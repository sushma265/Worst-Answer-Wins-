export default function ReactionOverlay({ reactions }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden>
      {reactions.map((r) => (
        <div
          key={r.id}
          className="reaction-popup"
          style={{ left: `${r.x}vw`, top: `${r.y}vh` }}
        >
          {r.emoji}
        </div>
      ))}
    </div>
  );
}
