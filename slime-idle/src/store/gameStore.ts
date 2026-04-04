import { create } from "zustand";
import { EVOLUTIONS } from "../data/evolutions";
import { SKILLS, ShopItemDef } from "../data/skills";
import { SUBORDINATES } from "../data/subordinates";
import { BUILDINGS } from "../data/buildings";
import { ACHIEVEMENTS } from "../data/achievements";
import { PRESTIGE_UPGRADES, PrestigeUpgrade } from "../data/prestigeUpgrades";
import { CHALLENGES, Challenge } from "../data/challenges";

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
  prestigeCount: number;
  prestigePoints: number;
  prestigeUpgrades: Record<string, number>;
  unlockedAchievements: string[];
  completedChallenges: string[];
  activeChallenge: string | null;
  challengeMagicules: number;
  autoBuyEnabled: boolean;
  stormActive: boolean;
  stormMultiplier: number;
  stormEndTime: number;
  comboCount: number;
  comboLastClick: number;
  totalCriticals: number;

  // Derived
  getClickPower: () => number;
  getPassivePower: () => number;
  getEvolutionMultiplier: () => number;
  getItemCost: (item: ShopItemDef) => number;
  getItemCostForQuantity: (item: ShopItemDef, qty: number) => { totalCost: number; affordable: number };
  getPrestigeUpgradeCost: (upgrade: PrestigeUpgrade) => number;
  getAchievementMultiplier: (type: "click_mult" | "passive_mult" | "all_mult") => number;
  getChallengeMultiplier: () => number;
  getOfflineMultiplier: () => number;
  getComboMultiplier: () => number;
  getCritChance: () => number;
  getCritMultiplier: () => number;

  // Actions
  click: () => { crit: boolean; combo: number; power: number };
  tick: (dt: number) => void;
  buyItem: (item: ShopItemDef) => boolean;
  buyItemMultiple: (item: ShopItemDef, qty: number) => number;
  autoBuy: () => void;
  addEvent: (msg: string) => void;
  checkEvolution: () => string | null;
  checkAchievements: () => string[];
  buyPrestigeUpgrade: (upgrade: PrestigeUpgrade) => boolean;
  startChallenge: (challenge: Challenge) => void;
  abandonChallenge: () => void;
  checkChallengeCompletion: () => void;
  startStorm: () => void;
  toggleAutoBuy: () => void;
  save: () => void;
  load: () => { offlineSeconds: number } | null;
  exportSave: () => string;
  importSave: (data: string) => boolean;
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
    prestigeCount: 0,
    prestigePoints: 0,
    prestigeUpgrades: {} as Record<string, number>,
    unlockedAchievements: [] as string[],
    completedChallenges: [] as string[],
    activeChallenge: null as string | null,
    challengeMagicules: 0,
    autoBuyEnabled: false,
    stormActive: false,
    stormMultiplier: 1,
    stormEndTime: 0,
    comboCount: 0,
    comboLastClick: 0,
    totalCriticals: 0,
  };
}

const ALL_ITEMS = [...SKILLS, ...SUBORDINATES, ...BUILDINGS];

function computeClickPower(ownedItems: Record<string, number>): number {
  let power = 1;
  for (const item of ALL_ITEMS) {
    if (item.clickPower && ownedItems[item.id]) {
      power += item.clickPower * ownedItems[item.id];
    }
  }
  return power;
}

function computePassivePower(ownedItems: Record<string, number>): number {
  let power = 0;
  for (const item of ALL_ITEMS) {
    if (item.passivePower && ownedItems[item.id]) {
      power += item.passivePower * ownedItems[item.id];
    }
  }
  return power;
}

function computePrestigeMultiplier(prestigeCount: number, prestigeUpgrades: Record<string, number>): number {
  let mult = 1 + prestigeCount * 0.5;
  for (const u of PRESTIGE_UPGRADES) {
    const level = prestigeUpgrades[u.id] ?? 0;
    if (level > 0 && u.effect.type === "all_mult") {
      mult *= 1 + u.effect.valuePerLevel * level;
    }
  }
  return mult;
}

