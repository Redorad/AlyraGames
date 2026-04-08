import { create } from "zustand";

export interface EndlessScore {
  wave: number;
  kills: number;
  date: string;
}

interface ProgressStore {
  completed: number[];
  completedHard: number[];
  completedNoHit: number[];
  highestUnlocked: number;
  endlessScores: EndlessScore[];

  completeLevel: (id: number, hard?: boolean, noHit?: boolean) => void;
  addEndlessScore: (wave: number, kills: number) => void;
  reset: () => void;
}

const STORAGE_KEY = "slime-td-progress";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        completed: data.completed ?? [],
        completedHard: data.completedHard ?? [],
        completedNoHit: data.completedNoHit ?? [],
        highestUnlocked: data.highestUnlocked ?? 1,
        endlessScores: data.endlessScores ?? [],
      };
    }
  } catch {}
  return { completed: [], completedHard: [], completedNoHit: [], highestUnlocked: 1, endlessScores: [] };
}

function save(state: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useProgressStore = create<ProgressStore>((set) => ({
  ...load(),

  completeLevel: (id, hard = false, noHit = false) =>
    set((s) => {
      const completed = s.completed.includes(id) ? s.completed : [...s.completed, id];
      const completedHard = hard
        ? s.completedHard.includes(id) ? s.completedHard : [...s.completedHard, id]
        : s.completedHard;
      const completedNoHit = noHit
        ? s.completedNoHit.includes(id) ? s.completedNoHit : [...s.completedNoHit, id]
        : s.completedNoHit;
      const highestUnlocked = Math.max(s.highestUnlocked, id + 1);
      const next = { completed, completedHard, completedNoHit, highestUnlocked, endlessScores: s.endlessScores };
      save(next);
      return next;
    }),

  addEndlessScore: (wave, kills) =>
    set((s) => {
      const entry: EndlessScore = {
        wave,
        kills,
        date: new Date().toLocaleDateString("fr-FR"),
      };
      const endlessScores = [...s.endlessScores, entry]
        .sort((a, b) => b.wave - a.wave || b.kills - a.kills)
        .slice(0, 10);
      const next = { ...s, endlessScores };
      save(next);
      return next;
    }),

  reset: () => {
    const fresh = { completed: [], completedHard: [], completedNoHit: [], highestUnlocked: 1, endlessScores: [] };
    save(fresh);
    return set(fresh);
  },
}));
