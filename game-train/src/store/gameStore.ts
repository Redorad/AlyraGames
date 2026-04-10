import { create } from 'zustand';

export const COLORS = ['red', 'blue', 'green', 'yellow'] as const;
export type Color = typeof COLORS[number];

export const COLOR_MAP: Record<Color, string> = {
  red: '#ef4444',
  blue: '#60a5fa',
  green: '#22c55e',
  yellow: '#eab308',
};

export interface Train {
  id: number;
  color: Color;
  row: number; // current row
  col: number; // current col (x, moves right)
  speed: number;
}

// stations at the right edge, one per row
export interface Station {
  row: number;
  color: Color;
}

export const ROWS = 5;
export const COLS = 10;

interface GameState {
  trains: Train[];
  stations: Station[];
  score: number;
  lives: number;
  spawnTimer: number;
  nextId: number;
  gameOver: boolean;
  paused: boolean;
  message: string;
  switchTrain: (id: number) => void;
  reset: () => void;
  tick: (delta: number) => void;
}

function makeStations(): Station[] {
  const shuffled = [...COLORS, COLORS[Math.floor(Math.random() * COLORS.length)]];
  // ensure ROWS entries
  while (shuffled.length < ROWS) {
    shuffled.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
  }
  return Array.from({ length: ROWS }, (_, i) => ({
    row: i,
    color: shuffled[i % shuffled.length],
  }));
}

export const useGameStore = create<GameState>((set, get) => ({
  trains: [],
  stations: makeStations(),
  score: 0,
  lives: 3,
  spawnTimer: 1,
  nextId: 1,
  gameOver: false,
  paused: false,
  message: 'Click a train to switch rows. Deliver to matching stations!',
  switchTrain: (id) => {
    set((s) => ({
      trains: s.trains.map((t) =>
        t.id === id ? { ...t, row: (t.row + 1) % ROWS } : t
      ),
    }));
  },
  reset: () =>
    set({
      trains: [],
      stations: makeStations(),
      score: 0,
      lives: 3,
      spawnTimer: 1,
      nextId: 1,
      gameOver: false,
      message: 'Click a train to switch rows. Deliver to matching stations!',
    }),
  tick: (delta) => {
    const s = get();
    if (s.gameOver || s.paused) return;

    let spawnTimer = s.spawnTimer - delta;
    let trains = [...s.trains];
    let nextId = s.nextId;
    let score = s.score;
    let lives = s.lives;
    let message = s.message;
    const difficulty = Math.min(3, 1 + score / 50);

    if (spawnTimer <= 0) {
      const row = Math.floor(Math.random() * ROWS);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      trains.push({
        id: nextId++,
        color,
        row,
        col: 0,
        speed: 1 + Math.random() * 0.5,
      });
      spawnTimer = Math.max(0.8, 3 - difficulty * 0.5);
    }

    // Move trains
    const nextTrains: Train[] = [];
    for (const t of trains) {
      const col = t.col + t.speed * delta * 1.2;
      if (col >= COLS - 0.5) {
        const station = s.stations[t.row];
        if (station && station.color === t.color) {
          score += 10;
          message = `Delivered! +10`;
        } else {
          lives -= 1;
          message = `Wrong station! -1 life`;
        }
        continue;
      }
      nextTrains.push({ ...t, col });
    }

    // Collision check: two trains in same cell (same row, adjacent col)
    for (let i = 0; i < nextTrains.length; i++) {
      for (let j = i + 1; j < nextTrains.length; j++) {
        const a = nextTrains[i];
        const b = nextTrains[j];
        if (a.row === b.row && Math.abs(a.col - b.col) < 0.5) {
          lives -= 1;
          message = 'Collision! -1 life';
          // remove both
          nextTrains[i].col = -999;
          nextTrains[j].col = -999;
        }
      }
    }
    const cleaned = nextTrains.filter((t) => t.col >= 0);

    const gameOver = lives <= 0;
    if (gameOver) message = 'Game Over! Press Reset.';

    set({
      trains: cleaned,
      spawnTimer,
      nextId,
      score,
      lives,
      gameOver,
      message,
    });
  },
}));