function computePrestigeTypeMult(prestigeUpgrades: Record<string, number>, type: "click_mult" | "passive_mult"): number {
  let mult = 1;
  for (const u of PRESTIGE_UPGRADES) {
    const level = prestigeUpgrades[u.id] ?? 0;
    if (level > 0 && u.effect.type === type) {
      mult *= 1 + u.effect.valuePerLevel * level;
    }
  }
  return mult;
}

function computeCostReduction(prestigeUpgrades: Record<string, number>): number {
  for (const u of PRESTIGE_UPGRADES) {
    const level = prestigeUpgrades[u.id] ?? 0;
    if (level > 0 && u.effect.type === "cost_reduction") {
      return Math.max(0.1, 1 - (u.effect.valuePerLevel * level) / 100);
    }
  }
  return 1;
}

function computeAchievementMult(unlockedAchievements: string[], type: "click_mult" | "passive_mult" | "all_mult"): number {
  let mult = 1;
  for (const a of ACHIEVEMENTS) {
    if (unlockedAchievements.includes(a.id) && a.reward.type === type) {
      mult *= a.reward.value;
    }
  }
  return mult;
}

function computeChallengeMult(completedChallenges: string[]): number {
  let mult = 1;
  for (const c of CHALLENGES) {
    if (completedChallenges.includes(c.id)) {
      mult *= c.reward.value;
    }
  }
  return mult;
}

function getActiveChallenge(id: string | null): Challenge | null {
  if (!id) return null;
  return CHALLENGES.find((c) => c.id === id) ?? null;
}

function getStartMagicules(prestigeUpgrades: Record<string, number>): number {
  let startMag = 0;
  for (const u of PRESTIGE_UPGRADES) {
    const level = prestigeUpgrades[u.id] ?? 0;
    if (level > 0 && u.effect.type === "start_magicules") {
      startMag = u.effect.valuePerLevel * level * Math.pow(10, Math.floor(level / 5));
    }
  }
  return startMag;
}

function computeItemCost(item: ShopItemDef, owned: number, costRed: number, challengeCost: number): number {
  const base = Math.floor(item.baseCost * Math.pow(COST_SCALE, owned));
  return Math.max(1, Math.floor(base * costRed * challengeCost));
}

