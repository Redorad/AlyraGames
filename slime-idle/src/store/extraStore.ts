import { create } from "zustand";
import { BOSSES, Boss } from "../data/bosses";
import { ARTIFACTS, Artifact, rollArtifact } from "../data/artifacts";
import { DUNGEONS, Dungeon } from "../data/dungeons";
import { DAILY_QUESTS, MILESTONE_QUESTS, QuestCheckState } from "../data/quests";
import { SYNERGIES } from "../data/synergies";
import { getDailyReward } from "../data/dailyRewards";
import { ASCENSION_UPGRADES } from "../data/ascension";
import { useGameStore } from "./gameStore";

const EXTRA_SAVE_KEY = "slime-idle-extra";

export interface BossFight {
  bossId: string;
  hpRemaining: number;
  maxHp: number;
  timeRemaining: number;
  startTime: number;
}

export interface DungeonRun {
  dungeonId: string;
  startTime: number;
  endTime: number;
}

export interface ExtraState {
  // Boss
  bossesDefeated: string[];
  activeBoss: BossFight | null;
  bossCooldownEnd: number;

  // Artifacts
  ownedArtifacts: string[];

  // Dungeons
  activeDungeon: DungeonRun | null;
  dungeonsCompleted: number;

  // Quests
  completedQuests: string[];
  dailyQuestClicks: number;
  lastDailyReset: number;

  // Daily login
  loginStreak: number;
  lastLoginDay: string;
  pendingDailyReward: boolean;

  // Sound
  soundEnabled: boolean;

  // Ascension
  ascensionCount: number;
  ascensionPoints: number;
  ascensionUpgrades: Record<string, number>;

