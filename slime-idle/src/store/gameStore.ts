import { create } from "zustand";
import { EVOLUTIONS } from "../data/evolutions";
import { SKILLS, ShopItemDef } from "../data/skills";
import { SUBORDINATES } from "../data/subordinates";
import { BUILDINGS } from "../data/buildings";
import { ACHIEVEMENTS, Achievement } from "../data/achievements";
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

  // Derived
  getClickPower: () => number;
  getPassivePower: () => number;
  getEvolutionMultiplier: () => number;
  getItemCost: (item: ShopItemDef) => number;
  getPrestigeUpgradeCost: (upgrade: PrestigeUpgrade) => number;
  getAchievementMultiplier: (type: "click_mult" | "passive_mult" | "all_mult") => number;
  getChallengeMultiplier: () => number;
  getOfflineMultiplier: () => number;

  // Actions
  click: () => void;
  tick: (dt: number) => void;
  buyItem: (item: ShopItemDef) => boolean;
  addEvent: (msg: string) => void;
  checkEvolution: () => string | null;
  checkAchievements: () => void;
  buyPrestigeUpgrade: (upgrade: PrestigeUpgrade) => boolean;
  startChallenge: (challenge: Challenge) => void;
  abandonChallenge: () => void;
  checkChallengeCompletion: () => void;
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
    prestigeCount: 0,
    prestigePoints: 0,
    prestigeUpgrades: {} as Record<string, number>,
    unlockedAchievements: [] as string[],
    completedChallenges: [] as string[],
    activeChallenge: null as string | null,
    challengeMagicules: 0,
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

