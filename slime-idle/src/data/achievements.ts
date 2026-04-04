export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  reward: { type: "click_mult" | "passive_mult" | "all_mult"; value: number };
  check: (state: AchievementCheckState) => boolean;
}

export interface AchievementCheckState {
  totalClicks: number;
  lifetimeMagicules: number;
  evolutionIndex: number;
  ownedItems: Record<string, number>;
  prestigeCount: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Click milestones
  { id: "click_10", name: "First Steps", emoji: "👆", description: "Click 10 times", reward: { type: "click_mult", value: 1.1 }, check: (s) => s.totalClicks >= 10 },
  { id: "click_100", name: "Getting Hungry", emoji: "👆", description: "Click 100 times", reward: { type: "click_mult", value: 1.15 }, check: (s) => s.totalClicks >= 100 },
  { id: "click_500", name: "Predator Instinct", emoji: "👄", description: "Click 500 times", reward: { type: "click_mult", value: 1.2 }, check: (s) => s.totalClicks >= 500 },
  { id: "click_2000", name: "Devourer", emoji: "🌀", description: "Click 2,000 times", reward: { type: "click_mult", value: 1.3 }, check: (s) => s.totalClicks >= 2000 },
  { id: "click_10000", name: "Insatiable", emoji: "🕳️", description: "Click 10,000 times", reward: { type: "click_mult", value: 1.5 }, check: (s) => s.totalClicks >= 10000 },

  // Magicule milestones
  { id: "mag_1k", name: "Awakening", emoji: "💫", description: "Earn 1K lifetime magicules", reward: { type: "all_mult", value: 1.05 }, check: (s) => s.lifetimeMagicules >= 1_000 },
  { id: "mag_100k", name: "Rising Power", emoji: "🔥", description: "Earn 100K lifetime magicules", reward: { type: "all_mult", value: 1.1 }, check: (s) => s.lifetimeMagicules >= 100_000 },
  { id: "mag_10m", name: "Demon Lord Seed", emoji: "😈", description: "Earn 10M lifetime magicules", reward: { type: "all_mult", value: 1.15 }, check: (s) => s.lifetimeMagicules >= 10_000_000 },
  { id: "mag_1b", name: "Catastrophe Class", emoji: "💀", description: "Earn 1B lifetime magicules", reward: { type: "all_mult", value: 1.2 }, check: (s) => s.lifetimeMagicules >= 1_000_000_000 },
  { id: "mag_1t", name: "World Breaker", emoji: "🌍", description: "Earn 1T lifetime magicules", reward: { type: "all_mult", value: 1.3 }, check: (s) => s.lifetimeMagicules >= 1_000_000_000_000 },
  { id: "mag_1qa", name: "Beyond Divinity", emoji: "✨", description: "Earn 1Qa lifetime magicules", reward: { type: "all_mult", value: 1.5 }, check: (s) => s.lifetimeMagicules >= 1e15 },

  // Evolution milestones
  { id: "evo_named", name: "Named Monster", emoji: "🔵", description: "Become Named Slime", reward: { type: "all_mult", value: 1.1 }, check: (s) => s.evolutionIndex >= 2 },
  { id: "evo_demon", name: "Demon Lord's Haki", emoji: "👑", description: "Become True Demon Lord", reward: { type: "all_mult", value: 1.2 }, check: (s) => s.evolutionIndex >= 6 },
  { id: "evo_ultimate", name: "Pinnacle", emoji: "⭐", description: "Reach Ultimate Slime", reward: { type: "all_mult", value: 1.25 }, check: (s) => s.evolutionIndex >= 7 },
  { id: "evo_void", name: "Void Incarnate", emoji: "🌑", description: "Reach Void God", reward: { type: "all_mult", value: 1.3 }, check: (s) => s.evolutionIndex >= 9 },
  { id: "evo_max", name: "End of Time", emoji: "♾️", description: "Reach final evolution", reward: { type: "all_mult", value: 1.5 }, check: (s) => s.evolutionIndex >= 11 },

