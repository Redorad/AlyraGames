import type { LevelDef } from "../types";

/** Endless mode uses a special map with a long winding path */
export const ENDLESS_LEVEL: LevelDef = {
  id: 0,
  name: "Mode Infini",
  subtitle: "Survivez le plus longtemps possible.",
  startGold: 300,
  lives: 20,
  grid: [
    //0  1  2  3  4  5  6  7  8  9 10 11
    [2, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], // 0
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], // 1
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0], // 2
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0], // 3
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0], // 4
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0], // 5
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0], // 6
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 7
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 8
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // 9
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], // 10
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], // 11
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], // 12
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0], // 13
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], // 14
    [2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2], // 15
    [2, 2, 0, 0, 4, 0, 0, 0, 0, 0, 2, 2], // 16
  ],
  path: [
    { col: 1, row: 0 },
    { col: 10, row: 0 },
    { col: 10, row: 6 },
    { col: 8, row: 6 },
    { col: 8, row: 2 },
    { col: 1, row: 2 },
    { col: 1, row: 9 },
    { col: 9, row: 9 },
    { col: 9, row: 13 },
    { col: 4, row: 13 },
    { col: 4, row: 16 },
  ],
  waves: [], // generated dynamically
};

/** Enemy pools by difficulty tier */
const TIER_ENEMIES = [
  // Tier 0 (waves 1-5): easy
  ["direwolf", "orc"],
  // Tier 1 (waves 6-10): medium
  ["orc", "orcCaptain", "ogre", "lizardman"],
  // Tier 2 (waves 11-15): hard
  ["orcCaptain", "ogre", "shadow", "holyKnight"],
  // Tier 3 (waves 16-20): very hard
  ["holyKnight", "otherworlder", "demon", "shadow"],
  // Tier 4 (waves 21+): nightmare
  ["demon", "holyKnight", "otherworlder"],
];

const BOSSES = ["gabiru", "gelmud", "clayman", "hinata", "milim", "charybdis"];

/** Generate wave for the given wave number (0-indexed) */
export function generateEndlessWave(waveNum: number): { defId: string; delay: number }[] {
  const tier = Math.min(Math.floor(waveNum / 5), TIER_ENEMIES.length - 1);
  const pool = TIER_ENEMIES[tier];

  // Scaling factors
  const baseCount = 6 + Math.floor(waveNum * 1.5);
  const interval = Math.max(0.25, 1.0 - waveNum * 0.02);

  const queue: { defId: string; delay: number }[] = [];
  let time = 0;

  // Boss every 5 waves (starting from wave 5)
  if ((waveNum + 1) % 5 === 0) {
    const bossIdx = Math.min(Math.floor(waveNum / 5), BOSSES.length - 1);
    queue.push({ defId: BOSSES[bossIdx], delay: time });
    time += 2;
  }

  // Regular enemies
  for (let i = 0; i < baseCount; i++) {
    const defId = pool[Math.floor(Math.random() * pool.length)];
    queue.push({ defId, delay: time });
    time += interval;
  }

  // Extra boss for wave 25+, every 5 waves
  if (waveNum >= 24 && (waveNum + 1) % 5 === 0) {
    queue.push({ defId: BOSSES[BOSSES.length - 1], delay: time });
  }

  return queue.sort((a, b) => a.delay - b.delay);
}
