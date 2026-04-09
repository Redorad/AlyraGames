import { Point, Direction } from "./store";

const CELL = 24;
const GAP = 0.5;

// Colors
const BG = "#0a0e27";
const GRID_LINE = "rgba(126,200,227,0.06)";
const FOOD_CORE = "#22c55e";
const FOOD_GLOW = "rgba(34,197,94,0.6)";
const WALL_GLOW = "rgba(239,68,68,0.45)";
const SNAKE_HEAD_COLOR = "#00e5ff";
const SNAKE_TAIL_COLOR = "#a78bfa";

function lerpColor(a: string, b: string, t: number): string {
  const pa = [
    parseInt(a.slice(1, 3), 16),
    parseInt(a.slice(3, 5), 16),
    parseInt(a.slice(5, 7), 16),
  ];
  const pb = [
    parseInt(b.slice(1, 3), 16),
    parseInt(b.slice(3, 5), 16),
    parseInt(b.slice(5, 7), 16),
  ];
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

export function getCanvasSize(gridW: number, gridH: number) {
  return { w: gridW * CELL, h: gridH * CELL };
}

export function render(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  snake: Point[],
  food: Point,
  hitWall: boolean,
  isGameOver: boolean,
  _direction: Direction,
  time: number
) {
  const w = gridW * CELL;
  const h = gridH * CELL;

  // Clear
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= gridW; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, h);
    ctx.stroke();
  }
  for (let y = 0; y <= gridH; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(w, y * CELL);
    ctx.stroke();
  }

  // Wall glow on death
  if (isGameOver && hitWall) {
    ctx.save();
    ctx.shadowColor = "rgba(239,68,68,0.8)";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = WALL_GLOW;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.restore();
  }

  // Food
  const pulse = 0.8 + 0.2 * Math.sin(time * 0.005);
  const fx = food.x * CELL + CELL / 2;
  const fy = food.y * CELL + CELL / 2;
  const fr = (CELL / 2 - GAP) * pulse;

  ctx.save();
  ctx.shadowColor = FOOD_GLOW;
  ctx.shadowBlur = 18;
  ctx.fillStyle = FOOD_CORE;
  ctx.beginPath();
  ctx.arc(fx, fy, fr, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Outer glow ring
  ctx.save();
  ctx.strokeStyle = FOOD_GLOW;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.3 + 0.2 * Math.sin(time * 0.004);
  ctx.beginPath();
  ctx.arc(fx, fy, fr + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Snake
  const len = snake.length;
  for (let i = len - 1; i >= 0; i--) {
    const seg = snake[i];
    const t = len === 1 ? 0 : i / (len - 1);
    const color = lerpColor(SNAKE_HEAD_COLOR, SNAKE_TAIL_COLOR, t);

    const x = seg.x * CELL + GAP;
    const y = seg.y * CELL + GAP;
    const s = CELL - GAP * 2;
    const r = i === 0 ? 6 : 4;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = i === 0 ? 16 : 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, s, s, r);
    ctx.fill();
    ctx.restore();
  }

  // Eyes on head
  if (snake.length > 0) {
    const head = snake[0];
    const hx = head.x * CELL + CELL / 2;
    const hy = head.y * CELL + CELL / 2;

    let ex1 = 0, ey1 = 0, ex2 = 0, ey2 = 0;
    const dir = _direction;
    const off = 4;
    const fwd = 3;

    if (dir === "RIGHT") {
      ex1 = hx + fwd; ey1 = hy - off;
      ex2 = hx + fwd; ey2 = hy + off;
    } else if (dir === "LEFT") {
      ex1 = hx - fwd; ey1 = hy - off;
      ex2 = hx - fwd; ey2 = hy + off;
    } else if (dir === "UP") {
      ex1 = hx - off; ey1 = hy - fwd;
      ex2 = hx + off; ey2 = hy - fwd;
    } else {
      ex1 = hx - off; ey1 = hy + fwd;
      ex2 = hx + off; ey2 = hy + fwd;
    }

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex1, ey1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex2, ey2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
