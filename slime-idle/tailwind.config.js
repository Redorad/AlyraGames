/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0a0e27",
          800: "#111640",
          700: "#1a2050",
        },
        steel: "#7ec8e3",
        accent: "#a78bfa",
      },
      animation: {
        "slime-bounce": "slimeBounce 0.15s ease-out",
        "float-up": "floatUp 1s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "particle-float": "particleFloat 8s linear infinite",
      },
      keyframes: {
        slimeBounce: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.88, 1.12)" },
          "100%": { transform: "scale(1)" },
        },
        floatUp: {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-80px) scale(1.2)" },
        },
        pulseGlow: {
          "0%, 100%": { filter: "drop-shadow(0 0 8px rgba(126, 200, 227, 0.4))" },
          "50%": { filter: "drop-shadow(0 0 20px rgba(126, 200, 227, 0.8))" },
        },
        particleFloat: {
          "0%": { transform: "translateY(100vh) translateX(0)", opacity: "0" },
          "10%": { opacity: "0.6" },
          "90%": { opacity: "0.6" },
          "100%": { transform: "translateY(-10vh) translateX(30px)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
