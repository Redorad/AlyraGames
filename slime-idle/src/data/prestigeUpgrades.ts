export interface PrestigeUpgrade {
  id: string;
  name: string;
  emoji: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costScale: number;
  effect: { type: "click_mult" | "passive_mult" | "all_mult" | "cost_reduction" | "offline_mult" | "start_magicules"; valuePerLevel: number };
}

export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  {
    id: "p_click", name: "Predator Memory", emoji: "👄",
    description: "×{value} click power per level",
    maxLevel: 20, baseCost: 1, costScale: 1.8,
    effect: { type: "click_mult", valuePerLevel: 0.15 },
  },
  {
    id: "p_passive", name: "Great Sage Wisdom", emoji: "🧠",
    description: "×{value} passive income per level",
    maxLevel: 20, baseCost: 1, costScale: 1.8,
    effect: { type: "passive_mult", valuePerLevel: 0.15 },
  },
  {
    id: "p_all", name: "Storm Dragon's Blessing", emoji: "🐉",
    description: "×{value} all income per level",
    maxLevel: 10, baseCost: 3, costScale: 2.2,
    effect: { type: "all_mult", valuePerLevel: 0.1 },
  },
  {
    id: "p_cost", name: "Merchant's Favour", emoji: "💰",
    description: "-{value}% shop costs per level",
    maxLevel: 10, baseCost: 2, costScale: 2,
    effect: { type: "cost_reduction", valuePerLevel: 2 },
  },
  {
    id: "p_offline", name: "Time Warp", emoji: "⏳",
    description: "×{value} offline earnings per level",
    maxLevel: 10, baseCost: 2, costScale: 2,
    effect: { type: "offline_mult", valuePerLevel: 0.3 },
  },
  {
    id: "p_start", name: "Head Start", emoji: "🚀",
    description: "Start with {value} magicules per level",
    maxLevel: 20, baseCost: 1, costScale: 1.5,
    effect: { type: "start_magicules", valuePerLevel: 500 },
  },
];
