import { create } from "zustand";

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type Point = { x: number; y: number };
export type GameStatus = "menu" | "playing" | "paused" | "gameover";

const GRID_W = 30;
const GRID_H = 20;
const BASE_SPEED = 150; // ms per tick
const MIN_SPEED = 50;
const SPEED_STEP = 2; // ms faster per food eaten

function randomFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  let pt: Point;
  do {
    pt = {
      x: Math.floor(Math.random() * GRID_W),
      y: Math.floor(Math.random() * GRID_H),
    };
  } while (occupied.has(`${pt.x},${pt.y}`));
  return pt;
}

function initialSnake(): Point[] {
  const cx = Math.floor(GRID_W / 2);
  const cy = Math.floor(GRID_H / 2);
  return [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
}

export interface GameState {
  gridW: number;
  gridH: number;
  snake: Point[];
  direction: Direction;
  nextDirection: Direction;
  food: Point;
  score: number;
  highScore: number;
  status: GameStatus;
  wrapAround: boolean;
  speed: number;
  hitWall: boolean;

  startGame: () => void;
  togglePause: () => void;
  setDirection: (d: Direction) => void;
  toggleWrap: () => void;
  tick: () => void;
  returnToMenu: () => void;
}

const OPPOSITE: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

function loadHighScore(): number {
  try {
    return Number(localStorage.getItem("snake-neon-high") ?? 0);
  } catch {
    return 0;
  }
}

function saveHighScore(s: number) {
  try {
    localStorage.setItem("snake-neon-high", String(s));
  } catch {}
}

export const useGameStore = create<GameState>((set, get) => ({
  gridW: GRID_W,
  gridH: GRID_H,
  snake: initialSnake(),
  direction: "RIGHT",
  nextDirection: "RIGHT",
  food: randomFood(initialSnake()),
  score: 3,
  highScore: loadHighScore(),
  status: "menu",
  wrapAround: false,
  speed: BASE_SPEED,
  hitWall: false,

  startGame: () => {
    const s = initialSnake();
    set({
      snake: s,
      direction: "RIGHT",
      nextDirection: "RIGHT",
      food: randomFood(s),
      score: 3,
      status: "playing",
      speed: BASE_SPEED,
      hitWall: false,
    });
  },

  togglePause: () => {
    const st = get().status;
    if (st === "playing") set({ status: "paused" });
    else if (st === "paused") set({ status: "playing" });
  },

  setDirection: (d: Direction) => {
    const cur = get().direction;
    if (d !== OPPOSITE[cur]) {
      set({ nextDirection: d });
    }
  },

  toggleWrap: () => set((s) => ({ wrapAround: !s.wrapAround })),

  returnToMenu: () => set({ status: "menu" }),

  tick: () => {
    const state = get();
    if (state.status !== "playing") return;

    const dir = state.nextDirection;
    const head = state.snake[0];
    let nx = head.x;
    let ny = head.y;

    if (dir === "UP") ny -= 1;
    else if (dir === "DOWN") ny += 1;
    else if (dir === "LEFT") nx -= 1;
    else if (dir === "RIGHT") nx += 1;

    // Wall collision / wrap
    if (state.wrapAround) {
      nx = ((nx % state.gridW) + state.gridW) % state.gridW;
      ny = ((ny % state.gridH) + state.gridH) % state.gridH;
    } else {
      if (nx < 0 || nx >= state.gridW || ny < 0 || ny >= state.gridH) {
        const hs = Math.max(state.score, state.highScore);
        saveHighScore(hs);
        set({
          status: "gameover",
          direction: dir,
          highScore: hs,
          hitWall: true,
        });
        return;
      }
    }

    // Self collision (skip last segment since it will move)
    const body = state.snake.slice(0, -1);
    if (body.some((p) => p.x === nx && p.y === ny)) {
      const hs = Math.max(state.score, state.highScore);
      saveHighScore(hs);
      set({
        status: "gameover",
        direction: dir,
        highScore: hs,
        hitWall: false,
      });
      return;
    }

    const newHead: Point = { x: nx, y: ny };
    let newSnake: Point[];
    let ate = false;

    if (nx === state.food.x && ny === state.food.y) {
      newSnake = [newHead, ...state.snake];
      ate = true;
    } else {
      newSnake = [newHead, ...state.snake.slice(0, -1)];
    }

    const newScore = newSnake.length;
    const newSpeed = ate
      ? Math.max(MIN_SPEED, state.speed - SPEED_STEP)
      : state.speed;

    set({
      snake: newSnake,
      direction: dir,
      score: newScore,
      speed: newSpeed,
      food: ate ? randomFood(newSnake) : state.food,
    });
  },
}));
