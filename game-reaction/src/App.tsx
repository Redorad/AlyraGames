import { useState, useRef, useCallback } from "react";

const TOTAL_TRIES = 5;

function getBest(): number { return Number(localStorage.getItem("reaction-best") || "0"); }
function saveBest(ms: number) {
  const cur = getBest();
  if (cur === 0 || ms < cur) localStorage.setItem("reaction-best", String(ms));
}

function getLeaderboard(): number[] {
  const raw = localStorage.getItem("reaction-leaderboard");
  return raw ? JSON.parse(raw) : [];
}
function addToLeaderboard(avg: number) {
  const lb = getLeaderboard();
  lb.push(avg);
  lb.sort((a, b) => a - b);
  localStorage.setItem("reaction-leaderboard", JSON.stringify(lb.slice(0, 10)));
}

type Phase = "idle" | "waiting" | "ready" | "clicked" | "tooEarly" | "done";

export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [best, setBest] = useState(getBest());
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const startRef = useRef(0);
  const tryRef = useRef(0);

  const startTry = useCallback(() => {
    setPhase("waiting");
    setCurrentTime(0);
    const delay = 1500 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      startRef.current = performance.now();
      setPhase("ready");
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (phase === "idle") {
      setTimes([]);
      tryRef.current = 0;
      startTry();
      return;
    }

    if (phase === "waiting") {
      clearTimeout(timerRef.current);
      setPhase("tooEarly");
      return;
    }

    if (phase === "ready") {
      const elapsed = Math.round(performance.now() - startRef.current);
      setCurrentTime(elapsed);
      setPhase("clicked");

      if (elapsed < best || best === 0) {
        saveBest(elapsed);
        setBest(elapsed);
      }

      const newTimes = [...times, elapsed];
      setTimes(newTimes);
      tryRef.current++;

      if (tryRef.current >= TOTAL_TRIES) {
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        addToLeaderboard(avg);
        setTimeout(() => setPhase("done"), 1200);
      } else {
        setTimeout(() => startTry(), 1200);
      }
      return;
    }

    if (phase === "tooEarly") {
      startTry();
      return;
    }

    if (phase === "done") {
      setPhase("idle");
      return;
    }
  }, [phase, times, best, startTry]);

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const leaderboard = getLeaderboard();

  const bgColor = phase === "waiting" ? "bg-red-600" :
    phase === "ready" ? "bg-green-500" :
    phase === "tooEarly" ? "bg-yellow-500" :
    "bg-navy-900";

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center transition-colors duration-200 ${bgColor} cursor-pointer`}
      onClick={handleClick}>
      <a href="/AlyraGames/" className="absolute top-4 left-4 text-steel text-sm hover:underline z-10"
        onClick={e => e.stopPropagation()}>
        &larr; Hub
      </a>

      <div className="flex flex-col items-center gap-4 pointer-events-none">
        {phase === "idle" && (
          <>
            <h1 className="text-4xl font-black text-steel">REACTION TIME</h1>
            <p className="text-6xl">&#9889;</p>
            <p className="text-slate-400 text-lg">Click to start ({TOTAL_TRIES} tries)</p>
            {best > 0 && <p className="text-accent text-sm">Personal best: {best}ms</p>}
            {leaderboard.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-500 mb-1">Leaderboard (avg ms)</p>
                <div className="flex flex-col gap-0.5 text-sm">
                  {leaderboard.slice(0, 5).map((t, i) => (
                    <span key={i} className={i === 0 ? "text-accent font-bold" : "text-slate-400"}>
                      #{i + 1}: {t}ms
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {phase === "waiting" && (
          <>
            <p className="text-3xl font-bold text-white">Wait for green...</p>
            <p className="text-white/60">Try {tryRef.current + 1} of {TOTAL_TRIES}</p>
          </>
        )}

        {phase === "ready" && (
          <p className="text-4xl font-black text-white">CLICK NOW!</p>
        )}

        {phase === "clicked" && (
          <>
            <p className="text-5xl font-black text-accent">{currentTime}ms</p>
            <p className="text-slate-400">Try {tryRef.current} of {TOTAL_TRIES}</p>
            {times.length > 0 && (
              <div className="flex gap-3 mt-2">
                {times.map((t, i) => (
                  <span key={i} className="text-sm text-steel">{t}ms</span>
                ))}
              </div>
            )}
          </>
        )}

        {phase === "tooEarly" && (
          <>
            <p className="text-3xl font-bold text-gray-900">Too early!</p>
            <p className="text-gray-800">Click to try again</p>
          </>
        )}

        {phase === "done" && (
          <>
            <h2 className="text-3xl font-black text-steel">Results</h2>
            <div className="flex gap-3 mt-2">
              {times.map((t, i) => (
                <span key={i} className="text-lg text-steel">{t}ms</span>
              ))}
            </div>
            <p className="text-2xl font-bold text-accent mt-2">Average: {avg}ms</p>
            {best > 0 && <p className="text-sm text-slate-400">Best single: {best}ms</p>}
            <p className="text-slate-400 mt-4">Click to play again</p>
          </>
        )}
      </div>
    </div>
  );
}
