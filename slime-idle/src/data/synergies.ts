export interface Synergy {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requires: string[]; // item IDs that must all be owned
  effect: { type: "all_mult" | "passive_mult" | "click_mult"; value: number };
}

export const SYNERGIES: Synergy[] = [
  { id: "syn_ogre_duo", name: "Ogre Duo", emoji: "🔥", description: "Benimaru + Shion: ×1.2 passive", requires: ["benimaru", "shion"], effect: { type: "passive_mult", value: 1.2 } },
  { id: "syn_kijin_trio", name: "Kijin Trio", emoji: "⚔️", description: "Benimaru + Shion + Shuna: ×1.35 passive", requires: ["benimaru", "shion", "shuna"], effect: { type: "passive_mult", value: 1.35 } },
  { id: "syn_shadow_ops", name: "Shadow Operations", emoji: "🥷", description: "Souei + Ranga: ×1.25 passive", requires: ["souei", "ranga"], effect: { type: "passive_mult", value: 1.25 } },
  { id: "syn_primordial", name: "Primordial Power", emoji: "😈", description: "Diablo + Guy Crimson: ×1.4 all", requires: ["diablo", "guy_crimson"], effect: { type: "all_mult", value: 1.4 } },
  { id: "syn_dragon_bond", name: "Dragon Bond", emoji: "🐉", description: "Veldora + Velgrynd: ×1.5 all", requires: ["veldora", "velgrynd"], effect: { type: "all_mult", value: 1.5 } },
  { id: "syn_time_heroes", name: "Time Paradox", emoji: "⏳", description: "Chloe + Hinata (skill): ×1.3 click", requires: ["chloe", "time_stop"], effect: { type: "click_mult", value: 1.3 } },
  { id: "syn_nation_core", name: "Nation's Heart", emoji: "🏰", description: "Castle + Forge + Lab: ×1.3 passive", requires: ["castle", "forge", "research_lab"], effect: { type: "passive_mult", value: 1.3 } },
  { id: "syn_full_court", name: "Full Court", emoji: "👑", description: "All 8 original allies: ×2 all", requires: ["gobta", "ranga", "shion", "benimaru", "shuna", "souei", "diablo", "veldora"], effect: { type: "all_mult", value: 2.0 } },
  { id: "syn_predator_sage", name: "Raphael", emoji: "🧠", description: "Predator + Great Sage: ×1.15 all", requires: ["predator", "great_sage"], effect: { type: "all_mult", value: 1.15 } },
  { id: "syn_ultimate_power", name: "Ultimate Power", emoji: "✨", description: "Turn Null + Void God: ×1.5 click", requires: ["turn_null", "void_god"], effect: { type: "click_mult", value: 1.5 } },
];
