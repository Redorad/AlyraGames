import { useGameStore } from '../store/gameStore';

export default function StatsBar() {
  const { wpm, accuracy, timeLeft, gameState, timeMode } = useGameStore();

  const displayTime = gameState === 'idle' ? timeMode : timeLeft;
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;

  const timeColor = timeLeft <= 10 && gameState === 'running'
    ? 'text-red-400'
    : 'text-steel';

  return (
    <div className="flex items-center justify-center gap-8 py-3">
      <div className="text-center">
        <div className="text-2xl font-bold text-steel">{wpm}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wider">WPM</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-accent">{accuracy}%</div>
        <div className="text-xs text-slate-500 uppercase tracking-wider">Accuracy</div>
      </div>
      <div className="text-center">
        <div className={`text-2xl font-bold ${timeColor}`}>
          {minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`}
        </div>
        <div className="text-xs text-slate-500 uppercase tracking-wider">Time</div>
      </div>
    </div>
  );
}
