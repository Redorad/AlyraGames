import { create } from 'zustand'
import type { GameState } from '../types'

const SAVE_KEY = 'slime-run-progress'

function loadProgress(): { levelsUnlocked: number; score: number } {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { levelsUnlocked: 1, score: 0 }
}

function saveProgress(levelsUnlocked: number, score: number) {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ levelsUnlocked, score }))
}

const saved = loadProgress()

export const useGameStore = create<GameState>((set) => ({
  screen: 'title',
  currentLevel: 0,
  score: saved.score,
  levelsUnlocked: saved.levelsUnlocked,
  setScreen: (screen) => set({ screen }),
  setCurrentLevel: (level) => set({ currentLevel: level }),
  addScore: (points) =>
    set((state) => {
      const newScore = state.score + points
      saveProgress(state.levelsUnlocked, newScore)
      return { score: newScore }
    }),
  unlockLevel: (level) =>
    set((state) => {
      const newUnlocked = Math.max(state.levelsUnlocked, level)
      saveProgress(newUnlocked, state.score)
      return { levelsUnlocked: newUnlocked }
    }),
  resetScore: () => set({ score: 0 }),
}))
