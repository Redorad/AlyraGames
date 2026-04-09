import { create } from 'zustand'
import { GameState } from './types'

const LS_KEY = 'brickbreaker-highscore'

function loadHighScore(): number {
  try {
    return parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0
  } catch {
    return 0
  }
}

function saveHighScore(score: number) {
  try {
    localStorage.setItem(LS_KEY, String(score))
  } catch {
    // ignore
  }
}

interface Store extends GameState {
  setStatus: (status: GameState['status']) => void
  setScore: (score: number) => void
  addScore: (points: number) => void
  setLives: (lives: number) => void
  loseLife: () => void
  setLevel: (level: number) => void
  nextLevel: () => void
  resetGame: () => void
  updateHighScore: () => void
}

export const useStore = create<Store>((set, get) => ({
  score: 0,
  lives: 3,
  level: 0,
  highScore: loadHighScore(),
  status: 'menu',

  setStatus: (status) => set({ status }),

  setScore: (score) => set({ score }),

  addScore: (points) => {
    const newScore = get().score + points
    set({ score: newScore })
    if (newScore > get().highScore) {
      set({ highScore: newScore })
      saveHighScore(newScore)
    }
  },

  setLives: (lives) => set({ lives }),

  loseLife: () => {
    const lives = get().lives - 1
    set({ lives })
    if (lives <= 0) {
      get().updateHighScore()
      set({ status: 'gameover' })
    }
  },

  setLevel: (level) => set({ level }),

  nextLevel: () => set((s) => ({ level: s.level + 1 })),

  resetGame: () =>
    set({
      score: 0,
      lives: 3,
      level: 0,
      status: 'playing',
      highScore: loadHighScore(),
    }),

  updateHighScore: () => {
    const { score, highScore } = get()
    if (score > highScore) {
      set({ highScore: score })
      saveHighScore(score)
    }
  },
}))