  // Ally milestones
  { id: "ally_first", name: "First Subordinate", emoji: "🤝", description: "Recruit any ally", reward: { type: "passive_mult", value: 1.1 }, check: (s) => ["gobta", "ranga", "shion", "benimaru", "shuna", "souei", "diablo", "veldora", "guy_crimson", "chloe", "velgrynd", "veldanava", "ivarage"].some((id) => (s.ownedItems[id] ?? 0) > 0) },
  { id: "ally_ranga", name: "Faithful Star Wolf", emoji: "🐺", description: "Recruit Ranga", reward: { type: "passive_mult", value: 1.1 }, check: (s) => (s.ownedItems["ranga"] ?? 0) > 0 },
  { id: "ally_diablo", name: "Primordial Servant", emoji: "🎩", description: "Recruit Diablo", reward: { type: "passive_mult", value: 1.15 }, check: (s) => (s.ownedItems["diablo"] ?? 0) > 0 },
  { id: "ally_veldora", name: "Storm Dragon Freed", emoji: "🐉", description: "Recruit Veldora", reward: { type: "passive_mult", value: 1.2 }, check: (s) => (s.ownedItems["veldora"] ?? 0) > 0 },
  { id: "ally_army", name: "Monster Nation", emoji: "🏴", description: "Own 50 total allies", reward: { type: "passive_mult", value: 1.25 }, check: (s) => ["gobta", "ranga", "shion", "benimaru", "shuna", "souei", "diablo", "veldora", "guy_crimson", "chloe", "velgrynd", "veldanava", "ivarage"].reduce((sum, id) => sum + (s.ownedItems[id] ?? 0), 0) >= 50 },

  // Building milestones
  { id: "build_first", name: "Founding Tempest", emoji: "🛖", description: "Build your first structure", reward: { type: "passive_mult", value: 1.05 }, check: (s) => ["goblin_hut", "forge", "trading_post", "research_lab", "colosseum", "castle", "holy_barrier", "labyrinth", "world_gate", "cardinal_tower", "tempest_capital", "celestial_palace"].some((id) => (s.ownedItems[id] ?? 0) > 0) },
  { id: "build_castle", name: "Seat of Power", emoji: "🏰", description: "Build Rimuru's Castle", reward: { type: "all_mult", value: 1.15 }, check: (s) => (s.ownedItems["castle"] ?? 0) > 0 },
  { id: "build_all", name: "Grand Architect", emoji: "🏛️", description: "Own every building type", reward: { type: "passive_mult", value: 1.3 }, check: (s) => ["goblin_hut", "forge", "trading_post", "research_lab", "colosseum", "castle", "holy_barrier", "labyrinth", "world_gate", "cardinal_tower", "tempest_capital", "celestial_palace"].every((id) => (s.ownedItems[id] ?? 0) > 0) },

  // Skill milestones
  { id: "skill_first", name: "Skill Acquired", emoji: "⚔️", description: "Learn your first skill", reward: { type: "click_mult", value: 1.05 }, check: (s) => ["predator", "great_sage", "absorb_dissolve", "ultraspeed_regen", "replication", "black_lightning", "void_god", "soul_harvest", "turn_null", "imaginary_space", "nihility_collapse", "multidim_barrier", "existence_erasure", "time_stop", "origin_magic", "end_of_world"].some((id) => (s.ownedItems[id] ?? 0) > 0) },
  { id: "skill_sage", name: "Great Sage Online", emoji: "🧠", description: "Level Great Sage to 10", reward: { type: "passive_mult", value: 1.15 }, check: (s) => (s.ownedItems["great_sage"] ?? 0) >= 10 },

  // Prestige milestones
  { id: "prestige_1", name: "Reincarnation", emoji: "🔄", description: "Prestige for the first time", reward: { type: "all_mult", value: 1.1 }, check: (s) => s.prestigeCount >= 1 },
  { id: "prestige_5", name: "Cycle of Rebirth", emoji: "🔄", description: "Prestige 5 times", reward: { type: "all_mult", value: 1.2 }, check: (s) => s.prestigeCount >= 5 },
  { id: "prestige_10", name: "Eternal Recurrence", emoji: "♾️", description: "Prestige 10 times", reward: { type: "all_mult", value: 1.5 }, check: (s) => s.prestigeCount >= 10 },
];
