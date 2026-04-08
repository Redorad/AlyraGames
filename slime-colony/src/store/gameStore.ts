import { create } from 'zustand';
import { GameState, Resources, BuildingInstance, Citizen } from '../types';
import { getBuildingDef, BUILDING_DEFS } from '../data/buildings';
import { getRandomEvent } from '../data/events';
import { playBuildSound, playEventSound, playMilestoneSound } from '../utils/sounds';

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

function computeStats(buildings: BuildingInstance[]) {
  let totalPopulationCap = 5; // base capacity
  let totalDefense = 0;
  let totalSoldiers = 0;

  for (const b of buildings) {
    const def = getBuildingDef(b.defId);
    if (!def) continue;
    if (def.populationCap) totalPopulationCap += def.populationCap * b.level;
    if (def.defense) totalDefense += def.defense * b.level;
    if (def.soldiers) totalSoldiers += b.assignedWorkers.length;
  }

  return { totalPopulationCap, totalDefense, totalSoldiers };
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
  milestones: [],
  tickCount: 0,
  lastEventTick: 0,
  eventLogCounter: 0,
  saveIndicator: false,

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
    };
    // Mark the first citizen as assigned to the farm
    initialCitizens[0] = { ...initialCitizens[0], assignedTo: farmBuilding.id };

    const initialBuildings = [farmBuilding];
    const stats = computeStats(initialBuildings);

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
      const stats = computeStats(save.buildings || []);
      set({
        phase: 'playing',
        resources: save.resources || { ...INITIAL_RESOURCES },
        buildings: save.buildings || [],
        citizens: save.citizens || [],
        eventLog: save.eventLog || [],
        milestones: save.milestones || [],
        tickCount: save.tickCount || 0,
        lastEventTick: save.lastEventTick || 0,
        eventLogCounter: save.eventLogCounter || 0,
        saveIndicator: false,
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

    // Production from buildings
    for (const b of state.buildings) {
      const def = getBuildingDef(b.defId);
      if (!def) continue;
      const workerCount = b.assignedWorkers.length;
      if (workerCount === 0) continue;

      if (def.production) {
        for (const [res, amount] of Object.entries(def.production)) {
          newResources[res as keyof Resources] += (amount || 0) * workerCount * b.level;
        }
      }

      if (def.converts) {
        const convertAmount = def.converts.rate * workerCount * b.level;
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
    const stats = computeStats(state.buildings);
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

    // Show save indicator every 10 ticks
    const showSaveIndicator = newTickCount % 10 === 0;

    set({
      resources: newResources,
      tickCount: newTickCount,
      lastEventTick: newLastEventTick,
      eventLog: newLog,
      citizens: newCitizens,
      milestones: newMilestones,
      eventLogCounter: logCounter,
      saveIndicator: showSaveIndicator,
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

  buildBuilding: (defId: string) => {
    const state = get();
    const def = BUILDING_DEFS.find((d) => d.id === defId);
    if (!def) return;
    if (!canAfford(state.resources, def.cost)) return;

    const newResources = subtractCost(state.resources, def.cost);
    const newBuilding: BuildingInstance = {
      id: `building-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      defId: def.id,
      level: 1,
      assignedWorkers: [],
    };

    const newBuildings = [...state.buildings, newBuilding];
    const stats = computeStats(newBuildings);

    let logCounter = state.eventLogCounter + 1;
    const newLog = [
      { id: logCounter, timestamp: Date.now(), text: `${def.emoji} ${def.name} construit!`, emoji: '🔨' },
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

    const stats = computeStats(newBuildings);

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

    const stats = computeStats(newBuildings);

    set({
      buildings: newBuildings,
      citizens: newCitizens,
      ...stats,
    });
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
}));
