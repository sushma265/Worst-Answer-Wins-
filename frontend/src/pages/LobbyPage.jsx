import { useState } from "react";
import PlayerAvatar from "../components/PlayerAvatar";
import { DarkModeToggle, ReactionBar } from "../components/SharedComponents";

export default function LobbyPage({ socket, roomCode, playerId, roomState, playerName, darkMode, setDarkMode, sendReaction }) {
  const [copied, setCopied] = useState(false);

  const players = roomState?.players || [];
  const canStart = players.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const startGame = () => {
    socket?.emit("start_game", { totalRounds: roomState?.totalRounds || 5 });
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-4xl text-white text-glow-pink">Game Lobby</h1>
          <p className="text-white/50 mt-1">Share the code and wait for friends!</p>
        </div>

        {/* Room code */}
        <div className="glass-card p-6 text-center">
          <p className="text-white/60 text-sm font-bold mb-2 uppercase tracking-widest">Room Code</p>
          <button
            onClick={copyCode}
            className="font-display text-6xl text-white tracking-widest hover:scale-105 transition-transform neon-border-cyan rounded-2xl px-6 py-2 inline-block"
            title="Click to copy"
          >
            {roomCode}
          </button>
          <p className="text-white/40 text-xs mt-3">
            {copied ? "✅ Copied!" : "Tap to copy"}
          </p>
        </div>

        {/* Players */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-white">
              Players ({players.length}/8)
            </h2>
            <div className="flex gap-1">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < players.length ? "bg-party-green" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  p.id === playerId
                    ? "bg-party-pink/20 neon-border-pink"
                    : "bg-white/5"
                }`}
              >
                <PlayerAvatar name={p.name} avatar={p.avatar} size="md" />
                <div className="flex-1">
                  <span className="text-white font-bold">{p.name}</span>
                  {p.id === playerId && (
                    <span className="ml-2 text-party-yellow text-xs font-bold">(you)</span>
                  )}
                </div>
                <span className="text-green-400 text-sm">✓ Ready</span>
              </div>
            ))}

            {players.length < 2 && (
              <div className="text-center text-white/40 text-sm py-4 border-2 border-dashed border-white/10 rounded-xl">
                Waiting for more players…
              </div>
            )}
          </div>
        </div>

        {/* Start button — available to everyone once 2+ players */}
        <div className="flex flex-col items-center gap-3">
          {canStart ? (
            <button
              onClick={startGame}
              className="w-full py-5 rounded-2xl font-display text-3xl text-white bg-gradient-to-r from-party-green to-party-cyan glow-cyan btn-press hover:scale-105 transition-all animate-pulse-glow"
            >
              🚀 Start Game!
            </button>
          ) : (
            <div className="w-full py-5 rounded-2xl font-display text-2xl text-white/30 bg-white/5 text-center border-2 border-dashed border-white/10">
              Need at least 2 players
            </div>
          )}
          <p className="text-white/30 text-sm">Anyone can start the game</p>
        </div>

        {/* Reactions */}
        <div className="glass-card p-4">
          <p className="text-white/50 text-xs text-center mb-3 font-bold uppercase tracking-wider">Send a Reaction</p>
          <ReactionBar sendReaction={sendReaction} />
        </div>
      </div>
    </div>
  );
}
