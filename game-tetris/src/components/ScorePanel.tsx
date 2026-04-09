import { useGameStore } from '../store/gameStore';

export default function ScorePanel() {
  const score = useGameStore(s => s.score);
  const lines = useGameStore(s => s.lines);
  const level = useGameStore(s => s.level);
  const highScore = useGameStore(s => s.highScore);

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg p-3 mb-3">
      <div className="space-y-2">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Score</div>
          <div className="text-xl font-bold text-steel">{score.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">High Score</div>
          <div className="text-sm font-semibold text-accent">{highScore.toLocaleString()}</div>
        </div>
        <div className="flex gap-4">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Level</div>
            <div className="text-lg font-bold text-white">{level}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Lines</div>
            <div className="text-lg font-bold text-white">{lines}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
