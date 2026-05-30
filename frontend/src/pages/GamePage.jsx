import { useState, useEffect } from "react";
import PlayerAvatar from "../components/PlayerAvatar";
import { ReactionBar } from "../components/SharedComponents";

export default function GamePage({ socket, playerId, roomState, roundData, sendReaction }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [judging, setJudging] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const question = roundData?.question || roomState?.currentQuestion;
  const round = roundData?.round || roomState?.round;
  const totalRounds = roundData?.totalRounds || roomState?.totalRounds;
  const playerCount = roomState?.playerCount || roomState?.players?.length || 1;

  useEffect(() => {
    setAnswer("");
    setSubmitted(false);
    setJudging(false);
    setTimeLeft(roundData?.timeLeft || 60);
    setSubmittedCount(0);
  }, [roundData]);

  useEffect(() => {
    if (!socket) return;
    const onTick = ({ timeLeft: t }) => setTimeLeft(t);
    const onSubmitted = ({ submittedCount: c }) => setSubmittedCount(c);
    const onJudging = () => setJudging(true);
    socket.on("timer_tick", onTick);
    socket.on("answer_submitted", onSubmitted);
    socket.on("judging_started", onJudging);
    return () => {
      socket.off("timer_tick", onTick);
      socket.off("answer_submitted", onSubmitted);
      socket.off("judging_started", onJudging);
    };
  }, [socket]);

  const submit = () => {
    if (!answer.trim() || submitted) return;
    socket?.emit("submit_answer", { answer: answer.trim() });
    setSubmitted(true);
  };

  const timerPct = (timeLeft / 60) * 100;
  const timerColor =
    timeLeft > 30 ? "from-party-green to-party-cyan" :
    timeLeft > 10 ? "from-party-yellow to-party-orange" :
    "from-party-pink to-red-600";
  const isDanger = timeLeft <= 10;

  if (judging) {
    return (
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 gap-8">
        <div className="text-8xl animate-bounce">🤖</div>
        <div className="text-center">
          <h2 className="font-display text-4xl text-white text-glow-cyan">AI is Judging…</h2>
          <p className="text-white/60 mt-2 text-lg">The robot overlord is considering your crimes against knowledge</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-party-cyan"
              style={{ animationDelay: `${i * 0.15}s`, animation: "bounce 1s infinite" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-6 gap-5">
      {/* Top bar */}
      <div className="w-full max-w-xl flex items-center justify-between">
        <div className="glass-card px-4 py-2">
          <span className="font-display text-white text-lg">
            Round <span className="text-party-yellow">{round}</span>/{totalRounds}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm font-bold">
            {submittedCount}/{playerCount} answered
          </span>
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center font-display text-2xl text-white shadow-lg ${isDanger ? "timer-danger" : `bg-gradient-to-br ${timerColor}`}`}
          >
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full max-w-xl h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${timerColor} rounded-full transition-all duration-1000`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Players row */}
      <div className="w-full max-w-xl">
        <div className="flex gap-3 overflow-x-auto pb-2 justify-center flex-wrap">
          {(roomState?.players || []).map(p => (
            <div key={p.id} className="relative">
              <PlayerAvatar name={p.name} avatar={p.avatar} size="sm" showName />
              {roomState?.submittedCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-party-green text-[8px] flex items-center justify-center text-white font-bold">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="w-full max-w-xl glass-card p-6 neon-border-cyan">
        <div className="text-party-cyan text-xs font-bold uppercase tracking-widest mb-2">
          🤔 The Question
        </div>
        <p className="font-display text-2xl md:text-3xl text-white leading-tight">
          {question}
        </p>
      </div>

      {/* Hint */}
      <div className="w-full max-w-xl text-center text-white/40 text-sm px-2">
        💡 Give the <span className="text-party-pink font-bold">worst but believable</span> answer you can think of. Be wrong. Be funny.
      </div>

      {/* Answer box */}
      {submitted ? (
        <div className="w-full max-w-xl glass-card p-6 text-center neon-border-pink">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="font-display text-2xl text-white mb-2">Answer Submitted!</h3>
          <p className="text-white/60">Waiting for others… brace yourself for AI judgment</p>
          <div className="mt-4 bg-white/5 rounded-xl p-3 text-party-yellow font-bold italic text-lg">
            "{answer}"
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xl flex flex-col gap-3">
          <textarea
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-2xl px-5 py-4 font-bold text-lg input-glow transition-all resize-none h-28"
            placeholder="Type your worst answer here…"
            value={answer}
            maxLength={200}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-white/30 text-xs">{answer.length}/200</span>
            <button
              onClick={submit}
              disabled={!answer.trim()}
              className={`px-8 py-3 rounded-2xl font-display text-xl text-white btn-press transition-all ${
                answer.trim()
                  ? "bg-gradient-to-r from-party-pink to-party-purple glow-pink hover:scale-105"
                  : "bg-white/10 cursor-not-allowed opacity-50"
              }`}
            >
              Submit! 🎯
            </button>
          </div>
        </div>
      )}

      {/* Reactions */}
      <div className="w-full max-w-xl glass-card p-3 mt-auto">
        <p className="text-white/30 text-xs text-center mb-2 font-bold uppercase tracking-wider">React</p>
        <ReactionBar sendReaction={sendReaction} />
      </div>
    </div>
  );
}
