import { create } from 'zustand'

// --- Types ---

export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

export interface CellData {
  row: number
  col: number
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  adjacentMines: number
}

export interface DifficultyConfig {
  rows: number
  cols: number
  mines: number
  label: string
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: 'Easy' },
  medium: { rows: 16, cols: 16, mines: 40, label: 'Medium' },
  hard: { rows: 16, cols: 30, mines: 99, label: 'Hard' },
}

export interface BestTimes {
  easy: number | null
  medium: number | null
  hard: number | null
}

// --- Store ---

interface GameState {
  difficulty: Difficulty
  board: CellData[][]
  status: GameStatus
  minesRemaining: number
  timer: number
  timerInterval: number | null
  bestTimes: BestTimes
  firstClick: boolean

  setDifficulty: (d: Difficulty) => void
  newGame: (d?: Difficulty) => void
  revealCell: (row: number, col: number) => void
  toggleFlag: (row: number, col: number) => void
  tick: () => void
  startTimer: () => void
  stopTimer: () => void
  loadBestTimes: () => void
}

function createEmptyBoard(rows: number, cols: number): CellData[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      row: r,
      col: c,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  )
}

function getNeighbors(row: number, col: number, rows: number, cols: number): [number, number][] {
  const neighbors: [number, number][] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push([nr, nc])
      }
    }
  }
  return neighbors
}

function placeMines(
  board: CellData[][],
  rows: number,
  cols: number,
  mineCount: number,
  safeRow: number,
  safeCol: number
): void {
  const safeCells = new Set<string>()
  safeCells.add(`${safeRow},${safeCol}`)
  for (const [nr, nc] of getNeighbors(safeRow, safeCol, rows, cols)) {
    safeCells.add(`${nr},${nc}`)
  }

  let placed = 0
  while (placed < mineCount) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    if (board[r][c].isMine) continue
    if (safeCells.has(`${r},${c}`)) continue
    board[r][c].isMine = true
    placed++
  }

  // Compute adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue
      let count = 0
      for (const [nr, nc] of getNeighbors(r, c, rows, cols)) {
        if (board[nr][nc].isMine) count++
      }
      board[r][c].adjacentMines = count
    }
  }
}

function floodFill(board: CellData[][], row: number, col: number, rows: number, cols: number): void {
  const stack: [number, number][] = [[row, col]]
  while (stack.length > 0) {
    const [r, c] = stack.pop()!
    if (board[r][c].isRevealed) continue
    if (board[r][c].isFlagged) continue
    board[r][c].isRevealed = true
    if (board[r][c].adjacentMines === 0 && !board[r][c].isMine) {
      for (const [nr, nc] of getNeighbors(r, c, rows, cols)) {
        if (!board[nr][nc].isRevealed && !board[nr][nc].isFlagged) {
          stack.push([nr, nc])
        }
      }
    }
  }
}

function checkWin(board: CellData[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isRevealed) return false
    }
  }
  return true
}

function cloneBoard(board: CellData[][]): CellData[][] {
  return board.map(row => row.map(cell => ({ ...cell })))
}

function loadBestTimesFromStorage(): BestTimes {
  try {
    const raw = localStorage.getItem('minesweeper-best-times')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        easy: typeof parsed.easy === 'number' ? parsed.easy : null,
        medium: typeof parsed.medium === 'number' ? parsed.medium : null,
        hard: typeof parsed.hard === 'number' ? parsed.hard : null,
      }
    }
  } catch {
    // ignore
  }
  return { easy: null, medium: null, hard: null }
}

function saveBestTimes(times: BestTimes): void {
  try {
    localStorage.setItem('minesweeper-best-times', JSON.stringify(times))
  } catch {
    // ignore
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  difficulty: 'easy',
  board: createEmptyBoard(9, 9),
  status: 'idle',
  minesRemaining: 10,
  timer: 0,
  timerInterval: null,
  firstClick: true,
  bestTimes: loadBestTimesFromStorage(),

  setDifficulty: (d: Difficulty) => {
    get().stopTimer()
    const config = DIFFICULTIES[d]
    set({
      difficulty: d,
      board: createEmptyBoard(config.rows, config.cols),
      status: 'idle',
      minesRemaining: config.mines,
      timer: 0,
      firstClick: true,
    })
  },

  newGame: (d?: Difficulty) => {
    get().stopTimer()
    const diff = d ?? get().difficulty
    const config = DIFFICULTIES[diff]
    set({
      difficulty: diff,
      board: createEmptyBoard(config.rows, config.cols),
      status: 'idle',
      minesRemaining: config.mines,
      timer: 0,
      firstClick: true,
    })
  },

  revealCell: (row: number, col: number) => {
    const state = get()
    if (state.status === 'won' || state.status === 'lost') return

    let board = cloneBoard(state.board)
    const config = DIFFICULTIES[state.difficulty]

    // First click: place mines, start timer
    if (state.firstClick) {
      placeMines(board, config.rows, config.cols, config.mines, row, col)
      set({ firstClick: false, status: 'playing' })
      get().startTimer()
    }

    const cell = board[row][col]
    if (cell.isRevealed || cell.isFlagged) return

    if (cell.isMine) {
      // Reveal all mines
      for (const r of board) {
        for (const c of r) {
          if (c.isMine) c.isRevealed = true
        }
      }
      get().stopTimer()
      set({ board, status: 'lost' })
      return
    }

    floodFill(board, row, col, config.rows, config.cols)

    if (checkWin(board)) {
      get().stopTimer()
      // Auto-flag remaining mines
      for (const r of board) {
        for (const c of r) {
          if (c.isMine && !c.isFlagged) c.isFlagged = true
        }
      }
      // Check best time
      const currentTime = get().timer
      const bestTimes = { ...get().bestTimes }
      const diff = get().difficulty
      if (bestTimes[diff] === null || currentTime < bestTimes[diff]!) {
        bestTimes[diff] = currentTime
        saveBestTimes(bestTimes)
        set({ bestTimes })
      }
      set({ board, status: 'won', minesRemaining: 0 })
    } else {
      set({ board })
    }
  },

  toggleFlag: (row: number, col: number) => {
    const state = get()
    if (state.status === 'won' || state.status === 'lost') return
    if (state.status === 'idle') return // can't flag before first click

    const board = cloneBoard(state.board)
    const cell = board[row][col]
    if (cell.isRevealed) return

    cell.isFlagged = !cell.isFlagged
    const delta = cell.isFlagged ? -1 : 1
    set({ board, minesRemaining: state.minesRemaining + delta })
  },

  tick: () => {
    set(s => ({ timer: s.timer + 1 }))
  },

  startTimer: () => {
    const state = get()
    if (state.timerInterval !== null) return
    const id = window.setInterval(() => {
      get().tick()
    }, 1000)
    set({ timerInterval: id as unknown as number })
  },

  stopTimer: () => {
    const state = get()
    if (state.timerInterval !== null) {
      clearInterval(state.timerInterval)
      set({ timerInterval: null })
    }
  },

  loadBestTimes: () => {
    set({ bestTimes: loadBestTimesFromStorage() })
  },
}))
