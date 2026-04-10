import { useState } from "react";

const STORAGE_KEY = "dice-stats";

interface Stats {
  bestScore: number;
  gamesPlayed: number;
}

const loadStats = (): Stats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { bestScore: 0, gamesPlayed: 0 };
};

const saveStats = (s: Stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

interface Category {
  key: string;
  label: string;
  score: (dice: number[]) => number;
}

const sum = (d: number[]) => d.reduce((a, b) => a + b, 0);

const countOf = (d: number[], n: number) => d.filter((x) => x === n).length;

const CATEGORIES: Category[] = [
  { key: "ones", label: "Ones", score: (d) => countOf(d, 1) * 1 },
  { key: "twos", label: "Twos", score: (d) => countOf(d, 2) * 2 },
  { key: "threes", label: "Threes", score: (d) => countOf(d, 3) * 3 },
  { key: "fours", label: "Fours", score: (d) => countOf(d, 4) * 4 },
  { key: "fives", label: "Fives", score: (d) => countOf(d, 5) * 5 },
  { key: "sixes", label: "Sixes", score: (d) => countOf(d, 6) * 6 },
  {
    key: "pair",
    label: "Pair",
    score: (d) => {
      for (let v = 6; v >= 1; v--) if (countOf(d, v) >= 2) return v * 2;
      return 0;
    },
  },
  {
    key: "threeKind",
    label: "Three of a Kind",
    score: (d) => {
      for (let v = 1; v <= 6; v++) if (countOf(d, v) >= 3) return sum(d);
      return 0;
    },
  },
  {
    key: "fourKind",
    label: "Four of a Kind",
    score: (d) => {
      for (let v = 1; v <= 6; v++) if (countOf(d, v) >= 4) return sum(d);
      return 0;
    },
  },
  {
    key: "fullHouse",
    label: "Full House",
    score: (d) => {
      const counts: Record<number, number> = {};
      d.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
      const vals = Object.values(counts).sort((a, b) => b - a);
      return vals[0] === 3 && vals[1] === 2 ? 25 : 0;
    },
  },
  {
    key: "smallStraight",
    label: "Small Straight",
    score: (d) => {
      const s = new Set(d);
      if ([1, 2, 3, 4].every((v) => s.has(v))) return 30;
      if ([2, 3, 4, 5].every((v) => s.has(v))) return 30;
      if ([3, 4, 5, 6].every((v) => s.has(v))) return 30;
      return 0;
    },
  },
  {
    key: "largeStraight",
    label: "Large Straight",
    score: (d) => {
      const s = new Set(d);
      if ([1, 2, 3, 4, 5].every((v) => s.has(v))) return 40;
      if ([2, 3, 4, 5, 6].every((v) => s.has(v))) return 40;
      return 0;
    },
  },
  {
    key: "yahtzee",
    label: "Dice Bonus",
    score: (d) => (d.every((v) => v === d[0]) ? 50 : 0),
  },
  { key: "chance", label: "Chance", score: sum },
];

const DIE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const rollDie = () => Math.floor(Math.random() * 6) + 1;

export default function App() {
  const [dice, setDice] = useState<number[]>([0, 0, 0, 0, 0]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [scored, setScored] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<Stats>(loadStats);
  const [round, setRound] = useState(1);
  const [rolling, setRolling] = useState(false);

  const isGameOver = Object.keys(scored).length >= CATEGORIES.length;
  const totalScore = Object.values(scored).reduce((a, b) => a + b, 0);

  const roll = () => {
    if (rollsLeft <= 0 || rolling) return;
    setRolling(true);
    setTimeout(() => {
      const next = dice.map((v, i) => (held[i] && v !== 0 ? v : rollDie()));
      setDice(next);
      setRollsLeft((r) => r - 1);
      setRolling(false);
    }, 300);
  };

  const toggleHold = (i: number) => {
    if (rollsLeft === 3 || dice[i] === 0) return;
    const nh = [...held];
    nh[i] = !nh[i];
    setHeld(nh);
  };

  const pickCategory = (cat: Category) => {
    if (scored[cat.key] !== undefined) return;
    if (rollsLeft === 3) return;
    const points = cat.score(dice);
    const newScored = { ...scored, [cat.key]: points };
    setScored(newScored);

    if (Object.keys(newScored).length >= CATEGORIES.length) {
      const finalScore = Object.values(newScored).reduce((a, b) => a + b, 0);
      const next: Stats = {
        bestScore: Math.max(stats.bestScore, finalScore),
        gamesPlayed: stats.gamesPlayed + 1,
      };
      setStats(next);
      saveStats(next);
    } else {
      setDice([0, 0, 0, 0, 0]);
      setHeld([false, false, false, false, false]);
      setRollsLeft(3);
      setRound((r) => r + 1);
    }
  };

  const reset = () => {
    setDice([0, 0, 0, 0, 0]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setScored({});
    setRound(1);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-4 px-4 overflow-y-auto">
      <div className="w-full max-w-sm flex items-center justify-between mt-2">
        <div className="text-xs">
          <div className="text-steel/60">ROUND</div>
          <div className="font-bold text-steel">{round}/{CATEGORIES.length}</div>
        </div>
        <h1 className="text-xl font-black">
          <span className="text-steel">DICE</span>
          <span className="text-accent">ROLL</span>
        </h1>
        <div className="text-xs text-right">
          <div className="text-steel/60">SCORE</div>
          <div className="font-bold text-accent">{totalScore}</div>
        </div>
      </div>

      {!isGameOver ? (
        <>
          <div className="flex gap-2 my-3">
            {dice.map((d, i) => (
              <button
                key={i}
                onClick={() => toggleHold(i)}
                className={`w-14 h-14 rounded-lg text-4xl flex items-center justify-center border-2 transition ${
                  held[i]
                    ? "bg-accent/30 border-accent text-accent"
                    : "bg-navy-800 border-navy-700 text-steel"
                } ${rolling ? "animate-pulse" : ""}`}
              >
                {d === 0 ? "·" : DIE_FACES[d]}
              </button>
            ))}
          </div>

          <button
            onClick={roll}
            disabled={rollsLeft === 0 || rolling}
            className="px-6 py-2 bg-accent text-white font-bold rounded-lg disabled:opacity-40"
          >
            Roll ({rollsLeft} left)
          </button>

          <div className="w-full max-w-sm mt-3 grid grid-cols-2 gap-1">
            {CATEGORIES.map((cat) => {
              const usedScore = scored[cat.key];
              const isUsed = usedScore !== undefined;
              const preview = rollsLeft < 3 && !isUsed ? cat.score(dice) : null;
              return (
                <button
                  key={cat.key}
                  disabled={isUsed || rollsLeft === 3}
                  onClick={() => pickCategory(cat)}
                  className={`px-2 py-1.5 rounded text-xs text-left flex justify-between ${
                    isUsed
                      ? "bg-navy-700/40 text-slate-500"
                      : rollsLeft === 3
                      ? "bg-navy-800 text-slate-500"
                      : "bg-navy-800 text-white hover:bg-navy-700 border border-navy-700"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`font-bold ${preview && preview > 0 ? "text-accent" : ""}`}>
                    {isUsed ? usedScore : preview ?? "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 my-10">
          <div className="text-4xl">🏆</div>
          <div className="text-2xl font-black text-emerald-400">Game Complete!</div>
          <div className="text-sm text-slate-400">Final score: {totalScore}</div>
          <div className="text-xs text-steel">Best: {stats.bestScore}</div>
          <button
            onClick={reset}
            className="px-6 py-2 bg-accent text-white font-bold rounded-lg"
          >
            Play Again
          </button>
        </div>
      )}

      <div className="text-[10px] text-slate-500 mt-2">
        Best: {stats.bestScore} &middot; Games: {stats.gamesPlayed}
      </div>
    </div>
  );
}
