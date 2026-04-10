import { create } from 'zustand';

export interface Line {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  baseIncome: number;
  speed: number; // seconds per robot
  owned: number;
  level: number;
}

interface GameState {
  credits: number;
  totalRobots: number;
  lines: Line[];
  upgradeMult: number;
  log: string[];
  buyLine: (id: string) => void;
  upgradeLine: (id: string) => void;
  buyGlobalUpgrade: () => void;
  tick: (delta: number) => void;
}

const initialLines: Line[] = [
  { id: 'basic', name: 'Basic Bot', emoji: '🤖', baseCost: 15, baseIncome: 2, speed: 1, owned: 0, level: 1 },
  { id: 'worker', name: 'Worker Bot', emoji: '🦾', baseCost: 120, baseIncome: 15, speed: 2, owned: 0, level: 1 },
  { id: 'drone', name: 'Drone', emoji: '🛸', baseCost: 800, baseIncome: 100, speed: 3, owned: 0, level: 1 },
  { id: 'android', name: 'Android', emoji: '👾', baseCost: 6000, baseIncome: 800, speed: 5, owned: 0, level: 1 },
  { id: 'mecha', name: 'Mecha', emoji: '🦿', baseCost: 45000, baseIncome: 6000, speed: 8, owned: 0, level: 1 },
  { id: 'ai', name: 'AI Core', emoji: '🧠', baseCost: 350000, baseIncome: 50000, speed: 12, owned: 0, level: 1 },
];

export const useGameStore = create<GameState>((set, get) => ({
  credits: 20,
  totalRobots: 0,
  lines: initialLines,
  upgradeMult: 1,
  log: ['Factory online. Buy your first line!'],
  buyLine: (id) => {
    const s = get();
    const line = s.lines.find((l) => l.id === id);
    if (!line) return;
    const cost = Math.floor(line.baseCost * Math.pow(1.15, line.owned));
    if (s.credits < cost) return;
    set({
      credits: s.credits - cost,
      lines: s.lines.map((l) => (l.id === id ? { ...l, owned: l.owned + 1 } : l)),
      log: [`New ${line.name} line online`, ...s.log].slice(0, 6),
    });
  },
  upgradeLine: (id) => {
    const s = get();
    const line = s.lines.find((l) => l.id === id);
    if (!line) return;
    const cost = Math.floor(line.baseCost * 10 * Math.pow(3, line.level));
    if (s.credits < cost) return;
    set({
      credits: s.credits - cost,
      lines: s.lines.map((l) => (l.id === id ? { ...l, level: l.level + 1 } : l)),
      log: [`${line.name} upgraded to lvl ${line.level + 1}`, ...s.log].slice(0, 6),
    });
  },
  buyGlobalUpgrade: () => {
    const s = get();
    const cost = Math.floor(500 * Math.pow(5, s.upgradeMult - 1));
    if (s.credits < cost) return;
    set({
      credits: s.credits - cost,
      upgradeMult: s.upgradeMult + 0.5,
      log: [`Factory efficiency +50%`, ...s.log].slice(0, 6),
    });
  },
  tick: (delta) => {
    const s = get();
    let credits = s.credits;
    let totalRobots = s.totalRobots;
    for (const l of s.lines) {
      if (l.owned <= 0) continue;
      const perSec = (l.owned / l.speed) * l.level * s.upgradeMult;
      const robots = perSec * delta;
      totalRobots += robots;
      credits += robots * l.baseIncome;
    }
    set({ credits, totalRobots });
  },
}));
