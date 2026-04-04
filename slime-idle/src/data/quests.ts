export interface Quest {
  id: string;
  name: string;
  emoji: string;
  description: string;
  check: (state: QuestCheckState) => boolean;
  reward: { magicules?: number; prestigePoints?: number };
  repeatable: boolean;
}

export interface QuestCheckState {
  totalClicks: number;
  clicksThisSession: number;
  lifetimeMagicules: number;
  ownedItems: Record<string, number>;
  evolutionIndex: number;
  bossesDefeated: string[];
  dungeonsCompleted: number;
}

export const DAILY_QUESTS: Quest[] = [
  { id: "dq_click_50", name: "Daily Absorption", emoji: "👆", description: "Click 50 times", check: (s) => s.clicksThisSession >= 50, reward: { magicules: 5000 }, repeatable: true },
  { id: "dq_click_200", name: "Feeding Frenzy", emoji: "👄", description: "Click 200 times", check: (s) => s.clicksThisSession >= 200, reward: { magicules: 25000 }, repeatable: true },
  { id: "dq_click_1000", name: "Rampage", emoji: "💥", description: "Click 1,000 times", check: (s) => s.clicksThisSession >= 1000, reward: { magicules: 200000 }, repeatable: true },
];

export const MILESTONE_QUESTS: Quest[] = [
  { id: "mq_buy_5_huts", name: "Village Builder", emoji: "🛖", description: "Own 5 Goblin Huts", check: (s) => (s.ownedItems["goblin_hut"] ?? 0) >= 5, reward: { magicules: 2000 }, repeatable: false },
  { id: "mq_buy_3_forges", name: "Master Smith", emoji: "⚒️", description: "Own 3 Kurobee's Forges", check: (s) => (s.ownedItems["forge"] ?? 0) >= 3, reward: { magicules: 5000 }, repeatable: false },
  { id: "mq_all_allies", name: "United Front", emoji: "🤝", description: "Recruit one of every ally type", check: (s) => ["gobta", "ranga", "shion", "benimaru", "shuna", "souei", "diablo", "veldora"].every((id) => (s.ownedItems[id] ?? 0) > 0), reward: { magicules: 1_000_000 }, repeatable: false },
  { id: "mq_beat_boss", name: "Slayer", emoji: "⚔️", description: "Defeat any boss", check: (s) => s.bossesDefeated.length > 0, reward: { magicules: 50_000 }, repeatable: false },
  { id: "mq_dungeon_3", name: "Dungeon Crawler", emoji: "🕳️", description: "Complete 3 dungeon runs", check: (s) => s.dungeonsCompleted >= 3, reward: { magicules: 100_000 }, repeatable: false },
  { id: "mq_evo_5", name: "Power Surge", emoji: "⚡", description: "Reach Tempest Slime evolution", check: (s) => s.evolutionIndex >= 4, reward: { magicules: 50_000 }, repeatable: false },
  { id: "mq_10_skills", name: "Skill Collector", emoji: "📚", description: "Own 10+ total skill levels", check: (s) => ["predator", "great_sage", "absorb_dissolve", "ultraspeed_regen", "replication", "black_lightning", "void_god", "soul_harvest", "turn_null", "imaginary_space", "nihility_collapse", "multidim_barrier", "existence_erasure", "time_stop", "origin_magic", "end_of_world"].reduce((sum, id) => sum + (s.ownedItems[id] ?? 0), 0) >= 10, reward: { magicules: 25_000 }, repeatable: false },
];