function computePrestigeMultiplier(prestigeCount: number, prestigeUpgrades: Record<string, number>, type: "all"): number {
  let mult = 1 + prestigeCount * 0.5; // base prestige bonus
  for (const u of PRESTIGE_UPGRADES) {
    const level = prestigeUpgrades[u.id] ?? 0;
    if (level <= 0) continue;
    if (u.effect.type === "all_mult") mult *= 1 + u.effect.valuePerLevel * level;
  }
  if (type === "all") return mult;
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
      return 1 - (u.effect.valuePerLevel * level) / 100;
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

export const useGameStore = create<GameState>((set, get) => ({
  ...getInitialState(),

  getClickPower: () => {
    const s = get();
    const challenge = getActiveChallenge(s.activeChallenge);
    if (challenge?.modifier.clickDisabled) return 0;
    const base = computeClickPower(s.ownedItems);
    const evoMult = EVOLUTIONS[s.evolutionIndex]?.multiplier ?? 1;
    const prestigeAll = computePrestigeMultiplier(s.prestigeCount, s.prestigeUpgrades, "all");
    const prestigeClick = computePrestigeTypeMult(s.prestigeUpgrades, "click_mult");
    const achClick = computeAchievementMult(s.unlockedAchievements, "click_mult");
    const achAll = computeAchievementMult(s.unlockedAchievements, "all_mult");
    const challengeMult = computeChallengeMult(s.completedChallenges);
    const activeMult = challenge?.modifier.clickMultiplier ?? 1;
    return base * evoMult * prestigeAll * prestigeClick * achClick * achAll * challengeMult * activeMult;
  },

  getPassivePower: () => {
    const s = get();
    const challenge = getActiveChallenge(s.activeChallenge);
    const base = computePassivePower(s.ownedItems);
    const evoMult = EVOLUTIONS[s.evolutionIndex]?.multiplier ?? 1;
    const prestigeAll = computePrestigeMultiplier(s.prestigeCount, s.prestigeUpgrades, "all");
    const prestigePassive = computePrestigeTypeMult(s.prestigeUpgrades, "passive_mult");
    const achPassive = computeAchievementMult(s.unlockedAchievements, "passive_mult");
    const achAll = computeAchievementMult(s.unlockedAchievements, "all_mult");
    const challengeMult = computeChallengeMult(s.completedChallenges);
    const activeMult = challenge?.modifier.passiveMultiplier ?? 1;
    return base * evoMult * prestigeAll * prestigePassive * achPassive * achAll * challengeMult * activeMult;
  },

  getEvolutionMultiplier: () => {
    const s = get();
    return (EVOLUTIONS[s.evolutionIndex]?.multiplier ?? 1) * computePrestigeMultiplier(s.prestigeCount, s.prestigeUpgrades, "all");
  },

  getItemCost: (item: ShopItemDef) => {
    const s = get();
    const challenge = getActiveChallenge(s.activeChallenge);
    const base = Math.floor(item.baseCost * Math.pow(COST_SCALE, s.ownedItems[item.id] ?? 0));
    const costRed = computeCostReduction(s.prestigeUpgrades);
    const challengeCost = challenge?.modifier.costMultiplier ?? 1;
    return Math.max(1, Math.floor(base * costRed * challengeCost));
  },

  getPrestigeUpgradeCost: (upgrade: PrestigeUpgrade) => {
    const s = get();
    const level = s.prestigeUpgrades[upgrade.id] ?? 0;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costScale, level));
  },

  getAchievementMultiplier: (type) => {
    return computeAchievementMult(get().unlockedAchievements, type);
  },

  getChallengeMultiplier: () => {
    return computeChallengeMult(get().completedChallenges);
  },

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

  click: () => {
    const s = get();
    const challenge = getActiveChallenge(s.activeChallenge);
    if (challenge?.modifier.clickDisabled) return;
    const clickPower = get().getClickPower();
    set((st) => ({
      magicules: st.magicules + clickPower,
      lifetimeMagicules: st.lifetimeMagicules + clickPower,
      totalClicks: st.totalClicks + 1,
      challengeMagicules: st.activeChallenge ? st.challengeMagicules + clickPower : st.challengeMagicules,
    }));
  },

  tick: (dt: number) => {
    const passivePower = get().getPassivePower();
    if (passivePower <= 0) return;
    const earned = passivePower * dt;
    set((s) => ({
      magicules: s.magicules + earned,
      lifetimeMagicules: s.lifetimeMagicules + earned,
      challengeMagicules: s.activeChallenge ? s.challengeMagicules + earned : s.challengeMagicules,
    }));
  },

  buyItem: (item: ShopItemDef) => {
    const s = get();
    const cost = get().getItemCost(item);
    if (s.magicules < cost) return false;
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
  },

  buyPrestigeUpgrade: (upgrade: PrestigeUpgrade) => {
    const s = get();
    const level = s.prestigeUpgrades[upgrade.id] ?? 0;
    if (level >= upgrade.maxLevel) return false;
    const cost = get().getPrestigeUpgradeCost(upgrade);
    if (s.prestigePoints < cost) return false;
    set((st) => ({
      prestigePoints: st.prestigePoints - cost,
      prestigeUpgrades: {
        ...st.prestigeUpgrades,
        [upgrade.id]: level + 1,
      },
    }));
    get().addEvent(`✦ Prestige upgrade: ${upgrade.emoji} ${upgrade.name} → Lv.${level + 1}`);
    return true;
  },

  startChallenge: (challenge: Challenge) => {
    const s = get();
    if (s.activeChallenge) return;
    if (s.completedChallenges.includes(challenge.id)) return;
    // Save current non-challenge state and start fresh run
    set({
      activeChallenge: challenge.id,
      challengeMagicules: 0,
      magicules: 0,
      lifetimeMagicules: 0,
      totalClicks: 0,
      evolutionIndex: 0,
      ownedItems: {},
    });
    get().addEvent(`⚔️ Challenge started: ${challenge.emoji} ${challenge.name}`);
  },

  abandonChallenge: () => {
    set({
      activeChallenge: null,
      challengeMagicules: 0,
      magicules: 0,
      lifetimeMagicules: 0,
      totalClicks: 0,
      evolutionIndex: 0,
      ownedItems: {},
    });
    get().addEvent("Challenge abandoned. Progress reset.");
  },

  checkChallengeCompletion: () => {
    const s = get();
    if (!s.activeChallenge) return;
    const challenge = getActiveChallenge(s.activeChallenge);
    if (!challenge) return;
    if (s.challengeMagicules >= challenge.goal) {
      set((st) => ({
        completedChallenges: [...st.completedChallenges, challenge.id],
        activeChallenge: null,
        challengeMagicules: 0,
        magicules: 0,
        lifetimeMagicules: 0,
        totalClicks: 0,
        evolutionIndex: 0,
        ownedItems: {},
      }));
      get().addEvent(`🏆 Challenge complete: ${challenge.emoji} ${challenge.name}! Permanent ×${challenge.reward.value} bonus!`);
    }
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
      prestigeCount: s.prestigeCount,
      prestigePoints: s.prestigePoints,
      prestigeUpgrades: s.prestigeUpgrades,
      unlockedAchievements: s.unlockedAchievements,
      completedChallenges: s.completedChallenges,
      activeChallenge: s.activeChallenge,
      challengeMagicules: s.challengeMagicules,
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
        prestigeCount: data.prestigeCount ?? 0,
        prestigePoints: data.prestigePoints ?? 0,
        prestigeUpgrades: data.prestigeUpgrades ?? {},
        unlockedAchievements: data.unlockedAchievements ?? [],
        completedChallenges: data.completedChallenges ?? [],
        activeChallenge: data.activeChallenge ?? null,
        challengeMagicules: data.challengeMagicules ?? 0,
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
    if (s.evolutionIndex < 7) return; // Must reach Ultimate Slime (index 7)
    const newPrestige = s.prestigeCount + 1;
    // Exponential prestige points: more for later prestiges
    const pointsEarned = Math.floor(1 + Math.pow(s.evolutionIndex - 6, 1.5) + Math.log10(Math.max(1, s.lifetimeMagicules)) * 0.5);
    // Head Start magicules
    let startMag = 0;
    for (const u of PRESTIGE_UPGRADES) {
      const level = s.prestigeUpgrades[u.id] ?? 0;
      if (level > 0 && u.effect.type === "start_magicules") {
        startMag = u.effect.valuePerLevel * level * Math.pow(10, Math.floor(level / 5));
      }
    }
    set({
      magicules: startMag,
      lifetimeMagicules: startMag,
      totalClicks: 0,
      evolutionIndex: 0,
      ownedItems: {},
      prestigeCount: newPrestige,
      prestigePoints: s.prestigePoints + pointsEarned,
      // Keep these across prestige:
      prestigeUpgrades: s.prestigeUpgrades,
      unlockedAchievements: s.unlockedAchievements,
      completedChallenges: s.completedChallenges,
      activeChallenge: null,
      challengeMagicules: 0,
      eventLog: [
        `✦ Reincarnated! Prestige ${newPrestige} — earned ${pointsEarned} prestige points!`,
        `Base multiplier: ×${(1 + newPrestige * 0.5).toFixed(1)}`,
      ],
      startTime: Date.now(),
      lastSaveTime: Date.now(),
    });
  },
}));
