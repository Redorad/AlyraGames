import { create } from 'zustand';
import {
  Board, Notes, Difficulty,
  generatePuzzle, cloneBoard, cloneNotes, emptyNotes,
  getConflicts, isBoardComplete, getHintCell
} from './sudoku';

interface HistoryEntry {
  board: Board;
  notes: Notes;
}

interface BestTimes {
  easy: number | null;
  medium: number | null;
  hard: number | null;
}

interface GameState {
  // Puzzle state
  puzzle: Board;
  solution: Board;
  board: Board;
  givenCells: boolean[][];
  notes: Notes;
  difficulty: Difficulty;

  // Selection
  selectedCell: [number, number] | null;

  // Mode
  notesMode: boolean;

  // Timer
  elapsed: number;
  timerRunning: boolean;

  // Game status
  isComplete: boolean;
  hintsUsed: number;

  // History for undo
  history: HistoryEntry[];

  // Best times
  bestTimes: BestTimes;

  // Actions
  newGame: (difficulty: Difficulty) => void;
  selectCell: (row: number, col: number) => void;
  clearSelection: () => void;
  placeNumber: (num: number) => void;
  eraseCell: () => void;
  toggleNotesMode: () => void;
  useHint: () => void;
  undo: () => void;
  tick: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
}

function loadBestTimes(): BestTimes {
  try {
    const data = localStorage.getItem('sudoku-zen-best-times');
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return { easy: null, medium: null, hard: null };
}

function saveBestTimes(times: BestTimes) {
  try {
    localStorage.setItem('sudoku-zen-best-times', JSON.stringify(times));
  } catch { /* ignore */ }
}

function createInitialState(difficulty: Difficulty) {
  const { puzzle, solution } = generatePuzzle(difficulty);
  const board = cloneBoard(puzzle);
  const givenCells = puzzle.map(row => row.map(v => v !== 0));

  return {
    puzzle,
    solution,
    board,
    givenCells,
    notes: emptyNotes(),
    difficulty,
    selectedCell: null,
    notesMode: false,
    elapsed: 0,
    timerRunning: true,
    isComplete: false,
    hintsUsed: 0,
    history: [],
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...createInitialState('easy'),
  bestTimes: loadBestTimes(),

  newGame: (difficulty: Difficulty) => {
    set({
      ...createInitialState(difficulty),
      bestTimes: get().bestTimes,
    });
  },

  selectCell: (row: number, col: number) => {
    set({ selectedCell: [row, col] });
  },

  clearSelection: () => {
    set({ selectedCell: null });
  },

  placeNumber: (num: number) => {
    const { selectedCell, board, givenCells, notes, notesMode, history, isComplete } = get();
    if (!selectedCell || isComplete) return;
    const [r, c] = selectedCell;
    if (givenCells[r][c]) return;

    // Save history
    const newHistory = [...history, { board: cloneBoard(board), notes: cloneNotes(notes) }];
    // Limit history to 100 entries
    if (newHistory.length > 100) newHistory.shift();

    if (notesMode) {
      const newNotes = cloneNotes(notes);
      if (newNotes[r][c].has(num)) {
        newNotes[r][c].delete(num);
      } else {
        newNotes[r][c].add(num);
      }
      // Clear the cell value when adding notes
      const newBoard = cloneBoard(board);
      newBoard[r][c] = 0;
      set({ notes: newNotes, board: newBoard, history: newHistory });
    } else {
      const newBoard = cloneBoard(board);
      // If clicking same number, erase it
      if (newBoard[r][c] === num) {
        newBoard[r][c] = 0;
      } else {
        newBoard[r][c] = num;
      }
      // Clear notes for this cell
      const newNotes = cloneNotes(notes);
      newNotes[r][c].clear();
      set({ board: newBoard, notes: newNotes, history: newHistory });

      // Check completion
      if (isBoardComplete(newBoard)) {
        const state = get();
        const bestTimes = { ...state.bestTimes };
        const current = bestTimes[state.difficulty];
        if (current === null || state.elapsed < current) {
          bestTimes[state.difficulty] = state.elapsed;
          saveBestTimes(bestTimes);
        }
        set({ isComplete: true, timerRunning: false, bestTimes });
      }
    }
  },

  eraseCell: () => {
    const { selectedCell, board, givenCells, notes, history, isComplete } = get();
    if (!selectedCell || isComplete) return;
    const [r, c] = selectedCell;
    if (givenCells[r][c]) return;

    if (board[r][c] === 0 && notes[r][c].size === 0) return;

    const newHistory = [...history, { board: cloneBoard(board), notes: cloneNotes(notes) }];
    if (newHistory.length > 100) newHistory.shift();

    const newBoard = cloneBoard(board);
    const newNotes = cloneNotes(notes);
    newBoard[r][c] = 0;
    newNotes[r][c].clear();
    set({ board: newBoard, notes: newNotes, history: newHistory });
  },

  toggleNotesMode: () => {
    set(state => ({ notesMode: !state.notesMode }));
  },

  useHint: () => {
    const { board, solution, givenCells, notes, history, isComplete } = get();
    if (isComplete) return;

    const hint = getHintCell(board, solution, givenCells);
    if (!hint) return;

    const [r, c] = hint;
    const newHistory = [...history, { board: cloneBoard(board), notes: cloneNotes(notes) }];
    if (newHistory.length > 100) newHistory.shift();

    const newBoard = cloneBoard(board);
    const newNotes = cloneNotes(notes);
    newBoard[r][c] = solution[r][c];
    newNotes[r][c].clear();

    set({
      board: newBoard,
      notes: newNotes,
      history: newHistory,
      hintsUsed: get().hintsUsed + 1,
      selectedCell: [r, c],
    });

    // Check completion
    if (isBoardComplete(newBoard)) {
      const state = get();
      const bestTimes = { ...state.bestTimes };
      const current = bestTimes[state.difficulty];
      if (current === null || state.elapsed < current) {
        bestTimes[state.difficulty] = state.elapsed;
        saveBestTimes(bestTimes);
      }
      set({ isComplete: true, timerRunning: false, bestTimes });
    }
  },

  undo: () => {
    const { history, isComplete } = get();
    if (history.length === 0 || isComplete) return;

    const newHistory = [...history];
    const prev = newHistory.pop()!;
    set({
      board: prev.board,
      notes: prev.notes,
      history: newHistory,
    });
  },

  tick: () => {
    const { timerRunning } = get();
    if (timerRunning) {
      set(state => ({ elapsed: state.elapsed + 1 }));
    }
  },

  pauseTimer: () => set({ timerRunning: false }),
  resumeTimer: () => {
    const { isComplete } = get();
    if (!isComplete) set({ timerRunning: true });
  },
}));
