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
    reward: { type: "all_mult", value: 1.1 },
    goal: 1_000_000,
  },
  {
    id: "ch_click_only", name: "Pure Predator", emoji: "👄",
    description: "No passive income. Click power ×5.",
    modifier: { passiveMultiplier: 0, clickMultiplier: 5 },
    reward: { type: "all_mult", value: 1.1 },
    goal: 500_000,
  },
  {
    id: "ch_expensive", name: "Famine", emoji: "💸",
    description: "Everything costs ×5 more.",
    modifier: { costMultiplier: 5 },
    reward: { type: "all_mult", value: 1.15 },
    goal: 1_000_000,
  },
  {
    id: "ch_slowburn", name: "Slow Burn", emoji: "🐢",
    description: "All income ×0.25, but costs ×0.5.",
    modifier: { passiveMultiplier: 0.25, clickMultiplier: 0.25, costMultiplier: 0.5 },
    reward: { type: "all_mult", value: 1.15 },
    goal: 500_000,
  },
  {
    id: "ch_glass_cannon", name: "Glass Cannon", emoji: "💥",
    description: "Click power ×10, passive ×0.1.",
    modifier: { clickMultiplier: 10, passiveMultiplier: 0.1 },
    reward: { type: "all_mult", value: 1.1 },
    goal: 2_000_000,
  },
  {
    id: "ch_endurance", name: "Endurance", emoji: "🏔️",
    description: "All income ×0.1. Reach 10M magicules.",
    modifier: { passiveMultiplier: 0.1, clickMultiplier: 0.1 },
    reward: { type: "all_mult", value: 1.3 },
    goal: 10_000_000,
  },
  // Hard challenges
  {
    id: "ch_poverty", name: "Absolute Poverty", emoji: "🪙",
    description: "Everything costs ×20 more. Reach 50M.",
    modifier: { costMultiplier: 20 },
    reward: { type: "all_mult", value: 1.25 },
    goal: 50_000_000,
  },
  {
    id: "ch_crippled", name: "Crippled", emoji: "🩼",
    description: "All income ×0.01. Reach 1M.",
    modifier: { passiveMultiplier: 0.01, clickMultiplier: 0.01 },
    reward: { type: "all_mult", value: 1.5 },
    goal: 1_000_000,
  },
  {
    id: "ch_marathon", name: "Marathon", emoji: "🏃",
    description: "All income ×0.05, costs ×10. Reach 100M.",
    modifier: { passiveMultiplier: 0.05, clickMultiplier: 0.05, costMultiplier: 10 },
    reward: { type: "all_mult", value: 2.0 },
    goal: 100_000_000,
  },
];
