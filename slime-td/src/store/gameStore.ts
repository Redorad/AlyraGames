import { create } from "zustand";

interface ProgressStore {
  /** Levels the player has beaten (ids) */
  completed: number[];
  /** Highest unlocked level id */
  highestUnlocked: number;

  completeLevel: (id: number) => void;
  reset: () => void;
}

const STORAGE_KEY = "slime-td-progress";

function load(): { completed: number[]; highestUnlocked: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completed: [], highestUnlocked: 1 };
}

function save(state: { completed: number[]; highestUnlocked: number }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useProgressStore = create<ProgressStore>((set) => ({
  ...load(),

  completeLevel: (id) =>
    set((s) => {
      const completed = s.completed.includes(id) ? s.completed : [...s.completed, id];
      const highestUnlocked = Math.max(s.highestUnlocked, id + 1);
      const next = { completed, highestUnlocked };
      save(next);
      return next;
    }),

  reset: () => {
    const fresh = { completed: [], highestUnlocked: 1 };
    save(fresh);
    return set(fresh);
  },
}));
