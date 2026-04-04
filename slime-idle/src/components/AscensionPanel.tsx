import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useExtraStore } from "../store/extraStore";
import { ASCENSION_UPGRADES } from "../data/ascension";

export function AscensionPanel() {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const ascensionCount = useExtraStore((s) => s.ascensionCount);
  const ascensionPoints = useExtraStore((s) => s.ascensionPoints);
  const ascensionUpgrades = useExtraStore((s) => s.ascensionUpgrades);
  const buyAscensionUpgrade = useExtraStore((s) => s.buyAscensionUpgrade);
  const ascend = useExtraStore((s) => s.ascend);

  const canAscend = prestigeCount >= 10;
  if (!canAscend && ascensionCount === 0) return null;

  const pointsOnAscend = Math.floor(1 + Math.pow(Math.max(0, prestigeCount - 9), 1.3));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="shimmer-btn text-xs px-3 py-1 rounded bg-purple-600/20 text-purple-400 border border-purple-600/40 hover:bg-purple-600/30 transition-colors"
      >
        🌌 Ascension {ascensionCount > 0 ? `(${ascensionPoints} AP)` : ""}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass border border-purple-500/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-purple-400 font-bold mb-1">🌌 Ascension</h2>
        <p className="text-sm text-gray-400 mb-1">
          Ascension Points: <span className="text-purple-400 font-bold">{ascensionPoints}</span>
          {ascensionCount > 0 && <span className="text-gray-500 ml-2">({ascensionCount} ascensions)</span>}
        </p>
        {canAscend && (
          <button
            onClick={() => setShowConfirm(true)}
            className="mb-3 px-3 py-1.5 rounded bg-purple-600/30 text-purple-300 text-sm font-bold border border-purple-500/40 hover:bg-purple-600/50 transition-colors"
          >
            Ascend (+{pointsOnAscend} AP)
          </button>
        )}
        {!canAscend && (
          <p className="text-xs text-gray-500 mb-3">Reach prestige 10 to ascend again.</p>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {ASCENSION_UPGRADES.map((upgrade) => {
            const level = ascensionUpgrades[upgrade.id] ?? 0;
            const maxed = level >= upgrade.maxLevel;
            const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costScale, level));
            const canAfford = ascensionPoints >= cost && !maxed;

            let desc = upgrade.description.replace(
              "{value}",
              String(upgrade.effect.valuePerLevel * (level + 1))
            );

            return (
              <button
                key={upgrade.id}
                onClick={() => buyAscensionUpgrade(upgrade.id)}
                disabled={!canAfford}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                  ${maxed
                    ? "border-purple-500/20 bg-purple-900/10 opacity-60"
                    : canAfford
                    ? "border-purple-500/30 bg-navy-800/80 hover:bg-navy-700/80 hover:border-purple-500/60 active:scale-[0.98]"
                    : "border-gray-700/30 bg-navy-900/50 opacity-40 cursor-not-allowed"
                  }`}
              >
                <span className="text-2xl">{upgrade.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-white text-sm">{upgrade.name}</span>
                    <span className="text-xs text-purple-400">
                      {maxed ? "MAX" : `Lv.${level}/${upgrade.maxLevel}`}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{desc}</div>
                </div>
                {!maxed && (
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${canAfford ? "text-purple-400" : "text-gray-500"}`}>
                      {cost} AP
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setOpen(false)}
          className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm hover:bg-navy-800 border border-steel/20"
        >
          Close
        </button>
      </div>

      {/* Ascend confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="bg-navy-800 border border-purple-500/40 rounded-xl p-6 max-w-xs text-center">
            <p className="text-white mb-2 font-semibold">🌌 Ascend?</p>
            <p className="text-sm text-gray-400 mb-1">
              Reset ALL progress including prestige count, but keep ascension upgrades & achievements.
            </p>
            <p className="text-sm text-purple-400 mb-4">
              Earn <span className="font-bold">{pointsOnAscend}</span> ascension points
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { ascend(); setShowConfirm(false); }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-500"
              >
                Ascend
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
