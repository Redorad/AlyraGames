import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { EVOLUTIONS } from "../data/evolutions";

export function ResetButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPrestige, setShowPrestige] = useState(false);
  const reset = useGameStore((s) => s.reset);
  const prestige = useGameStore((s) => s.prestige);
  const evolutionIndex = useGameStore((s) => s.evolutionIndex);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const canPrestige = evolutionIndex >= EVOLUTIONS.length - 1;

  return (
    <div className="px-3 py-2 flex gap-2 justify-center">
      {canPrestige && (
        <>
          <button
            onClick={() => setShowPrestige(true)}
            className="text-xs px-3 py-1 rounded bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 hover:bg-yellow-600/30 transition-colors"
          >
            ✦ Reincarnate (Prestige)
          </button>
          {showPrestige && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="bg-navy-800 border border-accent/40 rounded-xl p-6 max-w-xs text-center">
                <p className="text-white mb-2 font-semibold">Reincarnate?</p>
                <p className="text-sm text-gray-400 mb-4">
                  Reset all progress for a permanent ×{(1 + (prestigeCount + 1) * 0.5).toFixed(1)} multiplier.
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
        Reset Game
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-navy-800 border border-red-500/40 rounded-xl p-6 max-w-xs text-center">
            <p className="text-white mb-2 font-semibold">Reset all progress?</p>
            <p className="text-sm text-gray-400 mb-4">This cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { reset(); setShowConfirm(false); }}
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
