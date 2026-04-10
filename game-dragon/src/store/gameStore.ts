import { create } from 'zustand';

export type DragonType =
  | 'fire' | 'water' | 'earth' | 'air'
  | 'lightning' | 'ice' | 'shadow' | 'light'
  | 'rainbow' | 'cosmic';

export interface DragonInfo {
  type: DragonType;
  emoji: string;
  name: string;
  rarity: number; // 1-5
  income: number;
}

export const DRAGON_INFO: Record<DragonType, DragonInfo> = {
  fire:      { type: 'fire',      emoji: '🔥', name: 'Fire Dragon',      rarity: 1, income: 1 },
  water:     { type: 'water',     emoji: '💧', name: 'Water Dragon',     rarity: 1, income: 1 },
  earth:     { type: 'earth',     emoji: '🌿', name: 'Earth Dragon',     rarity: 1, income: 1 },
  air:       { type: 'air',       emoji: '💨', name: 'Air Dragon',       rarity: 1, income: 1 },
  lightning: { type: 'lightning', emoji: '⚡', name: 'Lightning Dragon', rarity: 2, income: 5 },
  ice:       { type: 'ice',       emoji: '❄️', name: 'Ice Dragon',       rarity: 2, income: 5 },
  shadow:    { type: 'shadow',    emoji: '🌑', name: 'Shadow Dragon',    rarity: 3, income: 20 },
  light:     { type: 'light',     emoji: '☀️', name: 'Light Dragon',     rarity: 3, income: 20 },
  rainbow:   { type: 'rainbow',   emoji: '🌈', name: 'Rainbow Dragon',   rarity: 4, income: 80 },
  cosmic:    { type: 'cosmic',    emoji: '🌌', name: 'Cosmic Dragon',    rarity: 5, income: 300 },
};

export interface Dragon {
  id: number;
  type: DragonType;
  hunger: number; // 0-100, higher = more hungry
  fed: boolean;
}

export interface Egg {
  id: number;
  progress: number; // 0-100
}

interface GameState {
  gold: number;
  eggs: Egg[];
  dragons: Dragon[];
  log: string[];
  nextId: number;
  buyEgg: () => void;
  feedDragon: (id: number) => void;
  breed: (a: number, b: number) => void;
  sellDragon: (id: number) => void;
  tick: () => void;
}

const BASIC: DragonType[] = ['fire', 'water', 'earth', 'air'];
const UNCOMMON: DragonType[] = ['lightning', 'ice'];
const RARE: DragonType[] = ['shadow', 'light'];
const EPIC: DragonType[] = ['rainbow'];
const LEGENDARY: DragonType[] = ['cosmic'];

function hatchType(): DragonType {
  const r = Math.random();
  if (r < 0.8) return BASIC[Math.floor(Math.random() * BASIC.length)];
  if (r < 0.97) return UNCOMMON[Math.floor(Math.random() * UNCOMMON.length)];
  return RARE[Math.floor(Math.random() * RARE.length)];
}

function breedType(a: DragonType, b: DragonType): DragonType {
  // chance to evolve
  const ra = DRAGON_INFO[a].rarity;
  const rb = DRAGON_INFO[b].rarity;
  const base = Math.max(ra, rb);
  const roll = Math.random();
  if (base >= 4 && roll < 0.2) return LEGENDARY[0];
  if (base >= 3 && roll < 0.3) return EPIC[0];
  if (base >= 2 && roll < 0.4) return RARE[Math.floor(Math.random() * RARE.length)];
  if (base >= 1 && roll < 0.5) return UNCOMMON[Math.floor(Math.random() * UNCOMMON.length)];
  return Math.random() < 0.5 ? a : b;
}

export const useGameStore = create<GameState>((set, get) => ({
  gold: 50,
  eggs: [],
  dragons: [],
  log: ['A new clan starts. Buy an egg to begin!'],
  nextId: 1,
  buyEgg: () => {
    const s = get();
    if (s.gold < 20) return;
    set({
      gold: s.gold - 20,
      eggs: [...s.eggs, { id: s.nextId, progress: 0 }],
      nextId: s.nextId + 1,
      log: ['Bought a mysterious egg!', ...s.log].slice(0, 6),
    });
  },
  feedDragon: (id) => {
    set((s) => ({
      dragons: s.dragons.map((d) =>
        d.id === id ? { ...d, hunger: Math.max(0, d.hunger - 80), fed: true } : d
      ),
    }));
  },
  breed: (aId, bId) => {
    const s = get();
    if (s.gold < 100) return;
    const a = s.dragons.find((d) => d.id === aId);
    const b = s.dragons.find((d) => d.id === bId);
    if (!a || !b) return;
    const type = breedType(a.type, b.type);
    const info = DRAGON_INFO[type];
    set({
      gold: s.gold - 100,
      dragons: [...s.dragons, { id: s.nextId, type, hunger: 0, fed: true }],
      nextId: s.nextId + 1,
      log: [`Bred a ${info.name}! ${info.emoji}`, ...s.log].slice(0, 6),
    });
  },
  sellDragon: (id) => {
    const s = get();
    const d = s.dragons.find((x) => x.id === id);
    if (!d) return;
    const price = DRAGON_INFO[d.type].income * 15 + 10;
    set({
      gold: s.gold + price,
      dragons: s.dragons.filter((x) => x.id !== id),
      log: [`Sold ${DRAGON_INFO[d.type].name} for ${price}g`, ...s.log].slice(0, 6),
    });
  },
  tick: () => {
    const s = get();
    // egg progress
    let hatched: Dragon[] = [];
    const eggs = s.eggs
      .map((e) => ({ ...e, progress: e.progress + 2 }))
      .filter((e) => {
        if (e.progress >= 100) {
          const type = hatchType();
          hatched.push({
            id: s.nextId + hatched.length,
            type,
            hunger: 0,
            fed: true,
          });
          return false;
        }
        return true;
      });
    // hunger + gold income
    let gold = s.gold;
    const dragons = [...s.dragons, ...hatched].map((d) => {
      const newHunger = Math.min(100, d.hunger + 1);
      if (d.hunger < 70) {
        gold += DRAGON_INFO[d.type].income * 0.1;
      }
      return { ...d, hunger: newHunger, fed: newHunger < 70 };
    });
    let log = s.log;
    if (hatched.length > 0) {
      log = [
        ...hatched.map((h) => `${DRAGON_INFO[h.type].name} hatched! ${DRAGON_INFO[h.type].emoji}`),
        ...log,
      ].slice(0, 6);
    }
    set({ eggs, dragons, gold, nextId: s.nextId + hatched.length, log });
  },
}));
