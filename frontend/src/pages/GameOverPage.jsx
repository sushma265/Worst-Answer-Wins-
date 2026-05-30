import { useEffect, useRef } from "react";
import PlayerAvatar from "../components/PlayerAvatar";

const CONFETTI_COLORS = ["#FF2D87", "#FFD700", "#00F5FF", "#9B5DE5", "#00D26A", "#FF6B35"];

function useConfetti() {
  const ref = useRef(null);
  useEffect(() => {
    const pieces = [];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement("div");
      el.className = "confetti-piece";
      el.style.cssText = `
        left: ${Math.random() * 100}vw;
        background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
        width: ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        animation-duration: ${2.5 + Math.random() * 3}s;
        animation-delay: ${Math.random() * 3}s;
        transform: rotate(${Math.random() * 360}deg);
      `;
      document.body.appendChild(el);
      pieces.push(el);
    }
    return () => pieces.forEach(el => el.remove());
  }, []);
  return ref;
}

export default function GameOverPage({ playerId, gameOverData, onPlayAgain, socket }) {
  useConfetti();
  const finalScores = gameOverData?.finalScores || [];
  const winner = gameOverData?.winner;
  const isWinner = finalScores[0] && finalScores.findIndex(p => p.name === winner?.name) === 0;
  const myScore = finalScores.find((_, i) => i === finalScores.findIndex(p => p.id === playerId));

  const topThree = finalScores.slice(0, 3);
  const rest = finalScores.slice(3);

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-6">

      {/* Winner banner */}
      <div className="text-center animate-float">
        <div className="text-8xl mb-3">🏆</div>
        <h1 className="font-display text-5xl md:text-6xl shine-text">
          {winner?.name} Wins!
        </h1>
        <p className="text-white/60 mt-2 text-lg">
          The most hilariously wrong person of the night
        </p>
      </div>

      {/* Podium */}
      <div className="w-full max-w-md">
        <div className="flex items-end justify-center gap-3">
          {/* 2nd */}
          {topThree[1] && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <PlayerAvatar name={topThree[1].name} avatar={topThree[1].avatar} size="lg" showName />
              <div className="w-full bg-gray-400/30 rounded-t-xl flex flex-col items-center justify-end py-4" style={{ height: "100px" }}>
                <span className="text-3xl">🥈</span>
                <span className="font-display text-white text-xl">{topThree[1].score}</span>
              </div>
            </div>
          )}

          {/* 1st */}
          {topThree[0] && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="text-3xl animate-bounce">👑</div>
              <PlayerAvatar name={topThree[0].name} avatar={topThree[0].avatar} size="xl" showName />
              <div className="w-full bg-yellow-500/30 neon-border-yellow rounded-t-xl flex flex-col items-center justify-end py-4" style={{ height: "140px" }}>
                <span className="text-3xl">🥇</span>
                <span className="font-display text-white text-2xl">{topThree[0].score}</span>
              </div>
            </div>
          )}

          {/* 3rd */}
          {topThree[2] && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <PlayerAvatar name={topThree[2].name} avatar={topThree[2].avatar} size="lg" showName />
              <div className="w-full bg-amber-700/30 rounded-t-xl flex flex-col items-center justify-end py-4" style={{ height: "70px" }}>
                <span className="text-3xl">🥉</span>
                <span className="font-display text-white text-xl">{topThree[2].score}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rest of players */}
      {rest.length > 0 && (
        <div className="w-full max-w-md glass-card p-4 space-y-2">
          {rest.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="text-white/40 font-bold w-5 text-sm">{i + 4}</span>
              <PlayerAvatar name={p.name} avatar={p.avatar} size="sm" />
              <span className="flex-1 text-white font-bold">{p.name}</span>
              <span className="font-display text-party-yellow">{p.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="w-full max-w-md flex flex-col gap-3">
        <button
          onClick={() => {
            socket?.emit("start_game", { totalRounds: 5 });
          }}
          className="w-full py-4 rounded-2xl font-display text-2xl text-white bg-gradient-to-r from-party-green to-party-cyan glow-cyan btn-press hover:scale-105 transition-all"
        >
          🔄 Play Again!
        </button>
        <button
          onClick={onPlayAgain}
          className="w-full py-3 rounded-2xl font-display text-xl text-white/60 bg-white/5 hover:bg-white/10 transition-all"
        >
          🏠 Back to Lobby
        </button>
      </div>
    </div>
  );
}
