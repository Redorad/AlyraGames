export interface SkillNode {
  id: string;
  name: string;
  emoji: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costScale: number;
  effect: { type: "click_mult" | "passive_mult" | "all_mult" | "crit_chance" | "crit_mult" | "cost_reduction" | "storm_duration" | "combo_bonus"; value: number };
  requires: string[]; // node IDs that must be unlocked first
  x: number; // grid position for visual layout
  y: number;
}

export const SKILL_TREE: SkillNode[] = [
  // Row 0 — root
  { id: "st_core", name: "Predator Core", emoji: "🟢", description: "+20% all income per level", maxLevel: 10, baseCost: 1, costScale: 1.8, effect: { type: "all_mult", value: 0.2 }, requires: [], x: 2, y: 0 },

  // Row 1 — branches
  { id: "st_click", name: "Water Blade", emoji: "💧", description: "+30% click power", maxLevel: 8, baseCost: 2, costScale: 1.6, effect: { type: "click_mult", value: 0.3 }, requires: ["st_core"], x: 0, y: 1 },
  { id: "st_passive", name: "Great Sage", emoji: "🧠", description: "+30% passive income", maxLevel: 8, baseCost: 2, costScale: 1.6, effect: { type: "passive_mult", value: 0.3 }, requires: ["st_core"], x: 4, y: 1 },

  // Row 2 — deeper
  { id: "st_crit_chance", name: "Spatial Motion", emoji: "⚡", description: "+3% crit chance", maxLevel: 5, baseCost: 3, costScale: 2.0, effect: { type: "crit_chance", value: 0.03 }, requires: ["st_click"], x: 0, y: 2 },
  { id: "st_crit_dmg", name: "Black Lightning", emoji: "🌩️", description: "+50% crit multiplier", maxLevel: 5, baseCost: 3, costScale: 2.0, effect: { type: "crit_mult", value: 0.5 }, requires: ["st_click"], x: 1, y: 2 },
  { id: "st_cost", name: "Analyst", emoji: "📊", description: "-5% item costs", maxLevel: 5, baseCost: 3, costScale: 2.0, effect: { type: "cost_reduction", value: 5 }, requires: ["st_passive"], x: 3, y: 2 },
  { id: "st_storm", name: "Storm Control", emoji: "🌀", description: "+20% storm duration", maxLevel: 5, baseCost: 3, costScale: 2.0, effect: { type: "storm_duration", value: 0.2 }, requires: ["st_passive"], x: 4, y: 2 },

  // Row 3 — elite
  { id: "st_combo", name: "Unlimited Imprisonment", emoji: "⛓️", description: "+10% combo bonus", maxLevel: 5, baseCost: 5, costScale: 2.5, effect: { type: "combo_bonus", value: 0.1 }, requires: ["st_crit_chance", "st_crit_dmg"], x: 0, y: 3 },
  { id: "st_mega_click", name: "Gluttony", emoji: "👁️", description: "+100% click power", maxLevel: 3, baseCost: 8, costScale: 3.0, effect: { type: "click_mult", value: 1.0 }, requires: ["st_combo"], x: 0, y: 4 },
  { id: "st_mega_passive", name: "Beelzebuth", emoji: "🕸️", description: "+100% passive income", maxLevel: 3, baseCost: 8, costScale: 3.0, effect: { type: "passive_mult", value: 1.0 }, requires: ["st_cost", "st_storm"], x: 4, y: 3 },
  { id: "st_ultimate", name: "Turn Null", emoji: "✨", description: "+50% all income", maxLevel: 3, baseCost: 15, costScale: 3.5, effect: { type: "all_mult", value: 0.5 }, requires: ["st_mega_click", "st_mega_passive"], x: 2, y: 5 },
];
