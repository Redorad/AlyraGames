import { useGameStore } from '../store';
import type { Difficulty } from '../sudoku';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export default function Header() {
  const elapsed = useGameStore(s => s.elapsed);
  const difficulty = useGameStore(s => s.difficulty);
  const newGame = useGameStore(s => s.newGame);
  const bestTimes = useGameStore(s => s.bestTimes);
  const hintsUsed = useGameStore(s => s.hintsUsed);

  const bestTime = bestTimes[difficulty];

  return (
    <div className="w-full max-w-lg px-4 pt-6 pb-2">
      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-steel">SUDOKU</span>{' '}
          <span className="text-accent">ZEN</span>
        </h1>
      </div>

      {/* Difficulty selector */}
      <div className="flex justify-center gap-2 mb-4">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
          <button
            key={d}
            onClick={() => newGame(d)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              difficulty === d
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'bg-navy-800 text-slate-400 border border-white/5 hover:border-accent/20 hover:text-slate-300'
            }`}
          >
            {difficultyLabels[d]}
          </button>
        ))}
      </div>

      {/* Timer and stats row */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <div className="font-mono text-lg font-bold text-steel">
            {formatTime(elapsed)}
          </div>
          {bestTime !== null && (
            <div className="text-slate-500 text-xs">
              Best: {formatTime(bestTime)}
            </div>
          )}
        </div>
        <div className="text-slate-500 text-xs">
          Hints: {hintsUsed}
        </div>
      </div>
    </div>
  );
}
