import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { CHALLENGES } from "../data/challenges";
import { formatNumber } from "../utils/format";

export function ChallengesPanel({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const completedChallenges = useGameStore((s) => s.completedChallenges);
  const activeChallenge = useGameStore((s) => s.activeChallenge);
  const challengeMagicules = useGameStore((s) => s.challengeMagicules);
  const startChallenge = useGameStore((s) => s.startChallenge);
  const abandonChallenge = useGameStore((s) => s.abandonChallenge);
  const prestigeCount = useGameStore((s) => s.prestigeCount);

  if (prestigeCount === 0) return null;

  if (!onClose && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1"
      >
        ⚔️ Challenges
      </button>
    );
  }

  const activeCh = CHALLENGES.find((c) => c.id === activeChallenge);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-steel/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-steel font-bold mb-1">⚔️ Challenges</h2>
        <p className="text-xs text-gray-400 mb-3">
          Complete challenges for permanent multipliers. Resets your current run.
        </p>

        {activeCh && (
          <div className="mb-3 p-3 rounded-lg border border-yellow-500/40 bg-yellow-900/10">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-yellow-400 text-sm">
                {activeCh.emoji} {activeCh.name} (Active)
              </span>
            </div>
            <div className="w-full h-2 bg-navy-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all"
                style={{ width: `${Math.min(100, (challengeMagicules / activeCh.goal) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {formatNumber(challengeMagicules)} / {formatNumber(activeCh.goal)}
              </span>
              <button
                onClick={abandonChallenge}
                className="text-xs px-2 py-1 bg-red-900/30 text-red-400 rounded border border-red-800/40 hover:bg-red-900/50"
              >
                Abandon
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {CHALLENGES.map((ch) => {
            const completed = completedChallenges.includes(ch.id);
            const isActive = activeChallenge === ch.id;
            const canStart = !activeChallenge && !completed;

            return (
              <div
                key={ch.id}
                className={`p-3 rounded-lg border text-sm
                  ${completed
                    ? "border-green-500/30 bg-green-900/10"
                    : isActive
                    ? "border-yellow-500/30 bg-yellow-900/10"
                    : "border-gray-700/30 bg-navy-900/30"
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">
                    {ch.emoji} {ch.name}
                    {completed && <span className="text-green-400 ml-2">✓</span>}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{ch.description}</p>
                <p className="text-xs text-gray-500 mb-2">
                  Goal: {formatNumber(ch.goal)} magicules | Reward: ×{ch.reward.value} all income
                </p>
                {canStart && (
                  <button
                    onClick={() => startChallenge(ch)}
                    className="text-xs px-3 py-1 bg-steel/20 text-steel rounded border border-steel/40 hover:bg-steel/30"
                  >
                    Start Challenge
                  </button>
                )}
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
