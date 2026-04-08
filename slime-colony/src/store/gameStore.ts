import { create } from 'zustand';
import { GameState, Resources, BuildingInstance, Citizen } from '../types';
import { getBuildingDef, BUILDING_DEFS } from '../data/buildings';
import { getRandomEvent } from '../data/events';
import { playAssignSound, playBuildSound, playEventSound, playMilestoneSound } from '../utils/sounds';

const SAVE_KEY = 'slime-colony-save';

const SLIME_NAMES = [
  'Rimuru', 'Shion', 'Shuna', 'Benimaru', 'Souei', 'Hakurou',
  'Gobta', 'Rigurd', 'Rigur', 'Kaijin', 'Geld', 'Gabiru',
  'Ranga', 'Treyni', 'Milim', 'Veldora', 'Diablo', 'Testarossa',
  'Ultima', 'Carrera', 'Zegion', 'Apito', 'Kumara', 'Adalman',
  'Wenti', 'Albert', 'Beretta', 'Moss', 'Gabil', 'Sufia',
  'Albis', 'Phobio', 'Grucius', 'Mjurran', 'Youm', 'Kirara',
  'Razen', 'Hinata', 'Luminous', 'Chloe', 'Shizue', 'Eren',
  'Alice', 'Gale', 'Kenya', 'Ryota', 'Clayman', 'Laplace',
];

let nameIndex = 0;

function getNextName(): string {
  const name = SLIME_NAMES[nameIndex % SLIME_NAMES.length];
  nameIndex++;
  if (nameIndex > SLIME_NAMES.length) {
    return `${name} ${Math.floor(nameIndex / SLIME_NAMES.length)}`;
  }
  return name;
}

