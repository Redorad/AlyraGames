export interface DailyReward {
  day: number;
  emoji: string;
  description: string;
  reward: { magiculesMult: number; prestigePoints?: number };
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, emoji: "📦", description: "Welcome bonus", reward: { magiculesMult: 60 } },
  { day: 2, emoji: "📦", description: "Day 2 bonus", reward: { magiculesMult: 120 } },
  { day: 3, emoji: "🎁", description: "Day 3 bonus", reward: { magiculesMult: 300 } },
  { day: 4, emoji: "📦", description: "Day 4 bonus", reward: { magiculesMult: 180 } },
  { day: 5, emoji: "🎁", description: "Day 5 bonus!", reward: { magiculesMult: 600 } },
  { day: 6, emoji: "📦", description: "Day 6 bonus", reward: { magiculesMult: 300 } },
  { day: 7, emoji: "🎉", description: "Weekly jackpot!", reward: { magiculesMult: 1800, prestigePoints: 1 } },
];

export function getDailyReward(streak: number): DailyReward {
  const idx = ((streak - 1) % DAILY_REWARDS.length);
  return DAILY_REWARDS[idx];
}
