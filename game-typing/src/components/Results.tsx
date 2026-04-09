import { useGameStore } from '../store/gameStore';

export default function Results() {
  const { wpm, accuracy, errorCount, timeMode, personalBest, resetGame, gameState } = useGameStore();

  if (gameState !== 'finished') return null;

  const best = personalBest[timeMode];
  const isNewBest = best && best.wpm === wpm;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isNewBest ? (
            <span className="text-accent">New Personal Best!</span>
          ) : (
            <span className="text-steel">Results</span>
          )}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-navy-900 rounded-xl p-4 text-center fade-in fade-in-delay-1">
            <div className="text-3xl font-bold text-steel">{wpm}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">WPM</div>
          </div>
          <div className="bg-navy-900 rounded-xl p-4 text-center fade-in fade-in-delay-2">
            <div className="text-3xl font-bold text-accent">{accuracy}%</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Accuracy</div>
          </div>
          <div className="bg-navy-900 rounded-xl p-4 text-center fade-in fade-in-delay-3">
            <div className="text-3xl font-bold text-slate-300">{timeMode}s</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Duration</div>
          </div>
          <div className="bg-navy-900 rounded-xl p-4 text-center fade-in fade-in-delay-4">
            <div className="text-3xl font-bold text-red-400">{errorCount}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Errors</div>
          </div>
        </div>

        {best && (
          <div className="bg-navy-900/50 rounded-lg p-3 mb-6 text-center border border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Personal Best ({timeMode}s)
            </p>
            <p className="text-lg font-bold text-accent">{best.wpm} WPM</p>
            <p className="text-xs text-slate-500">{best.accuracy}% accuracy</p>
          </div>
        )}

        <button
          onClick={resetGame}
          className="w-full py-3 bg-accent hover:bg-accent/80 text-white font-bold rounded-xl
                     transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
