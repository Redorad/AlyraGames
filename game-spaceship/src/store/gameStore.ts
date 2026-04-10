import { create } from 'zustand';

export interface ShipPart {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  costMult: number;
  owned: number;
  power: number;
}

export interface Planet {
  id: string;
  name: string;
  emoji: string;
  requiredPower: number;
  reward: number;
  explored: boolean;
}

interface GameState {
  energy: number;
  perClick: number;
  perSecond: number;
  totalPower: number;
  parts: ShipPart[];
  planets: Planet[];
  log: string[];
  click: () => void;
  buyPart: (id: string) => void;
  explore: (id: string) => void;
  tick: () => void;
}

const initialParts: ShipPart[] = [
  { id: 'hull', name: 'Hull Plate', emoji: '⬛', cost: 10, costMult: 1.15, owned: 0, power: 1 },
  { id: 'engine', name: 'Ion Engine', emoji: '🔥', cost: 60, costMult: 1.18, owned: 0, power: 5 },
  { id: 'shield', name: 'Shield', emoji: '🛡️', cost: 250, costMult: 1.2, owned: 0, power: 20 },
  { id: 'laser', name: 'Laser Cannon', emoji: '💥', cost: 1200, costMult: 1.22, owned: 0, power: 80 },
  { id: 'reactor', name: 'Fusion Reactor', emoji: '⚛️', cost: 6000, costMult: 1.25, owned: 0, power: 350 },
  { id: 'warp', name: 'Warp Drive', emoji: '🌀', cost: 30000, costMult: 1.3, owned: 0, power: 1500 },
];

const initialPlanets: Planet[] = [
  { id: 'luna', name: 'Luna', emoji: '🌙', requiredPower: 10, reward: 100, explored: false },
  { id: 'mars', name: 'Mars', emoji: '🔴', requiredPower: 50, reward: 600, explored: false },
  { id: 'jupiter', name: 'Jupiter', emoji: '🟠', requiredPower: 200, reward: 3000, explored: false },
  { id: 'saturn', name: 'Saturn', emoji: '🪐', requiredPower: 800, reward: 12000, explored: false },
  { id: 'neptune', name: 'Neptune', emoji: '🔵', requiredPower: 3000, reward: 60000, explored: false },
  { id: 'kepler', name: 'Kepler-22b', emoji: '🌍', requiredPower: 15000, reward: 400000, explored: false },
];

export const useGameStore = create<GameState>((set, get) => ({
  energy: 0,
  perClick: 1,
  perSecond: 0,
  totalPower: 0,
  parts: initialParts,
  planets: initialPlanets,
  log: ['Welcome to the shipyard! Click to earn energy.'],
  click: () => set((s) => ({ energy: s.energy + s.perClick })),
  buyPart: (id) => {
    const s = get();
    const part = s.parts.find((p) => p.id === id);
    if (!part) return;
    const cost = Math.floor(part.cost * Math.pow(part.costMult, part.owned));
    if (s.energy < cost) return;
    const newParts = s.parts.map((p) =>
      p.id === id ? { ...p, owned: p.owned + 1 } : p
    );
    const totalPower = newParts.reduce((sum, p) => sum + p.owned * p.power, 0);
    const perSecond = Math.floor(totalPower / 4);
    const perClick = 1 + Math.floor(totalPower / 20);
    set({
      energy: s.energy - cost,
      parts: newParts,
      totalPower,
      perSecond,
      perClick,
      log: [`Built ${part.name}!`, ...s.log].slice(0, 6),
    });
  },
  explore: (id) => {
    const s = get();
    const planet = s.planets.find((p) => p.id === id);
    if (!planet || planet.explored) return;
    if (s.totalPower < planet.requiredPower) return;
    const newPlanets = s.planets.map((p) =>
      p.id === id ? { ...p, explored: true } : p
    );
    set({
      planets: newPlanets,
      energy: s.energy + planet.reward,
      log: [`Explored ${planet.name}! +${planet.reward} energy`, ...s.log].slice(0, 6),
    });
  },
  tick: () => set((s) => ({ energy: s.energy + s.perSecond / 10 })),
}));