export const useGameStore = create<GameState>((set, get) => ({
  ...getInitialState(),

  getClickPower: () => {
    const s = get();
    const challenge = getActiveChallenge(s.activeChallenge);
    if (challenge?.modifier.clickDisabled) return 0;
    const base = computeClickPower(s.ownedItems);
    const evoMult = EVOLUTIONS[s.evolutionIndex]?.multiplier ?? 1;
    const prestigeAll = computePrestigeMultiplier(s.prestigeCount, s.prestigeUpgrades);
    const prestigeClick = computePrestigeTypeMult(s.prestigeUpgrades, "click_mult");
    const achClick = computeAchievementMult(s.unlockedAchievements, "click_mult");
    const achAll = computeAchievementMult(s.unlockedAchievements, "all_mult");
    const challengeMult = computeChallengeMult(s.completedChallenges);
    const activeMult = challenge?.modifier.clickMultiplier ?? 1;
    const stormMult = s.stormActive ? s.stormMultiplier : 1;
    return base * evoMult * prestigeAll * prestigeClick * achClick * achAll * challengeMult * activeMult * stormMult;
  },

  getPassivePower: () => {
    const s = get();
    const challenge = getActiveChallenge(s.activeChallenge);
    const base = computePassivePower(s.ownedItems) + (challenge?.modifier.basePassive ?? 0);
    const evoMult = EVOLUTIONS[s.evolutionIndex]?.multiplier ?? 1;
    const prestigeAll = computePrestigeMultiplier(s.prestigeCount, s.prestigeUpgrades);
    const prestigePassive = computePrestigeTypeMult(s.prestigeUpgrades, "passive_mult");
    const achPassive = computeAchievementMult(s.unlockedAchievements, "passive_mult");
    const achAll = computeAchievementMult(s.unlockedAchievements, "all_mult");
    const challengeMult = computeChallengeMult(s.completedChallenges);
    const activeMult = challenge?.modifier.passiveMultiplier ?? 1;
    const stormMult = s.stormActive ? s.stormMultiplier : 1;
    return base * evoMult * prestigeAll * prestigePassive * achPassive * achAll * challengeMult * activeMult * stormMult;
  },

  getEvolutionMultiplier: () => {
    const s = get();
    return (EVOLUTIONS[s.evolutionIndex]?.multiplier ?? 1) * computePrestigeMultiplier(s.prestigeCount, s.prestigeUpgrades);
  },

  getItemCost: (item: ShopItemDef) => {
    const s = get();
    const challenge = getActiveChallenge(s.activeChallenge);
    const costRed = computeCostReduction(s.prestigeUpgrades);
    const challengeCost = challenge?.modifier.costMultiplier ?? 1;
    return computeItemCost(item, s.ownedItems[item.id] ?? 0, costRed, challengeCost);
  },

  getItemCostForQuantity: (item: ShopItemDef, qty: number) => {
    const s = get();
    const challenge = getActiveChallenge(s.activeChallenge);
    const costRed = computeCostReduction(s.prestigeUpgrades);
    const challengeCost = challenge?.modifier.costMultiplier ?? 1;
    const owned = s.ownedItems[item.id] ?? 0;
    let totalCost = 0;
    let affordable = 0;
    for (let i = 0; i < qty; i++) {
      const c = computeItemCost(item, owned + i, costRed, challengeCost);
      if (totalCost + c > s.magicules) break;
      totalCost += c;
      affordable++;
    }
    return { totalCost, affordable };
  },

  getPrestigeUpgradeCost: (upgrade: PrestigeUpgrade) => {
    const level = get().prestigeUpgrades[upgrade.id] ?? 0;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costScale, level));
  },

  getAchievementMultiplier: (type) => computeAchievementMult(get().unlockedAchievements, type),
  getChallengeMultiplier: () => computeChallengeMult(get().completedChallenges),

  getOfflineMultiplier: () => {
    const s = get();
    let mult = 1;
    for (const u of PRESTIGE_UPGRADES) {
      const level = s.prestigeUpgrades[u.id] ?? 0;
      if (level > 0 && u.effect.type === "offline_mult") {
        mult *= 1 + u.effect.valuePerLevel * level;
      }
    }
    return mult;
  },

  getComboMultiplier: () => {
    const s = get();
    if (s.comboCount <= 1) return 1;
    // Combo multiplier: +5% per combo, max 3x
    return Math.min(3, 1 + (s.comboCount - 1) * 0.05);
  },

  getCritChance: () => {
    const s = get();
    // Base 5% + 2% per prestige, max 50%
    return Math.min(0.5, 0.05 + s.prestigeCount * 0.02);
  },

  getCritMultiplier: () => {
    const s = get();
    // Base 3x + 0.5x per prestige, max 10x
    return Math.min(10, 3 + s.prestigeCount * 0.5);
  },

  click: () => {
    const s = get();
    const challenge = getActiveChallenge(s.activeChallenge);
    if (challenge?.modifier.clickDisabled) return { crit: false, combo: 0, power: 0 };

    const now = Date.now();
    const timeSinceLastClick = now - s.comboLastClick;
    const newCombo = timeSinceLastClick < 500 ? s.comboCount + 1 : 1;

    const baseClick = get().getClickPower();
    const comboMult = newCombo > 1 ? Math.min(3, 1 + (newCombo - 1) * 0.05) : 1;
    const isCrit = Math.random() < get().getCritChance();
    const critMult = isCrit ? get().getCritMultiplier() : 1;
    const totalPower = baseClick * comboMult * critMult;

    set((st) => ({
      magicules: st.magicules + totalPower,
      lifetimeMagicules: st.lifetimeMagicules + totalPower,
      totalClicks: st.totalClicks + 1,
      challengeMagicules: st.activeChallenge ? st.challengeMagicules + totalPower : st.challengeMagicules,
      comboCount: newCombo,
      comboLastClick: now,
      totalCriticals: isCrit ? st.totalCriticals + 1 : st.totalCriticals,
    }));

    return { crit: isCrit, combo: newCombo, power: totalPower };
  },

  tick: (dt: number) => {
    const s = get();
    // Check storm expiry
    if (s.stormActive && Date.now() > s.stormEndTime) {
      set({ stormActive: false, stormMultiplier: 1 });
      get().addEvent("🌀 The Magicule Storm has passed.");
    }
    // Decay combo if no click in 500ms
    if (s.comboCount > 0 && Date.now() - s.comboLastClick > 500) {
      set({ comboCount: 0 });
    }
    const passivePower = get().getPassivePower();
    if (passivePower <= 0) return;
    const earned = passivePower * dt;
    set((st) => ({
      magicules: st.magicules + earned,
      lifetimeMagicules: st.lifetimeMagicules + earned,
      challengeMagicules: st.activeChallenge ? st.challengeMagicules + earned : st.challengeMagicules,
    }));
  },

  buyItem: (item: ShopItemDef) => {
    const cost = get().getItemCost(item);
    if (get().magicules < cost) return false;
    set((state) => ({
      magicules: state.magicules - cost,
      ownedItems: {
        ...state.ownedItems,
        [item.id]: (state.ownedItems[item.id] ?? 0) + 1,
      },
    }));
    get().addEvent(`Acquired: ${item.emoji} ${item.name} (Lv.${get().ownedItems[item.id] ?? 0})`);
    return true;
  },

  buyItemMultiple: (item: ShopItemDef, qty: number) => {
    const s = get();
    const challenge = getActiveChallenge(s.activeChallenge);
    const costRed = computeCostReduction(s.prestigeUpgrades);
    const challengeCost = challenge?.modifier.costMultiplier ?? 1;
    const owned = s.ownedItems[item.id] ?? 0;
    let totalCost = 0;
    let bought = 0;
    for (let i = 0; i < qty; i++) {
      const c = computeItemCost(item, owned + i, costRed, challengeCost);
      if (totalCost + c > s.magicules) break;
      totalCost += c;
      bought++;
    }
    if (bought === 0) return 0;
    set((state) => ({
      magicules: state.magicules - totalCost,
      ownedItems: {
        ...state.ownedItems,
        [item.id]: (state.ownedItems[item.id] ?? 0) + bought,
      },
    }));
    get().addEvent(`Acquired: ${item.emoji} ${item.name} ×${bought} (Lv.${get().ownedItems[item.id] ?? 0})`);
    return bought;
  },

  autoBuy: () => {
    const s = get();
    if (!s.autoBuyEnabled) return;
    // Find cheapest affordable item across all categories
    let cheapest: ShopItemDef | null = null;
    let cheapestCost = Infinity;
    const challenge = getActiveChallenge(s.activeChallenge);
    const costRed = computeCostReduction(s.prestigeUpgrades);
    const challengeCost = challenge?.modifier.costMultiplier ?? 1;
    for (const item of ALL_ITEMS) {
      const cost = computeItemCost(item, s.ownedItems[item.id] ?? 0, costRed, challengeCost);
      if (cost <= s.magicules && cost < cheapestCost) {
        cheapestCost = cost;
        cheapest = item;
      }
    }
    if (cheapest) {
      get().buyItem(cheapest);
    }
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
      const msg = `✦ EVOLVED into ${next.emoji} ${next.name}! (×${next.multiplier.toLocaleString()} multiplier)`;
      get().addEvent(msg);
      return next.name;
    }
    return null;
  },

  checkAchievements: () => {
    const s = get();
    const checkState = {
      totalClicks: s.totalClicks,
      lifetimeMagicules: s.lifetimeMagicules,
      evolutionIndex: s.evolutionIndex,
      ownedItems: s.ownedItems,
      prestigeCount: s.prestigeCount,
    };
    const newUnlocks: string[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!s.unlockedAchievements.includes(a.id) && a.check(checkState)) {
        newUnlocks.push(a.id);
      }
    }
    if (newUnlocks.length > 0) {
      set((st) => ({
        unlockedAchievements: [...st.unlockedAchievements, ...newUnlocks],
      }));
      for (const id of newUnlocks) {
        const a = ACHIEVEMENTS.find((x) => x.id === id)!;
        get().addEvent(`🏆 Achievement: ${a.emoji} ${a.name} — ${a.description}`);
      }
    }
    return newUnlocks;
  },

  buyPrestigeUpgrade: (upgrade: PrestigeUpgrade) => {
    const s = get();
    const level = s.prestigeUpgrades[upgrade.id] ?? 0;
    if (level >= upgrade.maxLevel) return false;
    const cost = get().getPrestigeUpgradeCost(upgrade);
    if (s.prestigePoints < cost) return false;
    set((st) => ({
      prestigePoints: st.prestigePoints - cost,
      prestigeUpgrades: { ...st.prestigeUpgrades, [upgrade.id]: level + 1 },
    }));
    get().addEvent(`✦ Prestige upgrade: ${upgrade.emoji} ${upgrade.name} → Lv.${level + 1}`);
    return true;
  },

  startChallenge: (challenge: Challenge) => {
    const s = get();
    if (s.activeChallenge || s.completedChallenges.includes(challenge.id)) return;
    const startMag = getStartMagicules(s.prestigeUpgrades);
    set({
      activeChallenge: challenge.id,
      challengeMagicules: 0,
      magicules: startMag,
      lifetimeMagicules: startMag,
      totalClicks: 0,
      evolutionIndex: 0,
      ownedItems: {},
    });
    get().addEvent(`⚔️ Challenge started: ${challenge.emoji} ${challenge.name}`);
  },

  abandonChallenge: () => {
    const startMag = getStartMagicules(get().prestigeUpgrades);
    set({
      activeChallenge: null, challengeMagicules: 0,
      magicules: startMag, lifetimeMagicules: startMag, totalClicks: 0, evolutionIndex: 0, ownedItems: {},
    });
    get().addEvent("Challenge abandoned. Progress reset.");
  },

  checkChallengeCompletion: () => {
    const s = get();
    if (!s.activeChallenge) return;
    const challenge = getActiveChallenge(s.activeChallenge);
    if (!challenge || s.challengeMagicules < challenge.goal) return;
    const startMag = getStartMagicules(get().prestigeUpgrades);
    set((st) => ({
      completedChallenges: [...st.completedChallenges, challenge.id],
      activeChallenge: null, challengeMagicules: 0,
      magicules: startMag, lifetimeMagicules: startMag, totalClicks: 0, evolutionIndex: 0, ownedItems: {},
    }));
    get().addEvent(`🏆 Challenge complete: ${challenge.emoji} ${challenge.name}! Permanent ×${challenge.reward.value} bonus!`);
  },

  startStorm: () => {
    const mult = 2 + Math.random() * 3; // 2x to 5x
    const duration = 10_000 + Math.random() * 20_000; // 10-30 seconds
    set({
      stormActive: true,
      stormMultiplier: Math.round(mult * 10) / 10,
      stormEndTime: Date.now() + duration,
    });
    get().addEvent(`🌀 Magicule Storm! ×${(Math.round(mult * 10) / 10)} income for ${Math.round(duration / 1000)}s!`);
  },

  toggleAutoBuy: () => {
    set((s) => ({ autoBuyEnabled: !s.autoBuyEnabled }));
  },

  save: () => {
    const s = get();
    const data = {
      magicules: s.magicules, lifetimeMagicules: s.lifetimeMagicules,
      totalClicks: s.totalClicks, evolutionIndex: s.evolutionIndex,
      ownedItems: s.ownedItems, eventLog: s.eventLog,
      lastSaveTime: Date.now(), startTime: s.startTime,
      prestigeCount: s.prestigeCount, prestigePoints: s.prestigePoints,
      prestigeUpgrades: s.prestigeUpgrades, unlockedAchievements: s.unlockedAchievements,
      completedChallenges: s.completedChallenges,
      activeChallenge: s.activeChallenge, challengeMagicules: s.challengeMagicules,
      autoBuyEnabled: s.autoBuyEnabled, totalCriticals: s.totalCriticals,
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
        magicules: data.magicules ?? 0, lifetimeMagicules: data.lifetimeMagicules ?? 0,
        totalClicks: data.totalClicks ?? 0, evolutionIndex: data.evolutionIndex ?? 0,
        ownedItems: data.ownedItems ?? {}, eventLog: data.eventLog ?? [],
        lastSaveTime: Date.now(), startTime: data.startTime ?? Date.now(),
        prestigeCount: data.prestigeCount ?? 0, prestigePoints: data.prestigePoints ?? 0,
        prestigeUpgrades: data.prestigeUpgrades ?? {},
        unlockedAchievements: data.unlockedAchievements ?? [],
        completedChallenges: data.completedChallenges ?? [],
        activeChallenge: data.activeChallenge ?? null,
        challengeMagicules: data.challengeMagicules ?? 0,
        autoBuyEnabled: data.autoBuyEnabled ?? false,
        totalCriticals: data.totalCriticals ?? 0,
      });
      return { offlineSeconds };
    } catch {
      return null;
    }
  },

  exportSave: () => {
    get().save();
    const raw = localStorage.getItem(SAVE_KEY);
    return btoa(raw ?? "{}");
  },

  importSave: (data: string) => {
    try {
      const json = atob(data.trim());
      JSON.parse(json); // validate
      localStorage.setItem(SAVE_KEY, json);
      get().load();
      get().addEvent("Save imported successfully!");
      return true;
    } catch {
      return false;
    }
  },

  reset: () => {
    localStorage.removeItem(SAVE_KEY);
    set(getInitialState());
  },

  prestige: () => {
    const s = get();
    if (s.evolutionIndex < 7) return;
    const newPrestige = s.prestigeCount + 1;
    const pointsEarned = Math.floor(1 + Math.pow(s.evolutionIndex - 6, 1.5) + Math.log10(Math.max(1, s.lifetimeMagicules)) * 0.5);
    const startMag = getStartMagicules(s.prestigeUpgrades);
    set({
      magicules: startMag, lifetimeMagicules: startMag,
      totalClicks: 0, evolutionIndex: 0, ownedItems: {},
      prestigeCount: newPrestige, prestigePoints: s.prestigePoints + pointsEarned,
      prestigeUpgrades: s.prestigeUpgrades,
      unlockedAchievements: s.unlockedAchievements,
      completedChallenges: s.completedChallenges,
      activeChallenge: null, challengeMagicules: 0,
      stormActive: false, stormMultiplier: 1, stormEndTime: 0,
      comboCount: 0, comboLastClick: 0,
      autoBuyEnabled: s.autoBuyEnabled,
      eventLog: [
        `✦ Reincarnated! Prestige ${newPrestige} — earned ${pointsEarned} prestige points!`,
        `Base multiplier: ×${(1 + newPrestige * 0.5).toFixed(1)}`,
      ],
      startTime: Date.now(), lastSaveTime: Date.now(),
    });
  },
}));
