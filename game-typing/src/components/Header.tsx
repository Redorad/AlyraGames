import { useGameStore } from '../store/gameStore';
import type { TimeMode } from '../store/gameStore';

const TIME_OPTIONS: TimeMode[] = [30, 60, 120];

export default function Header() {
  const { timeMode, setTimeMode, gameState } = useGameStore();

  return (
    <header className="text-center pt-6 pb-4">
      <h1 className="text-3xl font-black tracking-tight">
        <span className="text-steel">TYPING</span>{' '}
        <span className="text-accent">SPEED</span>
      </h1>
      <p className="text-slate-500 text-sm mt-1">Test your typing speed</p>

      <div className="flex items-center justify-center gap-2 mt-4">
        {TIME_OPTIONS.map((t) => (
          <button
            key={t}
            onClick={() => setTimeMode(t)}
            disabled={gameState === 'running'}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              timeMode === t
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'bg-navy-700 text-slate-400 hover:bg-navy-800 hover:text-slate-300'
            } ${gameState === 'running' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {t}s
          </button>
        ))}
      </div>
    </header>
  );
}
