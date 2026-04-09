import { useEffect, useRef, useCallback } from "react";
import { useStore } from "./store";
import {
  createEngine,
  flap,
  resetToMenu,
  update,
  render,
  GameEngine,
} from "./game";

/* ===== Canvas sizing ===== */
const GAME_W = 400;
const GAME_H = 600;

function getMedal(score: number): { emoji: string; label: string } | null {
  if (score >= 50) return { emoji: "\uD83E\uDD47", label: "Gold" };
  if (score >= 25) return { emoji: "\uD83E\uDD48", label: "Silver" };
  if (score >= 10) return { emoji: "\uD83E\uDD49", label: "Bronze" };
  return null;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const { state, score, highScore, setState, setScore, loadHighScore, saveHighScore } =
    useStore();

  // Load high score on mount
  useEffect(() => {
    loadHighScore();
  }, [loadHighScore]);

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = GAME_W;
    canvas.height = GAME_H;

    const engine = createEngine(
      canvas,
      (s: number) => setScore(s),
      () => {
        saveHighScore();
        setState("gameover");
      }
    );
    engineRef.current = engine;

    // Game loop
    let running = true;
    let lastTs = 0;

    function loop(ts: number) {
      if (!running) return;
      const dt = lastTs === 0 ? 1 / 60 : (ts - lastTs) / 1000;
      lastTs = ts;
      update(engine, dt);
      render(engine);
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
      running = false;
    };
  }, [setState, setScore, saveHighScore]);

  // Sync zustand state back to engine when reset
  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    if (state === "menu" && e.state !== "menu") {
      resetToMenu(e);
    }
  }, [state]);

  // Input handler
  const handleInput = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    if (e.state === "gameover") return;
    flap(e);
    if (e.state === "playing") {
      setState("playing");
    }
  }, [setState]);

  // Keyboard
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code === "Space" || ev.code === "ArrowUp") {
        ev.preventDefault();
        handleInput();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleInput]);

  const medal = getMedal(score);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-navy-900">
      <div className="relative" style={{ width: GAME_W, height: GAME_H, maxWidth: "100vw", maxHeight: "100vh" }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full rounded-lg shadow-2xl"
          style={{ imageRendering: "auto", aspectRatio: `${GAME_W}/${GAME_H}` }}
          onMouseDown={(e) => {
            e.preventDefault();
            handleInput();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            handleInput();
          }}
        />

        {/* Menu overlay */}
        {state === "menu" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-lg">
            <h1 className="text-5xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
              Flappy Clone
            </h1>
            <p className="text-steel text-sm mb-8 opacity-80">A pixel bird adventure</p>
            <button
              className="px-8 py-3 bg-accent hover:bg-accent/80 text-white font-bold text-lg rounded-xl
                         shadow-lg transition-all duration-150 active:scale-95"
              onClick={handleInput}
            >
              Play
            </button>
            <p className="text-white/40 text-xs mt-6">
              Click, Tap, or press Space to flap
            </p>
            {highScore > 0 && (
              <p className="text-steel/60 text-xs mt-2">
                Best: {highScore}
              </p>
            )}
          </div>
        )}

        {/* Game Over overlay */}
        {state === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
            <div className="bg-navy-800 border border-white/10 rounded-2xl px-10 py-8 flex flex-col items-center shadow-2xl">
              <h2 className="text-3xl font-black text-white mb-4">Game Over</h2>

              {medal && (
                <div className="text-5xl mb-3">{medal.emoji}</div>
              )}
              {medal && (
                <p className="text-accent text-sm font-semibold mb-3">{medal.label} Medal</p>
              )}

              <div className="flex gap-8 mb-6">
                <div className="text-center">
                  <p className="text-white/50 text-xs uppercase tracking-wider">Score</p>
                  <p className="text-3xl font-bold text-white">{score}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/50 text-xs uppercase tracking-wider">Best</p>
                  <p className="text-3xl font-bold text-steel">{highScore}</p>
                </div>
              </div>

              <button
                className="px-8 py-3 bg-accent hover:bg-accent/80 text-white font-bold text-lg rounded-xl
                           shadow-lg transition-all duration-150 active:scale-95"
                onClick={() => {
                  setState("menu");
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
