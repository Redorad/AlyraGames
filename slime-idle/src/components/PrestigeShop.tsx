import { useState, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { PRESTIGE_UPGRADES, PrestigeUpgrade } from "../data/prestigeUpgrades";

export function PrestigeShop() {
  const [open, setOpen] = useState(false);
  const prestigePoints = useGameStore((s) => s.prestigePoints);
  const prestigeUpgrades = useGameStore((s) => s.prestigeUpgrades);
  const buyPrestigeUpgrade = useGameStore((s) => s.buyPrestigeUpgrade);
  const getPrestigeUpgradeCost = useGameStore((s) => s.getPrestigeUpgradeCost);
  const prestigeCount = useGameStore((s) => s.prestigeCount);

  const buyMax = useCallback((upgrade: PrestigeUpgrade) => {
    let bought = 0;
    while (true) {
      const level = useGameStore.getState().prestigeUpgrades[upgrade.id] ?? 0;
      if (level >= upgrade.maxLevel) break;
      const cost = useGameStore.getState().getPrestigeUpgradeCost(upgrade);
      if (useGameStore.getState().prestigePoints < cost) break;
      buyPrestigeUpgrade(upgrade);
      bought++;
      if (bought > 100) break; // safety limit
    }
  }, [buyPrestigeUpgrade]);

  if (prestigeCount === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="shimmer-btn text-xs px-3 py-1 rounded bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 hover:bg-yellow-600/30 transition-colors"
      >
        ✦ Prestige Shop ({prestigePoints} pts)
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass border border-yellow-500/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-yellow-400 font-bold mb-1">
          ✦ Prestige Shop
        </h2>
        <p className="text-sm text-gray-400 mb-3">
          Points: <span className="text-yellow-400 font-bold">{prestigePoints}</span>
        </p>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {PRESTIGE_UPGRADES.map((upgrade) => {
            const level = prestigeUpgrades[upgrade.id] ?? 0;
            const maxed = level >= upgrade.maxLevel;
            const cost = getPrestigeUpgradeCost(upgrade);
            const canAfford = prestigePoints >= cost && !maxed;

            // Format description
            let desc = upgrade.description;
            if (upgrade.effect.type === "start_magicules") {
              const val = upgrade.effect.valuePerLevel * (level + 1) * Math.pow(10, Math.floor((level + 1) / 5));
              desc = desc.replace("{value}", val.toLocaleString());
            } else {
              desc = desc.replace("{value}", (upgrade.effect.valuePerLevel * (level + 1) * 100).toFixed(0) + "%");
            }

            return (
              <button
                key={upgrade.id}
                onClick={() => buyPrestigeUpgrade(upgrade)}
                disabled={!canAfford}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                  ${maxed
                    ? "border-yellow-500/20 bg-yellow-900/10 opacity-60"
                    : canAfford
                    ? "border-yellow-500/30 bg-navy-800/80 hover:bg-navy-700/80 hover:border-yellow-500/60 active:scale-[0.98]"
                    : "border-gray-700/30 bg-navy-900/50 opacity-40 cursor-not-allowed"
                  }`}
              >
                <span className="text-2xl">{upgrade.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-white text-sm">{upgrade.name}</span>
                    <span className="text-xs text-yellow-400">
                      {maxed ? "MAX" : `Lv.${level}/${upgrade.maxLevel}`}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{desc}</div>
                </div>
                {!maxed && (
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <div className={`text-sm font-bold ${canAfford ? "text-yellow-400" : "text-gray-500"}`}>
                      {cost} pts
                    </div>
                    {canAfford && (
                      <button
                        onClick={(e) => { e.stopPropagation(); buyMax(upgrade); }}
                        className="text-[10px] px-2 py-0.5 rounded bg-yellow-600/30 text-yellow-300 hover:bg-yellow-600/50 border border-yellow-600/40"
                      >
                        Buy Max
                      </button>
                    )}
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
    </div>
  );
}
