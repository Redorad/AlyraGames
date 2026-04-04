import { create } from "zustand";
import { EVOLUTIONS } from "../data/evolutions";
import { SKILLS, ShopItemDef } from "../data/skills";
import { SUBORDINATES } from "../data/subordinates";
import { BUILDINGS } from "../data/buildings";
import { ACHIEVEMENTS } from "../data/achievements";
import { PRESTIGE_UPGRADES, PrestigeUpgrade } from "../data/prestigeUpgrades";
import { CHALLENGES, Challenge } from "../data/challenges";
import { SYNERGIES } from "../data/synergies";
import { ARTIFACTS } from "../data/artifacts";
import { ASCENSION_UPGRADES } from "../data/ascension";
import { recordPrestigeRun } from "../components/LeaderboardPanel";
import { SKILL_TREE } from "../data/skillTree";
import { EQUIPMENT } from "../data/equipment";
import { WORLD_MAP } from "../data/worldMap";
import { RESEARCH_TREE } from "../data/research";

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
  autoPrestigeEnabled: boolean;
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
  toggleAutoPrestige: () => void;
  autoPrestige: () => void;
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
    autoPrestigeEnabled: false,
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

function computeSynergyMult(ownedItems: Record<string, number>, type: "all_mult" | "passive_mult" | "click_mult"): number {
  let mult = 1;
  for (const syn of SYNERGIES) {
    if (syn.effect.type !== type) continue;
    if (syn.requires.every((id) => (ownedItems[id] ?? 0) > 0)) mult *= syn.effect.value;
  }
  return mult;
}

function computeArtifactMult(ownedArtifacts: string[], type: string): number {
  let value = type === "crit_chance" || type === "cost_reduction" ? 0 : 1;
  for (const artId of ownedArtifacts) {
    const art = ARTIFACTS.find((a) => a.id === artId);
    if (!art || art.effect.type !== type) continue;
    if (type === "crit_chance" || type === "cost_reduction") value += art.effect.value;
    else value *= art.effect.value;
  }
  return value;
}

// Extra store artifact list accessor (lazy loaded from localStorage)
function getOwnedArtifacts(): string[] {
  try {
    const raw = localStorage.getItem("slime-idle-extra");
    if (!raw) return [];
    return JSON.parse(raw).ownedArtifacts ?? [];
  } catch { return []; }
}

// Ascension bonus accessor (lazy loaded from localStorage)
function getAscensionBonus(type: string): number {
  try {
    const raw = localStorage.getItem("slime-idle-extra");
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const upgrades: Record<string, number> = data.ascensionUpgrades ?? {};
    let value = 0;
    for (const u of ASCENSION_UPGRADES) {
      if (u.effect.type !== type) continue;
      const level = upgrades[u.id] ?? 0;
      if (level > 0) value += u.effect.valuePerLevel * level;
    }
    return value;
  } catch { return 0; }
}

// Skill tree bonus accessor (from localStorage)
function getSkillTreeBonus(type: string): number {
  try {
    const raw = localStorage.getItem("slime-idle-skilltree");
    if (!raw) return 0;
    const levels: Record<string, number> = JSON.parse(raw);
    let value = 0;
    for (const node of SKILL_TREE) {
      if (node.effect.type !== type) continue;
      const level = levels[node.id] ?? 0;
      if (level > 0) value += node.effect.value * level;
    }
    return value;
  } catch { return 0; }
}

// World map passive bonus accessor (from localStorage)
function getWorldMapBonus(): number {
  try {
    const raw = localStorage.getItem("slime-idle-worldmap");
    if (!raw) return 1;
    const discovered: string[] = JSON.parse(raw);
    let mult = 1;
    for (const loc of WORLD_MAP) {
      if (discovered.includes(loc.id)) mult *= loc.passiveBonus;
    }
    return mult;
  } catch { return 1; }
}

// Equipment bonus accessor (from localStorage)
function getEquipmentBonus(type: string): number {
  try {
    const raw = localStorage.getItem("slime-idle-equipment");
    if (!raw) return type === "cost_reduction" || type === "crit_chance" ? 0 : 1;
    const data = JSON.parse(raw);
    const equipped: Record<string, string | null> = data.equipped ?? {};
    let value = type === "cost_reduction" || type === "crit_chance" ? 0 : 1;
    for (const slot of Object.values(equipped)) {
      if (!slot) continue;
      const item = EQUIPMENT.find((e) => e.id === slot);
      if (!item || item.effect.type !== type) continue;
      if (type === "cost_reduction" || type === "crit_chance") value += item.effect.value;
      else value *= 1 + item.effect.value;
    }
    return value;
  } catch { return type === "cost_reduction" || type === "crit_chance" ? 0 : 1; }
}

// Research bonus accessor (from localStorage)
function getResearchBonus(type: string): number {
  try {
    const raw = localStorage.getItem("slime-idle-research");
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const completed: string[] = data.completed ?? [];
    let value = 0;
    for (const r of RESEARCH_TREE) {
      if (r.effect.type !== type || !completed.includes(r.id)) continue;
      value += r.effect.value;
    }
    return value;
  } catch { return 0; }
}

