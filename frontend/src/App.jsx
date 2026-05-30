import { useState, useEffect, useCallback } from "react";
import { useSocket } from "./context/SocketContext";
import HomePage from "./pages/HomePage";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";
import ResultsPage from "./pages/ResultsPage";
import GameOverPage from "./pages/GameOverPage";
import FloatingParticles from "./components/FloatingParticles";
import ReactionOverlay from "./components/ReactionOverlay";
import { playSound } from "./sounds/sounds";

export default function App() {
  const socket = useSocket();
  const [page, setPage] = useState("home"); // home | lobby | game | results | gameover
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [roomState, setRoomState] = useState(null);
  const [roundData, setRoundData] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [nextRoundIn, setNextRoundIn] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const addReaction = useCallback((emoji, name) => {
    const id = Date.now() + Math.random();
    const x = 20 + Math.random() * 60; // vw %
    const y = 30 + Math.random() * 40; // vh %
    setReactions(r => [...r, { id, emoji, name, x, y }]);
    setTimeout(() => setReactions(r => r.filter(rx => rx.id !== id)), 1600);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("room_created", ({ roomCode: code, playerId: pid }) => {
      setRoomCode(code);
      setPlayerId(pid);
      setPage("lobby");
    });

    socket.on("room_joined", ({ roomCode: code, playerId: pid }) => {
      setRoomCode(code);
      setPlayerId(pid);
      setPage("lobby");
    });

    socket.on("room_state", (state) => {
      setRoomState(state);
      if (state.phase === "playing" && page !== "game") setPage("game");
    });

    socket.on("round_started", (data) => {
      setRoundData(data);
      setResultsData(null);
      setNextRoundIn(null);
      setPage("game");
      playSound("roundStart");
    });

    socket.on("judging_started", () => {
      playSound("thinking");
    });

    socket.on("round_results", (data) => {
      setResultsData(data);
      setPage("results");
      playSound("results");
    });

    socket.on("next_round_countdown", ({ secondsLeft }) => {
      setNextRoundIn(secondsLeft);
    });

    socket.on("game_over", (data) => {
      setGameOverData(data);
      setNextRoundIn(null);
      setPage("gameover");
      playSound("winner");
    });

    socket.on("answer_submitted", ({ submittedCount, playerCount }) => {
      if (submittedCount === playerCount) playSound("allIn");
      else playSound("submit");
    });

    socket.on("player_joined", ({ playerName: name }) => {
      playSound("join");
    });

    socket.on("timer_tick", ({ timeLeft }) => {
      if (timeLeft <= 10 && timeLeft > 0) playSound("tick");
    });

    socket.on("reaction", ({ emoji, playerName: name }) => {
      addReaction(emoji, name);
    });

    socket.on("error", ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("room_state");
      socket.off("round_started");
      socket.off("judging_started");
      socket.off("round_results");
      socket.off("next_round_countdown");
      socket.off("game_over");
      socket.off("answer_submitted");
      socket.off("player_joined");
      socket.off("timer_tick");
      socket.off("reaction");
      socket.off("error");
    };
  }, [socket, page, addReaction]);

  const sendReaction = (emoji) => {
    socket?.emit("send_reaction", { emoji });
  };

  const commonProps = {
    socket,
    roomCode,
    playerId,
    playerName,
    setPlayerName,
    roomState,
    darkMode,
    setDarkMode,
    sendReaction,
  };

  return (
    <div className="party-bg min-h-screen font-body">
      <FloatingParticles />
      <ReactionOverlay reactions={reactions} />

      {page === "home" && <HomePage {...commonProps} />}
      {page === "lobby" && <LobbyPage {...commonProps} />}
      {page === "game" && (
        <GamePage
          {...commonProps}
          roundData={roundData}
          roomState={roomState}
        />
      )}
      {page === "results" && (
        <ResultsPage
          {...commonProps}
          resultsData={resultsData}
          nextRoundIn={nextRoundIn}
          roomState={roomState}
        />
      )}
      {page === "gameover" && (
        <GameOverPage
          {...commonProps}
          gameOverData={gameOverData}
          onPlayAgain={() => {
            setPage("lobby");
            setGameOverData(null);
            setResultsData(null);
            setRoundData(null);
            setNextRoundIn(null);
          }}
        />
      )}
    </div>
  );
}
