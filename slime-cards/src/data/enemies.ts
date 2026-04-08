import type { EnemyDef, EnemyIntent, EnemyInstance } from "../types";

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  /* ── Act 1 ──────────────────────────────────── */
  direwolf: {
    id: "direwolf",
    name: "Loup Cornu",
    maxHp: 28,
    emoji: "\u{1F43A}",
    color: "#6b7280",
  },
  orc: {
    id: "orc",
    name: "Soldat Orc",
    maxHp: 38,
    emoji: "\u{1F479}",
    color: "#22c55e",
  },
  goblin: {
    id: "goblin",
    name: "Goblin",
    maxHp: 18,
    emoji: "\u{1F47A}",
    color: "#4ade80",
  },
  lizardman: {
    id: "lizardman",
    name: "Homme-Lézard",
    maxHp: 32,
    emoji: "\u{1F98E}",
    color: "#14b8a6",
  },

  /* ── Act 2 ──────────────────────────────────── */
  ogre: {
    id: "ogre",
    name: "Ogre",
    maxHp: 50,
    emoji: "\u{1F4AA}",
    color: "#dc2626",
  },
  shadow: {
    id: "shadow",
    name: "Ombre",
    maxHp: 35,
    emoji: "\u{1F47B}",
    color: "#374151",
  },
  holyKnight: {
    id: "holyKnight",
    name: "Chevalier Sacré",
    maxHp: 55,
    emoji: "\u{1F6E1}\u{FE0F}",
    color: "#fbbf24",
  },

  /* ── Act 3 ──────────────────────────────────── */
  demon: {
    id: "demon",
    name: "Démon",
    maxHp: 65,
    emoji: "\u{1F47F}",
    color: "#991b1b",
  },
  otherworlder: {
    id: "otherworlder",
    name: "Otherworlder",
    maxHp: 50,
    emoji: "\u{1F300}",
    color: "#a855f7",
  },

  /* ── Elites ─────────────────────────────────── */
  orcCaptain: {
    id: "orcCaptain",
    name: "Capitaine Orc",
    maxHp: 55,
    emoji: "\u{1F479}",
    color: "#15803d",
  },
  clayman: {
    id: "clayman",
    name: "Clayman",
    maxHp: 75,
    emoji: "\u{1F3AD}",
    color: "#94a3b8",
  },

  /* ── Bosses ─────────────────────────────────── */
  gabiru: {
    id: "gabiru",
    name: "Gabiru",
    maxHp: 80,
    emoji: "\u{1F40A}",
    color: "#2dd4bf",
  },
  hinata: {
    id: "hinata",
    name: "Hinata",
    maxHp: 120,
    emoji: "\u{2694}\u{FE0F}",
    color: "#fde68a",
  },
  milim: {
    id: "milim",
    name: "Milim",
    maxHp: 160,
    emoji: "\u{1F4A5}",
    color: "#f472b6",
  },
};

const ACT_ENEMIES: Record<number, string[]> = {
  1: ["direwolf", "orc", "goblin", "lizardman"],
  2: ["ogre", "shadow", "holyKnight"],
  3: ["demon", "otherworlder"],
};

const ACT_ELITES: Record<number, string[]> = {
  1: ["orcCaptain"],
  2: ["clayman"],
  3: ["clayman"],
};

const ACT_BOSSES: Record<number, string> = {
  1: "gabiru",
  2: "hinata",
  3: "milim",
};

let nextEnemyId = 1;

export function createEnemy(defId: string, hpScale = 1): EnemyInstance {
  const def = ENEMY_DEFS[defId];
  const hp = Math.round(def.maxHp * hpScale);
  return {
    id: nextEnemyId++,
    defId,
    hp,
    maxHp: hp,
    block: 0,
    strength: 0,
    intent: { type: "attack", value: 0 },
    weak: 0,
    vulnerable: 0,
  };
}

/** Spawn enemies for a normal combat in given act */
export function spawnCombatEnemies(act: number): EnemyInstance[] {
  const pool = ACT_ENEMIES[act] ?? ACT_ENEMIES[1];
  const count = Math.random() < 0.4 ? 1 : Math.random() < 0.7 ? 2 : 3;
  const enemies: EnemyInstance[] = [];
  for (let i = 0; i < count; i++) {
    const defId = pool[Math.floor(Math.random() * pool.length)];
    enemies.push(createEnemy(defId));
  }
  return enemies;
}

export function spawnEliteEnemies(act: number): EnemyInstance[] {
  const pool = ACT_ELITES[act] ?? ACT_ELITES[1];
  const defId = pool[Math.floor(Math.random() * pool.length)];
  return [createEnemy(defId, 1.2)];
}

export function spawnBoss(act: number): EnemyInstance[] {
  const defId = ACT_BOSSES[act] ?? ACT_BOSSES[1];
  return [createEnemy(defId)];
}

/** Roll a new intent for the enemy based on its type */
export function rollIntent(enemy: EnemyInstance, turn: number): EnemyIntent {
  const def = ENEMY_DEFS[enemy.defId];
  const r = Math.random();

  // Boss-specific patterns
  if (def.id === "gabiru") {
    if (turn % 3 === 0) return { type: "buff", value: 2 };
    return r < 0.6 ? { type: "attack", value: 10 + enemy.strength } : { type: "attack_defend", value: 7 + enemy.strength, value2: 6 };
  }
  if (def.id === "hinata") {
    if (turn % 4 === 0) return { type: "attack", value: 18 + enemy.strength };
    if (turn % 4 === 1) return { type: "defend", value: 15 };
    return r < 0.5 ? { type: "attack", value: 12 + enemy.strength } : { type: "debuff", value: 1 };
  }
  if (def.id === "milim") {
    if (turn % 3 === 0) return { type: "buff", value: 3 };
    return { type: "attack", value: 14 + enemy.strength + Math.floor(turn / 2) };
  }

  // Elite patterns
  if (def.id === "orcCaptain") {
    return r < 0.4 ? { type: "attack", value: 10 + enemy.strength } : r < 0.7 ? { type: "attack_defend", value: 7 + enemy.strength, value2: 8 } : { type: "buff", value: 2 };
  }
  if (def.id === "clayman") {
    return r < 0.3 ? { type: "debuff", value: 1 } : r < 0.7 ? { type: "attack", value: 12 + enemy.strength } : { type: "defend", value: 12 };
  }

  // Generic AI based on enemy type
  const baseAtk = Math.round(def.maxHp * 0.2);
  const baseDef = Math.round(def.maxHp * 0.15);

  if (r < 0.5) return { type: "attack", value: baseAtk + enemy.strength };
  if (r < 0.75) return { type: "defend", value: baseDef };
  if (r < 0.9) return { type: "attack_defend", value: Math.round(baseAtk * 0.7) + enemy.strength, value2: Math.round(baseDef * 0.6) };
  return { type: "buff", value: 1 };
}
