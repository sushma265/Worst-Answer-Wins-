import { useState, useEffect } from "react";
import PlayerAvatar from "../components/PlayerAvatar";
import { ReactionBar } from "../components/SharedComponents";

export default function ResultsPage({ socket, playerId, resultsData, nextRoundIn, roomState, sendReaction }) {
  const [revealed, setRevealed] = useState([]);

  const results = resultsData?.results || [];
  const sortedResults = [...results].sort((a, b) => b.score - a.score);
  const isLastRound = resultsData?.round >= resultsData?.totalRounds;

  // Reveal results one by one with stagger
  useEffect(() => {
    setRevealed([]);
    if (!results.length) return;
    results.forEach((_, i) => {
      setTimeout(() => {
        setRevealed(r => [...r, i]);
      }, 600 + i * 900);
    });
  }, [resultsData]);

  // Leaderboard from cumulative scores
  const players = roomState?.players || [];
  const scores = roomState?.scores || {};
  const leaderboard = [...players]
    .map(p => ({ ...p, total: scores[p.id] || 0 }))
    .sort((a, b) => b.total - a.total);

  const maxScore = leaderboard[0]?.total || 1;

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-6 gap-6">
      {/* Header */}
      <div className="w-full max-w-xl text-center">
        <div className="font-display text-2xl text-white/50 mb-1">
          Round {resultsData?.round}/{resultsData?.totalRounds}
        </div>
        <h2 className="font-display text-4xl text-white text-glow-pink">Results! 🎉</h2>
        <div className="mt-2 glass-card px-4 py-2 inline-block">
          <p className="text-white/70 text-sm font-bold italic">
            "{resultsData?.question}"
          </p>
        </div>
      </div>

      {/* Answer reveals */}
      <div className="w-full max-w-xl flex flex-col gap-3">
        {sortedResults.map((result, i) => {
          const isMe = result.playerId === playerId;
          const isVisible = revealed.includes(results.indexOf(result)) || revealed.includes(i);
          const isTop = i === 0;

          return (
            <div
              key={result.playerName + i}
              className={`glass-card p-4 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              } ${isTop ? "neon-border-yellow" : ""} ${isMe ? "neon-border-pink" : ""}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start gap-3">
                {/* Rank */}
                <div className={`font-display text-2xl w-8 text-center flex-shrink-0 ${
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-white/40"
                }`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </div>

                <PlayerAvatar name={result.playerName} avatar={result.avatar} size="sm" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{result.playerName}</span>
                    {isMe && <span className="text-party-pink text-xs font-bold">(you)</span>}
                    {isTop && <span className="text-yellow-400 text-xs font-bold">⭐ Top answer!</span>}
                  </div>
                  <p className="text-party-yellow font-bold italic mt-1 text-sm">
                    "{result.answer}"
                  </p>
                  <p className="text-white/50 text-xs mt-1">{result.reason}</p>
                </div>

                {/* Score */}
                <div className={`flex-shrink-0 font-display text-3xl ${
                  result.score >= 80 ? "text-party-green" :
                  result.score >= 60 ? "text-party-yellow" :
                  result.score >= 40 ? "text-party-orange" : "text-white/40"
                } ${isVisible ? "animate-[scoreReveal_0.5s_ease-out_forwards]" : "opacity-0"}`}>
                  {result.score}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="w-full max-w-xl glass-card p-5">
        <h3 className="font-display text-xl text-white mb-4 text-center">
          📊 Standings
        </h3>
        <div className="space-y-2">
          {leaderboard.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="font-display text-white/60 w-5 text-sm">{i + 1}</span>
              <PlayerAvatar name={p.name} avatar={p.avatar} size="sm" />
              <span className="flex-1 text-white font-bold text-sm">
                {p.name}
                {p.id === playerId && <span className="text-party-pink ml-1 text-xs">(you)</span>}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-party-pink to-party-purple rounded-full transition-all duration-1000 score-bar"
                    style={{ "--score-width": `${(p.total / maxScore) * 100}%`, width: `${(p.total / maxScore) * 100}%` }}
                  />
                </div>
                <span className="font-display text-party-yellow text-sm w-8 text-right">{p.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-advance notice */}
      {nextRoundIn !== null && (
        <div className="w-full max-w-xl glass-card p-4 text-center neon-border-cyan">
          {isLastRound ? (
            <p className="font-display text-xl text-white">
              🏁 Final results in <span className="text-party-cyan">{nextRoundIn}s</span>…
            </p>
          ) : (
            <p className="font-display text-xl text-white">
              ⏭ Next round in <span className="text-party-cyan">{nextRoundIn}s</span>…
            </p>
          )}
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-party-cyan rounded-full transition-all duration-1000"
              style={{ width: `${(nextRoundIn / 12) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Reactions */}
      <div className="w-full max-w-xl glass-card p-3">
        <p className="text-white/30 text-xs text-center mb-2 font-bold uppercase tracking-wider">React</p>
        <ReactionBar sendReaction={sendReaction} />
      </div>
    </div>
  );
}
