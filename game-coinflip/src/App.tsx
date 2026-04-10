import { useState } from "react";

type Side = "heads" | "tails";

const STORAGE_KEY = "coinflip-stats";

interface Stats {
  bestStreak: number;
  totalFlips: number;
  totalCorrect: number;
}

const loadStats = (): Stats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { bestStreak: 0, totalFlips: 0, totalCorrect: 0 };
};

const saveStats = (s: Stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

export default function App() {
  const [streak, setStreak] = useState(0);
  const [lastResult, setLastResult] = useState<Side | null>(null);
  const [lastGuess, setLastGuess] = useState<Side | null>(null);
  const [message, setMessage] = useState<string>("");
  const [flipping, setFlipping] = useState(false);
  const [stats, setStats] = useState<Stats>(loadStats);
  const [history, setHistory] = useState<Side[]>([]);

  const flip = (guess: Side) => {
    if (flipping) return;
    setFlipping(true);
    setLastGuess(guess);
    setMessage("");
    setTimeout(() => {
      const result: Side = Math.random() < 0.5 ? "heads" : "tails";
      setLastResult(result);
      setHistory((h) => [result, ...h].slice(0, 20));
      setFlipping(false);
      const correct = guess === result;
      if (correct) {
        const ns = streak + 1;
        setStreak(ns);
        setMessage("Correct!");
        const stat = {
          totalFlips: stats.totalFlips + 1,
          totalCorrect: stats.totalCorrect + 1,
          bestStreak: Math.max(stats.bestStreak, ns),
        };
        setStats(stat);
        saveStats(stat);
      } else {
        setMessage(`Wrong! Streak broken at ${streak}`);
        setStreak(0);
        const stat = {
          ...stats,
          totalFlips: stats.totalFlips + 1,
        };
        setStats(stat);
        saveStats(stat);
      }
    }, 700);
  };

  const reset = () => {
    setStreak(0);
    setLastResult(null);
    setLastGuess(null);
    setMessage("");
    setHistory([]);
  };

  const accuracy =
    stats.totalFlips > 0 ? Math.round((stats.totalCorrect / stats.totalFlips) * 100) : 0;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-6 px-4">
      <div className="w-full max-w-sm flex items-center justify-between mt-2">
        <div className="text-center">
          <div className="text-xs text-steel/60">STREAK</div>
          <div className="text-2xl font-black text-accent">{streak}</div>
        </div>
        <h1 className="text-xl font-black">
          <span className="text-steel">COIN</span>
          <span className="text-accent">FLIP</span>
        </h1>
        <div className="text-center">
          <div className="text-xs text-steel/60">BEST</div>
          <div className="text-2xl font-black text-steel">{stats.bestStreak}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div
          className={`w-40 h-40 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-4 border-yellow-300 flex items-center justify-center text-6xl shadow-2xl ${
            flipping ? "animate-spin" : ""
          }`}
          style={{ boxShadow: "0 0 60px rgba(251,191,36,0.3)" }}
        >
          {flipping ? "🪙" : lastResult === "heads" ? "👑" : lastResult === "tails" ? "⭐" : "🪙"}
        </div>

        <div className="text-center h-12">
          {lastResult && !flipping && (
            <>
              <div className="text-sm text-steel capitalize">{lastResult}!</div>
              <div
                className={`text-xs font-bold ${
                  lastGuess === lastResult ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {message}
              </div>
            </>
          )}
          {flipping && <div className="text-sm text-slate-400">Flipping...</div>}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => flip("heads")}
          disabled={flipping}
          className="px-6 py-3 bg-navy-800 border-2 border-navy-700 hover:border-accent rounded-xl disabled:opacity-40 active:scale-95 transition"
        >
          <div className="text-3xl">👑</div>
          <div className="text-xs font-bold uppercase mt-1">Heads</div>
        </button>
        <button
          onClick={() => flip("tails")}
          disabled={flipping}
          className="px-6 py-3 bg-navy-800 border-2 border-navy-700 hover:border-accent rounded-xl disabled:opacity-40 active:scale-95 transition"
        >
          <div className="text-3xl">⭐</div>
          <div className="text-xs font-bold uppercase mt-1">Tails</div>
        </button>
      </div>

      {history.length > 0 && (
        <div className="flex gap-1 flex-wrap justify-center mt-2 max-w-xs">
          {history.map((h, i) => (
            <div
              key={i}
              className={`text-lg ${i === 0 ? "" : "opacity-60"}`}
              style={{ opacity: Math.max(0.2, 1 - i * 0.05) }}
            >
              {h === "heads" ? "👑" : "⭐"}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-1">
        <button
          onClick={reset}
          className="text-xs text-slate-500 hover:text-steel px-3 py-1"
        >
          Reset streak
        </button>
        <div className="text-[10px] text-slate-500">
          Total flips: {stats.totalFlips} &middot; Accuracy: {accuracy}%
        </div>
      </div>
    </div>
  );
}
