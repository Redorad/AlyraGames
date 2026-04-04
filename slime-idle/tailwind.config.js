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
        "slime-breathe": "slimeBreathe 3s ease-in-out infinite",
        "float-up": "floatUp 1s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "particle-float": "particleFloat 8s linear infinite",
        "ripple": "rippleExpand 0.6s ease-out forwards",
        "shake": "screenShake 0.3s ease-out",
        "aurora": "auroraShift 12s ease-in-out infinite",
        "shimmer": "shimmerSweep 2.5s ease-in-out infinite",
        "bar-glow": "barGlow 2s ease-in-out infinite",
        "evo-flash": "evoFlash 0.8s ease-out forwards",
        "buy-pop": "buyPop 0.3s ease-out",
        "sparkle": "sparkleFloat 4s linear infinite",
      },
      keyframes: {
        slimeBounce: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.88, 1.12)" },
          "100%": { transform: "scale(1)" },
        },
        slimeBreathe: {
          "0%, 100%": { transform: "scale(1) translateY(0)" },
          "30%": { transform: "scale(1.03, 0.97) translateY(1px)" },
          "60%": { transform: "scale(0.97, 1.03) translateY(-2px)" },
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
        rippleExpand: {
          "0%": { transform: "scale(0)", opacity: "0.6" },
          "100%": { transform: "scale(3)", opacity: "0" },
        },
        screenShake: {
          "0%, 100%": { transform: "translateX(0)" },
          "15%": { transform: "translateX(-4px) translateY(2px)" },
          "30%": { transform: "translateX(3px) translateY(-2px)" },
          "45%": { transform: "translateX(-2px) translateY(1px)" },
          "60%": { transform: "translateX(2px)" },
          "75%": { transform: "translateX(-1px)" },
        },
        auroraShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        shimmerSweep: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        barGlow: {
          "0%, 100%": { boxShadow: "0 0 4px rgba(126, 200, 227, 0.3), 0 0 8px rgba(167, 139, 250, 0.15)" },
          "50%": { boxShadow: "0 0 12px rgba(126, 200, 227, 0.6), 0 0 24px rgba(167, 139, 250, 0.3)" },
        },
        evoFlash: {
          "0%": { opacity: "0.9", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.5)" },
          "100%": { opacity: "0", transform: "scale(2.5)" },
        },
        buyPop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)" },
        },
        sparkleFloat: {
          "0%": { transform: "translateY(100vh) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(-10vh) rotate(360deg)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
