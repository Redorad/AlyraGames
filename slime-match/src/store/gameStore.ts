import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Screen } from '../types';

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      screen: 'title' as Screen,
      currentLevel: 1,
      unlockedLevel: 1,
      highScores: {},

      setScreen: (screen: Screen) => set({ screen }),

      setCurrentLevel: (level: number) => set({ currentLevel: level }),

      completeLevel: (level: number, score: number) =>
        set((state) => ({
          unlockedLevel: Math.max(state.unlockedLevel, level + 1),
          highScores: {
            ...state.highScores,
            [level]: Math.max(state.highScores[level] ?? 0, score),
          },
        })),
    }),
    {
      name: 'slime-match-progress',
      partialize: (state) => ({
        unlockedLevel: state.unlockedLevel,
        highScores: state.highScores,
      }),
    }
  )
);
