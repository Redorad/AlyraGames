import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { playSelect } from '../utils/sounds';

export default function TitleScreen() {
  const { unlockedLevel, highScores, setScreen, setCurrentLevel } = useGameStore();

  const handleLevelSelect = (level: number) => {
    if (level > unlockedLevel) return;
    playSelect();
    setCurrentLevel(level);
    setScreen('game');
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="animate-fade-in text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-accent mb-2 drop-shadow-lg">
          Slime Match
        </h1>
        <p className="text-steel/70 text-sm sm:text-base">
          Match 3 slimes to score!
        </p>
        <div className="flex justify-center gap-1 mt-2 text-2xl">
          <span>🔵</span><span>🔴</span><span>🟢</span><span>🟡</span><span>🟣</span><span>⚪</span>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-2">
        <h2 className="text-steel text-center text-lg font-semibold mb-3">Select Level</h2>
        <div className="grid grid-cols-2 gap-2">
          {LEVELS.map((lvl) => {
            const unlocked = lvl.level <= unlockedLevel;
            const best = highScores[lvl.level];
            const completed = best !== undefined && best >= lvl.targetScore;

            return (
              <button
                key={lvl.level}
                onClick={() => handleLevelSelect(lvl.level)}
                disabled={!unlocked}
                className={`
                  relative p-3 rounded-lg border text-left transition-all
                  ${unlocked
                    ? completed
                      ? 'bg-accent/20 border-accent/50 hover:bg-accent/30 cursor-pointer'
                      : 'bg-navy-800 border-steel/30 hover:bg-navy-700 hover:border-steel/50 cursor-pointer'
                    : 'bg-navy-900/50 border-navy-700/30 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-white/40'}`}>
                    Level {lvl.level}
                  </span>
                  {completed && <span className="text-sm">⭐</span>}
                  {!unlocked && <span className="text-sm">🔒</span>}
                </div>
                <div className={`text-xs mt-1 ${unlocked ? 'text-steel/70' : 'text-white/30'}`}>
                  Target: {lvl.targetScore.toLocaleString()}
                </div>
                {best !== undefined && (
                  <div className="text-xs text-accent/80 mt-0.5">
                    Best: {best.toLocaleString()}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 text-center text-steel/40 text-xs animate-fade-in">
        <p>Swap adjacent slimes to match 3+</p>
        <p>Match 4 = Line Clear | Match 5 = Color Bomb</p>
      </div>
    </div>
  );
}
