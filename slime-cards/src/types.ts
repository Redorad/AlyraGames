/* ── Cards ─────────────────────────────────────────────── */

export type CardType = "attack" | "skill" | "power";
export type CardRarity = "common" | "uncommon" | "rare";
export type TargetType = "enemy" | "self" | "all_enemies" | "random";

export interface CardDef {
  id: string;
  name: string;
  description: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  damage?: number;
  block?: number;
  draw?: number;
  heal?: number;
  /** Status effects applied to target */
  applyWeak?: number;
  applyVulnerable?: number;
  applyStrength?: number;
  applyDexterity?: number;
  /** Number of hits (for multi-hit attacks) */
  hits?: number;
  target: TargetType;
  emoji: string;
  color: string;
  /** If true, card is removed from deck after play (exhaust) */
  exhaust?: boolean;
}

export interface CardInstance {
  uid: number;
  defId: string;
  upgraded: boolean;
}

/* ── Enemies ──────────────────────────────────────────── */

export interface EnemyDef {
  id: string;
  name: string;
  maxHp: number;
  emoji: string;
  color: string;
}

export type EnemyIntentType = "attack" | "defend" | "buff" | "debuff" | "attack_defend";

export interface EnemyIntent {
  type: EnemyIntentType;
  value: number;
  value2?: number; // for attack_defend: block amount
}

export interface EnemyInstance {
  id: number;
  defId: string;
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  intent: EnemyIntent;
  weak: number;
  vulnerable: number;
}

/* ── Player ───────────────────────────────────────────── */

export interface PlayerState {
  hp: number;
  maxHp: number;
  block: number;
  energy: number;
  maxEnergy: number;
  strength: number;
  dexterity: number;
  weak: number;
  vulnerable: number;
  gold: number;
}

/* ── Map ──────────────────────────────────────────────── */

export type NodeType = "combat" | "elite" | "boss" | "event" | "rest" | "shop";

export interface MapNode {
  id: number;
  row: number;
  col: number;
  type: NodeType;
  connections: number[]; // ids of nodes in next row
  cleared: boolean;
}

/* ── Game ─────────────────────────────────────────────── */

export type GameScreen = "title" | "map" | "combat" | "reward" | "event" | "rest" | "shop" | "game_over" | "victory";

export interface CombatReward {
  gold: number;
  cardChoices: CardDef[];
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  emoji: string;
  choices: {
    text: string;
    effect: () => void;
  }[];
}
