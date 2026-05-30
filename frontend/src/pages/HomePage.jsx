import { useState } from "react";
import { DarkModeToggle } from "../components/SharedComponents";

const AVATARS = ["🤪", "😎", "🥳", "🤓", "👽", "🤖", "🦊", "🐸", "🐱", "🦄", "🎃", "🍕"];

export default function HomePage({ socket, setPlayerName, darkMode, setDarkMode }) {
  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [avatar, setAvatar] = useState("🤪");
  const [rounds, setRounds] = useState(5);
  const [error, setError] = useState("");

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Enter your name!"); return; }
    setPlayerName(trimmed);
    socket?.emit("create_room", { playerName: trimmed, avatar });
  };

  const handleJoin = () => {
    const trimmed = name.trim();
    const trimCode = code.trim().toUpperCase();
    if (!trimmed) { setError("Enter your name!"); return; }
    if (!trimCode || trimCode.length !== 4) { setError("Enter a valid 4-letter room code!"); return; }
    setPlayerName(trimmed);
    socket?.emit("join_room", { roomCode: trimCode, playerName: trimmed, avatar });
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Logo */}
      <div className="text-center mb-10 animate-float">
        <div className="text-7xl mb-3">🏆</div>
        <h1 className="font-display text-5xl md:text-7xl shine-text leading-tight">
          Worst Answer
        </h1>
        <h1 className="font-display text-5xl md:text-7xl text-white leading-tight">
          Wins
        </h1>
        <p className="text-white/60 mt-3 text-lg font-semibold">
          Be wrong. Be funny. Win everything.
        </p>
      </div>

      {/* Main card */}
      {!mode ? (
        <div className="glass-card p-8 w-full max-w-sm flex flex-col gap-4">
          <button
            onClick={() => setMode("create")}
            className="w-full py-4 rounded-2xl font-display text-2xl text-white bg-gradient-to-r from-party-pink to-party-purple glow-pink btn-press hover:scale-105 transition-all"
          >
            🎮 Create Room
          </button>
          <button
            onClick={() => setMode("join")}
            className="w-full py-4 rounded-2xl font-display text-2xl text-white bg-gradient-to-r from-party-cyan to-party-purple glow-cyan btn-press hover:scale-105 transition-all"
          >
            🚪 Join Room
          </button>
          <div className="text-center text-white/40 text-sm mt-2">
            2–8 players • AI-judged • No BS
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 w-full max-w-sm flex flex-col gap-5">
          <button
            onClick={() => { setMode(null); setError(""); }}
            className="text-white/50 hover:text-white text-sm self-start flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>

          <h2 className="font-display text-3xl text-white text-center">
            {mode === "create" ? "🎮 Create Room" : "🚪 Join Room"}
          </h2>

          {/* Avatar picker */}
          <div>
            <label className="text-white/70 text-sm font-bold block mb-2">Pick your avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`text-2xl p-1 rounded-xl transition-all ${
                    avatar === a
                      ? "bg-party-pink/40 scale-110 ring-2 ring-party-pink"
                      : "hover:bg-white/10"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-white/70 text-sm font-bold block mb-1">Your name</label>
            <input
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 font-bold text-lg input-glow transition-all"
              placeholder="Enter your name..."
              value={name}
              maxLength={16}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && (mode === "create" ? handleCreate() : handleJoin())}
            />
          </div>

          {/* Room code for join */}
          {mode === "join" && (
            <div>
              <label className="text-white/70 text-sm font-bold block mb-1">Room code</label>
              <input
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 font-display text-2xl text-center tracking-widest uppercase input-glow transition-all"
                placeholder="ABCD"
                value={code}
                maxLength={4}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
          )}

          {/* Rounds for create */}
          {mode === "create" && (
            <div>
              <label className="text-white/70 text-sm font-bold block mb-1">
                Rounds: <span className="text-party-yellow">{rounds}</span>
              </label>
              <input
                type="range"
                min={3}
                max={10}
                value={rounds}
                onChange={(e) => setRounds(+e.target.value)}
                className="w-full accent-party-pink"
              />
              <div className="flex justify-between text-white/40 text-xs mt-1">
                <span>3 (quick)</span><span>10 (marathon)</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-party-pink text-sm font-bold text-center">{error}</p>
          )}

          <button
            onClick={mode === "create" ? handleCreate : handleJoin}
            className="w-full py-4 rounded-2xl font-display text-2xl text-white bg-gradient-to-r from-party-pink to-party-orange glow-pink btn-press hover:scale-105 transition-all"
          >
            {mode === "create" ? "Create! 🚀" : "Join! 🎯"}
          </button>
        </div>
      )}

      {/* How to play */}
      <div className="mt-10 max-w-md text-center text-white/40 text-sm space-y-1">
        <p>📋 A question appears • Everyone answers badly</p>
        <p>🤖 AI judges who was the most hilariously wrong</p>
        <p>🏆 Most points after all rounds wins!</p>
      </div>
    </div>
  );
}
