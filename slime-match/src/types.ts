export type GemType = 'water' | 'fire' | 'nature' | 'lightning' | 'dark' | 'holy';

export type SpecialType = 'none' | 'line_h' | 'line_v' | 'bomb';

export interface Gem {
  id: number;
  type: GemType;
  special: SpecialType;
  row: number;
  col: number;
}

export interface Position {
  row: number;
  col: number;
}

export interface MatchResult {
  positions: Position[];
  isHorizontal: boolean;
  length: number;
}

export interface LevelConfig {
  level: number;
  targetScore: number;
  timeSeconds: number;
}

export interface GemDef {
  type: GemType;
  emoji: string;
  color: string;
  label: string;
}

export type Screen = 'title' | 'game';

export interface GameState {
  screen: Screen;
  currentLevel: number;
  unlockedLevel: number;
  highScores: Record<number, number>;
  setScreen: (screen: Screen) => void;
  setCurrentLevel: (level: number) => void;
  completeLevel: (level: number, score: number) => void;
}
