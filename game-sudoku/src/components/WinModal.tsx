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

export default function WinModal() {
  const elapsed = useGameStore(s => s.elapsed);
  const difficulty = useGameStore(s => s.difficulty);
  const hintsUsed = useGameStore(s => s.hintsUsed);
  const newGame = useGameStore(s => s.newGame);
  const bestTimes = useGameStore(s => s.bestTimes);

  const bestTime = bestTimes[difficulty];
  const isNewBest = bestTime === elapsed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-navy-800 border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="text-4xl mb-3">
          {isNewBest ? '🏆' : '✨'}
        </div>
        <h2 className="text-2xl font-black text-white mb-1">
          Puzzle Complete!
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          {difficultyLabels[difficulty]} difficulty
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-navy-900/60 rounded-xl p-3">
            <div className="text-xs text-slate-500 mb-1">Time</div>
            <div className="text-xl font-bold text-steel font-mono">{formatTime(elapsed)}</div>
          </div>
          <div className="bg-navy-900/60 rounded-xl p-3">
            <div className="text-xs text-slate-500 mb-1">Hints Used</div>
            <div className="text-xl font-bold text-accent">{hintsUsed}</div>
          </div>
        </div>

        {isNewBest && (
          <div className="text-accent text-sm font-semibold mb-4">
            New best time!
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => newGame(difficulty)}
            className="px-5 py-2.5 bg-accent/20 text-accent border border-accent/40 rounded-lg font-semibold text-sm hover:bg-accent/30 transition-all"
          >
            Play Again
          </button>
          <button
            onClick={() => {
              const next: Difficulty = difficulty === 'easy' ? 'medium' : difficulty === 'medium' ? 'hard' : 'easy';
              newGame(next);
            }}
            className="px-5 py-2.5 bg-navy-700 text-slate-300 border border-white/[0.06] rounded-lg font-semibold text-sm hover:border-accent/20 hover:text-white transition-all"
          >
            Next Difficulty
          </button>
        </div>
      </div>
    </div>
  );
}
