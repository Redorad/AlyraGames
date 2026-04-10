import { create } from 'zustand';

export type Cell = {
  letter: string; // solution
  number?: number; // clue number
  black?: boolean;
};

export interface Clue {
  num: number;
  dir: 'across' | 'down';
  text: string;
  row: number;
  col: number;
  length: number;
}

export interface Puzzle {
  title: string;
  grid: Cell[][]; // 5x5
  clues: Clue[];
}

// Puzzle 1: open grid, interlocking words
// Grid:
// A P P L E
// R O D E O
// E R O D E
// N E A R S
// A L E R T
function buildPuzzle1(): Puzzle {
  const letters = [
    ['A', 'P', 'P', 'L', 'E'],
    ['R', 'O', 'D', 'E', 'O'],
    ['E', 'R', 'O', 'D', 'E'],
    ['N', 'E', 'A', 'R', 'S'],
    ['A', 'L', 'E', 'R', 'T'],
  ];
  const grid: Cell[][] = letters.map((row) => row.map((l) => ({ letter: l })));
  grid[0][0].number = 1;
  grid[0][1].number = 2;
  grid[0][2].number = 3;
  grid[0][3].number = 4;
  grid[0][4].number = 5;
  grid[1][0].number = 6;
  grid[2][0].number = 7;
  grid[3][0].number = 8;
  grid[4][0].number = 9;
  return {
    title: 'Puzzle 1: Starter',
    grid,
    clues: [
      { num: 1, dir: 'across', text: 'Common red fruit', row: 0, col: 0, length: 5 },
      { num: 6, dir: 'across', text: 'Cowboy event', row: 1, col: 0, length: 5 },
      { num: 7, dir: 'across', text: 'Wear down gradually', row: 2, col: 0, length: 5 },
      { num: 8, dir: 'across', text: 'Comes close to (plural)', row: 3, col: 0, length: 5 },
      { num: 9, dir: 'across', text: 'On guard', row: 4, col: 0, length: 5 },
      { num: 1, dir: 'down', text: 'An ___ (a single)', row: 0, col: 0, length: 5 }, // ARENA
      { num: 2, dir: 'down', text: 'Oil producing org.', row: 0, col: 1, length: 5 }, // PORE L? Actually: P,O,R,E,L = POREL. not a word
      { num: 3, dir: 'down', text: 'Anagram of "DOE"', row: 0, col: 2, length: 5 }, // P,D,O,A,E
      { num: 4, dir: 'down', text: 'Poker cards', row: 0, col: 3, length: 5 }, // L,E,D,R,R
      { num: 5, dir: 'down', text: 'Letter before F', row: 0, col: 4, length: 5 }, // E,O,E,S,T
    ],
  };
}
