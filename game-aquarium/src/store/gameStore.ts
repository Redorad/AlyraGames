import { create } from 'zustand';

export interface FishSpecies {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  rarity: number;
  income: number;
}

export const SPECIES: FishSpecies[] = [
  { id: 'goldfish', name: 'Goldfish', emoji: '🐟', cost: 10, rarity: 1, income: 1 },
  { id: 'tropical', name: 'Tropical Fish', emoji: '🐠', cost: 50, rarity: 1, income: 3 },
  { id: 'blowfish', name: 'Blowfish', emoji: '🐡', cost: 200, rarity: 2, income: 15 },
  { id: 'shark', name: 'Shark', emoji: '🦈', cost: 1500, rarity: 3, income: 80 },
  { id: 'octopus', name: 'Octopus', emoji: '🐙', cost: 7000, rarity: 3, income: 300 },
  { id: 'dolphin', name: 'Dolphin', emoji: '🐬', cost: 25000, rarity: 4, income: 1200 },
  { id: 'whale', name: 'Whale', emoji: '🐋', cost: 120000, rarity: 5, income: 6000 },
];

export interface Fish {
  id: number;
  speciesId: string;
  x: number;
  y: number;
  vx: number;
  hunger: number;
}

interface GameState {
  coins: number;
  fishes: Fish[];
  nextId: number;
  log: string[];
  buyFish: (id: string) => void;
  feedAll: () => void;
  tick: (delta: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  coins: 30,
  fishes: [],
  nextId: 1,
  log: ['Welcome to the Aquarium. Buy your first fish!'],
  buyFish: (id) => {
    const s = get();
    const sp = SPECIES.find((x) => x.id === id);
    if (!sp || s.coins < sp.cost) return;
    const fish: Fish = {
      id: s.nextId,
      speciesId: id,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      vx: Math.random() > 0.5 ? 1 : -1,
      hunger: 20,
    };
    set({
      coins: s.coins - sp.cost,
      fishes: [...s.fishes, fish],
      nextId: s.nextId + 1,
      log: [`Added a ${sp.name}!`, ...s.log].slice(0, 5),
    });
  },
  feedAll: () => {
    const s = get();
    if (s.coins < 5) return;
    set({
      coins: s.coins - 5,
      fishes: s.fishes.map((f) => ({ ...f, hunger: 0 })),
      log: ['Fed all fish!', ...s.log].slice(0, 5),
    });
  },
  tick: (delta) => {
    const s = get();
    let coins = s.coins;
    const fishes = s.fishes.map((f) => {
      const sp = SPECIES.find((x) => x.id === f.speciesId)!;
      let vx = f.vx;
      let x = f.x + vx * delta * 5;
      if (x < 5 || x > 95) {
        vx = -vx;
        x = Math.max(5, Math.min(95, x));
      }
      const y = f.y + Math.sin(Date.now() / 1000 + f.id) * 0.1;
      const hunger = Math.min(100, f.hunger + delta * 2);
      if (hunger < 80) {
        coins += sp.income * delta * 0.3;
      }
      return { ...f, x, y, vx, hunger };
    });
    set({ coins, fishes });
  },
}));
