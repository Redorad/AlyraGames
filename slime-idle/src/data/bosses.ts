export interface Boss {
  id: string;
  name: string;
  emoji: string;
  description: string;
  hp: number;
  timeLimit: number; // seconds
  reward: { magicules: number; artifactChance: number };
  unlockPrestige: number;
}

export const BOSSES: Boss[] = [
  // Early bosses
  { id: "ifrit", name: "Ifrit", emoji: "🔥", description: "Fire spirit dwelling within", hp: 500, timeLimit: 30, reward: { magicules: 10_000, artifactChance: 0.3 }, unlockPrestige: 0 },
  { id: "charybdis", name: "Charybdis", emoji: "🌊", description: "Catastrophe-class monster", hp: 5_000, timeLimit: 30, reward: { magicules: 100_000, artifactChance: 0.4 }, unlockPrestige: 0 },
  { id: "clayman", name: "Clayman", emoji: "🤡", description: "Scheming Demon Lord", hp: 25_000, timeLimit: 25, reward: { magicules: 500_000, artifactChance: 0.5 }, unlockPrestige: 1 },
  { id: "hinata", name: "Hinata Sakaguchi", emoji: "⚔️", description: "Holy Knight Captain", hp: 100_000, timeLimit: 25, reward: { magicules: 2_000_000, artifactChance: 0.5 }, unlockPrestige: 2 },
  // Mid bosses
  { id: "milim", name: "Milim Nava", emoji: "💗", description: "Destroyer — Oldest Demon Lord", hp: 500_000, timeLimit: 20, reward: { magicules: 10_000_000, artifactChance: 0.6 }, unlockPrestige: 3 },
  { id: "guy", name: "Guy Crimson", emoji: "😈", description: "Primordial Red — Strongest Demon Lord", hp: 2_000_000, timeLimit: 20, reward: { magicules: 50_000_000, artifactChance: 0.7 }, unlockPrestige: 5 },
  { id: "yuuki", name: "Yuuki Kagurazaka", emoji: "🎭", description: "The Mastermind", hp: 10_000_000, timeLimit: 15, reward: { magicules: 500_000_000, artifactChance: 0.8 }, unlockPrestige: 7 },
  { id: "veldanava_boss", name: "Veldanava (Echo)", emoji: "👼", description: "Star King Dragon's shadow", hp: 100_000_000, timeLimit: 15, reward: { magicules: 10_000_000_000, artifactChance: 1.0 }, unlockPrestige: 10 },
  // Hard bosses — require deep prestige / ascension
  { id: "ivarage_boss", name: "Ivarage Awakened", emoji: "🦑", description: "Chaos Dragon unleashed", hp: 5_000_000_000, timeLimit: 12, reward: { magicules: 1e12, artifactChance: 1.0 }, unlockPrestige: 15 },
  { id: "feldway_boss", name: "Feldway, the Seraph", emoji: "🪽", description: "Commander of heaven's army", hp: 500_000_000_000, timeLimit: 12, reward: { magicules: 1e14, artifactChance: 1.0 }, unlockPrestige: 20 },
  { id: "true_dragon", name: "True Dragon God", emoji: "🐉", description: "All four dragons merged", hp: 1e14, timeLimit: 10, reward: { magicules: 1e17, artifactChance: 1.0 }, unlockPrestige: 30 },
  { id: "world_enemy", name: "The World Enemy", emoji: "💀", description: "Threat to all existence", hp: 1e17, timeLimit: 10, reward: { magicules: 1e20, artifactChance: 1.0 }, unlockPrestige: 50 },
];
