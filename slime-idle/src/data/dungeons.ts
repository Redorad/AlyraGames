export interface Dungeon {
  id: string;
  name: string;
  emoji: string;
  description: string;
  duration: number; // seconds
  reward: { magiculesMult: number; artifactChance: number };
  requiredAllies: number; // min total allies to send
}

export const DUNGEONS: Dungeon[] = [
  { id: "dg_cave", name: "Sealed Cave", emoji: "🕳️", description: "A familiar starting point", duration: 60, reward: { magiculesMult: 30, artifactChance: 0.1 }, requiredAllies: 1 },
  { id: "dg_forest", name: "Jura Forest Depths", emoji: "🌲", description: "Dense with monsters", duration: 180, reward: { magiculesMult: 120, artifactChance: 0.15 }, requiredAllies: 3 },
  { id: "dg_dwargon", name: "Dwargon Mines", emoji: "⛏️", description: "Rich in ore and danger", duration: 300, reward: { magiculesMult: 300, artifactChance: 0.2 }, requiredAllies: 5 },
  { id: "dg_labyrinth", name: "Ramiris's Labyrinth", emoji: "🏗️", description: "Infinite shifting maze", duration: 600, reward: { magiculesMult: 800, artifactChance: 0.3 }, requiredAllies: 10 },
  { id: "dg_underworld", name: "Spirit Realm", emoji: "👻", description: "Realm of the spirits", duration: 900, reward: { magiculesMult: 2000, artifactChance: 0.4 }, requiredAllies: 15 },
  { id: "dg_heavenly", name: "Heavenly Star Palace", emoji: "🌟", description: "Domain of the divine", duration: 1800, reward: { magiculesMult: 10000, artifactChance: 0.6 }, requiredAllies: 25 },
];
