/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["'Fredoka One'", "cursive"],
        body: ["'Nunito'", "sans-serif"],
      },
      colors: {
        party: {
          pink: "#FF2D87",
          yellow: "#FFD700",
          cyan: "#00F5FF",
          purple: "#9B5DE5",
          green: "#00D26A",
          orange: "#FF6B35",
        },
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        wiggle: "wiggle 0.5s ease-in-out infinite",
        "score-reveal": "scoreReveal 0.5s ease-out forwards",
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        scoreReveal: {
          "0%": { transform: "scale(0) rotate(-10deg)", opacity: 0 },
          "60%": { transform: "scale(1.2) rotate(3deg)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: 1 },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 45, 135, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 45, 135, 0.9)" },
        },
      },
    },
  },
  plugins: [],
};
