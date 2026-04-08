/* ── Tower definitions ─────────────────────────────────── */

export interface TowerDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  range: number; // in tiles
  damage: number;
  attackSpeed: number; // attacks per second (0 = passive)
  color: string;
  symbol: string;
  special?: "splash" | "slow" | "buff" | "crit" | "aura" | "priority" | "predator";
  specialValue?: number; // splash radius / slow % / buff % / crit chance / dps / –
  unlockLevel: number; // first level this tower appears
}

export interface TowerInstance {
  id: number;
  defId: string;
  col: number;
  row: number;
  level: number; // 1–3
  cooldown: number;
  buffMultiplier: number; // from Shuna
}

/* ── Enemy definitions ─────────────────────────────────── */

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number; // tiles per second
  reward: number;
  color: string;
  size: number; // radius multiplier (1 = normal)
  armor: number; // flat damage reduction
  isBoss: boolean;
}

export interface EnemyInstance {
  id: number;
  defId: string;
  hp: number;
  maxHp: number;
  x: number; // tile coords (float)
  y: number;
  speed: number;
  pathIndex: number; // next waypoint index
  reward: number;
  armor: number;
  slowTimer: number;
  slowFactor: number;
  dead: boolean;
  isBoss: boolean;
}

/* ── Projectiles ───────────────────────────────────────── */

export interface Projectile {
  id: number;
  x: number;
  y: number;
  targetId: number;
  damage: number;
  speed: number;
  color: string;
  splashRadius?: number;
  slowAmount?: number;
  isCrit: boolean;
  dead: boolean;
}

/* ── Levels ────────────────────────────────────────────── */

export interface WaveEntry {
  enemyId: string;
  count: number;
  interval: number; // seconds between spawns
}

export interface Wave {
  groups: WaveEntry[];
}

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  grid: number[][]; // 0=buildable, 1=path, 2=deco, 3=spawn, 4=base
  path: { col: number; row: number }[];
  waves: Wave[];
  startGold: number;
  lives: number;
}

/* ── Game state exposed to React ───────────────────────── */

export interface GameState {
  gold: number;
  lives: number;
  maxLives: number;
  currentWave: number;
  totalWaves: number;
  waveActive: boolean;
  gameStatus: "playing" | "won" | "lost";
  selectedTowerDef: TowerDef | null;
  selectedTower: TowerInstance | null;
  canUpgrade: boolean;
  upgradeCost: number;
  sellValue: number;
  towersPlaced: number;
}
