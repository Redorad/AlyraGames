import { useGameStore } from '../store/gameStore';

export default function Header() {
  const score = useGameStore(s => s.score);
  const bestScore = useGameStore(s => s.bestScore);
  const init = useGameStore(s => s.init);

  return (
    <div className="w-full max-w-[360px] mb-4">
      {/* Title row */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            <span className="text-steel">2048</span>{' '}
            <span className="text-accent">Slime</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Fuse slimes to reach the trophy!</p>
        </div>
        <button
          onClick={init}
          className="px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/30 text-accent text-sm font-bold hover:bg-accent/25 active:scale-95 transition-all"
        >
          New Game
        </button>
      </div>

      {/* Score row */}
      <div className="flex gap-3">
        <div className="flex-1 py-2 px-3 rounded-lg bg-navy-800/80 border border-white/5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Score</p>
          <p className="text-xl font-black text-steel">{score.toLocaleString()}</p>
        </div>
        <div className="flex-1 py-2 px-3 rounded-lg bg-navy-800/80 border border-white/5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Best</p>
          <p className="text-xl font-black text-accent">{bestScore.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
