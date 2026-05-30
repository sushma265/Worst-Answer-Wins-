export function DarkModeToggle({ darkMode, setDarkMode }) {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full glass-card flex items-center justify-center text-lg hover:scale-110 transition-transform"
      title="Toggle dark mode"
    >
      {darkMode ? "☀️" : "🌙"}
    </button>
  );
}

const REACTION_EMOJIS = ["😂", "🔥", "💀", "👏", "🤣", "😭", "💯", "🤡"];

export function ReactionBar({ sendReaction }) {
  return (
    <div className="flex items-center gap-1 flex-wrap justify-center">
      {REACTION_EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => sendReaction(e)}
          className="text-2xl hover:scale-125 active:scale-90 transition-transform cursor-pointer select-none p-1"
          title={`React with ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
