export interface WorldLocation {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlockEvolution: number; // evolution index required
  passiveBonus: number; // multiplier when discovered
  missionDuration: number; // seconds for army deployment
  missionRewardMult: number; // magicules multiplier
  x: number; // percentage position on map
  y: number;
  connections: string[]; // connected location IDs
}

export const WORLD_MAP: WorldLocation[] = [
  { id: "sealed_cave", name: "Sealed Cave", emoji: "🕳️", description: "Where it all began", unlockEvolution: 0, passiveBonus: 1.05, missionDuration: 30, missionRewardMult: 10, x: 50, y: 85, connections: ["jura_forest"] },
  { id: "jura_forest", name: "Jura Forest", emoji: "🌲", description: "Dense magical forest", unlockEvolution: 1, passiveBonus: 1.1, missionDuration: 60, missionRewardMult: 30, x: 45, y: 70, connections: ["sealed_cave", "goblin_village", "dwargon"] },
  { id: "goblin_village", name: "Goblin Village", emoji: "🏘️", description: "Allied settlement", unlockEvolution: 2, passiveBonus: 1.15, missionDuration: 90, missionRewardMult: 60, x: 30, y: 60, connections: ["jura_forest", "tempest"] },
  { id: "dwargon", name: "Dwargon", emoji: "⛏️", description: "Kingdom of dwarves", unlockEvolution: 2, passiveBonus: 1.1, missionDuration: 120, missionRewardMult: 100, x: 70, y: 55, connections: ["jura_forest", "blumund"] },
  { id: "tempest", name: "Tempest", emoji: "🏰", description: "Rimuru's capital city", unlockEvolution: 3, passiveBonus: 1.25, missionDuration: 180, missionRewardMult: 200, x: 40, y: 45, connections: ["goblin_village", "blumund", "eurazania"] },
  { id: "blumund", name: "Blumund", emoji: "🏛️", description: "Allied human kingdom", unlockEvolution: 3, passiveBonus: 1.1, missionDuration: 150, missionRewardMult: 150, x: 65, y: 40, connections: ["dwargon", "tempest", "falmuth"] },
  { id: "eurazania", name: "Eurazania", emoji: "🦁", description: "Beast kingdom", unlockEvolution: 4, passiveBonus: 1.2, missionDuration: 240, missionRewardMult: 400, x: 20, y: 35, connections: ["tempest", "walpurgis"] },
  { id: "falmuth", name: "Falmuth", emoji: "⚔️", description: "Conquered kingdom", unlockEvolution: 5, passiveBonus: 1.3, missionDuration: 300, missionRewardMult: 800, x: 75, y: 25, connections: ["blumund", "heaven_tower"] },
  { id: "walpurgis", name: "Walpurgis Hall", emoji: "🌙", description: "Demon lord council", unlockEvolution: 6, passiveBonus: 1.5, missionDuration: 600, missionRewardMult: 2000, x: 30, y: 20, connections: ["eurazania", "heaven_tower"] },
  { id: "heaven_tower", name: "Heaven's Tower", emoji: "🗼", description: "Celestial boundary", unlockEvolution: 7, passiveBonus: 1.8, missionDuration: 900, missionRewardMult: 5000, x: 55, y: 10, connections: ["falmuth", "walpurgis", "cardinal_world"] },
  { id: "cardinal_world", name: "Cardinal World", emoji: "🌍", description: "The entire world united", unlockEvolution: 9, passiveBonus: 2.0, missionDuration: 1200, missionRewardMult: 15000, x: 50, y: 2, connections: ["heaven_tower"] },
];
