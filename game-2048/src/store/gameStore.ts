import { create } from 'zustand';

// ── Tile configuration ──────────────────────
export interface TileConfig {
  emoji: string;
  bg: string;
  text: string;
}

export const TILE_CONFIG: Record<number, TileConfig> = {
  2:    { emoji: '\uD83E\uDEE7', bg: '#1e3a5f', text: '#7ec8e3' },    // bubble
  4:    { emoji: '\uD83D\uDCA7', bg: '#1a3550', text: '#60a5fa' },     // droplet
  8:    { emoji: '\uD83D\uDD35', bg: '#1e3060', text: '#3b82f6' },     // blue circle
  16:   { emoji: '\uD83D\uDFE2', bg: '#1a4030', text: '#22c55e' },     // green circle
  32:   { emoji: '\uD83D\uDFE1', bg: '#3d3520', text: '#eab308' },     // yellow circle
  64:   { emoji: '\uD83D\uDFE0', bg: '#4a2a10', text: '#f97316' },     // orange circle
  128:  { emoji: '\uD83D\uDD34', bg: '#4a1520', text: '#ef4444' },     // red circle
  256:  { emoji: '\uD83D\uDFE3', bg: '#3a1a50', text: '#a78bfa' },     // purple circle
  512:  { emoji: '\u2B50',       bg: '#4a3a10', text: '#fbbf24' },     // star
  1024: { emoji: '\uD83D\uDC51', bg: '#4a3510', text: '#f59e0b' },     // crown
  2048: { emoji: '\uD83C\uDFC6', bg: '#3a2a10', text: '#fcd34d' },     // trophy
};

export function getTileConfig(value: number): TileConfig {
  return TILE_CONFIG[value] ?? { emoji: '\uD83C\uDFC6', bg: '#2a1a30', text: '#e879f9' };
}

// ── Types ───────────────────────────────────
export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerged: boolean;
}

type Grid = (Tile | null)[][];
type Direction = 'up' | 'down' | 'left' | 'right';

interface GameState {
  grid: Grid;
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
  keepPlaying: boolean;
  nextId: number;
  // Actions
  init: () => void;
  move: (dir: Direction) => void;
  continueGame: () => void;
}

const SIZE = 4;
const BEST_SCORE_KEY = '2048-slime-best';

function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(v: number) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(v));
  } catch { /* ignore */ }
}

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function cloneGrid(g: Grid): Grid {
  return g.map(row => row.map(t => (t ? { ...t, isNew: false, isMerged: false } : null)));
}

function emptyCells(g: Grid): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!g[r][c]) cells.push([r, c]);
  return cells;
}

function addRandom(g: Grid, nextId: number): number {
  const cells = emptyCells(g);
  if (cells.length === 0) return nextId;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  g[r][c] = { id: nextId, value, row: r, col: c, isNew: true, isMerged: false };
  return nextId + 1;
}

function canMove(g: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!g[r][c]) return true;
      const v = g[r][c]!.value;
      if (c + 1 < SIZE && g[r][c + 1]?.value === v) return true;
      if (r + 1 < SIZE && g[r + 1]?.[c]?.value === v) return true;
    }
  }
  return false;
}

function hasWon(g: Grid): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (g[r][c]?.value === 2048) return true;
  return false;
}

interface MoveResult {
  grid: Grid;
  score: number;
  moved: boolean;
  nextId: number;
}

function slideAndMerge(line: (Tile | null)[], nextId: number): { tiles: (Tile | null)[]; scored: number; newNextId: number } {
  // Filter non-null
  const filtered = line.filter(Boolean) as Tile[];
  const result: (Tile | null)[] = Array(SIZE).fill(null);
  let scored = 0;
  let pos = 0;
  let nid = nextId;

  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i].value === filtered[i + 1].value) {
      const merged = filtered[i].value * 2;
      scored += merged;
      result[pos] = { id: nid++, value: merged, row: 0, col: 0, isNew: false, isMerged: true };
      i++; // skip next
    } else {
      result[pos] = { ...filtered[i], isNew: false, isMerged: false };
    }
    pos++;
  }

  return { tiles: result, scored, newNextId: nid };
}

function moveGrid(g: Grid, dir: Direction, currentNextId: number): MoveResult {
  const newGrid = cloneGrid(g);
  let score = 0;
  let moved = false;
  let nextId = currentNextId;

  for (let i = 0; i < SIZE; i++) {
    let line: (Tile | null)[] = [];

    // Extract line
    if (dir === 'left') {
      line = newGrid[i].slice();
    } else if (dir === 'right') {
      line = newGrid[i].slice().reverse();
    } else if (dir === 'up') {
      for (let r = 0; r < SIZE; r++) line.push(newGrid[r][i]);
    } else {
      for (let r = SIZE - 1; r >= 0; r--) line.push(newGrid[r][i]);
    }

    const { tiles, scored, newNextId } = slideAndMerge(line, nextId);
    score += scored;
    nextId = newNextId;

    // Write back
    if (dir === 'left') {
      for (let c = 0; c < SIZE; c++) {
        const t = tiles[c];
        if (t) { t.row = i; t.col = c; }
        if (newGrid[i][c]?.id !== t?.id || newGrid[i][c]?.value !== t?.value) moved = true;
        newGrid[i][c] = t;
      }
    } else if (dir === 'right') {
      for (let c = 0; c < SIZE; c++) {
        const t = tiles[SIZE - 1 - c];
        if (t) { t.row = i; t.col = c; }
        if (newGrid[i][c]?.id !== t?.id || newGrid[i][c]?.value !== t?.value) moved = true;
        newGrid[i][c] = t;
      }
    } else if (dir === 'up') {
      for (let r = 0; r < SIZE; r++) {
        const t = tiles[r];
        if (t) { t.row = r; t.col = i; }
        if (newGrid[r][i]?.id !== t?.id || newGrid[r][i]?.value !== t?.value) moved = true;
        newGrid[r][i] = t;
      }
    } else {
      for (let r = 0; r < SIZE; r++) {
        const t = tiles[SIZE - 1 - r];
        if (t) { t.row = r; t.col = i; }
        if (newGrid[r][i]?.id !== t?.id || newGrid[r][i]?.value !== t?.value) moved = true;
        newGrid[r][i] = t;
      }
    }
  }

  return { grid: newGrid, score, moved, nextId };
}

export const useGameStore = create<GameState>((set, get) => ({
  grid: emptyGrid(),
  score: 0,
  bestScore: loadBest(),
  gameOver: false,
  won: false,
  keepPlaying: false,
  nextId: 1,

  init: () => {
    const g = emptyGrid();
    let nid = 1;
    nid = addRandom(g, nid);
    nid = addRandom(g, nid);
    set({ grid: g, score: 0, gameOver: false, won: false, keepPlaying: false, nextId: nid });
  },

  move: (dir: Direction) => {
    const { grid, score, gameOver, won, keepPlaying, nextId } = get();
    if (gameOver) return;
    if (won && !keepPlaying) return;

    const result = moveGrid(grid, dir, nextId);
    if (!result.moved) return;

    let nid = addRandom(result.grid, result.nextId);
    const newScore = score + result.score;
    const newBest = Math.max(newScore, get().bestScore);
    saveBest(newBest);

    const isOver = !canMove(result.grid);
    const isWon = !keepPlaying && hasWon(result.grid);

    set({
      grid: result.grid,
      score: newScore,
      bestScore: newBest,
      gameOver: isOver,
      won: isWon,
      nextId: nid,
    });
  },

  continueGame: () => {
    set({ won: false, keepPlaying: true });
  },
}));
