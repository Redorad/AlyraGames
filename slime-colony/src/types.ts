export interface Resources {
  food: number;
  wood: number;
  stone: number;
  magicules: number;
  gold: number;
}

export type ResourceKey = keyof Resources;

export interface BuildingDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: Partial<Resources>;
  maxWorkers: number;
  production?: Partial<Resources>;
  populationCap?: number;
  defense?: number;
  soldiers?: number;
  unlocks?: string;
  converts?: { from: ResourceKey; to: ResourceKey; rate: number };
  storageCap?: number;
}

export interface BuildingInstance {
  id: string;
  defId: string;
  level: number;
  assignedWorkers: string[];
  gridX: number;
  gridY: number;
  constructing: boolean;
  constructionEnd: number;
}

export interface Citizen {
  id: string;
  name: string;
  assignedTo: string | null;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  emoji: string;
  effect: (state: GameState) => Partial<GameState>;
}

export interface EventLogEntry {
  id: number;
  timestamp: number;
  text: string;
  emoji: string;
}

export type GamePhase = 'title' | 'playing';

export interface GameState {
  phase: GamePhase;
  resources: Resources;
  buildings: BuildingInstance[];
  citizens: Citizen[];
  eventLog: EventLogEntry[];
  totalPopulationCap: number;
  totalDefense: number;
  totalSoldiers: number;
  totalStorageCap: number;
  happiness: number;
  milestones: number[];
  tickCount: number;
  lastEventTick: number;
  eventLogCounter: number;
  saveIndicator: boolean;
  startGame: () => void;
  loadSave: () => boolean;
  clearSave: () => void;
  tick: () => void;
  buildBuilding: (defId: string, gridX?: number, gridY?: number) => void;
  upgradeBuilding: (buildingId: string) => void;
  assignWorker: (citizenId: string, buildingId: string) => void;
  unassignWorker: (citizenId: string) => void;
  autoAssignWorkers: () => void;
  autoUpgradeBuildings: () => void;
  addEvent: (text: string, emoji: string) => void;
  getProductionRates: () => Partial<Resources>;
  autoUpgradeEnabled: boolean;
  toggleAutoUpgrade: () => void;
}
