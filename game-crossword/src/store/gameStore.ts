import { create } from 'zustand';

export type Cell = {
  letter: string;
  number?: number;
};

export interface Clue {
  num: number;
  dir: 'across' | 'down';
  text: string;
}

export interface Puzzle {
  title: string;
  grid: Cell[][];
  clues: Clue[];
}

function makePuzzle(
  title: string,
  letters: string[][],
  clueData: { num: number; dir: 'across' | 'down'; text: string }[]
): Puzzle {
  const grid: Cell[][] = letters.map((row) => row.map((l) => ({ letter: l })));
  let n = 1;
  for (let c = 0; c < 5; c++) {
    grid[0][c].number = n++;
  }
  for (let r = 1; r < 5; r++) {
    grid[r][0].number = n++;
  }
  return { title, grid, clues: clueData };
}

export const PUZZLES: Puzzle[] = [
  makePuzzle(
    'Puzzle 1: Warm Start',
    [
      ['H', 'E', 'A', 'R', 'T'],
      ['E', 'M', 'B', 'E', 'R'],
      ['A', 'B', 'U', 'S', 'E'],
      ['R', 'E', 'S', 'I', 'N'],
      ['T', 'R', 'E', 'N', 'D'],
    ],
    [
      { num: 1, dir: 'across', text: 'Core of the body; beats with life' },
      { num: 6, dir: 'across', text: 'Glowing coal in a fire' },
      { num: 7, dir: 'across', text: 'To mistreat' },
      { num: 8, dir: 'across', text: 'Sticky tree sap' },
      { num: 9, dir: 'across', text: 'Latest fashion' },
      { num: 1, dir: 'down', text: 'Muscle that pumps blood' },
      { num: 2, dir: 'down', text: 'Hot coal from a fire' },
      { num: 3, dir: 'down', text: 'Treat badly' },
      { num: 4, dir: 'down', text: 'Tree sap product' },
      { num: 5, dir: 'down', text: 'Current style' },
    ]
  ),
  makePuzzle(
    'Puzzle 2: Aromatic',
    [
      ['S', 'A', 'T', 'E', 'D'],
      ['A', 'R', 'O', 'M', 'A'],
      ['T', 'O', 'K', 'E', 'N'],
      ['E', 'M', 'E', 'N', 'D'],
      ['D', 'A', 'N', 'D', 'Y'],
    ],
    [
      { num: 1, dir: 'across', text: 'Full after eating' },
      { num: 6, dir: 'across', text: 'Pleasant smell' },
      { num: 7, dir: 'across', text: 'Small symbol or reminder' },
      { num: 8, dir: 'across', text: 'To correct (a text)' },
      { num: 9, dir: 'across', text: 'Excellent; spiffy' },
      { num: 1, dir: 'down', text: 'Satisfied, fed up (well fed)' },
      { num: 2, dir: 'down', text: 'Nice scent' },
      { num: 3, dir: 'down', text: 'Keepsake' },
      { num: 4, dir: 'down', text: 'Revise, edit' },
      { num: 5, dir: 'down', text: 'First-rate' },
    ]
  ),
  makePuzzle(
    'Puzzle 3: Ironic',
    [
      ['S', 'I', 'S', 'A', 'L'],
      ['I', 'R', 'O', 'N', 'Y'],
      ['S', 'O', 'N', 'I', 'C'],
      ['A', 'N', 'I', 'S', 'E'],
      ['L', 'Y', 'C', 'E', 'E'],
    ],
    [
      { num: 1, dir: 'across', text: 'Fiber plant used for rope' },
      { num: 6, dir: 'across', text: 'Sarcasm; opposite meaning' },
      { num: 7, dir: 'across', text: 'Relating to sound' },
      { num: 8, dir: 'across', text: 'Licorice-flavored herb' },
      { num: 9, dir: 'across', text: 'French secondary school' },
      { num: 1, dir: 'down', text: 'Strong plant fiber' },
      { num: 2, dir: 'down', text: 'Figure of speech; opposite meaning' },
      { num: 3, dir: 'down', text: 'Of or using sound' },
      { num: 4, dir: 'down', text: 'Aromatic herb, flavor of ouzo' },
      { num: 5, dir: 'down', text: 'French high school' },
    ]
  ),
];

interface GameState {
  puzzleIdx: number;
  values: string[][];
  cursor: { row: number; col: number; dir: 'across' | 'down' };
  solved: boolean;
  setValue: (r: number, c: number, v: string) => void;
  setCursor: (r: number, c: number) => void;
  toggleDir: () => void;
  check: () => boolean;
  loadPuzzle: (idx: number) => void;
  reveal: () => void;
  clear: () => void;
}

const emptyGrid = () =>
  Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ''));

export const useGameStore = create<GameState>((set, get) => ({
  puzzleIdx: 0,
  values: emptyGrid(),
  cursor: { row: 0, col: 0, dir: 'across' },
  solved: false,
  setValue: (r, c, v) => {
    const s = get();
    const upper = v.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
    const next = s.values.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? upper : cell))
    );
    let { row, col, dir } = s.cursor;
    if (upper) {
      if (dir === 'across' && col < 4) col += 1;
      else if (dir === 'down' && row < 4) row += 1;
    }
    set({ values: next, cursor: { row, col, dir } });
  },
  setCursor: (r, c) => {
    const s = get();
    set({ cursor: { ...s.cursor, row: r, col: c } });
  },
  toggleDir: () => {
    const s = get();
    set({
      cursor: {
        ...s.cursor,
        dir: s.cursor.dir === 'across' ? 'down' : 'across',
      },
    });
  },
  check: () => {
    const s = get();
    const puzzle = PUZZLES[s.puzzleIdx];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (s.values[r][c] !== puzzle.grid[r][c].letter) return false;
      }
    }
    set({ solved: true });
    return true;
  },
  loadPuzzle: (idx) =>
    set({
      puzzleIdx: idx % PUZZLES.length,
      values: emptyGrid(),
      cursor: { row: 0, col: 0, dir: 'across' },
      solved: false,
    }),
  reveal: () => {
    const s = get();
    const puzzle = PUZZLES[s.puzzleIdx];
    set({
      values: puzzle.grid.map((row) => row.map((c) => c.letter)),
      solved: true,
    });
  },
  clear: () =>
    set({
      values: emptyGrid(),
      solved: false,
    }),
}));
