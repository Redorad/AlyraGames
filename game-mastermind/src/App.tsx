import { useEffect, useState } from "react";

const COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#a78bfa", "#06b6d4"];
const CODE_LEN = 4;
const MAX_TRIES = 10;
const STORAGE_KEY = "mastermind-stats";

interface Stats {
  played: number;
  wins: number;
  bestTries: number;
}

const loadStats = (): Stats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { played: 0, wins: 0, bestTries: 0 };
};

const saveStats = (s: Stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

const genCode = (): number[] => {
  const c: number[] = [];
  for (let i = 0; i < CODE_LEN; i++) c.push(Math.floor(Math.random() * COLORS.length));
  return c;
};

const scoreGuess = (guess: number[], code: number[]): { black: number; white: number } => {
  let black = 0;
  const guessRem: number[] = [];
  const codeRem: number[] = [];
  for (let i = 0; i < CODE_LEN; i++) {
    if (guess[i] === code[i]) black++;
    else {
      guessRem.push(guess[i]);
      codeRem.push(code[i]);
    }
  }
  let white = 0;
  for (const g of guessRem) {
    const idx = codeRem.indexOf(g);
    if (idx !== -1) {
      white++;
      codeRem.splice(idx, 1);
    }
  }
  return { black, white };
};

export default function App() {
  const [code, setCode] = useState<number[]>(() => genCode());
  const [guesses, setGuesses] = useState<{ guess: number[]; black: number; white: number }[]>([]);
  const [current, setCurrent] = useState<(number | null)[]>(Array(CODE_LEN).fill(null));
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [stats, setStats] = useState<Stats>(loadStats);
  const [activeSlot, setActiveSlot] = useState(0);

  const reset = () => {
    setCode(genCode());
    setGuesses([]);
    setCurrent(Array(CODE_LEN).fill(null));
    setStatus("playing");
    setActiveSlot(0);
  };

  const placeColor = (colorIdx: number) => {
    if (status !== "playing") return;
    const next = [...current];
    next[activeSlot] = colorIdx;
    setCurrent(next);
    const nextSlot = next.findIndex((v, i) => v === null && i > activeSlot);
    if (nextSlot !== -1) setActiveSlot(nextSlot);
    else if (next.every((v) => v !== null)) setActiveSlot(CODE_LEN - 1);
    else setActiveSlot(next.findIndex((v) => v === null));
  };

  const submit = () => {
    if (current.some((v) => v === null)) return;
    const guessArr = current as number[];
    const { black, white } = scoreGuess(guessArr, code);
    const newGuesses = [...guesses, { guess: guessArr, black, white }];
    setGuesses(newGuesses);
    if (black === CODE_LEN) {
      setStatus("won");
      const next: Stats = {
        played: stats.played + 1,
        wins: stats.wins + 1,
        bestTries: stats.bestTries === 0 ? newGuesses.length : Math.min(stats.bestTries, newGuesses.length),
      };
      setStats(next);
      saveStats(next);
    } else if (newGuesses.length >= MAX_TRIES) {
      setStatus("lost");
      const next: Stats = { ...stats, played: stats.played + 1 };
      setStats(next);
      saveStats(next);
    } else {
      setCurrent(Array(CODE_LEN).fill(null));
      setActiveSlot(0);
    }
  };

  useEffect(() => {
    setActiveSlot(0);
  }, [guesses.length]);

  const pegColor = (idx: number | null) => (idx === null ? "bg-navy-900 border-navy-700" : "");

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-4 px-4">
      <div className="w-full max-w-sm flex items-center justify-between mt-2">
        <div className="text-xs">
          <div className="text-steel/60">TRY</div>
          <div className="font-bold text-steel">{guesses.length + 1}/{MAX_TRIES}</div>
        </div>
        <h1 className="text-xl font-black">
          <span className="text-steel">MASTER</span>
          <span className="text-accent">MIND</span>
        </h1>
        <div className="text-xs text-right">
          <div className="text-steel/60">WINS</div>
          <div className="font-bold text-steel">{stats.wins}</div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-sm flex flex-col gap-1.5 mt-4 overflow-y-auto">
        {guesses.map((g, i) => (
          <div key={i} className="flex items-center gap-2 bg-navy-800/50 rounded-lg p-1.5 border border-navy-700">
            <div className="flex gap-1">
              {g.guess.map((c, j) => (
                <div
                  key={j}
                  className="w-7 h-7 rounded-full border border-white/10"
                  style={{ background: COLORS[c] }}
                />
              ))}
            </div>
            <div className="flex-1 flex flex-wrap gap-0.5 justify-end pr-1">
              {Array.from({ length: g.black }).map((_, k) => (
                <div key={`b${k}`} className="w-2.5 h-2.5 rounded-full bg-white" />
              ))}
              {Array.from({ length: g.white }).map((_, k) => (
                <div key={`w${k}`} className="w-2.5 h-2.5 rounded-full bg-transparent border border-white" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {status === "playing" ? (
        <div className="w-full max-w-sm flex flex-col items-center gap-3 mt-3">
          <div className="flex gap-2 p-2 bg-navy-800 rounded-lg border border-navy-700">
            {current.map((c, i) => (
              <button
                key={i}
                onClick={() => setActiveSlot(i)}
                className={`w-9 h-9 rounded-full border-2 ${
                  activeSlot === i ? "border-accent" : "border-navy-700"
                } ${c === null ? "bg-navy-900" : ""}`}
                style={c !== null ? { background: COLORS[c] } : {}}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {COLORS.map((col, i) => (
              <button
                key={i}
                onClick={() => placeColor(i)}
                className="w-9 h-9 rounded-full border-2 border-white/20 hover:scale-110 active:scale-95 transition"
                style={{ background: col }}
              />
            ))}
          </div>

          <button
            onClick={submit}
            disabled={current.some((v) => v === null)}
            className="px-6 py-2 bg-accent text-white font-bold rounded-lg disabled:opacity-40"
          >
            Check
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-3 mt-3">
          <div className={`text-2xl font-black ${status === "won" ? "text-emerald-400" : "text-red-400"}`}>
            {status === "won" ? "You cracked it!" : "Game Over"}
          </div>
          <div className="flex gap-1">
            {code.map((c, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border border-white/10"
                style={{ background: COLORS[c] }}
              />
            ))}
          </div>
          <button onClick={reset} className="px-6 py-2 bg-accent text-white font-bold rounded-lg">
            Play Again
          </button>
          <div className="text-[10px] text-slate-500">
            Best: {stats.bestTries > 0 ? `${stats.bestTries} tries` : "—"} &middot; Played: {stats.played}
          </div>
        </div>
      )}
    </div>
  );
}
