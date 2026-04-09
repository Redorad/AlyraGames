import { create } from "zustand";

export type Difficulty = "easy" | "medium" | "hard";
export type Screen = "menu" | "playing" | "paused" | "gameover";

interface GameState {
  screen: Screen;
  difficulty: Difficulty;
  playerScore: number;
  aiScore: number;
  winner: "player" | "ai" | null;
  soundOn: boolean;

  setScreen: (s: Screen) => void;
  setDifficulty: (d: Difficulty) => void;
  addPlayerScore: () => void;
  addAiScore: () => void;
  setWinner: (w: "player" | "ai") => void;
  toggleSound: () => void;
  resetScores: () => void;
  startGame: (d: Difficulty) => void;
}

export const useStore = create<GameState>((set) => ({
  screen: "menu",
  difficulty: "medium",
  playerScore: 0,
  aiScore: 0,
  winner: null,
  soundOn: true,

  setScreen: (screen) => set({ screen }),
  setDifficulty: (difficulty) => set({ difficulty }),
  addPlayerScore: () =>
    set((s) => {
      const ns = s.playerScore + 1;
      if (ns >= 11) return { playerScore: ns, winner: "player", screen: "gameover" };
      return { playerScore: ns };
    }),
  addAiScore: () =>
    set((s) => {
      const ns = s.aiScore + 1;
      if (ns >= 11) return { aiScore: ns, winner: "ai", screen: "gameover" };
      return { aiScore: ns };
    }),
  setWinner: (winner) => set({ winner, screen: "gameover" }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  resetScores: () => set({ playerScore: 0, aiScore: 0, winner: null }),
  startGame: (difficulty) =>
    set({ screen: "playing", difficulty, playerScore: 0, aiScore: 0, winner: null }),
}));
