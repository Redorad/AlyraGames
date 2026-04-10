import { create } from 'zustand';

export interface Dish {
  id: string;
  name: string;
  emoji: string;
  cookTime: number;
  price: number;
  unlockLevel: number;
}

export const DISHES: Dish[] = [
  { id: 'burger', name: 'Burger', emoji: '🍔', cookTime: 3, price: 12, unlockLevel: 1 },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', cookTime: 5, price: 20, unlockLevel: 1 },
  { id: 'sushi', name: 'Sushi', emoji: '🍣', cookTime: 4, price: 25, unlockLevel: 2 },
  { id: 'ramen', name: 'Ramen', emoji: '🍜', cookTime: 6, price: 32, unlockLevel: 2 },
  { id: 'steak', name: 'Steak', emoji: '🥩', cookTime: 8, price: 50, unlockLevel: 3 },
  { id: 'cake', name: 'Cake', emoji: '🎂', cookTime: 10, price: 75, unlockLevel: 4 },
];

export interface Customer {
  id: number;
  order: string;
  patience: number;
  served: boolean;
}

export interface Station {
  id: number;
  cooking?: string;
  progress: number;
}

interface GameState {
  cash: number;
  level: number;
  xp: number;
  customers: Customer[];
  stations: Station[];
  ready: { id: number; dishId: string }[];
  spawnTimer: number;
  nextId: number;
  log: string[];
  startCook: (stationId: number, dishId: string) => void;
  serve: (customerId: number, dishId: string) => void;
  upgradeKitchen: () => void;
  reset: () => void;
  tick: (delta: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  cash: 50,
  level: 1,
  xp: 0,
  customers: [],
  stations: [{ id: 1, progress: 0 }, { id: 2, progress: 0 }],
  ready: [],
  spawnTimer: 2,
  nextId: 1,
  log: ['Welcome! Cook food and serve customers.'],
  startCook: (stationId, dishId) => {
    const s = get();
    const station = s.stations.find((x) => x.id === stationId);
    if (!station || station.cooking) return;
    const dish = DISHES.find((d) => d.id === dishId);
    if (!dish || dish.unlockLevel > s.level) return;
    set({
      stations: s.stations.map((x) =>
        x.id === stationId ? { ...x, cooking: dishId, progress: 0 } : x
      ),
    });
  },
  serve: (customerId, dishId) => {
    const s = get();
    const customer = s.customers.find((c) => c.id === customerId);
    if (!customer || customer.order !== dishId) return;
    const dish = DISHES.find((d) => d.id === dishId);
    if (!dish) return;
    set({
      cash: s.cash + dish.price,
      xp: s.xp + 10,
      customers: s.customers.filter((c) => c.id !== customerId),
      ready: s.ready.filter((r) => r.dishId !== dishId || r.id !== s.ready.find((r2) => r2.dishId === dishId)?.id),
      log: [`Served ${dish.name}! +$${dish.price}`, ...s.log].slice(0, 5),
    });
  },
  upgradeKitchen: () => {
    const s = get();
    const cost = 200 * s.stations.length;
    if (s.cash < cost) return;
    set({
      cash: s.cash - cost,
      stations: [...s.stations, { id: s.stations.length + 1, progress: 0 }],
      log: [`New cooking station added!`, ...s.log].slice(0, 5),
    });
  },
  reset: () =>
    set({
      cash: 50,
      level: 1,
      xp: 0,
      customers: [],
      stations: [{ id: 1, progress: 0 }, { id: 2, progress: 0 }],
      ready: [],
      spawnTimer: 2,
      nextId: 1,
      log: ['Welcome!'],
    }),
  tick: (delta) => {
    const s = get();
    let cash = s.cash;
    let xp = s.xp;
    let level = s.level;
    let log = s.log;
    let spawnTimer = s.spawnTimer - delta;
    let nextId = s.nextId;
    let customers = [...s.customers];
    let ready = [...s.ready];

    // Level up
    while (xp >= level * 50) {
      xp -= level * 50;
      level += 1;
      log = [`Level up! ${level}`, ...log].slice(0, 5);
    }

    // Spawn customer
    if (spawnTimer <= 0 && customers.length < 6) {
      const unlocked = DISHES.filter((d) => d.unlockLevel <= level);
      const dish = unlocked[Math.floor(Math.random() * unlocked.length)];
      customers.push({
        id: nextId++,
        order: dish.id,
        patience: 100,
        served: false,
      });
      spawnTimer = 3 + Math.random() * 2;
    }

    // Update patience
    customers = customers.filter((c) => {
      const newP = c.patience - delta * 3;
      if (newP <= 0) {
        log = [`Customer left angry!`, ...log].slice(0, 5);
        return false;
      }
      c.patience = newP;
      return true;
    });

    // Cooking
    const stations = s.stations.map((st) => {
      if (!st.cooking) return st;
      const dish = DISHES.find((d) => d.id === st.cooking);
      if (!dish) return st;
      const progress = st.progress + (100 / dish.cookTime) * delta;
      if (progress >= 100) {
        ready.push({ id: nextId++, dishId: st.cooking });
        return { ...st, cooking: undefined, progress: 0 };
      }
      return { ...st, progress };
    });

    set({
      cash, xp, level, spawnTimer, nextId, customers, stations, ready, log,
    });
  },
}));
