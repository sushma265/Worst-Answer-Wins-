import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { QUESTIONS } from "./questions.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "https://worst-answer-wins.vercel.app",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "https://worst-answer-wins.vercel.app" }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getRandomQuestions(count = 5) {
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function emitRoomState(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  io.to(roomCode).emit("room_state", {
    players: room.players,
    phase: room.phase,
    currentQuestion: room.currentQuestion,
    round: room.round,
    totalRounds: room.totalRounds,
    scores: room.scores,
    roundScores: room.roundScores,
    submittedCount: room.answers ? Object.keys(room.answers).length : 0,
    playerCount: room.players.length,
    timeLeft: room.timeLeft,
  });
}

async function judgeAnswers(question, answers) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const answersText = answers
    .map((a, i) => `Answer ${i + 1} (${a.playerName}): "${a.answer}"`)
    .join("\n");

  const prompt = `You are judging a party game called "Worst Answer Wins". Players submit the worst but most believable wrong answer to a question. The funnier and more convincingly wrong, the better.

Question: "${question}"

Answers:
${answersText}

Score each answer from 1-100 based on:
- How amusingly wrong it is (40%)
- How believable/plausible it sounds despite being wrong (35%)
- Creative humor and originality (25%)

Respond ONLY with valid JSON in this exact format:
{
  "scores": [
    {"playerName": "name", "score": 85, "reason": "one funny sentence explaining why"},
    ...
  ]
}

Keep reasons short, funny, and encouraging. Score generously - most answers should be 40-95.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.scores;
  } catch (err) {
    console.error("Gemini error:", err);
    return answers.map((a) => ({
      playerName: a.playerName,
      score: Math.floor(Math.random() * 40) + 40,
      reason: "The AI judge is having a coffee break. Random score awarded!",
    }));
  }
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Create room — first player is just a regular player, no special host role
  socket.on("create_room", ({ playerName, avatar }) => {
    let code;
    do { code = generateRoomCode(); } while (rooms[code]);

    rooms[code] = {
      code,
      creatorId: socket.id, // only used to show "created by" label, not for gating
      phase: "lobby",
      players: [{ id: socket.id, name: playerName, avatar }],
      scores: { [socket.id]: 0 },
      roundScores: {},
      round: 0,
      totalRounds: 5,
      questions: [],
      answers: {},
      currentQuestion: null,
      timeLeft: 60,
      timerInterval: null,
      nextRoundTimeout: null,
    };

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = playerName;

    socket.emit("room_created", { roomCode: code, playerId: socket.id });
    emitRoomState(code);
  });

  // Join room
  socket.on("join_room", ({ roomCode, playerName, avatar }) => {
    const code = roomCode.toUpperCase();
    const room = rooms[code];

    if (!room) { socket.emit("error", { message: "Room not found!" }); return; }
    if (room.phase !== "lobby") { socket.emit("error", { message: "Game already in progress!" }); return; }
    if (room.players.length >= 8) { socket.emit("error", { message: "Room is full!" }); return; }
    if (room.players.find(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      socket.emit("error", { message: "Name already taken!" }); return;
    }

    room.players.push({ id: socket.id, name: playerName, avatar });
    room.scores[socket.id] = 0;

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = playerName;

    socket.emit("room_joined", { roomCode: code, playerId: socket.id });
    io.to(code).emit("player_joined", { playerName });
    emitRoomState(code);
  });

  // Start game — any player can trigger this
  socket.on("start_game", ({ totalRounds }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || room.phase !== "lobby") return;
    if (room.players.length < 2) {
      socket.emit("error", { message: "Need at least 2 players to start!" });
      return;
    }

    room.totalRounds = Math.min(Math.max(totalRounds || 5, 3), 10);
    room.questions = getRandomQuestions(room.totalRounds);
    room.round = 0;
    room.scores = {};
    room.players.forEach(p => { room.scores[p.id] = 0; });

    startNextRound(code);
  });

  // Submit answer
  socket.on("submit_answer", ({ answer }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || room.phase !== "playing") return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || room.answers[socket.id]) return;

    const trimmed = answer?.trim();
    if (!trimmed) return;

    room.answers[socket.id] = { answer: trimmed, playerName: player.name, playerId: socket.id };

    io.to(code).emit("answer_submitted", {
      playerName: player.name,
      submittedCount: Object.keys(room.answers).length,
      playerCount: room.players.length,
    });

    // All players answered → judge immediately
    if (Object.keys(room.answers).length >= room.players.length) {
      clearInterval(room.timerInterval);
      judgeRound(code);
    }
  });

  // Emoji reaction — any player
  socket.on("send_reaction", ({ emoji }) => {
    const code = socket.data.roomCode;
    const player = rooms[code]?.players.find(p => p.id === socket.id);
    if (!player) return;
    io.to(code).emit("reaction", { emoji, playerName: player.name });
  });

  // Disconnect
  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;

    const idx = room.players.findIndex(p => p.id === socket.id);
    if (idx === -1) return;

    const player = room.players[idx];
    room.players.splice(idx, 1);
    io.to(code).emit("player_left", { playerName: player.name });

    if (room.players.length === 0) {
      clearInterval(room.timerInterval);
      clearTimeout(room.nextRoundTimeout);
      delete rooms[code];
      return;
    }

    // If game is playing and everyone still in game answered, judge now
    if (room.phase === "playing" &&
        room.players.length > 0 &&
        Object.keys(room.answers).length >= room.players.length) {
      clearInterval(room.timerInterval);
      judgeRound(code);
    }

    emitRoomState(code);
  });
});

function startNextRound(code) {
  const room = rooms[code];
  if (!room) return;

  room.round++;
  room.phase = "playing";
  room.answers = {};
  room.currentQuestion = room.questions[room.round - 1];
  room.timeLeft = 60;
  room.roundScores = {};

  emitRoomState(code);
  io.to(code).emit("round_started", {
    round: room.round,
    totalRounds: room.totalRounds,
    question: room.currentQuestion,
    timeLeft: room.timeLeft,
  });

  room.timerInterval = setInterval(() => {
    room.timeLeft--;
    io.to(code).emit("timer_tick", { timeLeft: room.timeLeft });

    if (room.timeLeft <= 0) {
      clearInterval(room.timerInterval);
      judgeRound(code);
    }
  }, 1000);
}

async function judgeRound(code) {
  const room = rooms[code];
  if (!room || room.phase === "judging") return;

  room.phase = "judging";
  io.to(code).emit("judging_started");
  emitRoomState(code);

  const answerList = Object.values(room.answers);

  // Add placeholder for players who didn't answer
  room.players.forEach(p => {
    if (!room.answers[p.id]) {
      answerList.push({ answer: "[No answer submitted]", playerName: p.name, playerId: p.id });
    }
  });

  if (answerList.length === 0) {
    room.phase = "results";
    emitRoomState(code);
    io.to(code).emit("round_results", { results: [], scores: room.scores, round: room.round, totalRounds: room.totalRounds });
    scheduleNextRound(code);
    return;
  }

  const scores = await judgeAnswers(room.currentQuestion, answerList);

  const results = scores.map(s => {
    const player = room.players.find(p => p.name === s.playerName);
    const pid = player?.id;
    if (pid) {
      room.scores[pid] = (room.scores[pid] || 0) + s.score;
      room.roundScores[pid] = s.score;
    }
    return {
      ...s,
      playerId: pid,
      avatar: player?.avatar,
      answer: room.answers[pid]?.answer || "[No answer]",
    };
  });

  room.phase = "results";
  emitRoomState(code);

  io.to(code).emit("round_results", {
    results,
    scores: room.scores,
    round: room.round,
    totalRounds: room.totalRounds,
    question: room.currentQuestion,
  });

  // Auto-advance after 12 seconds
  scheduleNextRound(code);
}

function scheduleNextRound(code) {
  const room = rooms[code];
  if (!room) return;

  // Count down to next round and broadcast
  let countdown = 12;
  const tick = setInterval(() => {
    countdown--;
    io.to(code).emit("next_round_countdown", { secondsLeft: countdown });
    if (countdown <= 0) {
      clearInterval(tick);
      room.nextRoundTimeout = null;
      if (!rooms[code]) return;
      if (room.round >= room.totalRounds) {
        endGame(code);
      } else {
        startNextRound(code);
      }
    }
  }, 1000);

  room.nextRoundTimeout = tick;
}

function endGame(code) {
  const room = rooms[code];
  if (!room) return;

  room.phase = "gameover";
  emitRoomState(code);

  const sorted = room.players
    .map(p => ({ name: p.name, avatar: p.avatar, score: room.scores[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  io.to(code).emit("game_over", { finalScores: sorted, winner: sorted[0] });
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 Worst Answer Wins server running on port ${PORT}`);
});
