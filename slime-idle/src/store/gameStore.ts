import { create } from "zustand";
import { EVOLUTIONS } from "../data/evolutions";
import { SKILLS, ShopItemDef } from "../data/skills";
import { SUBORDINATES } from "../data/subordinates";
import { BUILDINGS } from "../data/buildings";

const SAVE_KEY = "slime-idle-save";
const COST_SCALE = 1.15;

export interface GameState {
  magicules: number;
  lifetimeMagicules: number;
  totalClicks: number;
  evolutionIndex: number;
  ownedItems: Record<string, number>;
  eventLog: string[];
  lastSaveTime: number;
  startTime: number;
  prestigeMultiplier: number;
  prestigeCount: number;

  // Derived (computed on the fly)
  getClickPower: () => number;
  getPassivePower: () => number;
  getEvolutionMultiplier: () => number;
  getItemCost: (item: ShopItemDef) => number;

  // Actions
  click: () => void;
  tick: (dt: number) => void;
  buyItem: (item: ShopItemDef) => boolean;
  addEvent: (msg: string) => void;
  checkEvolution: () => string | null;
  save: () => void;
  load: () => { offlineSeconds: number } | null;
  reset: () => void;
  prestige: () => void;
}

function getInitialState() {
  return {
    magicules: 0,
    lifetimeMagicules: 0,
    totalClicks: 0,
    evolutionIndex: 0,
    ownedItems: {} as Record<string, number>,
    eventLog: ["Great Sage: «Notice. You have been reincarnated as a slime.»"],
    lastSaveTime: Date.now(),
    startTime: Date.now(),
    prestigeMultiplier: 1,
    prestigeCount: 0,
  };
}

function computeClickPower(ownedItems: Record<string, number>): number {
  let power = 1;
  const allItems = [...SKILLS, ...SUBORDINATES, ...BUILDINGS];
  for (const item of allItems) {
    if (item.clickPower && ownedItems[item.id]) {
      power += item.clickPower * ownedItems[item.id];
    }
  }
  return power;
}

function computePassivePower(ownedItems: Record<string, number>): number {
  let power = 0;
  const allItems = [...SKILLS, ...SUBORDINATES, ...BUILDINGS];
  for (const item of allItems) {
    if (item.passivePower && ownedItems[item.id]) {
      power += item.passivePower * ownedItems[item.id];
    }
  }
  return power;
}

function computeEvolutionMultiplier(index: number): number {
  return EVOLUTIONS[index]?.multiplier ?? 1;
}

function computeItemCost(item: ShopItemDef, owned: number): number {
  return Math.floor(item.baseCost * Math.pow(COST_SCALE, owned));
}

export const useGameStore = create<GameState>((set, get) => ({
  ...getInitialState(),

  getClickPower: () => {
    const s = get();
    return computeClickPower(s.ownedItems) * computeEvolutionMultiplier(s.evolutionIndex) * s.prestigeMultiplier;
  },

  getPassivePower: () => {
    const s = get();
    return computePassivePower(s.ownedItems) * computeEvolutionMultiplier(s.evolutionIndex) * s.prestigeMultiplier;
  },

  getEvolutionMultiplier: () => {
    return computeEvolutionMultiplier(get().evolutionIndex) * get().prestigeMultiplier;
  },

  getItemCost: (item: ShopItemDef) => {
    return computeItemCost(item, get().ownedItems[item.id] ?? 0);
  },

  click: () => {
    const clickPower = get().getClickPower();
    set((s) => ({
      magicules: s.magicules + clickPower,
      lifetimeMagicules: s.lifetimeMagicules + clickPower,
      totalClicks: s.totalClicks + 1,
    }));
  },

  tick: (dt: number) => {
    const passivePower = get().getPassivePower();
    if (passivePower <= 0) return;
    const earned = passivePower * dt;
    set((s) => ({
      magicules: s.magicules + earned,
      lifetimeMagicules: s.lifetimeMagicules + earned,
    }));
  },

  buyItem: (item: ShopItemDef) => {
    const s = get();
    const cost = computeItemCost(item, s.ownedItems[item.id] ?? 0);
    if (s.magicules < cost) return false;
    set((state) => ({
      magicules: state.magicules - cost,
      ownedItems: {
        ...state.ownedItems,
        [item.id]: (state.ownedItems[item.id] ?? 0) + 1,
      },
    }));
    get().addEvent(`Acquired: ${item.emoji} ${item.name} (Lv.${(get().ownedItems[item.id] ?? 0)})`);
    return true;
  },

  addEvent: (msg: string) => {
    set((s) => ({
      eventLog: [...s.eventLog.slice(-49), msg],
    }));
  },

  checkEvolution: () => {
    const s = get();
    const nextIndex = s.evolutionIndex + 1;
    if (nextIndex >= EVOLUTIONS.length) return null;
    const next = EVOLUTIONS[nextIndex];
    if (s.lifetimeMagicules >= next.threshold) {
      set({ evolutionIndex: nextIndex });
      const msg = `✦ EVOLVED into ${next.emoji} ${next.name}! (×${next.multiplier} multiplier)`;
      get().addEvent(msg);
      return next.name;
    }
    return null;
  },

  save: () => {
    const s = get();
    const data = {
      magicules: s.magicules,
      lifetimeMagicules: s.lifetimeMagicules,
      totalClicks: s.totalClicks,
      evolutionIndex: s.evolutionIndex,
      ownedItems: s.ownedItems,
      eventLog: s.eventLog,
      lastSaveTime: Date.now(),
      startTime: s.startTime,
      prestigeMultiplier: s.prestigeMultiplier,
      prestigeCount: s.prestigeCount,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  },

  load: () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      const offlineSeconds = Math.max(0, (Date.now() - (data.lastSaveTime ?? Date.now())) / 1000);
      set({
        magicules: data.magicules ?? 0,
        lifetimeMagicules: data.lifetimeMagicules ?? 0,
        totalClicks: data.totalClicks ?? 0,
        evolutionIndex: data.evolutionIndex ?? 0,
        ownedItems: data.ownedItems ?? {},
        eventLog: data.eventLog ?? [],
        lastSaveTime: Date.now(),
        startTime: data.startTime ?? Date.now(),
        prestigeMultiplier: data.prestigeMultiplier ?? 1,
        prestigeCount: data.prestigeCount ?? 0,
      });
      return { offlineSeconds };
    } catch {
      return null;
    }
  },

  reset: () => {
    localStorage.removeItem(SAVE_KEY);
    set(getInitialState());
  },

  prestige: () => {
    const s = get();
    if (s.evolutionIndex < EVOLUTIONS.length - 1) return;
    const newPrestige = s.prestigeCount + 1;
    const newMultiplier = 1 + newPrestige * 0.5;
    set({
      ...getInitialState(),
      prestigeMultiplier: newMultiplier,
      prestigeCount: newPrestige,
      eventLog: [`✦ Reincarnated! Prestige level ${newPrestige} (×${newMultiplier.toFixed(1)} permanent bonus)`],
      startTime: Date.now(),
      lastSaveTime: Date.now(),
    });
  },
}));
