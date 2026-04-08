import { create } from "zustand";

interface ProgressStore {
  /** Levels the player has beaten (ids) */
  completed: number[];
  /** Levels beaten in hard mode */
  completedHard: number[];
  /** Highest unlocked level id */
  highestUnlocked: number;

  completeLevel: (id: number, hard?: boolean) => void;
  reset: () => void;
}

const STORAGE_KEY = "slime-td-progress";

function load(): { completed: number[]; completedHard: number[]; highestUnlocked: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        completed: data.completed ?? [],
        completedHard: data.completedHard ?? [],
        highestUnlocked: data.highestUnlocked ?? 1,
      };
    }
  } catch {}
  return { completed: [], completedHard: [], highestUnlocked: 1 };
}

function save(state: { completed: number[]; completedHard: number[]; highestUnlocked: number }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useProgressStore = create<ProgressStore>((set) => ({
  ...load(),

  completeLevel: (id, hard = false) =>
    set((s) => {
      const completed = s.completed.includes(id) ? s.completed : [...s.completed, id];
      const completedHard = hard
        ? s.completedHard.includes(id) ? s.completedHard : [...s.completedHard, id]
        : s.completedHard;
      const highestUnlocked = Math.max(s.highestUnlocked, id + 1);
      const next = { completed, completedHard, highestUnlocked };
      save(next);
      return next;
    }),

  reset: () => {
    const fresh = { completed: [], completedHard: [], highestUnlocked: 1 };
    save(fresh);
    return set(fresh);
  },
}));
