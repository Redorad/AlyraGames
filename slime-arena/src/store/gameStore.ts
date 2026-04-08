import { create } from 'zustand';
import { GamePhase, PlacedUnit, BattleUnit, BattleLog } from '../types';
import { UNITS, getUnitDef } from '../data/units';
import { ENEMY_ROUNDS } from '../data/enemies';
import { buildBattleUnits, simulateBattle } from '../engine/battle';

interface ShopUnit {
  shopSlot: number;
  defId: string;
  bought: boolean;
}

interface GameState {
  phase: GamePhase;
  round: number;
  playerHp: number;
  gold: number;
  winStreak: number;
  loseStreak: number;
  shop: ShopUnit[];
  placed: PlacedUnit[];
  bench: PlacedUnit[];

  // Battle state
  playerTeam: BattleUnit[];
  enemyTeam: BattleUnit[];
  battleLog: BattleLog | null;
  battleResult: 'player' | 'enemy' | null;

  // Actions
  startGame: () => void;
  rollShop: () => void;
  buyUnit: (shopSlot: number) => void;
  placeUnit: (uid: string, gridX: number, gridY: number) => void;
  removeUnit: (uid: string) => void;
  sellUnit: (uid: string) => void;
  startBattle: () => void;
  endBattle: () => void;
  goToTitle: () => void;
}

let placedUidCounter = 0;
function nextPlacedUid(): string {
  return `placed_${++placedUidCounter}`;
}

function generateShop(round: number): ShopUnit[] {
  const pool = UNITS.filter(u => {
    if (round <= 3) return u.stars <= 2;
    if (round <= 6) return u.stars <= 3;
    return true;
  });
  const shop: ShopUnit[] = [];
  for (let i = 0; i < 5; i++) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    shop.push({ shopSlot: i, defId: pick.id, bought: false });
  }
  return shop;
}

