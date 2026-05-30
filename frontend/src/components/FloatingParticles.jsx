import { useMemo } from "react";

const EMOJIS = ["🎉", "⭐", "🎊", "✨", "🏆", "🎯", "💥", "🌟"];

export default function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        emoji: EMOJIS[i % EMOJIS.length],
        left: `${5 + (i * 8.2) % 90}%`,
        duration: `${12 + (i * 3.7) % 14}s`,
        delay: `-${(i * 2.3) % 14}s`,
        size: `${1 + (i % 3) * 0.4}rem`,
        opacity: 0.08 + (i % 4) * 0.04,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle select-none"
          style={{
            left: p.left,
            animationDuration: p.duration,
            animationDelay: p.delay,
            fontSize: p.size,
            opacity: p.opacity,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}
