export interface Research {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number; // magicules to start
  duration: number; // seconds
  effect: { type: "click_mult" | "passive_mult" | "all_mult" | "cost_reduction" | "offline_mult" | "crit_chance" | "boss_damage"; value: number };
  requires: string[]; // research IDs required
  tier: number;
}

export const RESEARCH_TREE: Research[] = [
  // Tier 1
  { id: "res_analyze", name: "Analyze", emoji: "🔍", description: "+10% all income", cost: 1000, duration: 30, effect: { type: "all_mult", value: 0.1 }, requires: [], tier: 1 },
  { id: "res_predict", name: "Prediction", emoji: "🔮", description: "+15% passive income", cost: 2000, duration: 45, effect: { type: "passive_mult", value: 0.15 }, requires: [], tier: 1 },

  // Tier 2
  { id: "res_parallel", name: "Parallel Processing", emoji: "🧠", description: "+20% click power", cost: 10000, duration: 60, effect: { type: "click_mult", value: 0.2 }, requires: ["res_analyze"], tier: 2 },
  { id: "res_optimize", name: "Cost Optimization", emoji: "📉", description: "-8% item costs", cost: 15000, duration: 90, effect: { type: "cost_reduction", value: 0.08 }, requires: ["res_analyze"], tier: 2 },
  { id: "res_harvest", name: "Magicule Harvester", emoji: "🌾", description: "+25% passive income", cost: 12000, duration: 75, effect: { type: "passive_mult", value: 0.25 }, requires: ["res_predict"], tier: 2 },

  // Tier 3
  { id: "res_sage_calc", name: "Sage Calculations", emoji: "📊", description: "+5% crit chance", cost: 100000, duration: 180, effect: { type: "crit_chance", value: 0.05 }, requires: ["res_parallel"], tier: 3 },
  { id: "res_dream", name: "Dream Processing", emoji: "💭", description: "+50% offline earnings", cost: 80000, duration: 150, effect: { type: "offline_mult", value: 0.5 }, requires: ["res_harvest"], tier: 3 },
  { id: "res_weakness", name: "Weakness Analysis", emoji: "🎯", description: "+30% boss damage", cost: 120000, duration: 200, effect: { type: "boss_damage", value: 0.3 }, requires: ["res_parallel", "res_optimize"], tier: 3 },

  // Tier 4
  { id: "res_raphael", name: "Raphael Protocol", emoji: "👁️", description: "+40% all income", cost: 1000000, duration: 300, effect: { type: "all_mult", value: 0.4 }, requires: ["res_sage_calc", "res_dream"], tier: 4 },
  { id: "res_ciel", name: "Ciel Awakening", emoji: "✨", description: "+50% all income", cost: 5000000, duration: 600, effect: { type: "all_mult", value: 0.5 }, requires: ["res_raphael"], tier: 4 },
];
