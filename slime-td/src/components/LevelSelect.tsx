import { LEVELS } from "../data/levels";
import { getAvailableTowers } from "../data/towers";
import { useProgressStore } from "../store/gameStore";

interface Props {
  onSelect: (levelId: number) => void;
}

export default function LevelSelect({ onSelect }: Props) {
  const { completed, highestUnlocked } = useProgressStore();

  return (
    <div className="min-h-full bg-navy-900 flex flex-col">
      {/* Header */}
      <div className="text-center pt-6 pb-4 px-4">
        <h1 className="text-2xl font-bold text-steel">Slime TD</h1>
        <p className="text-sm text-gray-400 mt-1">Tower Defense — Tensei Shitara Slime Datta Ken</p>
      </div>

      {/* Level list */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
        {LEVELS.map((lvl) => {
          const unlocked = lvl.id <= highestUnlocked;
          const done = completed.includes(lvl.id);
          const newTowers = getAvailableTowers(lvl.id).filter(
            (t) => t.unlockLevel === lvl.id,
          );

          return (
            <button
              key={lvl.id}
              disabled={!unlocked}
              onClick={() => unlocked && onSelect(lvl.id)}
              className={`level-card w-full text-left rounded-xl p-4 border transition
                ${
                  unlocked
                    ? done
                      ? "bg-navy-700/60 border-green-500/40"
                      : "bg-navy-800 border-steel/30"
                    : "bg-navy-900/50 border-gray-700/30 opacity-40"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">
                      {lvl.id}.
                    </span>
                    <span className="text-lg font-semibold text-steel">
                      {lvl.name}
                    </span>
                    {done && <span className="text-green-400 text-sm">✓</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{lvl.subtitle}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>{lvl.waves.length} vagues</div>
                  <div>{lvl.lives} vies</div>
                </div>
              </div>

              {newTowers.length > 0 && unlocked && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {newTowers.map((t) => (
                    <span
                      key={t.id}
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        borderColor: t.color,
                        color: t.color,
                        backgroundColor: `${t.color}15`,
                      }}
                    >
                      + {t.name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