  // Actions
  startBoss: (boss: Boss) => void;
  hitBoss: () => { damage: number; defeated: boolean };
  tickBoss: (dt: number) => void;
  startDungeon: (dungeon: Dungeon) => void;
  checkDungeon: () => { completed: boolean; reward?: string };
  checkQuests: () => string[];
  claimDailyReward: () => void;
  checkDailyLogin: () => void;
  getSynergyMultiplier: (type: "all_mult" | "passive_mult" | "click_mult") => number;
  getArtifactBonus: (type: string) => number;
  getAscensionBonus: (type: string) => number;
  buyAscensionUpgrade: (upgradeId: string) => void;
  ascend: () => void;
  toggleSound: () => void;
  saveExtra: () => void;
  loadExtra: () => void;
  resetExtra: () => void;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getInitialExtra() {
  return {
    bossesDefeated: [] as string[],
    activeBoss: null as BossFight | null,
    bossCooldownEnd: 0,
    ownedArtifacts: [] as string[],
    activeDungeon: null as DungeonRun | null,
    dungeonsCompleted: 0,
    completedQuests: [] as string[],
    dailyQuestClicks: 0,
    lastDailyReset: Date.now(),
    loginStreak: 0,
    lastLoginDay: "",
    pendingDailyReward: false,
    soundEnabled: true,
    ascensionCount: 0,
    ascensionPoints: 0,
    ascensionUpgrades: {} as Record<string, number>,
  };
}

export const useExtraStore = create<ExtraState>((set, get) => ({
  ...getInitialExtra(),

  startBoss: (boss: Boss) => {
    const s = get();
    if (s.activeBoss) return;
    if (Date.now() < s.bossCooldownEnd) return;
    set({
      activeBoss: {
        bossId: boss.id,
        hpRemaining: boss.hp,
        maxHp: boss.hp,
        timeRemaining: boss.timeLimit,
        startTime: Date.now(),
      },
    });
    useGameStore.getState().addEvent(`⚔️ Boss fight: ${boss.emoji} ${boss.name}!`);
  },

  hitBoss: () => {
    const s = get();
    if (!s.activeBoss) return { damage: 0, defeated: false };
    const clickPower = useGameStore.getState().getClickPower();
    const comboMult = useGameStore.getState().getComboMultiplier();
    const damage = clickPower * comboMult * 0.01; // Scale down for boss HP
    const newHp = Math.max(0, s.activeBoss.hpRemaining - damage);
    const defeated = newHp <= 0;

    if (defeated) {
      const boss = BOSSES.find((b) => b.id === s.activeBoss!.bossId)!;
      const newDefeated = [...s.bossesDefeated];
      if (!newDefeated.includes(boss.id)) newDefeated.push(boss.id);

      // Roll artifact
      let newArtifacts = [...s.ownedArtifacts];
      let artifactMsg = "";
      if (Math.random() < boss.reward.artifactChance) {
        const art = rollArtifact(s.ownedArtifacts);
        if (art) {
          newArtifacts.push(art.id);
          artifactMsg = ` Found artifact: ${art.emoji} ${art.name}!`;
        }
      }

      // Give magicule reward
      const gs = useGameStore.getState();
      const reward = boss.reward.magicules * (gs.getEvolutionMultiplier());
      gs.addEvent(`🏆 Defeated ${boss.emoji} ${boss.name}! +${reward.toLocaleString()} magicules!${artifactMsg}`);
      useGameStore.setState((st) => ({
        magicules: st.magicules + reward,
        lifetimeMagicules: st.lifetimeMagicules + reward,
      }));

      set({
        activeBoss: null,
        bossesDefeated: newDefeated,
        ownedArtifacts: newArtifacts,
        bossCooldownEnd: Date.now() + 30_000, // 30s cooldown
      });
      return { damage, defeated: true };
    }

    set({
      activeBoss: { ...s.activeBoss, hpRemaining: newHp },
    });
    return { damage, defeated: false };
  },

  tickBoss: (dt: number) => {
    const s = get();
    if (!s.activeBoss) return;
    const elapsed = (Date.now() - s.activeBoss.startTime) / 1000;
    const boss = BOSSES.find((b) => b.id === s.activeBoss!.bossId);
    if (!boss) return;
    const remaining = boss.timeLimit - elapsed;
    if (remaining <= 0) {
      useGameStore.getState().addEvent(`💀 Failed to defeat ${boss.emoji} ${boss.name} in time.`);
      set({ activeBoss: null, bossCooldownEnd: Date.now() + 15_000 });
      return;
    }
    set({ activeBoss: { ...s.activeBoss, timeRemaining: remaining } });
  },

  startDungeon: (dungeon: Dungeon) => {
    const s = get();
    if (s.activeDungeon) return;
    // Check ally count
    const gs = useGameStore.getState();
    const allyIds = ["gobta", "ranga", "shion", "benimaru", "shuna", "souei", "diablo", "veldora", "guy_crimson", "chloe", "velgrynd", "veldanava", "ivarage"];
    const totalAllies = allyIds.reduce((sum, id) => sum + (gs.ownedItems[id] ?? 0), 0);
    if (totalAllies < dungeon.requiredAllies) return;

    set({
      activeDungeon: {
        dungeonId: dungeon.id,
        startTime: Date.now(),
        endTime: Date.now() + dungeon.duration * 1000,
      },
    });
    gs.addEvent(`🕳️ Expedition started: ${dungeon.emoji} ${dungeon.name} (${Math.floor(dungeon.duration / 60)}m)`);
  },

  checkDungeon: () => {
    const s = get();
    if (!s.activeDungeon) return { completed: false };
    if (Date.now() < s.activeDungeon.endTime) return { completed: false };

    const dungeon = DUNGEONS.find((d) => d.id === s.activeDungeon!.dungeonId);
    if (!dungeon) { set({ activeDungeon: null }); return { completed: false }; }

    const gs = useGameStore.getState();
    const passivePerSec = gs.getPassivePower();
    const magReward = passivePerSec * dungeon.reward.magiculesMult;

    // Roll artifact
    let newArtifacts = [...s.ownedArtifacts];
    let artifactMsg = "";
    if (Math.random() < dungeon.reward.artifactChance) {
      const art = rollArtifact(s.ownedArtifacts);
      if (art) {
        newArtifacts.push(art.id);
        artifactMsg = ` Found: ${art.emoji} ${art.name}!`;
      }
    }

    useGameStore.setState((st) => ({
      magicules: st.magicules + magReward,
      lifetimeMagicules: st.lifetimeMagicules + magReward,
    }));
    gs.addEvent(`🕳️ Expedition complete! ${dungeon.emoji} ${dungeon.name} — +${magReward.toLocaleString()} magicules!${artifactMsg}`);

    set({
      activeDungeon: null,
      dungeonsCompleted: s.dungeonsCompleted + 1,
      ownedArtifacts: newArtifacts,
    });
    return { completed: true, reward: `+${magReward.toLocaleString()}${artifactMsg}` };
  },

  checkQuests: () => {
    const s = get();
    const gs = useGameStore.getState();
    const checkState: QuestCheckState = {
      totalClicks: gs.totalClicks,
      clicksThisSession: s.dailyQuestClicks,
      lifetimeMagicules: gs.lifetimeMagicules,
      ownedItems: gs.ownedItems,
      evolutionIndex: gs.evolutionIndex,
      bossesDefeated: s.bossesDefeated,
      dungeonsCompleted: s.dungeonsCompleted,
    };

    const newCompleted: string[] = [];
    const allQuests = [...DAILY_QUESTS, ...MILESTONE_QUESTS];
    for (const q of allQuests) {
      if (!s.completedQuests.includes(q.id) && q.check(checkState)) {
        newCompleted.push(q.id);
        if (q.reward.magicules) {
          const scaled = q.reward.magicules * (gs.getEvolutionMultiplier());
          useGameStore.setState((st) => ({
            magicules: st.magicules + scaled,
            lifetimeMagicules: st.lifetimeMagicules + scaled,
          }));
          gs.addEvent(`📋 Quest done: ${q.emoji} ${q.name} — +${scaled.toLocaleString()} magicules!`);
        }
      }
    }

    if (newCompleted.length > 0) {
      set((st) => ({ completedQuests: [...st.completedQuests, ...newCompleted] }));
    }
    return newCompleted;
  },

  checkDailyLogin: () => {
    const s = get();
    const today = getToday();
    if (s.lastLoginDay === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const newStreak = s.lastLoginDay === yesterdayStr ? s.loginStreak + 1 : 1;
    set({
      loginStreak: newStreak,
      lastLoginDay: today,
      pendingDailyReward: true,
      // Reset daily quests
      dailyQuestClicks: 0,
      completedQuests: s.completedQuests.filter((id) => !DAILY_QUESTS.some((dq) => dq.id === id)),
    });
  },

  claimDailyReward: () => {
    const s = get();
    if (!s.pendingDailyReward) return;
    const reward = getDailyReward(s.loginStreak);
    const gs = useGameStore.getState();
    const passivePerSec = Math.max(1, gs.getPassivePower());
    const magReward = passivePerSec * reward.reward.magiculesMult;

    useGameStore.setState((st) => ({
      magicules: st.magicules + magReward,
      lifetimeMagicules: st.lifetimeMagicules + magReward,
      prestigePoints: st.prestigePoints + (reward.reward.prestigePoints ?? 0),
    }));
    gs.addEvent(`${reward.emoji} Day ${s.loginStreak} login reward! +${magReward.toLocaleString()} magicules${reward.reward.prestigePoints ? ` +${reward.reward.prestigePoints} prestige pts` : ""}!`);
    set({ pendingDailyReward: false });
  },

  getSynergyMultiplier: (type) => {
    const gs = useGameStore.getState();
    let mult = 1;
    for (const syn of SYNERGIES) {
      if (syn.effect.type !== type) continue;
      const active = syn.requires.every((id) => (gs.ownedItems[id] ?? 0) > 0);
      if (active) mult *= syn.effect.value;
    }
    return mult;
  },

  getArtifactBonus: (type: string) => {
    const s = get();
    let value = type === "crit_chance" || type === "cost_reduction" ? 0 : 1;
    for (const artId of s.ownedArtifacts) {
      const art = ARTIFACTS.find((a) => a.id === artId);
      if (!art || art.effect.type !== type) continue;
      if (type === "crit_chance" || type === "cost_reduction") {
        value += art.effect.value;
      } else {
        value *= art.effect.value;
      }
    }
    return value;
  },

  getAscensionBonus: (type: string) => {
    const s = get();
    let value = 0;
    for (const upgrade of ASCENSION_UPGRADES) {
      if (upgrade.effect.type !== type) continue;
      const level = s.ascensionUpgrades[upgrade.id] ?? 0;
      if (level > 0) value += upgrade.effect.valuePerLevel * level;
    }
    return value;
  },

  buyAscensionUpgrade: (upgradeId: string) => {
    const s = get();
    const upgrade = ASCENSION_UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return;
    const level = s.ascensionUpgrades[upgradeId] ?? 0;
    if (level >= upgrade.maxLevel) return;
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costScale, level));
    if (s.ascensionPoints < cost) return;
    set({
      ascensionPoints: s.ascensionPoints - cost,
      ascensionUpgrades: { ...s.ascensionUpgrades, [upgradeId]: level + 1 },
    });
    useGameStore.getState().addEvent(`🌌 Ascension upgrade: ${upgrade.emoji} ${upgrade.name} → Lv.${level + 1}`);
  },

  ascend: () => {
    const gs = useGameStore.getState();
    const s = get();
    if (gs.prestigeCount < 10) return;
    const pointsEarned = Math.floor(1 + Math.pow(Math.max(0, gs.prestigeCount - 9), 1.3));
    // Reset game store to initial state (full reset except achievements)
    useGameStore.setState({
      magicules: 0, lifetimeMagicules: 0, totalClicks: 0, evolutionIndex: 0,
      ownedItems: {}, prestigeCount: 0, prestigePoints: 0, prestigeUpgrades: {},
      completedChallenges: [], activeChallenge: null, challengeMagicules: 0,
      autoBuyEnabled: false, stormActive: false, stormMultiplier: 1, stormEndTime: 0,
      comboCount: 0, comboLastClick: 0, totalCriticals: 0,
      eventLog: [`🌌 Ascended! Ascension ${s.ascensionCount + 1} — earned ${pointsEarned} AP!`],
      startTime: Date.now(), lastSaveTime: Date.now(),
    });
    // Reset extra state but keep ascension upgrades
    set({
      bossesDefeated: [], activeBoss: null, bossCooldownEnd: 0,
      ownedArtifacts: [], activeDungeon: null, dungeonsCompleted: 0,
      completedQuests: [], dailyQuestClicks: 0,
      ascensionCount: s.ascensionCount + 1,
      ascensionPoints: s.ascensionPoints + pointsEarned,
    });
  },

  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  saveExtra: () => {
    const s = get();
    const data = {
      bossesDefeated: s.bossesDefeated,
      bossCooldownEnd: s.bossCooldownEnd,
      ownedArtifacts: s.ownedArtifacts,
      activeDungeon: s.activeDungeon,
      dungeonsCompleted: s.dungeonsCompleted,
      completedQuests: s.completedQuests,
      dailyQuestClicks: s.dailyQuestClicks,
      lastDailyReset: s.lastDailyReset,
      loginStreak: s.loginStreak,
      lastLoginDay: s.lastLoginDay,
      soundEnabled: s.soundEnabled,
      ascensionCount: s.ascensionCount,
      ascensionPoints: s.ascensionPoints,
      ascensionUpgrades: s.ascensionUpgrades,
    };
    localStorage.setItem(EXTRA_SAVE_KEY, JSON.stringify(data));
  },

  loadExtra: () => {
    const raw = localStorage.getItem(EXTRA_SAVE_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      set({
        bossesDefeated: d.bossesDefeated ?? [],
        bossCooldownEnd: d.bossCooldownEnd ?? 0,
        ownedArtifacts: d.ownedArtifacts ?? [],
        activeDungeon: d.activeDungeon ?? null,
        dungeonsCompleted: d.dungeonsCompleted ?? 0,
        completedQuests: d.completedQuests ?? [],
        dailyQuestClicks: d.dailyQuestClicks ?? 0,
        lastDailyReset: d.lastDailyReset ?? Date.now(),
        loginStreak: d.loginStreak ?? 0,
        lastLoginDay: d.lastLoginDay ?? "",
        soundEnabled: d.soundEnabled ?? true,
        ascensionCount: d.ascensionCount ?? 0,
        ascensionPoints: d.ascensionPoints ?? 0,
        ascensionUpgrades: d.ascensionUpgrades ?? {},
      });
    } catch {}
  },

  resetExtra: () => {
    localStorage.removeItem(EXTRA_SAVE_KEY);
    set(getInitialExtra());
  },
}));
