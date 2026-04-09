import { create } from "zustand";

export type GameState = "menu" | "playing" | "gameover";

interface FlappyStore {
  state: GameState;
  score: number;
  highScore: number;
  setState: (s: GameState) => void;
  setScore: (n: number) => void;
  loadHighScore: () => void;
  saveHighScore: () => void;
}

const LS_KEY = "flappy-clone-highscore";

export const useStore = create<FlappyStore>((set, get) => ({
  state: "menu",
  score: 0,
  highScore: 0,
  setState: (s) => set({ state: s }),
  setScore: (n) => set({ score: n }),
  loadHighScore: () => {
    try {
      const v = localStorage.getItem(LS_KEY);
      if (v) set({ highScore: parseInt(v, 10) || 0 });
    } catch {
      /* noop */
    }
  },
  saveHighScore: () => {
    const { score, highScore } = get();
    if (score > highScore) {
      set({ highScore: score });
      try {
        localStorage.setItem(LS_KEY, String(score));
      } catch {
        /* noop */
      }
    }
  },
}));
