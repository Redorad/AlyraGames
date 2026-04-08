import type { TowerDef } from "../types";

export const TOWER_DEFS: Record<string, TowerDef> = {
  goblin: {
    id: "goblin",
    name: "Goblin Archer",
    description: "Tireur basique. Dégâts corrects, bonne portée.",
    cost: 50,
    range: 3,
    damage: 20,
    attackSpeed: 1,
    color: "#4ade80",
    symbol: "G",
    unlockLevel: 1,
  },
  ranga: {
    id: "ranga",
    name: "Ranga",
    description: "Attaque très rapide. Efficace contre les groupes.",
    cost: 70,
    range: 2.5,
    damage: 8,
    attackSpeed: 2.5,
    color: "#60a5fa",
    symbol: "R",
    unlockLevel: 2,
  },
  shion: {
    id: "shion",
    name: "Shion",
    description: "Dégâts massifs mais lente. Dévastatrice contre les tanks.",
    cost: 100,
    range: 2,
    damage: 80,
    attackSpeed: 0.5,
    color: "#c084fc",
    symbol: "S",
    unlockLevel: 3,
  },
  benimaru: {
    id: "benimaru",
    name: "Benimaru",
    description: "Dégâts de zone (splash). Idéal dans les courbes.",
    cost: 120,
    range: 3,
    damage: 25,
    attackSpeed: 0.8,
    color: "#f97316",
    symbol: "B",
    special: "splash",
    specialValue: 1.2,
    unlockLevel: 4,
  },
  souei: {
    id: "souei",
    name: "Souei",
    description: "Ralentit les ennemis de 40%. Crée des points de contrôle.",
    cost: 80,
    range: 3.5,
    damage: 5,
    attackSpeed: 0.7,
    color: "#1e3a5f",
    symbol: "So",
    special: "slow",
    specialValue: 0.4,
    unlockLevel: 5,
  },
  shuna: {
    id: "shuna",
    name: "Shuna",
    description: "Boost +35% dégâts des tours proches. Aucun dégât direct.",
    cost: 130,
    range: 2.5,
    damage: 0,
    attackSpeed: 0,
    color: "#f9a8d4",
    symbol: "Sh",
    special: "buff",
    specialValue: 0.35,
    unlockLevel: 6,
  },
  hakurou: {
    id: "hakurou",
    name: "Hakurou",
    description: "Sniper longue portée. 25% de chance de coup critique ×3.",
    cost: 150,
    range: 5,
    damage: 150,
    attackSpeed: 0.3,
    color: "#e2e8f0",
    symbol: "H",
    special: "crit",
    specialValue: 0.25,
    unlockLevel: 7,
  },
  geld: {
    id: "geld",
    name: "Geld",
    description: "Aura de dégâts continus. Place-le au bord du chemin.",
    cost: 100,
    range: 1.5,
    damage: 15,
    attackSpeed: 0,
    color: "#a16207",
    symbol: "Ge",
    special: "aura",
    specialValue: 15,
    unlockLevel: 8,
  },
  diablo: {
    id: "diablo",
    name: "Diablo",
    description: "DPS d'élite. Cible toujours l'ennemi le plus fort.",
    cost: 200,
    range: 3.5,
    damage: 60,
    attackSpeed: 0.8,
    color: "#1c1c2e",
    symbol: "D",
    special: "priority",
    unlockLevel: 9,
  },
  rimuru: {
    id: "rimuru",
    name: "Rimuru",
    description: "Le Roi-Démon Rimuru. Splash + ralentissement. Extrêmement puissant.",
    cost: 300,
    range: 4,
    damage: 100,
    attackSpeed: 1.0,
    color: "#60a5fa",
    symbol: "★",
    special: "predator",
    specialValue: 1.5,
    unlockLevel: 11,
  },
};

/** Returns tower defs available for a given level */
export function getAvailableTowers(level: number, rimuruUnlocked = false): TowerDef[] {
  return Object.values(TOWER_DEFS).filter((t) => {
    if (t.id === "rimuru") return rimuruUnlocked;
    return t.unlockLevel <= level;
  });
}

/** Get upgrade cost for a tower at a given level */
export function getUpgradeCost(def: TowerDef, currentLevel: number): number {
  if (currentLevel >= 3) return Infinity;
  return Math.round(def.cost * (currentLevel === 1 ? 0.6 : 1.0));
}

/** Get sell value (50% of total investment) */
export function getSellValue(def: TowerDef, currentLevel: number): number {
  let total = def.cost;
  if (currentLevel >= 2) total += getUpgradeCost(def, 1);
  if (currentLevel >= 3) total += getUpgradeCost(def, 2);
  return Math.round(total * 0.5);
}

/** Get scaled damage for tower level */
export function getTowerDamage(def: TowerDef, level: number): number {
  const mult = level === 1 ? 1 : level === 2 ? 1.4 : 2.0;
  return Math.round(def.damage * mult);
}

/** Get scaled range for tower level */
export function getTowerRange(def: TowerDef, level: number): number {
  return def.range + (level - 1) * 0.3;
}

/** Get scaled attack speed for tower level */
export function getTowerAttackSpeed(def: TowerDef, level: number): number {
  return def.attackSpeed * (1 + (level - 1) * 0.15);
}
