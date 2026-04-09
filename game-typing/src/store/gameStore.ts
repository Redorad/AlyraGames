import { create } from 'zustand';
import { generateParagraph } from '../words';

export type TimeMode = 30 | 60 | 120;
export type GameState = 'idle' | 'running' | 'finished';

interface PersonalBest {
  wpm: number;
  accuracy: number;
  time: TimeMode;
  date: string;
}

interface TypingState {
  // Game state
  gameState: GameState;
  timeMode: TimeMode;
  targetText: string;
  typedText: string;
  timeLeft: number;
  startTime: number | null;
  intervalId: number | null;

  // Stats
  wpm: number;
  accuracy: number;
  correctChars: number;
  errorCount: number;
  totalTyped: number;

  // Personal best
  personalBest: Record<TimeMode, PersonalBest | null>;

  // Actions
  setTimeMode: (mode: TimeMode) => void;
  startGame: () => void;
  handleInput: (char: string) => void;
  handleBackspace: () => void;
  tick: () => void;
  endGame: () => void;
  resetGame: () => void;
  loadPersonalBest: () => void;
}

function loadBests(): Record<TimeMode, PersonalBest | null> {
  try {
    const saved = localStorage.getItem('typing-speed-bests');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { 30: null, 60: null, 120: null };
}

function saveBests(bests: Record<TimeMode, PersonalBest | null>) {
  try {
    localStorage.setItem('typing-speed-bests', JSON.stringify(bests));
  } catch { /* ignore */ }
}

export const useGameStore = create<TypingState>((set, get) => ({
  gameState: 'idle',
  timeMode: 30,
  targetText: generateParagraph(60),
  typedText: '',
  timeLeft: 30,
  startTime: null,
  intervalId: null,

  wpm: 0,
  accuracy: 100,
  correctChars: 0,
  errorCount: 0,
  totalTyped: 0,

  personalBest: loadBests(),

  setTimeMode: (mode) => {
    const state = get();
    if (state.gameState === 'running') return;
    set({
      timeMode: mode,
      timeLeft: mode,
      targetText: generateParagraph(mode === 30 ? 60 : mode === 60 ? 120 : 240),
      typedText: '',
      gameState: 'idle',
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      errorCount: 0,
      totalTyped: 0,
      startTime: null,
    });
  },

  startGame: () => {
    const state = get();
    if (state.gameState === 'running') return;
    const wordCount = state.timeMode === 30 ? 60 : state.timeMode === 60 ? 120 : 240;
    set({
      gameState: 'running',
      targetText: generateParagraph(wordCount),
      typedText: '',
      timeLeft: state.timeMode,
      startTime: Date.now(),
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      errorCount: 0,
      totalTyped: 0,
    });
  },

  handleInput: (char) => {
    const state = get();
    if (state.gameState !== 'running') return;

    const newTyped = state.typedText + char;
    const pos = newTyped.length - 1;
    const isCorrect = pos < state.targetText.length && state.targetText[pos] === char;

    const newCorrect = state.correctChars + (isCorrect ? 1 : 0);
    const newErrors = state.errorCount + (isCorrect ? 0 : 1);
    const newTotal = state.totalTyped + 1;

    // Calculate WPM: (correct chars / 5) / minutes elapsed
    const elapsed = (Date.now() - (state.startTime || Date.now())) / 60000;
    const wpm = elapsed > 0 ? Math.round((newCorrect / 5) / elapsed) : 0;
    const accuracy = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 100;

    // Check if we've typed the entire text
    if (newTyped.length >= state.targetText.length) {
      set({
        typedText: newTyped,
        correctChars: newCorrect,
        errorCount: newErrors,
        totalTyped: newTotal,
        wpm,
        accuracy,
      });
      get().endGame();
      return;
    }

    set({
      typedText: newTyped,
      correctChars: newCorrect,
      errorCount: newErrors,
      totalTyped: newTotal,
      wpm,
      accuracy,
    });
  },

  handleBackspace: () => {
    const state = get();
    if (state.gameState !== 'running' || state.typedText.length === 0) return;

    const removedChar = state.typedText[state.typedText.length - 1];
    const pos = state.typedText.length - 1;
    const wasCorrect = pos < state.targetText.length && state.targetText[pos] === removedChar;

    const newCorrect = state.correctChars - (wasCorrect ? 1 : 0);
    const newErrors = state.errorCount - (wasCorrect ? 0 : 1);
    const newTotal = state.totalTyped - 1;

    const elapsed = (Date.now() - (state.startTime || Date.now())) / 60000;
    const wpm = elapsed > 0 ? Math.round((newCorrect / 5) / elapsed) : 0;
    const accuracy = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 100;

    set({
      typedText: state.typedText.slice(0, -1),
      correctChars: newCorrect,
      errorCount: newErrors,
      totalTyped: newTotal,
      wpm,
      accuracy,
    });
  },

  tick: () => {
    const state = get();
    if (state.gameState !== 'running') return;

    const newTimeLeft = state.timeLeft - 1;
    if (newTimeLeft <= 0) {
      set({ timeLeft: 0 });
      get().endGame();
    } else {
      set({ timeLeft: newTimeLeft });
    }
  },

  endGame: () => {
    const state = get();
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    // Calculate final stats
    const elapsed = (Date.now() - (state.startTime || Date.now())) / 60000;
    const finalWpm = elapsed > 0 ? Math.round((state.correctChars / 5) / elapsed) : 0;
    const finalAccuracy = state.totalTyped > 0 ? Math.round((state.correctChars / state.totalTyped) * 100) : 100;

    // Check personal best
    const bests = { ...state.personalBest };
    const current = bests[state.timeMode];
    if (!current || finalWpm > current.wpm) {
      bests[state.timeMode] = {
        wpm: finalWpm,
        accuracy: finalAccuracy,
        time: state.timeMode,
        date: new Date().toISOString(),
      };
      saveBests(bests);
    }

    set({
      gameState: 'finished',
      intervalId: null,
      wpm: finalWpm,
      accuracy: finalAccuracy,
      personalBest: bests,
    });
  },

  resetGame: () => {
    const state = get();
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }
    const wordCount = state.timeMode === 30 ? 60 : state.timeMode === 60 ? 120 : 240;
    set({
      gameState: 'idle',
      targetText: generateParagraph(wordCount),
      typedText: '',
      timeLeft: state.timeMode,
      startTime: null,
      intervalId: null,
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      errorCount: 0,
      totalTyped: 0,
    });
  },

  loadPersonalBest: () => {
    set({ personalBest: loadBests() });
  },
}));
