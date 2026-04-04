import { useExtraStore } from "../store/extraStore";
import { getDailyReward, DAILY_REWARDS } from "../data/dailyRewards";

export function DailyRewardModal() {
  const pendingDailyReward = useExtraStore((s) => s.pendingDailyReward);
  const loginStreak = useExtraStore((s) => s.loginStreak);
  const claimDailyReward = useExtraStore((s) => s.claimDailyReward);

  if (!pendingDailyReward) return null;

  const reward = getDailyReward(loginStreak);
  const streakIdx = ((loginStreak - 1) % DAILY_REWARDS.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-navy-800 border border-yellow-500/40 rounded-xl p-6 max-w-xs w-full text-center">
        <div className="text-4xl mb-2">{reward.emoji}</div>
        <h2 className="text-yellow-400 font-bold text-lg mb-1">Day {loginStreak} Login!</h2>
        <p className="text-sm text-gray-400 mb-3">{reward.description}</p>

        {/* Streak dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {DAILY_REWARDS.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${i <= streakIdx ? "bg-yellow-400" : "bg-navy-700"}`}
            />
          ))}
        </div>

        <p className="text-xs text-gray-500 mb-4">
          ×{reward.reward.magiculesMult} passive/s reward
          {reward.reward.prestigePoints ? ` + ${reward.reward.prestigePoints} prestige pts` : ""}
        </p>

        <button
          onClick={claimDailyReward}
          className="w-full py-3 bg-yellow-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform"
        >
          Claim!
        </button>
      </div>
    </div>
  );
}
