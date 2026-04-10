import { create } from 'zustand';

export type Stage = 'egg' | 'baby' | 'teen' | 'adult';
export type Mood = 'happy' | 'sad' | 'hungry' | 'sick' | 'sleepy' | 'dirty';

interface GameState {
  hunger: number; // 0 full, 100 starving
  happiness: number; // 0 sad, 100 happy
  hygiene: number; // 0 dirty, 100 clean
  energy: number; // 0 tired, 100 full
  age: number; // in seconds
  stage: Stage;
  alive: boolean;
  lastAction: number;
  hearts: number[];
  feed: () => void;
  clean: () => void;
  play: () => void;
  sleep: () => void;
  reset: () => void;
  tick: (delta: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  hunger: 20,
  happiness: 80,
  hygiene: 100,
  energy: 100,
  age: 0,
  stage: 'egg',
  alive: true,
  lastAction: 0,
  hearts: [],
  feed: () => {
    const s = get();
    if (!s.alive) return;
    set({
      hunger: Math.max(0, s.hunger - 40),
      happiness: Math.min(100, s.happiness + 5),
      hearts: [...s.hearts, Date.now()],
    });
  },
  clean: () => {
    const s = get();
    if (!s.alive) return;
    set({
      hygiene: 100,
      happiness: Math.min(100, s.happiness + 10),
      hearts: [...s.hearts, Date.now()],
    });
  },
  play: () => {
    const s = get();
    if (!s.alive) return;
    set({
      happiness: Math.min(100, s.happiness + 25),
      energy: Math.max(0, s.energy - 15),
      hunger: Math.min(100, s.hunger + 5),
      hearts: [...s.hearts, Date.now()],
    });
  },
  sleep: () => {
    const s = get();
    if (!s.alive) return;
    set({
      energy: 100,
      hearts: [...s.hearts, Date.now()],
    });
  },
  reset: () =>
    set({
      hunger: 20,
      happiness: 80,
      hygiene: 100,
      energy: 100,
      age: 0,
      stage: 'egg',
      alive: true,
      hearts: [],
    }),
  tick: (delta) => {
    const s = get();
    if (!s.alive) return;
    const hunger = Math.min(100, s.hunger + delta * 2);
    const happiness = Math.max(0, s.happiness - delta * 1.2);
    const hygiene = Math.max(0, s.hygiene - delta * 0.8);
    const energy = Math.max(0, s.energy - delta * 0.6);
    const age = s.age + delta;
    let stage: Stage = 'egg';
    if (age > 10) stage = 'baby';
    if (age > 40) stage = 'teen';
    if (age > 100) stage = 'adult';
    const alive = !(hunger >= 100 && happiness <= 0);
    // clean old hearts
    const hearts = s.hearts.filter((h) => Date.now() - h < 1500);
    set({ hunger, happiness, hygiene, energy, age, stage, alive, hearts });
  },
}));
