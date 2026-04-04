import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useExtraStore } from "../store/extraStore";
import { formatNumber } from "../utils/format";

export function ResetButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPrestige, setShowPrestige] = useState(false);
  const reset = useGameStore((s) => s.reset);
  const resetExtra = useExtraStore((s) => s.resetExtra);
  const prestige = useGameStore((s) => s.prestige);
  const evolutionIndex = useGameStore((s) => s.evolutionIndex);
  const lifetimeMagicules = useGameStore((s) => s.lifetimeMagicules);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const canPrestige = evolutionIndex >= 7;

  // Estimate prestige points
  const pointsEarned = canPrestige
    ? Math.floor(1 + Math.pow(evolutionIndex - 6, 1.5) + Math.log10(Math.max(1, lifetimeMagicules)) * 0.5)
    : 0;

  return (
    <div className="flex gap-2 items-center">
      {canPrestige && (
        <>
          <button
            onClick={() => setShowPrestige(true)}
            className="text-xs px-3 py-1 rounded bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 hover:bg-yellow-600/30 transition-colors"
          >
            ✦ Reincarnate
          </button>
          {showPrestige && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="bg-navy-800 border border-accent/40 rounded-xl p-6 max-w-xs text-center">
                <p className="text-white mb-2 font-semibold">Reincarnate?</p>
                <p className="text-sm text-gray-400 mb-1">
                  Reset progress but keep prestige upgrades, achievements & challenges.
                </p>
                <p className="text-sm text-yellow-400 mb-1">
                  Earn <span className="font-bold">{pointsEarned}</span> prestige points
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Base multiplier: ×{(1 + (prestigeCount + 1) * 0.5).toFixed(1)}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { prestige(); setShowPrestige(false); }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-bold hover:bg-yellow-500"
                  >
                    Reincarnate
                  </button>
                  <button
                    onClick={() => setShowPrestige(false)}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs px-3 py-1 rounded bg-red-900/20 text-red-400 border border-red-800/40 hover:bg-red-900/30 transition-colors"
      >
        Reset
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-navy-800 border border-red-500/40 rounded-xl p-6 max-w-xs text-center">
            <p className="text-white mb-2 font-semibold">Reset ALL progress?</p>
            <p className="text-sm text-gray-400 mb-4">This deletes everything including prestige. Cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { reset(); resetExtra(); setShowConfirm(false); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-500"
              >
                Reset
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
