import { useEffect, useMemo, useState } from "react";
import { PUZZLES, Puzzle } from "./puzzles";

const STORAGE_KEY = "pictoquiz-stats";

interface Stats {
  best: number;
  played: number;
  totalCorrect: number;
}

const loadStats = (): Stats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { best: 0, played: 0, totalCorrect: 0 };
};

const saveStats = (s: Stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function App() {
  const [deck, setDeck] = useState<Puzzle[]>(() => shuffle(PUZZLES));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState<"playing" | "gameover">("playing");
  const [picked, setPicked] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [removedChoice, setRemovedChoice] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>(loadStats);

  const puzzle = deck[idx % deck.length];
  const choices = useMemo(() => shuffle(puzzle.choices), [puzzle]);

  useEffect(() => {
    if (status === "gameover") {
      setStats((s) => {
        const next = {
          best: Math.max(s.best, score),
          played: s.played + 1,
          totalCorrect: s.totalCorrect + score,
        };
        saveStats(next);
        return next;
      });
    }
    // eslint-disable-next-line
  }, [status]);

  const reset = () => {
    setDeck(shuffle(PUZZLES));
    setIdx(0);
    setScore(0);
    setLives(3);
    setStatus("playing");
    setPicked(null);
    setHintUsed(false);
    setRemovedChoice([]);
  };

  const pickAnswer = (choice: string) => {
    if (picked) return;
    setPicked(choice);
    const isCorrect = choice === puzzle.answer;
    setTimeout(() => {
      if (isCorrect) {
        setScore((s) => s + (hintUsed ? 5 : 10));
      } else {
        setLives((l) => l - 1);
      }
      if (!isCorrect && lives - 1 <= 0) {
        setStatus("gameover");
        return;
      }
      setIdx((i) => i + 1);
      setPicked(null);
      setHintUsed(false);
      setRemovedChoice([]);
    }, 800);
  };

  const useHint = () => {
    if (hintUsed || picked) return;
    const wrong = puzzle.choices.filter((c) => c !== puzzle.answer);
    const toRemove = shuffle(wrong).slice(0, 2);
    setRemovedChoice(toRemove);
    setHintUsed(true);
  };

  const buttonStyle = (choice: string) => {
    if (!picked) return "bg-navy-800 border-navy-700 hover:border-steel";
    if (choice === puzzle.answer) return "bg-emerald-600 border-emerald-500";
    if (choice === picked) return "bg-red-600 border-red-500";
    return "bg-navy-800 border-navy-700 opacity-60";
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-4 px-4 max-w-md mx-auto">
      <div className="w-full flex items-center justify-between mt-2">
        <div className="text-xs">
          <div className="text-steel/60">SCORE</div>
          <div className="font-bold text-steel">{score}</div>
        </div>
        <h1 className="text-xl font-black">
          <span className="text-steel">EMOJI</span>
          <span className="text-accent">QUIZ</span>
        </h1>
        <div className="text-xs text-right">
          <div className="text-steel/60">LIVES</div>
          <div className="font-bold text-red-400">{"❤️".repeat(lives)}</div>
        </div>
      </div>

      {status === "playing" ? (
        <>
          <div className="flex flex-col items-center gap-4 flex-1 justify-center w-full">
            <div className="text-xs uppercase tracking-wider text-accent">{puzzle.category}</div>
            <div className="text-6xl py-6">{puzzle.emojis}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Pick the answer</div>
          </div>

          <div className="w-full grid grid-cols-1 gap-2">
            {choices.map((choice) => {
              const removed = removedChoice.includes(choice);
              return (
                <button
                  key={choice}
                  disabled={removed || !!picked}
                  onClick={() => pickAnswer(choice)}
                  className={`px-3 py-3 rounded-lg border-2 text-sm font-bold transition ${buttonStyle(
                    choice
                  )} ${removed ? "opacity-20 line-through" : ""}`}
                >
                  {choice}
                </button>
              );
            })}
            <button
              onClick={useHint}
              disabled={hintUsed}
              className="mt-1 px-3 py-2 rounded-lg bg-accent/20 border border-accent text-accent text-xs font-bold disabled:opacity-30"
            >
              {hintUsed ? "Hint used" : "💡 Hint (50/50)"}
            </button>
            <div className="text-[10px] text-slate-500 text-center">
              Best: {stats.best} &middot; Question {idx + 1}/{deck.length}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-5xl">🏁</div>
          <div className="text-2xl font-black text-steel">Game Over</div>
          <div className="text-sm text-slate-400">Score: {score}</div>
          <div className="text-xs text-slate-500">Best: {stats.best}</div>
          <button
            onClick={reset}
            className="mt-4 px-6 py-2.5 bg-accent text-white font-bold rounded-lg hover:opacity-90"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
