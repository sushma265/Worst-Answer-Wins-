const AVATAR_BG = [
  "from-pink-500 to-purple-600",
  "from-cyan-400 to-blue-600",
  "from-yellow-400 to-orange-500",
  "from-green-400 to-teal-600",
  "from-red-400 to-pink-600",
  "from-indigo-400 to-purple-600",
  "from-orange-400 to-red-500",
  "from-teal-400 to-cyan-600",
];

export function getAvatarBg(name) {
  let hash = 0;
  for (const c of name || "?") hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_BG[Math.abs(hash) % AVATAR_BG.length];
}

export default function PlayerAvatar({ name, avatar, size = "md", showName = false, score = null }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-xl",
    lg: "w-16 h-16 text-3xl",
    xl: "w-24 h-24 text-5xl",
  };
  const bg = getAvatarBg(name);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${bg} flex items-center justify-center shadow-lg avatar-ring relative`}
      >
        <span className="leading-none select-none">{avatar || name?.[0]?.toUpperCase() || "?"}</span>
        {score !== null && (
          <div className="absolute -top-1 -right-1 bg-party-yellow text-black text-xs font-black rounded-full w-5 h-5 flex items-center justify-center shadow">
            {score}
          </div>
        )}
      </div>
      {showName && (
        <span className="text-white text-xs font-bold truncate max-w-[4rem] text-center">{name}</span>
      )}
    </div>
  );
}
