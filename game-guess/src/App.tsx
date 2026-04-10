import { useState, useRef, useEffect } from "react";

type Range = 100 | 1000 | 10000;

interface Attempt {
  n: number;
  direction: "up" | "down" | "win";
  heat: string;
}

const HS_KEY = "guess_best_scores";

function getHeat(guess: number, target: number, range: number): string {
  const dist = Math.abs(guess - target);
  const ratio = dist / range;
  if (dist === 0) return "🎯";
  if (ratio < 0.01) return "🔥 Burning hot!";
  if (ratio < 0.03) return "🔥 Very hot";
  if (ratio < 0.08) return "♨️ Hot";
  if (ratio < 0.15) return "🌡️ Warm";
  if (ratio < 0.25) return "❄️ Cool";
  if (ratio < 0.5) return "🧊 Cold";
  return "🥶 Freezing";
}

export default function App() {
  const [range, setRange] = useState<Range>(100);
  const [target, setTarget] = useState<number>(() => Math.floor(Math.random() * 100) + 1);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [won, setWon] = useState(false);
  const [bestScores, setBestScores] = useState<Record<Range, number>>(() => {
    const stored = localStorage.getItem(HS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        /* ignore */
      }
    }
    return { 100: 0, 1000: 0, 10000: 0 };
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const newGame = (r: Range) => {
    setRange(r);
    setTarget(Math.floor(Math.random() * r) + 1);
    setAttempts([]);
    setInput("");
    setWon(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const n = parseInt(input, 10);
    if (isNaN(n) || n < 1 || n > range || won) return;
    setInput("");
    if (n === target) {
      const att: Attempt = { n, direction: "win", heat: "🎯 You got it!" };
      setAttempts((a) => [att, ...a]);
      setWon(true);
      const count = attempts.length + 1;
      const prev = bestScores[range];
      if (prev === 0 || count < prev) {
        const next = { ...bestScores, [range]: count };
        setBestScores(next);
        localStorage.setItem(HS_KEY, JSON.stringify(next));
      }
    } else {
      const direction = n < target ? "up" : "down";
      const heat = getHeat(n, target, range);
      setAttempts((a) => [{ n, direction, heat }, ...a]);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center p-6 bg-navy-900">
      <div className="text-center mb-4">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          <span className="text-steel">NUMBER</span>
          <span className="text-accent"> GUESS</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">Higher or lower? Find the number.</p>
      </div>

      <div className="flex gap-2 mb-4">
        {([100, 1000, 10000] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => newGame(r)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              range === r
                ? "bg-accent text-navy-900"
                : "bg-navy-800 text-slate-300 hover:bg-navy-700 border border-white/5"
            }`}
          >
            1-{r}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md bg-navy-800 rounded-2xl p-5 border border-white/5 shadow-xl">
        <div className="flex justify-between text-xs mb-3">
          <div className="text-slate-400">
            Attempts: <span className="text-steel font-bold">{attempts.length}</span>
          </div>
          <div className="text-slate-400">
            Best: <span className="text-accent font-bold">{bestScores[range] || "—"}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={won}
            min={1}
            max={range}
            placeholder={`1 - ${range}`}
            className="flex-1 bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-accent disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={won || !input}
            className="px-5 rounded-lg bg-accent text-navy-900 font-bold text-sm uppercase disabled:opacity-40 hover:brightness-110"
          >
            Guess
          </button>
        </div>

        {won && (
          <div className="text-center mb-3">
            <div className="text-accent font-bold text-lg">You won in {attempts.length} tries!</div>
            <button
              onClick={() => newGame(range)}
              className="mt-2 px-5 py-2 rounded-lg bg-steel text-navy-900 font-bold text-xs uppercase"
            >
              New Game
            </button>
          </div>
        )}

        <div className="max-h-64 overflow-auto space-y-1.5">
          {attempts.map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-navy-900 rounded-lg px-3 py-2 border border-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white">{a.n}</span>
                {a.direction === "up" && <span className="text-steel text-sm">↑ Higher</span>}
                {a.direction === "down" && <span className="text-accent text-sm">↓ Lower</span>}
                {a.direction === "win" && <span className="text-yellow-400 text-sm font-bold">WIN</span>}
              </div>
              <span className="text-xs text-slate-400">{a.heat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
