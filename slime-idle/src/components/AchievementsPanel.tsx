import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ACHIEVEMENTS } from "../data/achievements";

export function AchievementsPanel({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const unlocked = useGameStore((s) => s.unlockedAchievements);

  if (!onClose && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1"
      >
        🏆 {unlocked.length}/{ACHIEVEMENTS.length}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-steel/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-steel font-bold mb-3">
          🏆 Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlocked.includes(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 p-2 rounded-lg border text-sm
                  ${isUnlocked
                    ? "border-yellow-500/30 bg-yellow-900/10"
                    : "border-gray-700/30 bg-navy-900/30 opacity-40"
                  }`}
              >
                <span className="text-xl">{isUnlocked ? a.emoji : "🔒"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{a.name}</div>
                  <div className="text-xs text-gray-400">{a.description}</div>
                  {isUnlocked && (
                    <div className="text-xs text-yellow-400 mt-0.5">
                      Reward: ×{a.reward.value} {a.reward.type.replace("_mult", "").replace("all", "all income").replace("click", "click power").replace("passive", "passive income")}
                    </div>
                  )}
                </div>
                {isUnlocked && <span className="text-yellow-400">✓</span>}
              </div>
            );
          })}
        </div>
        <button
          onClick={() => onClose ? onClose() : setOpen(false)}
          className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm hover:bg-navy-800 border border-steel/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
