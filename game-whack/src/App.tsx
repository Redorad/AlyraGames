import { useState, useEffect, useRef, useCallback } from "react";

const ROUND_TIME = 30;
const GRID = 9;

function getHi(): number { return Number(localStorage.getItem("whack-hi") || "0"); }
function setHi(s: number) { localStorage.setItem("whack-hi", String(s)); }

export default function App() {
  const [state, setState] = useState<"menu" | "play" | "over">("menu");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [moles, setMoles] = useState<boolean[]>(Array(GRID).fill(false));
  const [whacked, setWhacked] = useState<boolean[]>(Array(GRID).fill(false));
  const [hi, setHiState] = useState(getHi());

  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const moleTimerRef = useRef<ReturnType<typeof setInterval>>();

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(ROUND_TIME);
    setMoles(Array(GRID).fill(false));
    setWhacked(Array(GRID).fill(false));
    setState("play");
  }, []);

  /* countdown timer */
  useEffect(() => {
    if (state !== "play") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          clearInterval(moleTimerRef.current);
          const final = scoreRef.current;
          if (final > getHi()) { setHi(final); setHiState(final); }
          setState("over");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [state]);

  /* mole spawner */
  useEffect(() => {
    if (state !== "play") return;
    const spawn = () => {
      setMoles(prev => {
        const next = [...prev];
        /* put one or two moles up */
        const count = Math.random() > 0.6 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * GRID);
          next[idx] = true;
        }
        return next;
      });
      setWhacked(Array(GRID).fill(false));

      /* hide moles after a delay */
      const hideDelay = 800 + Math.random() * 600;
      setTimeout(() => {
        setMoles(Array(GRID).fill(false));
      }, hideDelay);
    };

    spawn();
    moleTimerRef.current = setInterval(spawn, 1200);
    return () => clearInterval(moleTimerRef.current);
  }, [state]);

  const whack = useCallback((idx: number) => {
    if (state !== "play") return;
    setMoles(prev => {
      if (!prev[idx]) return prev;
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setWhacked(w => { const n = [...w]; n[idx] = true; return n; });
      const next = [...prev];
      next[idx] = false;
      return next;
    });
  }, [state]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <a href="/AlyraGames/" className="text-steel text-sm hover:underline self-start">&larr; Hub</a>

      <h1 className="text-3xl font-black text-steel">WHACK-A-MOLE</h1>

      {/* HUD */}
      <div className="flex gap-8 text-lg font-bold">
        <span>Score: <span className="text-accent">{score}</span></span>
        <span>Time: <span className={timeLeft <= 5 ? "text-red-400" : "text-steel"}>{timeLeft}s</span></span>
        <span className="text-sm text-slate-400 self-end">Best: {hi}</span>
      </div>

      {/* Grid */}
      {state === "menu" ? (
        <div className="flex flex-col items-center gap-6 mt-8">
          <p className="text-slate-400">Whack moles in 30 seconds!</p>
          <button onClick={startGame}
            className="px-8 py-3 rounded-xl bg-accent text-white font-bold text-lg hover:opacity-90 transition">
            Start Game
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mt-2">
            {Array.from({ length: GRID }).map((_, i) => (
              <div
                key={i}
                className={`hole ${whacked[i] ? "hole-hit" : ""}`}
                onMouseDown={() => whack(i)}
                onTouchStart={(e) => { e.preventDefault(); whack(i); }}
              >
                <div className={`mole ${moles[i] ? (whacked[i] ? "whacked" : "up") : ""}`}>
                  {moles[i] ? (whacked[i] ? "💫" : "🐹") : ""}
                </div>
              </div>
            ))}
          </div>

          {state === "over" && (
            <div className="flex flex-col items-center gap-4 mt-4">
              <p className="text-xl font-bold text-red-400">Time's up!</p>
              <p className="text-lg">Final score: <span className="text-accent font-bold">{score}</span></p>
              <button onClick={startGame}
                className="px-8 py-3 rounded-xl bg-accent text-white font-bold hover:opacity-90 transition">
                Play Again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