function roundGold(round: number, winStreak: number, loseStreak: number): number {
  const base = 5;
  const streakBonus = Math.min(3, Math.max(winStreak, loseStreak));
  const roundBonus = Math.floor(round / 3);
  return base + streakBonus + roundBonus;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'title',
  round: 1,
  playerHp: 100,
  gold: 10,
  winStreak: 0,
  loseStreak: 0,
  shop: [],
  placed: [],
  bench: [],
  playerTeam: [],
  enemyTeam: [],
  battleLog: null,
  battleResult: null,

  startGame: () => {
    placedUidCounter = 0;
    const shop = generateShop(1);
    set({
      phase: 'prep',
      round: 1,
      playerHp: 100,
      gold: 10,
      winStreak: 0,
      loseStreak: 0,
      shop,
      placed: [],
      bench: [],
      playerTeam: [],
      enemyTeam: [],
      battleLog: null,
      battleResult: null,
    });
  },

  rollShop: () => {
    const { gold, round } = get();
    if (gold < 1) return;
    set({ gold: gold - 1, shop: generateShop(round) });
  },

  buyUnit: (shopSlot: number) => {
    const { shop, gold, placed, bench } = get();
    const item = shop.find(s => s.shopSlot === shopSlot && !s.bought);
    if (!item) return;
    const def = getUnitDef(item.defId);
    if (gold < def.cost) return;

    // Max 8 units (4 placed + 4 bench)
    if (placed.length + bench.length >= 8) return;

    const uid = nextPlacedUid();
    const newBench = [...bench, { uid, defId: item.defId, gridX: -1, gridY: -1 }];
    const newShop = shop.map(s => s.shopSlot === shopSlot ? { ...s, bought: true } : s);
    set({ gold: gold - def.cost, shop: newShop, bench: newBench });
  },

  placeUnit: (uid: string, gridX: number, gridY: number) => {
    const { placed, bench } = get();

    // Max 4x2 grid (columns 0-3, rows 0-1)
    if (gridX < 0 || gridX > 3 || gridY < 0 || gridY > 1) return;

    // Check if slot is occupied
    const occupied = placed.find(u => u.gridX === gridX && u.gridY === gridY);

    // Check if unit is from bench
    const benchUnit = bench.find(u => u.uid === uid);
    const placedUnit = placed.find(u => u.uid === uid);

    if (benchUnit) {
      // Max 8 on the field (4x2 grid)
      if (placed.length >= 8 && !occupied) return;

      let newPlaced = [...placed];
      let newBench = bench.filter(u => u.uid !== uid);

      if (occupied) {
        // Swap: move occupied unit to bench
        newPlaced = newPlaced.filter(u => u.uid !== occupied.uid);
        newBench = [...newBench, { ...occupied, gridX: -1, gridY: -1 }];
      }

      newPlaced.push({ uid, defId: benchUnit.defId, gridX, gridY });
      set({ placed: newPlaced, bench: newBench });
    } else if (placedUnit) {
      let newPlaced = placed.filter(u => u.uid !== uid);

      if (occupied) {
        // Swap positions
        newPlaced = newPlaced.filter(u => u.uid !== occupied.uid);
        newPlaced.push({ ...occupied, gridX: placedUnit.gridX, gridY: placedUnit.gridY });
      }

      newPlaced.push({ ...placedUnit, gridX, gridY });
      set({ placed: newPlaced });
    }
  },

  removeUnit: (uid: string) => {
    const { placed, bench } = get();
    const unit = placed.find(u => u.uid === uid);
    if (unit) {
      set({
        placed: placed.filter(u => u.uid !== uid),
        bench: [...bench, { ...unit, gridX: -1, gridY: -1 }],
      });
    }
  },

  sellUnit: (uid: string) => {
    const { placed, bench, gold } = get();
    const unit = placed.find(u => u.uid === uid) || bench.find(u => u.uid === uid);
    if (!unit) return;
    const def = getUnitDef(unit.defId);
    const sellPrice = Math.max(1, Math.floor(def.cost / 2));
    set({
      placed: placed.filter(u => u.uid !== uid),
      bench: bench.filter(u => u.uid !== uid),
      gold: gold + sellPrice,
    });
  },

  startBattle: () => {
    const { placed, round } = get();
    if (placed.length === 0) return;

    const enemyRound = ENEMY_ROUNDS.find(r => r.round === round);
    if (!enemyRound) return;

    const { playerTeam, enemyTeam } = buildBattleUnits(placed, enemyRound.units);
    const battleLog = simulateBattle(
      playerTeam.map(u => ({ ...u })),
      enemyTeam.map(u => ({ ...u }))
    );

    set({
      phase: 'battle',
      playerTeam,
      enemyTeam,
      battleLog,
      battleResult: battleLog.winner,
    });
  },

  endBattle: () => {
    const { round, playerHp, battleResult, battleLog, winStreak, loseStreak, gold } = get();

    let newHp = playerHp;
    let newWinStreak = winStreak;
    let newLoseStreak = loseStreak;

    if (battleResult === 'enemy') {
      const dmg = (battleLog?.survivingEnemies || 1) * 10;
      newHp = Math.max(0, playerHp - dmg);
      newWinStreak = 0;
      newLoseStreak = loseStreak + 1;
    } else {
      newWinStreak = winStreak + 1;
      newLoseStreak = 0;
    }

    if (newHp <= 0 || round >= 10) {
      set({
        phase: 'gameOver',
        playerHp: newHp,
        winStreak: newWinStreak,
        loseStreak: newLoseStreak,
      });
      return;
    }

    const newRound = round + 1;
    const income = roundGold(newRound, newWinStreak, newLoseStreak);
    const newShop = generateShop(newRound);

    set({
      phase: 'prep',
      round: newRound,
      playerHp: newHp,
      gold: gold + income,
      winStreak: newWinStreak,
      loseStreak: newLoseStreak,
      shop: newShop,
      battleLog: null,
      battleResult: null,
    });
  },

  goToTitle: () => {
    set({ phase: 'title' });
  },
}));
