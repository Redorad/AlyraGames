export interface AscensionUpgrade {
  id: string;
  name: string;
  emoji: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costScale: number;
  effect: { type: "all_mult" | "prestige_point_mult" | "boss_damage" | "artifact_luck" | "storm_power" | "auto_click"; valuePerLevel: number };
}

export const ASCENSION_UPGRADES: AscensionUpgrade[] = [
  {
    id: "asc_all", name: "Cosmic Amplifier", emoji: "🌌",
    description: "×{value} all income per level",
    maxLevel: 50, baseCost: 1, costScale: 2.0,
    effect: { type: "all_mult", valuePerLevel: 0.25 },
  },
  {
    id: "asc_prestige", name: "Reincarnation Mastery", emoji: "🔄",
    description: "×{value} prestige points earned per level",
    maxLevel: 30, baseCost: 2, costScale: 2.2,
    effect: { type: "prestige_point_mult", valuePerLevel: 0.2 },
  },
  {
    id: "asc_boss", name: "Dragon Slayer", emoji: "⚔️",
    description: "×{value} boss damage per level",
    maxLevel: 40, baseCost: 1, costScale: 1.8,
    effect: { type: "boss_damage", valuePerLevel: 0.25 },
  },
  {
    id: "asc_artifact", name: "Fortune's Favour", emoji: "🍀",
    description: "+{value}% artifact drop chance per level",
    maxLevel: 20, baseCost: 3, costScale: 2.5,
    effect: { type: "artifact_luck", valuePerLevel: 3 },
  },
  {
    id: "asc_storm", name: "Tempest Lord", emoji: "🌀",
    description: "+{value}× storm multiplier per level",
    maxLevel: 25, baseCost: 2, costScale: 2.0,
    effect: { type: "storm_power", valuePerLevel: 0.3 },
  },
  {
    id: "asc_autoclick", name: "Autonomous Predator", emoji: "🤖",
    description: "+{value} free clicks/sec per level",
    maxLevel: 20, baseCost: 5, costScale: 3.0,
    effect: { type: "auto_click", valuePerLevel: 1 },
  },
];
