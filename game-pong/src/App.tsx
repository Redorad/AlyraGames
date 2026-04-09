import { useStore, Difficulty } from "./store";
import { playWin } from "./audio";
import PongCanvas from "./PongCanvas";
import { useEffect, useRef } from "react";

/* ---- Menu Screen ---- */
function MenuScreen() {
  const startGame = useStore((s) => s.startGame);
  const soundOn = useStore((s) => s.soundOn);
  const toggleSound = useStore((s) => s.toggleSound);

  const difficulties: { key: Difficulty; label: string; desc: string }[] = [
    { key: "easy", label: "Easy", desc: "Slow AI" },
    { key: "medium", label: "Medium", desc: "Balanced" },
    { key: "hard", label: "Hard", desc: "Fast AI" },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 px-4">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight">
          <span className="text-steel">PONG</span>{" "}
          <span className="text-accent">DUEL</span>
        </h1>
        <p className="text-gray-500 text-sm mt-2">First to 11 wins</p>
      </div>

      {/* Difficulty buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {difficulties.map((d) => (
          <button
            key={d.key}
            onClick={() => startGame(d.key)}
            className="w-full py-3 px-6 rounded-xl font-bold text-lg
                       border border-white/10 bg-navy-800/70 hover:bg-navy-700
                       hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10
                       transition-all duration-150 active:scale-95
                       flex items-center justify-between"
          >
            <span className="text-white">{d.label}</span>
            <span className="text-gray-500 text-sm font-normal">{d.desc}</span>
          </button>
        ))}
      </div>

      {/* Controls info */}
      <div className="text-center text-gray-500 text-xs space-y-1 mt-2">
        <p>Mouse / Touch to move paddle</p>
        <p>W / S or Arrow keys</p>
      </div>

      {/* Sound toggle */}
      <button
        onClick={toggleSound}
        className="text-gray-500 hover:text-steel text-sm transition-colors"
      >
        Sound: {soundOn ? "ON" : "OFF"}
      </button>
    </div>
  );
}

/* ---- HUD overlay during game ---- */
function GameHUD() {
  const screen = useStore((s) => s.screen);
  const setScreen = useStore((s) => s.setScreen);
  const soundOn = useStore((s) => s.soundOn);
  const toggleSound = useStore((s) => s.toggleSound);

  if (screen !== "playing") return null;

  return (
    <div className="absolute top-3 right-3 flex gap-2 z-10">
      <button
        onClick={toggleSound}
        className="w-9 h-9 rounded-lg bg-navy-800/80 border border-white/10
                   flex items-center justify-center text-gray-400 hover:text-steel
                   transition-colors text-sm"
        title={soundOn ? "Mute" : "Unmute"}
      >
        {soundOn ? "\u266A" : "\u2715"}
      </button>
      <button
        onClick={() => setScreen("menu")}
        className="w-9 h-9 rounded-lg bg-navy-800/80 border border-white/10
                   flex items-center justify-center text-gray-400 hover:text-accent
                   transition-colors text-sm"
        title="Quit to Menu"
      >
        \u2716
      </button>
    </div>
  );
}

/* ---- Game Over Screen ---- */
function GameOverScreen() {
  const winner = useStore((s) => s.winner);
  const playerScore = useStore((s) => s.playerScore);
  const aiScore = useStore((s) => s.aiScore);
  const startGame = useStore((s) => s.startGame);
  const setScreen = useStore((s) => s.setScreen);
  const difficulty = useStore((s) => s.difficulty);
  const soundOn = useStore((s) => s.soundOn);
  const played = useRef(false);

  useEffect(() => {
    if (winner === "player" && soundOn && !played.current) {
      played.current = true;
      playWin();
    }
    return () => { played.current = false; };
  }, [winner, soundOn]);

  const isWin = winner === "player";

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 px-4">
      <h2
        className={`text-5xl font-black tracking-tight ${
          isWin ? "text-steel" : "text-accent"
        }`}
      >
        {isWin ? "You Win!" : "You Lose"}
      </h2>

      <div className="flex items-center gap-6 text-3xl font-bold">
        <span className="text-steel">{playerScore}</span>
        <span className="text-gray-600">-</span>
        <span className="text-accent">{aiScore}</span>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
        <button
          onClick={() => startGame(difficulty)}
          className="w-full py-3 rounded-xl font-bold text-lg
                     border border-accent/30 bg-accent/10 text-accent
                     hover:bg-accent/20 hover:border-accent/50
                     transition-all duration-150 active:scale-95"
        >
          Play Again
        </button>
        <button
          onClick={() => setScreen("menu")}
          className="w-full py-3 rounded-xl font-bold text-lg
                     border border-white/10 bg-navy-800/70 text-gray-400
                     hover:bg-navy-700 hover:text-white
                     transition-all duration-150 active:scale-95"
        >
          Menu
        </button>
      </div>
    </div>
  );
}

/* ---- App ---- */
export default function App() {
  const screen = useStore((s) => s.screen);

  return (
    <div className="relative w-full h-full bg-navy-900">
      {screen === "menu" && <MenuScreen />}
      {screen === "playing" && (
        <>
          <PongCanvas />
          <GameHUD />
        </>
      )}
      {screen === "gameover" && <GameOverScreen />}
    </div>
  );
}
