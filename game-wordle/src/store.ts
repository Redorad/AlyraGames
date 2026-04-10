import { create } from "zustand";
import { ANSWERS, VALID_GUESSES } from "./words";

export type LetterState = "empty" | "absent" | "present" | "correct";

export interface Cell {
  letter: string;
  state: LetterState;
}

export type GameStatus = "playing" | "won" | "lost";

interface Stats {
  played: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  distribution: number[]; // wins per attempt count (index 0 => 1 try)
}

interface State {
  answer: string;
  rows: Cell[][];
  current: string;
  rowIndex: number;
  status: GameStatus;
  message: string;
  keyStates: Record<string, LetterState>;
  shakeRow: boolean;
  stats: Stats;
  newGame: () => void;
  typeLetter: (letter: string) => void;
  deleteLetter: () => void;
  submit: () => void;
  clearMessage: () => void;
}

const MAX_ROWS = 6;
const WORD_LEN = 5;

const emptyRow = (): Cell[] =>
  Array.from({ length: WORD_LEN }, () => ({ letter: "", state: "empty" as LetterState }));

const emptyRows = (): Cell[][] => Array.from({ length: MAX_ROWS }, emptyRow);

const loadStats = (): Stats => {
  try {
    const raw = localStorage.getItem("wordle-stats");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { played: 0, wins: 0, currentStreak: 0, bestStreak: 0, distribution: [0, 0, 0, 0, 0, 0] };
};

const saveStats = (s: Stats) => {
  try {
    localStorage.setItem("wordle-stats", JSON.stringify(s));
  } catch {}
};

const pickAnswer = () => ANSWERS[Math.floor(Math.random() * ANSWERS.length)];

export const useGame = create<State>((set, get) => ({
  answer: pickAnswer(),
  rows: emptyRows(),
  current: "",
  rowIndex: 0,
  status: "playing",
  message: "",
  keyStates: {},
  shakeRow: false,
  stats: loadStats(),
  newGame: () =>
    set({
      answer: pickAnswer(),
      rows: emptyRows(),
      current: "",
      rowIndex: 0,
      status: "playing",
      message: "",
      keyStates: {},
      shakeRow: false,
    }),
  typeLetter: (letter) => {
    const { current, status } = get();
    if (status !== "playing") return;
    if (current.length >= WORD_LEN) return;
    set({ current: current + letter.toUpperCase() });
  },
  deleteLetter: () => {
    const { current, status } = get();
    if (status !== "playing") return;
    set({ current: current.slice(0, -1) });
  },
  submit: () => {
    const { current, rows, rowIndex, answer, status, keyStates, stats } = get();
    if (status !== "playing") return;
    if (current.length !== WORD_LEN) {
      set({ message: "Not enough letters", shakeRow: true });
      setTimeout(() => set({ shakeRow: false }), 320);
      return;
    }
    if (!VALID_GUESSES.has(current)) {
      set({ message: "Not in word list", shakeRow: true });
      setTimeout(() => set({ shakeRow: false }), 320);
      return;
    }

    const newRow: Cell[] = [];
    const answerLetters = answer.split("");
    const used = new Array(WORD_LEN).fill(false);

    // First pass: correct
    for (let i = 0; i < WORD_LEN; i++) {
      const ch = current[i];
      if (ch === answerLetters[i]) {
        newRow[i] = { letter: ch, state: "correct" };
        used[i] = true;
      }
    }
    // Second pass: present / absent
    for (let i = 0; i < WORD_LEN; i++) {
      if (newRow[i]) continue;
      const ch = current[i];
      const idx = answerLetters.findIndex((l, j) => !used[j] && l === ch);
      if (idx !== -1) {
        newRow[i] = { letter: ch, state: "present" };
        used[idx] = true;
      } else {
        newRow[i] = { letter: ch, state: "absent" };
      }
    }

    const newRows = rows.map((r, i) => (i === rowIndex ? newRow : r));

    // Merge key states (correct > present > absent)
    const nextKeys = { ...keyStates };
    for (const cell of newRow) {
      const prev = nextKeys[cell.letter];
      if (prev === "correct") continue;
      if (prev === "present" && cell.state === "absent") continue;
      nextKeys[cell.letter] = cell.state;
    }

    const won = current === answer;
    const lost = !won && rowIndex + 1 >= MAX_ROWS;
    const nextStatus: GameStatus = won ? "won" : lost ? "lost" : "playing";

    let nextStats = stats;
    if (won) {
      nextStats = {
        ...stats,
        played: stats.played + 1,
        wins: stats.wins + 1,
        currentStreak: stats.currentStreak + 1,
        bestStreak: Math.max(stats.bestStreak, stats.currentStreak + 1),
        distribution: stats.distribution.map((v, i) => (i === rowIndex ? v + 1 : v)),
      };
      saveStats(nextStats);
    } else if (lost) {
      nextStats = {
        ...stats,
        played: stats.played + 1,
        currentStreak: 0,
      };
      saveStats(nextStats);
    }

    set({
      rows: newRows,
      rowIndex: rowIndex + 1,
      current: "",
      status: nextStatus,
      keyStates: nextKeys,
      stats: nextStats,
      message: won ? "Brilliant!" : lost ? `Answer: ${answer}` : "",
    });
  },
  clearMessage: () => set({ message: "" }),
}));
