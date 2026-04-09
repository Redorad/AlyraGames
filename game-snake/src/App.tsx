import { useEffect, useRef, useCallback } from "react";
import { useGameStore, Direction } from "./store";
import { render, getCanvasSize } from "./renderer";
import { useSwipe } from "./useSwipe";

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  w: "UP",
  W: "UP",
  s: "DOWN",
  S: "DOWN",
  a: "LEFT",
  A: "LEFT",
  d: "RIGHT",
  D: "RIGHT",
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tickRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  const {
    gridW,
    gridH,
    snake,
    direction,
    food,
    score,
    highScore,
    status,
    wrapAround,
    speed,
    hitWall,
    startGame,
    togglePause,
    setDirection,
    toggleWrap,
    tick,
    returnToMenu,
  } = useGameStore();

  const { w: cw, h: ch } = getCanvasSize(gridW, gridH);

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        if (status === "playing") {
          setDirection(dir);
        }
      }
      if (e.key === " " || e.key === "Escape") {
        e.preventDefault();
        if (status === "playing" || status === "paused") {
          togglePause();
        }
      }
      if (e.key === "Enter") {
        if (status === "menu" || status === "gameover") {
          startGame();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, setDirection, togglePause, startGame]);

  // Swipe
  const handleSwipe = useCallback(
    (d: Direction) => {
      if (status === "playing") {
        setDirection(d);
      }
    },
    [status, setDirection]
  );
  useSwipe(handleSwipe);

  // Game loop
  useEffect(() => {
    function loop(time: number) {
      // Tick logic
      if (status === "playing") {
        if (time - lastTickRef.current >= speed) {
          lastTickRef.current = time;
          tick();
        }
      }

      // Render
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        const st = useGameStore.getState();
        render(
          ctx,
          st.gridW,
          st.gridH,
          st.snake,
          st.food,
          st.hitWall,
          st.status === "gameover",
          st.direction,
          time
        );
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [status, speed, tick]);

  // Reset tick timer on game start
  useEffect(() => {
    if (status === "playing") {
      lastTickRef.current = performance.now();
    }
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-3 p-2">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
        <span className="text-steel">SNAKE</span>{" "}
        <span className="text-accent">NEON</span>
      </h1>

      {/* HUD */}
      <div className="flex items-center gap-6 text-sm font-mono">
        <span className="text-steel">
          Score: <strong className="text-white">{score}</strong>
        </span>
        <span className="text-accent">
          Best: <strong className="text-white">{highScore}</strong>
        </span>
      </div>

      {/* Canvas container */}
      <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-lg shadow-accent/5">
        <canvas
          ref={canvasRef}
          width={cw}
          height={ch}
          className="block"
          style={{ maxWidth: "100%", height: "auto" }}
        />

        {/* Overlays */}
        {status === "menu" && (
          <Overlay>
            <p className="text-5xl mb-2">🐍</p>
            <p className="text-xl font-bold text-steel">Snake Neon</p>
            <p className="text-sm text-gray-400 mt-1 max-w-[260px] text-center">
              Arrow keys / WASD to move. Space to pause. Eat food, grow, survive.
            </p>
            <button onClick={startGame} className="btn mt-4">
              Play
            </button>
            <WrapToggle wrapAround={wrapAround} toggle={toggleWrap} />
          </Overlay>
        )}

        {status === "paused" && (
          <Overlay>
            <p className="text-xl font-bold text-accent">Paused</p>
            <button onClick={togglePause} className="btn mt-3">
              Resume
            </button>
          </Overlay>
        )}

        {status === "gameover" && (
          <Overlay>
            <p className="text-xl font-bold text-red-400">Game Over</p>
            <p className="text-sm text-gray-400 mt-1">
              Score: <strong className="text-white">{score}</strong>
              {score >= highScore && score > 3 && (
                <span className="ml-2 text-yellow-400">New Best!</span>
              )}
            </p>
            <button onClick={startGame} className="btn mt-3">
              Retry
            </button>
            <button
              onClick={returnToMenu}
              className="text-xs text-gray-500 hover:text-gray-300 mt-2 transition-colors"
            >
              Back to Menu
            </button>
          </Overlay>
        )}
      </div>

      {/* Controls hint */}
      <p className="text-[11px] text-gray-600 text-center">
        Arrow keys / WASD / Swipe &middot; Space = Pause &middot; Enter = Start
      </p>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 bg-navy-900/85 backdrop-blur-sm flex flex-col items-center justify-center z-10">
      {children}
    </div>
  );
}

function WrapToggle({
  wrapAround,
  toggle,
}: {
  wrapAround: boolean;
  toggle: () => void;
}) {
  return (
    <label className="flex items-center gap-2 mt-4 cursor-pointer text-sm text-gray-400 select-none">
      <span
        onClick={toggle}
        className={`w-9 h-5 rounded-full relative transition-colors ${
          wrapAround ? "bg-accent" : "bg-navy-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            wrapAround ? "translate-x-4" : ""
          }`}
        />
      </span>
      <span onClick={toggle}>Wrap-around mode</span>
    </label>
  );
}