function computeItemCost(item: ShopItemDef, owned: number, costRed: number, challengeCost: number): number {
  const artCostRed = 1 - computeArtifactMult(getOwnedArtifacts(), "cost_reduction");
  const stCostRed = 1 - getSkillTreeBonus("cost_reduction") / 100; // skill tree uses value: 5 meaning 5%
  const eqCostRed = 1 - getEquipmentBonus("cost_reduction");
  const resCostRed = 1 - getResearchBonus("cost_reduction");
  const base = Math.floor(item.baseCost * Math.pow(COST_SCALE, owned));
  return Math.max(1, Math.floor(base * costRed * challengeCost * Math.max(0.1, artCostRed) * Math.max(0.1, stCostRed) * Math.max(0.1, eqCostRed) * Math.max(0.1, resCostRed)));
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
    const synAll = computeSynergyMult(s.ownedItems, "all_mult");
    const synClick = computeSynergyMult(s.ownedItems, "click_mult");
    const arts = getOwnedArtifacts();
    const artAll = computeArtifactMult(arts, "all_mult");
    const artClick = computeArtifactMult(arts, "click_mult");
    const ascAll = 1 + getAscensionBonus("all_mult");
    // New systems bonuses
    const stClick = 1 + getSkillTreeBonus("click_mult");
    const stAll = 1 + getSkillTreeBonus("all_mult");
    const worldMap = getWorldMapBonus();
    const eqClick = getEquipmentBonus("click_mult");
    const eqAll = getEquipmentBonus("all_mult");
    const resClick = 1 + getResearchBonus("click_mult");
    const resAll = 1 + getResearchBonus("all_mult");
    return base * evoMult * prestigeAll * prestigeClick * achClick * achAll * challengeMult * activeMult * stormMult * synAll * synClick * artAll * artClick * ascAll * stClick * stAll * worldMap * eqClick * eqAll * resClick * resAll;
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
    const synAll = computeSynergyMult(s.ownedItems, "all_mult");
    const synPassive = computeSynergyMult(s.ownedItems, "passive_mult");
    const arts = getOwnedArtifacts();
    const artAll = computeArtifactMult(arts, "all_mult");
    const artPassive = computeArtifactMult(arts, "passive_mult");
    const ascAll = 1 + getAscensionBonus("all_mult");
    const stPassive = 1 + getSkillTreeBonus("passive_mult");
    const stAll = 1 + getSkillTreeBonus("all_mult");
    const worldMap = getWorldMapBonus();
    const eqPassive = getEquipmentBonus("passive_mult");
    const eqAll = getEquipmentBonus("all_mult");
    const resPassive = 1 + getResearchBonus("passive_mult");
    const resAll = 1 + getResearchBonus("all_mult");
    return base * evoMult * prestigeAll * prestigePassive * achPassive * achAll * challengeMult * activeMult * stormMult * synAll * synPassive * artAll * artPassive * ascAll * stPassive * stAll * worldMap * eqPassive * eqAll * resPassive * resAll;
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
    return mult * (1 + getResearchBonus("offline_mult"));
  },

  getComboMultiplier: () => {
    const s = get();
    if (s.comboCount <= 1) return 1;
    // Combo multiplier: +5% per combo, max 3x
    return Math.min(3, 1 + (s.comboCount - 1) * 0.05);
  },

  getCritChance: () => {
    const s = get();
    const artBonus = computeArtifactMult(getOwnedArtifacts(), "crit_chance");
    const stCrit = getSkillTreeBonus("crit_chance");
    const eqCrit = getEquipmentBonus("crit_chance");
    const resCrit = getResearchBonus("crit_chance");
    return Math.min(0.75, 0.05 + s.prestigeCount * 0.02 + artBonus + stCrit + eqCrit + resCrit);
  },

  getCritMultiplier: () => {
    const s = get();
    const artMult = computeArtifactMult(getOwnedArtifacts(), "crit_mult");
    const stCritMult = 1 + getSkillTreeBonus("crit_mult");
    const eqCritMult = getEquipmentBonus("crit_mult");
    return Math.min(20, (3 + s.prestigeCount * 0.5) * artMult * stCritMult * eqCritMult);
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
    const challenge = getActiveChallenge(s.activeChallenge);
    const costRed = computeCostReduction(s.prestigeUpgrades);
    const challengeCost = challenge?.modifier.costMultiplier ?? 1;

    // Buy all affordable items in rounds until nothing more can be bought
    let budget = s.magicules;
    const newOwned = { ...s.ownedItems };
    let totalSpent = 0;
    let totalBought = 0;
    let bought = true;
    while (bought) {
      bought = false;
      for (const item of ALL_ITEMS) {
        const owned = newOwned[item.id] ?? 0;
        const cost = computeItemCost(item, owned, costRed, challengeCost);
        if (cost <= budget) {
          newOwned[item.id] = owned + 1;
          budget -= cost;
          totalSpent += cost;
          totalBought++;
          bought = true;
        }
      }
    }
    if (totalBought > 0) {
      set({ magicules: s.magicules - totalSpent, ownedItems: newOwned });
      if (totalBought > 1) {
        get().addEvent(`Auto-buy: purchased ${totalBought} upgrades.`);
      }
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

  toggleAutoPrestige: () => {
    set((s) => ({ autoPrestigeEnabled: !s.autoPrestigeEnabled }));
  },

  autoPrestige: () => {
    const s = get();
    if (!s.autoPrestigeEnabled) return;
    if (s.evolutionIndex < 7) return;
    get().prestige();
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
    recordPrestigeRun();
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
      autoPrestigeEnabled: s.autoPrestigeEnabled,
      eventLog: [
        `✦ Reincarnated! Prestige ${newPrestige} — earned ${pointsEarned} prestige points!`,
        `Base multiplier: ×${(1 + newPrestige * 0.5).toFixed(1)}`,
      ],
      startTime: Date.now(), lastSaveTime: Date.now(),
    });
  },
}));
