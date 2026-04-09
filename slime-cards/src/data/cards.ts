import type { CardDef } from "../types";

export const CARDS: Record<string, CardDef> = {
  /* ── Starter cards ────────────────────────────── */
  strike: {
    id: "strike",
    name: "Strike",
    description: "Deal 6 damage.",
    type: "attack",
    rarity: "common",
    cost: 1,
    damage: 6,
    target: "enemy",
    emoji: "\u{2694}\u{FE0F}",
    color: "#ef4444",
  },
  defend: {
    id: "defend",
    name: "Defend",
    description: "Gain 5 block.",
    type: "skill",
    rarity: "common",
    cost: 1,
    block: 5,
    target: "self",
    emoji: "\u{1F6E1}\u{FE0F}",
    color: "#3b82f6",
  },

  /* ── Common attacks ───────────────────────────── */
  wolfFang: {
    id: "wolfFang",
    name: "Ranga's Fang",
    description: "Deal 3 damage 3 times.",
    type: "attack",
    rarity: "common",
    cost: 1,
    damage: 3,
    hits: 3,
    target: "enemy",
    emoji: "\u{1F43A}",
    color: "#60a5fa",
  },
  slash: {
    id: "slash",
    name: "Slash",
    description: "Deal 8 damage.",
    type: "attack",
    rarity: "common",
    cost: 1,
    damage: 8,
    target: "enemy",
    emoji: "\u{1FA78}",
    color: "#f87171",
  },
  bash: {
    id: "bash",
    name: "Bash",
    description: "Deal 8 damage. Apply 2 Vulnerable.",
    type: "attack",
    rarity: "common",
    cost: 2,
    damage: 8,
    applyVulnerable: 2,
    target: "enemy",
    emoji: "\u{1F44A}",
    color: "#f59e0b",
  },

  /* ── Common skills ────────────────────────────── */
  ironWall: {
    id: "ironWall",
    name: "Geld's Wall",
    description: "Gain 8 block.",
    type: "skill",
    rarity: "common",
    cost: 1,
    block: 8,
    target: "self",
    emoji: "\u{1F9F1}",
    color: "#a16207",
  },
  shadowStep: {
    id: "shadowStep",
    name: "Shadow Step",
    description: "Gain 3 block. Draw 2 cards.",
    type: "skill",
    rarity: "common",
    cost: 1,
    block: 3,
    draw: 2,
    target: "self",
    emoji: "\u{1F47B}",
    color: "#1e3a5f",
  },
  weaken: {
    id: "weaken",
    name: "Weaken",
    description: "Apply 2 Weakness.",
    type: "skill",
    rarity: "common",
    cost: 1,
    applyWeak: 2,
    target: "enemy",
    emoji: "\u{1F578}\u{FE0F}",
    color: "#6366f1",
  },

  /* ── Uncommon attacks ─────────────────────────── */
  fireStorm: {
    id: "fireStorm",
    name: "Fire Storm",
    description: "Deal 8 damage to ALL enemies.",
    type: "attack",
    rarity: "uncommon",
    cost: 2,
    damage: 8,
    target: "all_enemies",
    emoji: "\u{1F525}",
    color: "#f97316",
  },
  ogreStrength: {
    id: "ogreStrength",
    name: "Shion's Might",
    description: "Deal 14 damage.",
    type: "attack",
    rarity: "uncommon",
    cost: 2,
    damage: 14,
    target: "enemy",
    emoji: "\u{1F4AA}",
    color: "#c084fc",
  },
  criticalCut: {
    id: "criticalCut",
    name: "Hakurou's Cut",
    description: "Deal 10 damage. If the enemy is Vulnerable, deal 10 more.",
    type: "attack",
    rarity: "uncommon",
    cost: 1,
    damage: 10,
    target: "enemy",
    emoji: "\u{1F3AF}",
    color: "#e2e8f0",
  },
  heavyBlow: {
    id: "heavyBlow",
    name: "Heavy Blow",
    description: "Deal 20 damage. Exhaust.",
    type: "attack",
    rarity: "uncommon",
    cost: 2,
    damage: 20,
    target: "enemy",
    emoji: "\u{1F4A5}",
    color: "#dc2626",
    exhaust: true,
  },

  /* ── Uncommon skills ──────────────────────────── */
  healingLight: {
    id: "healingLight",
    name: "Shuna's Light",
    description: "Heal 7 HP.",
    type: "skill",
    rarity: "uncommon",
    cost: 1,
    heal: 7,
    target: "self",
    emoji: "\u{1F338}",
    color: "#f9a8d4",
  },
  fortress: {
    id: "fortress",
    name: "Fortress",
    description: "Gain 12 block.",
    type: "skill",
    rarity: "uncommon",
    cost: 2,
    block: 12,
    target: "self",
    emoji: "\u{1F3F0}",
    color: "#64748b",
  },
  insight: {
    id: "insight",
    name: "Insight",
    description: "Draw 3 cards.",
    type: "skill",
    rarity: "uncommon",
    cost: 1,
    draw: 3,
    target: "self",
    emoji: "\u{1F441}\u{FE0F}",
    color: "#8b5cf6",
  },
  intimidate: {
    id: "intimidate",
    name: "Intimidate",
    description: "Apply 1 Weakness to ALL enemies.",
    type: "skill",
    rarity: "uncommon",
    cost: 1,
    applyWeak: 1,
    target: "all_enemies",
    emoji: "\u{1F608}",
    color: "#1c1c2e",
  },

  /* ── Rare cards ───────────────────────────────── */
  predator: {
    id: "predator",
    name: "Predator",
    description: "Deal 12 damage. Heal for the damage dealt.",
    type: "attack",
    rarity: "rare",
    cost: 2,
    damage: 12,
    heal: 12,
    target: "enemy",
    emoji: "\u{1F9CA}",
    color: "#60a5fa",
  },
  darkFlame: {
    id: "darkFlame",
    name: "Dark Flame",
    description: "Deal 25 damage. Exhaust.",
    type: "attack",
    rarity: "rare",
    cost: 3,
    damage: 25,
    target: "enemy",
    emoji: "\u{1F525}",
    color: "#581c87",
    exhaust: true,
  },
  demonLord: {
    id: "demonLord",
    name: "Demon Lord",
    description: "Gain 3 Strength. Exhaust.",
    type: "power",
    rarity: "rare",
    cost: 3,
    applyStrength: 3,
    target: "self",
    emoji: "\u{1F451}",
    color: "#fbbf24",
    exhaust: true,
  },
  ironSkin: {
    id: "ironSkin",
    name: "Iron Skin",
    description: "Gain 2 Dexterity. Exhaust.",
    type: "power",
    rarity: "rare",
    cost: 2,
    applyDexterity: 2,
    target: "self",
    emoji: "\u{1F9CA}",
    color: "#94a3b8",
    exhaust: true,
  },
  megiddo: {
    id: "megiddo",
    name: "Megiddo",
    description: "Deal 15 damage to ALL enemies. Exhaust.",
    type: "attack",
    rarity: "rare",
    cost: 3,
    damage: 15,
    target: "all_enemies",
    emoji: "\u{1F30B}",
    color: "#ef4444",
    exhaust: true,
  },
};

/** Create the starting deck */
export function createStarterDeck(): string[] {
  return [
    "strike", "strike", "strike", "strike", "strike",
    "defend", "defend", "defend", "defend",
    "bash",
  ];
}

/** Get random card choices filtered by rarity weights */
export function getRandomCards(count: number, exclude: string[] = []): CardDef[] {
  const pool = Object.values(CARDS).filter(
    (c) => c.id !== "strike" && c.id !== "defend" && !exclude.includes(c.id),
  );

  // Weighted random: common 60%, uncommon 30%, rare 10%
  const weighted: CardDef[] = [];
  for (const c of pool) {
    const weight = c.rarity === "common" ? 6 : c.rarity === "uncommon" ? 3 : 1;
    for (let i = 0; i < weight; i++) weighted.push(c);
  }

  const result: CardDef[] = [];
  const used = new Set<string>();
  while (result.length < count && weighted.length > 0) {
    const idx = Math.floor(Math.random() * weighted.length);
    const card = weighted[idx];
    if (!used.has(card.id)) {
      used.add(card.id);
      result.push(card);
    }
    weighted.splice(idx, 1);
  }
  return result;
}
