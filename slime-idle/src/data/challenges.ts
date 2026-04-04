export interface Challenge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  modifier: {
    clickDisabled?: boolean;
    passiveMultiplier?: number;
    clickMultiplier?: number;
    costMultiplier?: number;
    basePassive?: number; // free passive income to start with
  };
  reward: { type: "all_mult"; value: number };
  goal: number;
}

export const CHALLENGES: Challenge[] = [
  {
    id: "ch_no_click", name: "Meditation", emoji: "🧘",
    description: "Clicking is disabled. Start with 5/s passive, ×3 passive multiplier.",
    modifier: { clickDisabled: true, passiveMultiplier: 3, basePassive: 5 },
    reward: { type: "all_mult", value: 1.15 },
    goal: 1_000_000,
  },
  {
    id: "ch_click_only", name: "Pure Predator", emoji: "👄",
    description: "No passive income. Click power ×5.",
    modifier: { passiveMultiplier: 0, clickMultiplier: 5 },
    reward: { type: "all_mult", value: 1.15 },
    goal: 500_000,
  },
  {
    id: "ch_expensive", name: "Famine", emoji: "💸",
    description: "Everything costs ×5 more.",
    modifier: { costMultiplier: 5 },
    reward: { type: "all_mult", value: 1.2 },
    goal: 1_000_000,
  },
  {
    id: "ch_slowburn", name: "Slow Burn", emoji: "🐢",
    description: "All income ×0.25, but costs ×0.5.",
    modifier: { passiveMultiplier: 0.25, clickMultiplier: 0.25, costMultiplier: 0.5 },
    reward: { type: "all_mult", value: 1.2 },
    goal: 500_000,
  },
  {
    id: "ch_glass_cannon", name: "Glass Cannon", emoji: "💥",
    description: "Click power ×10, passive ×0.1.",
    modifier: { clickMultiplier: 10, passiveMultiplier: 0.1 },
    reward: { type: "all_mult", value: 1.15 },
    goal: 2_000_000,
  },
  {
    id: "ch_endurance", name: "Endurance", emoji: "🏔️",
    description: "All income ×0.1. Reach 10M magicules.",
    modifier: { passiveMultiplier: 0.1, clickMultiplier: 0.1 },
    reward: { type: "all_mult", value: 1.5 },
    goal: 10_000_000,
  },
];