function createCitizen(): Citizen {
  return {
    id: `citizen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: getNextName(),
    assignedTo: null,
  };
}

const INITIAL_RESOURCES: Resources = {
  food: 100,
  wood: 40,
  stone: 30,
  magicules: 5,
  gold: 20,
};

function canAfford(resources: Resources, cost: Partial<Resources>): boolean {
  for (const [key, value] of Object.entries(cost)) {
    if ((resources[key as keyof Resources] || 0) < (value || 0)) return false;
  }
  return true;
}

function subtractCost(resources: Resources, cost: Partial<Resources>): Resources {
  const result = { ...resources };
  for (const [key, value] of Object.entries(cost)) {
    result[key as keyof Resources] -= value || 0;
  }
  return result;
}

function computeStats(buildings: BuildingInstance[], citizens?: Citizen[]) {
  let totalPopulationCap = 5; // base capacity
  let totalDefense = 0;
  let totalSoldiers = 0;
  let totalStorageCap = 500; // base storage
  let taverneCount = 0;

  for (const b of buildings) {
    const def = getBuildingDef(b.defId);
    if (!def) continue;
    if (def.populationCap) totalPopulationCap += def.populationCap * b.level;
    if (def.defense) totalDefense += def.defense * b.level;
    if (def.soldiers) totalSoldiers += b.assignedWorkers.length;
    if (def.storageCap) totalStorageCap += def.storageCap * b.level;
    if (def.id === 'taverne') taverneCount++;
  }

  return { totalPopulationCap, totalDefense, totalSoldiers, totalStorageCap, taverneCount };
}

function computeHappiness(buildings: BuildingInstance[], citizens: Citizen[], food: number): number {
  const { taverneCount } = computeStats(buildings);
  const idleCount = citizens.filter((c) => !c.assignedTo).length;
  let happiness = 50 + taverneCount * 10 + (food > 50 ? 10 : 0) - idleCount * 5;
  happiness = Math.max(0, Math.min(100, happiness));
  return happiness;
}

function getHappinessMultiplier(happiness: number): number {
  if (happiness < 30) return 0.5;
  if (happiness > 70) return 1.2;
  return 1;
}

// Event timing: between 30 and 60 ticks (seconds)
const MIN_EVENT_INTERVAL = 30;
const MAX_EVENT_INTERVAL = 60;
function nextEventInterval(): number {
  return MIN_EVENT_INTERVAL + Math.floor(Math.random() * (MAX_EVENT_INTERVAL - MIN_EVENT_INTERVAL));
}

const MILESTONES = [10, 25, 50, 100];

export function hasSaveData(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'title',
  resources: { ...INITIAL_RESOURCES },
  buildings: [],
  citizens: [],
  eventLog: [],
  totalPopulationCap: 5,
  totalDefense: 0,
  totalSoldiers: 0,
  totalStorageCap: 500,
  happiness: 50,
  milestones: [],
  tickCount: 0,
  lastEventTick: 0,
  eventLogCounter: 0,
  saveIndicator: false,
  autoUpgradeEnabled: false,

  toggleAutoUpgrade: () => {
    set((s) => ({ autoUpgradeEnabled: !s.autoUpgradeEnabled }));
  },

  startGame: () => {
    nameIndex = 0;
    // Create 5 initial citizens
    const initialCitizens = Array.from({ length: 5 }, () => createCitizen());
    // Start with 1 farm already built, with 1 worker assigned
    const farmDef = BUILDING_DEFS.find((d) => d.id === 'ferme')!;
    const farmBuilding: BuildingInstance = {
      id: `building-${Date.now()}-initial-farm`,
      defId: farmDef.id,
      level: 1,
      assignedWorkers: [initialCitizens[0].id],
      gridX: 4,
      gridY: 3,
      constructing: false,
      constructionEnd: 0,
    };
    // Mark the first citizen as assigned to the farm
    initialCitizens[0] = { ...initialCitizens[0], assignedTo: farmBuilding.id };

    const initialBuildings = [farmBuilding];
    const stats = computeStats(initialBuildings, initialCitizens);
    const happiness = computeHappiness(initialBuildings, initialCitizens, INITIAL_RESOURCES.food);

    // Clear any old save
    try { localStorage.removeItem(SAVE_KEY); } catch { /* noop */ }

    set({
      phase: 'playing',
      resources: { ...INITIAL_RESOURCES },
      buildings: initialBuildings,
      citizens: initialCitizens,
      eventLog: [],
      milestones: [],
      tickCount: 0,
      lastEventTick: 0,
      eventLogCounter: 0,
      saveIndicator: false,
      happiness,
      ...stats,
    });
  },

  loadSave: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const save = JSON.parse(raw);
      // Restore nameIndex so new citizens get unique names
      nameIndex = save.nameIndex || 0;
      const buildings = save.buildings || [];
      const citizens = save.citizens || [];
      const resources = save.resources || { ...INITIAL_RESOURCES };
      const stats = computeStats(buildings, citizens);
      const happiness = computeHappiness(buildings, citizens, resources.food);
      set({
        phase: 'playing',
        resources,
        buildings,
        citizens,
        eventLog: save.eventLog || [],
        milestones: save.milestones || [],
        tickCount: save.tickCount || 0,
        lastEventTick: save.lastEventTick || 0,
        eventLogCounter: save.eventLogCounter || 0,
        saveIndicator: false,
        happiness,
        ...stats,
      });
      return true;
    } catch {
      return false;
    }
  },

  clearSave: () => {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* noop */ }
  },

  tick: () => {
    const state = get();
    if (state.phase !== 'playing') return;

    const newResources = { ...state.resources };
    let newLog = [...state.eventLog];
    let logCounter = state.eventLogCounter;

    // Calculate happiness multiplier
    const happiness = computeHappiness(state.buildings, state.citizens, state.resources.food);
    const happinessMult = getHappinessMultiplier(happiness);

    // Check construction timers
    const now = Date.now();
    let newBuildings = state.buildings.map((b) => {
      if (b.constructing && now >= b.constructionEnd) {
        return { ...b, constructing: false, constructionEnd: 0 };
      }
      return b;
    });

    // Production from buildings (skip constructing buildings)
    for (const b of newBuildings) {
      if (b.constructing) continue;
      const def = getBuildingDef(b.defId);
      if (!def) continue;
      const workerCount = b.assignedWorkers.length;
      if (workerCount === 0) continue;

      if (def.production) {
        for (const [res, amount] of Object.entries(def.production)) {
          newResources[res as keyof Resources] += (amount || 0) * workerCount * b.level * happinessMult;
        }
      }

      if (def.converts) {
        const convertAmount = def.converts.rate * workerCount * b.level * happinessMult;
        if (newResources[def.converts.from] >= convertAmount) {
          newResources[def.converts.from] -= convertAmount;
          newResources[def.converts.to] += convertAmount;
        }
      }
    }

    // Food consumption: 0.3 food per citizen per tick
    const foodConsumed = state.citizens.length * 0.3;
    newResources.food = Math.max(0, newResources.food - foodConsumed);

    const newTickCount = state.tickCount + 1;

    // Random events
    let newLastEventTick = state.lastEventTick;
    if (newTickCount - state.lastEventTick >= nextEventInterval()) {
      const event = getRandomEvent();
      const changes = event.effect(state);
      if (changes.resources) {
        Object.assign(newResources, changes.resources);
      }
      logCounter++;
      newLog = [
        { id: logCounter, timestamp: Date.now(), text: `${event.title}: ${event.description}`, emoji: event.emoji },
        ...newLog,
      ].slice(0, 20);
      newLastEventTick = newTickCount;
      playEventSound();
    }

    // Population growth: if food > 20 + 2 per citizen and under pop cap
    const stats = computeStats(newBuildings, state.citizens);
    let newCitizens = [...state.citizens];
    if (
      newResources.food > 20 + state.citizens.length * 2 &&
      state.citizens.length < stats.totalPopulationCap &&
      newTickCount % 15 === 0
    ) {
      const newCitizen = createCitizen();
      newCitizens = [...newCitizens, newCitizen];
      logCounter++;
      newLog = [
        { id: logCounter, timestamp: Date.now(), text: `${newCitizen.name} a rejoint Tempest!`, emoji: '🎉' },
        ...newLog,
      ].slice(0, 20);
    }

    // Milestone checks
    let newMilestones = [...state.milestones];
    for (const m of MILESTONES) {
      if (newCitizens.length >= m && !newMilestones.includes(m)) {
        newMilestones = [...newMilestones, m];
        logCounter++;
        newLog = [
          {
            id: logCounter,
            timestamp: Date.now(),
            text: `Tempest atteint ${m} habitants! La ville grandit!`,
            emoji: '🏆',
          },
          ...newLog,
        ].slice(0, 20);
        playMilestoneSound();
      }
    }

    // Auto-upgrade every 5 ticks if enabled
    if (state.autoUpgradeEnabled && newTickCount % 5 === 0) {
      // Defer to after state is set
      setTimeout(() => get().autoUpgradeBuildings(), 0);
    }

    // Show save indicator every 10 ticks
    const showSaveIndicator = newTickCount % 10 === 0;

    const updatedHappiness = computeHappiness(newBuildings, newCitizens, newResources.food);

    set({
      resources: newResources,
      buildings: newBuildings,
      tickCount: newTickCount,
      lastEventTick: newLastEventTick,
      eventLog: newLog,
      citizens: newCitizens,
      milestones: newMilestones,
      eventLogCounter: logCounter,
      saveIndicator: showSaveIndicator,
      happiness: updatedHappiness,
      ...stats,
    });

    // Persist to localStorage after every tick
    try {
      const updated = get();
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        resources: updated.resources,
        buildings: updated.buildings,
        citizens: updated.citizens,
        eventLog: updated.eventLog,
        milestones: updated.milestones,
        tickCount: updated.tickCount,
        lastEventTick: updated.lastEventTick,
        eventLogCounter: updated.eventLogCounter,
        nameIndex,
      }));
    } catch { /* storage full or unavailable */ }

    // Clear save indicator after a short delay
    if (showSaveIndicator) {
      setTimeout(() => {
        set({ saveIndicator: false });
      }, 1500);
    }
  },

  buildBuilding: (defId: string, gridX: number, gridY: number) => {
    const state = get();
    const def = BUILDING_DEFS.find((d) => d.id === defId);
    if (!def) return;
    if (!canAfford(state.resources, def.cost)) return;

    // Check if cell is already occupied
    const occupied = state.buildings.some((b) => b.gridX === gridX && b.gridY === gridY);
    if (occupied) return;

    const newResources = subtractCost(state.resources, def.cost);
    const newBuilding: BuildingInstance = {
      id: `building-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      defId: def.id,
      level: 1,
      assignedWorkers: [],
      gridX,
      gridY,
      constructing: true,
      constructionEnd: Date.now() + 5000,
    };

    const newBuildings = [...state.buildings, newBuilding];
    const stats = computeStats(newBuildings, state.citizens);

    let logCounter = state.eventLogCounter + 1;
    const newLog = [
      { id: logCounter, timestamp: Date.now(), text: `${def.emoji} ${def.name} en construction...`, emoji: '🔨' },
      ...state.eventLog,
    ].slice(0, 20);

    playBuildSound();

    set({
      resources: newResources,
      buildings: newBuildings,
      eventLog: newLog,
      eventLogCounter: logCounter,
      ...stats,
    });
  },

  upgradeBuilding: (buildingId: string) => {
    const state = get();
    const building = state.buildings.find((b) => b.id === buildingId);
    if (!building) return;
    const def = getBuildingDef(building.defId);
    if (!def) return;

    // Check max level
    if (building.level >= 3) return;

    // Check if a forge exists
    const hasForge = state.buildings.some((b) => b.defId === 'forge');
    if (!hasForge) return;

    // Upgrade cost = original cost * current level (to go to next level)
    const upgradeCost: Partial<Resources> = {};
    for (const [key, value] of Object.entries(def.cost)) {
      upgradeCost[key as keyof Resources] = (value || 0) * (building.level + 1);
    }

    if (!canAfford(state.resources, upgradeCost)) return;

    const newResources = subtractCost(state.resources, upgradeCost);
    const newBuildings = state.buildings.map((b) =>
      b.id === buildingId ? { ...b, level: b.level + 1 } : b
    );
    const stats = computeStats(newBuildings, state.citizens);

    let logCounter = state.eventLogCounter + 1;
    const stars = '⭐'.repeat(building.level + 1);
    const newLog = [
      { id: logCounter, timestamp: Date.now(), text: `${def.emoji} ${def.name} ameliore! ${stars}`, emoji: '⬆️' },
      ...state.eventLog,
    ].slice(0, 20);

    playBuildSound();

    set({
      resources: newResources,
      buildings: newBuildings,
      eventLog: newLog,
      eventLogCounter: logCounter,
      ...stats,
    });
  },

  assignWorker: (citizenId: string, buildingId: string) => {
    const state = get();
    const building = state.buildings.find((b) => b.id === buildingId);
    if (!building) return;
    const def = getBuildingDef(building.defId);
    if (!def) return;
    if (building.assignedWorkers.length >= def.maxWorkers) return;

    const citizen = state.citizens.find((c) => c.id === citizenId);
    if (!citizen) return;

    // Unassign from previous building if any
    let newBuildings = state.buildings.map((b) => ({
      ...b,
      assignedWorkers: b.assignedWorkers.filter((w) => w !== citizenId),
    }));

    // Assign to new building
    newBuildings = newBuildings.map((b) =>
      b.id === buildingId ? { ...b, assignedWorkers: [...b.assignedWorkers, citizenId] } : b
    );

    const newCitizens = state.citizens.map((c) =>
      c.id === citizenId ? { ...c, assignedTo: buildingId } : c
    );

    const stats = computeStats(newBuildings, newCitizens);

    set({
      buildings: newBuildings,
      citizens: newCitizens,
      ...stats,
    });
  },

  unassignWorker: (citizenId: string) => {
    const state = get();

    const newBuildings = state.buildings.map((b) => ({
      ...b,
      assignedWorkers: b.assignedWorkers.filter((w) => w !== citizenId),
    }));

    const newCitizens = state.citizens.map((c) =>
      c.id === citizenId ? { ...c, assignedTo: null } : c
    );

    const stats = computeStats(newBuildings, newCitizens);

    set({
      buildings: newBuildings,
      citizens: newCitizens,
      ...stats,
    });
  },

  autoAssignWorkers: () => {
    const state = get();
    const idleCitizens = state.citizens.filter((c) => !c.assignedTo);
    if (idleCitizens.length === 0) return;

    let newBuildings = state.buildings.map((b) => ({ ...b, assignedWorkers: [...b.assignedWorkers] }));
    let newCitizens = [...state.citizens];
    let assigned = 0;

    // Sort buildings: farms first, then others
    const sortedBuildings = [...newBuildings].sort((a, b) => {
      if (a.defId === 'ferme' && b.defId !== 'ferme') return -1;
      if (a.defId !== 'ferme' && b.defId === 'ferme') return 1;
      return 0;
    });

    for (const building of sortedBuildings) {
      const def = getBuildingDef(building.defId);
      if (!def || def.maxWorkers === 0) continue;

      const bRef = newBuildings.find((b) => b.id === building.id)!;
      while (bRef.assignedWorkers.length < def.maxWorkers) {
        const idle = newCitizens.find((c) => !c.assignedTo);
        if (!idle) break;

        bRef.assignedWorkers.push(idle.id);
        newCitizens = newCitizens.map((c) =>
          c.id === idle.id ? { ...c, assignedTo: building.id } : c
        );
        assigned++;
      }
    }

    if (assigned === 0) return;

    const stats = computeStats(newBuildings, newCitizens);
    playAssignSound();

    set({
      buildings: newBuildings,
      citizens: newCitizens,
      ...stats,
    });
  },

  autoUpgradeBuildings: () => {
    const state = get();
    const hasForge = state.buildings.some((b) => b.defId === 'forge');
    if (!hasForge) return;

    for (const building of state.buildings) {
      if (building.level >= 3) continue;
      const def = getBuildingDef(building.defId);
      if (!def) continue;

      const upgradeCost: Partial<Resources> = {};
      for (const [key, value] of Object.entries(def.cost)) {
        upgradeCost[key as keyof Resources] = (value || 0) * (building.level + 1);
      }

      if (canAfford(get().resources, upgradeCost)) {
        get().upgradeBuilding(building.id);
        return; // One upgrade per tick to avoid draining all resources
      }
    }
  },

  addEvent: (text: string, emoji: string) => {
    const state = get();
    const logCounter = state.eventLogCounter + 1;
    set({
      eventLog: [
        { id: logCounter, timestamp: Date.now(), text, emoji },
        ...state.eventLog,
      ].slice(0, 20),
      eventLogCounter: logCounter,
    });
  },

  getProductionRates: () => {
    const state = get();
    const rates: Resources = { food: 0, wood: 0, stone: 0, magicules: 0, gold: 0 };
    const happiness = computeHappiness(state.buildings, state.citizens, state.resources.food);
    const happinessMult = getHappinessMultiplier(happiness);

    for (const b of state.buildings) {
      if (b.constructing) continue;
      const def = getBuildingDef(b.defId);
      if (!def) continue;
      const workerCount = b.assignedWorkers.length;
      if (workerCount === 0) continue;

      if (def.production) {
        for (const [res, amount] of Object.entries(def.production)) {
          rates[res as keyof Resources] += (amount || 0) * workerCount * b.level * happinessMult;
        }
      }

      if (def.converts) {
        const convertAmount = def.converts.rate * workerCount * b.level * happinessMult;
        rates[def.converts.from] -= convertAmount;
        rates[def.converts.to] += convertAmount;
      }
    }

    // Food consumption
    rates.food -= state.citizens.length * 0.3;

    return rates;
  },
}));
