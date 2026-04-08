export interface UnitDef {
  id: string;
  name: string;
  emoji: string;
  stars: 1 | 2 | 3 | 4;
  hp: number;
  atk: number;
  def: number;
  speed: number;
  cost: number;
  special: string;
  synergies: string[];
}

export interface BattleUnit {
  uid: string;
  def: UnitDef;
  currentHp: number;
  maxHp: number;
  atk: number;
  defStat: number;
  speed: number;
  gridX: number;
  gridY: number;
  side: 'player' | 'enemy';
  alive: boolean;
  synergyBonuses: { atk: number; hp: number; crit: number };
  burn: number;
  poison: number;
  stun: number;
}

export interface DamageEvent {
  attackerUid: string;
  targetUid: string;
  damage: number;
  isCrit: boolean;
  tick: number;
}

export interface DeathEvent {
  uid: string;
  tick: number;
}

export interface HealEvent {
  healerUid: string;
  targetUid: string;
  amount: number;
  tick: number;
}

export interface BattleLog {
  damages: DamageEvent[];
  deaths: DeathEvent[];
  heals: HealEvent[];
  winner: 'player' | 'enemy';
  survivingEnemies: number;
}

export interface SynergyDef {
  id: string;
  name: string;
  emoji: string;
  threshold: number;
  bonus: string;
  effect: { atk?: number; hp?: number; crit?: number; speed?: number };
}

export interface EnemyRound {
  round: number;
  name: string;
  units: { id: string; gridX: number; gridY: number }[];
}

export type GamePhase = 'title' | 'prep' | 'battle' | 'gameOver';

export interface GridSlot {
  x: number;
  y: number;
  unitUid: string | null;
}

export interface PlacedUnit {
  uid: string;
  defId: string;
  gridX: number;
  gridY: number;
}
