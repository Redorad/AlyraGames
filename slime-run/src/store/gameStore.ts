import { create } from 'zustand'
import type { GameState } from '../types'

export const useGameStore = create<GameState>((set) => ({
  screen: 'title',
  currentLevel: 0,
  score: 0,
  levelsUnlocked: 1,
  setScreen: (screen) => set({ screen }),
  setCurrentLevel: (level) => set({ currentLevel: level }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  unlockLevel: (level) =>
    set((state) => ({
      levelsUnlocked: Math.max(state.levelsUnlocked, level),
    })),
  resetScore: () => set({ score: 0 }),
}))
