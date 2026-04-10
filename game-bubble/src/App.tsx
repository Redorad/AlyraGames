import { useEffect, useRef, useState } from "react";

const W = 400;
const H = 560;
const R = 16; // bubble radius
const COLS = Math.floor(W / (R * 2));
const ROW_H = R * 2 * 0.866;

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a78bfa"];

type Bubble = { row: number; col: number; color: string } | null;

interface ShotBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

function gridPos(row: number, col: number): { x: number; y: number } {
  const offset = row % 2 === 1 ? R : 0;
  return {
    x: col * R * 2 + R + offset,
    y: row * ROW_H + R + 30,
  };
}

function neighbors(row: number, col: number): [number, number][] {
  const even = row % 2 === 0;
  const off = even ? -1 : 0;
  return [
    [row, col - 1],
    [row, col + 1],
    [row - 1, col + off],
    [row - 1, col + off + 1],
    [row + 1, col + off],
    [row + 1, col + off + 1],
  ];
}

function initGrid(rows = 6): Bubble[][] {
  const grid: Bubble[][] = [];
  for (let r = 0; r < 14; r++) {
    const row: Bubble[] = [];
    for (let c = 0; c < COLS; c++) {
      if (r < rows) {
        row.push({
          row: r,
          col: c,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      } else {
        row.push(null);
      }
    }
    grid.push(row);
  }
  return grid;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    grid: initGrid(),
    shooter: {
      x: W / 2,
      y: H - 30,
      angle: -Math.PI / 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      next: COLORS[Math.floor(Math.random() * COLORS.length)],
    },
    shot: null as ShotBubble | null,
    mouseX: W / 2,
    mouseY: 0,
    score: 0,
    status: "playing" as "playing" | "won" | "lost",
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = 0;

    const findCellAt = (x: number, y: number): [number, number] | null => {
      const row = Math.round((y - R - 30) / ROW_H);
      if (row < 0 || row >= 14) return null;
      const offset = row % 2 === 1 ? R : 0;
      const col = Math.round((x - R - offset) / (R * 2));
      if (col < 0 || col >= COLS) return null;
      return [row, col];
    };

    const snapShot = () => {
      const s = stateRef.current;
      if (!s.shot) return;
      // Find nearest empty cell adjacent to collision
      let bestRow = -1;
      let bestCol = -1;
      let bestD = Infinity;
      for (let r = 0; r < 14; r++) {
        for (let c = 0; c < COLS; c++) {
          if (s.grid[r][c]) continue;
          // Only empty cells next to another bubble or top
          let hasNeighbor = r === 0;
          if (!hasNeighbor) {
            for (const [nr, nc] of neighbors(r, c)) {
              if (nr >= 0 && nr < 14 && nc >= 0 && nc < COLS && s.grid[nr][nc]) {
                hasNeighbor = true;
                break;
              }
            }
          }
          if (!hasNeighbor) continue;
          const p = gridPos(r, c);
          const d = Math.hypot(p.x - s.shot.x, p.y - s.shot.y);
          if (d < bestD) {
            bestD = d;
            bestRow = r;
            bestCol = c;
          }
        }
      }
      if (bestRow === -1) {
        s.shot = null;
        return;
      }
      s.grid[bestRow][bestCol] = { row: bestRow, col: bestCol, color: s.shot.color };
      const matches = floodMatch(bestRow, bestCol, s.shot.color);
      if (matches.length >= 3) {
        for (const [r, c] of matches) s.grid[r][c] = null;
        s.score += matches.length * 10;
        // Drop disconnected bubbles
        const connected = findConnected();
        for (let r = 0; r < 14; r++) {
          for (let c = 0; c < COLS; c++) {
            if (s.grid[r][c] && !connected.has(`${r},${c}`)) {
              s.grid[r][c] = null;
              s.score += 20;
            }
          }
        }
      }
      s.shot = null;
      s.shooter.color = s.shooter.next;
      s.shooter.next = COLORS[Math.floor(Math.random() * COLORS.length)];

      // Check win / loss
      let anyBubble = false;
      let lowest = -1;
      for (let r = 0; r < 14; r++) {
        for (let c = 0; c < COLS; c++) {
          if (s.grid[r][c]) {
            anyBubble = true;
            if (r > lowest) lowest = r;
          }
        }
      }
      if (!anyBubble) s.status = "won";
      else if (lowest >= 12) s.status = "lost";
      setTick((t) => t + 1);
    };

    const floodMatch = (row: number, col: number, color: string): [number, number][] => {
      const s = stateRef.current;
      const visited = new Set<string>();
      const result: [number, number][] = [];
      const stack: [number, number][] = [[row, col]];
      while (stack.length) {
        const [r, c] = stack.pop()!;
        const key = `${r},${c}`;
        if (visited.has(key)) continue;
        if (r < 0 || r >= 14 || c < 0 || c >= COLS) continue;
        const b = s.grid[r][c];
        if (!b || b.color !== color) continue;
        visited.add(key);
        result.push([r, c]);
        for (const n of neighbors(r, c)) stack.push(n);
      }
      return result;
    };

    const findConnected = (): Set<string> => {
      const s = stateRef.current;
      const connected = new Set<string>();
      const stack: [number, number][] = [];
      for (let c = 0; c < COLS; c++) {
        if (s.grid[0][c]) stack.push([0, c]);
      }
      while (stack.length) {
        const [r, c] = stack.pop()!;
        const key = `${r},${c}`;
        if (connected.has(key)) continue;
        if (r < 0 || r >= 14 || c < 0 || c >= COLS) continue;
        if (!s.grid[r][c]) continue;
        connected.add(key);
        for (const n of neighbors(r, c)) stack.push(n);
      }
      return connected;
    };

    const update = (dt: number) => {
      const s = stateRef.current;
      if (s.status !== "playing") return;
      // Update shooter angle from mouse
      const dx = s.mouseX - s.shooter.x;
      const dy = s.mouseY - s.shooter.y;
      const ang = Math.atan2(dy, dx);
      if (ang < -0.15) s.shooter.angle = Math.max(ang, -Math.PI + 0.15);
      if (s.shot) {
        s.shot.x += s.shot.vx * dt;
        s.shot.y += s.shot.vy * dt;
        if (s.shot.x < R || s.shot.x > W - R) {
          s.shot.vx *= -1;
          s.shot.x = Math.max(R, Math.min(W - R, s.shot.x));
        }
        if (s.shot.y < R + 30) {
          snapShot();
          return;
        }
        // Check collision with grid
        for (let r = 0; r < 14; r++) {
          for (let c = 0; c < COLS; c++) {
            if (!s.grid[r][c]) continue;
            const p = gridPos(r, c);
            const d = Math.hypot(p.x - s.shot.x, p.y - s.shot.y);
            if (d < R * 2 - 2) {
              snapShot();
              return;
            }
          }
        }
      }
    };

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);
      // Top line
      ctx.strokeStyle = "#1a2050";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(W, 30);
      ctx.stroke();
      // Danger line
      ctx.strokeStyle = "rgba(239,68,68,0.4)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const dangerY = gridPos(12, 0).y + R;
      ctx.moveTo(0, dangerY);
      ctx.lineTo(W, dangerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Grid
      for (let r = 0; r < 14; r++) {
        for (let c = 0; c < COLS; c++) {
          const b = s.grid[r][c];
          if (!b) continue;
          const p = gridPos(r, c);
          drawBubble(p.x, p.y, b.color);
        }
      }
      // Shot
      if (s.shot) drawBubble(s.shot.x, s.shot.y, s.shot.color);
      // Shooter aim line
      if (!s.shot && s.status === "playing") {
        ctx.strokeStyle = "rgba(126,200,227,0.3)";
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(s.shooter.x, s.shooter.y);
        ctx.lineTo(
          s.shooter.x + Math.cos(s.shooter.angle) * 600,
          s.shooter.y + Math.sin(s.shooter.angle) * 600
        );
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Shooter
      drawBubble(s.shooter.x, s.shooter.y, s.shooter.color);
      // Next
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px -apple-system";
      ctx.textAlign = "right";
      ctx.fillText("NEXT", W - 30, H - 30);
      drawBubble(W - 14, H - 20, s.shooter.next, 10);
    };

    const drawBubble = (x: number, y: number, color: string, radius = R) => {
      const grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, radius);
      grad.addColorStop(0, lighten(color));
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const lighten = (c: string): string => {
      // Simple: overlay with white
      return c + "cc";
    };

    const loop = (t: number) => {
      const dt = last ? Math.min(t - last, 32) : 16;
      last = t;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = ((e.clientX - rect.left) / rect.width) * W;
      stateRef.current.mouseY = ((e.clientY - rect.top) / rect.height) * H;
    };
    const onClick = () => {
      const s = stateRef.current;
      if (s.shot || s.status !== "playing") return;
      const speed = 0.6;
      s.shot = {
        x: s.shooter.x,
        y: s.shooter.y,
        vx: Math.cos(s.shooter.angle) * speed,
        vy: Math.sin(s.shooter.angle) * speed,
        color: s.shooter.color,
      };
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  const reset = () => {
    stateRef.current = {
      grid: initGrid(),
      shooter: {
        x: W / 2,
        y: H - 30,
        angle: -Math.PI / 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        next: COLORS[Math.floor(Math.random() * COLORS.length)],
      },
      shot: null,
      mouseX: W / 2,
      mouseY: 0,
      score: 0,
      status: "playing",
    };
    setTick((t) => t + 1);
  };

  const s = stateRef.current;

  return (
    <div className="w-full h-full flex flex-col items-center justify-start py-3 px-2 gap-2">
      <div className="w-full max-w-md flex items-center justify-between px-3">
        <h1 className="text-xl font-black tracking-wider">
          <span className="text-steel">BUB</span>
          <span className="text-accent">BLE</span>
        </h1>
        <div className="text-xs">
          <span className="text-slate-400">Score </span>
          <span className="text-accent font-bold text-lg">{s.score}</span>
        </div>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-xl border border-navy-700 cursor-crosshair"
          style={{ maxHeight: "78vh", width: "auto" }}
        />
        {s.status !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-900/80 rounded-xl">
            <div className="text-center">
              <div
                className={`text-3xl font-black mb-3 ${
                  s.status === "won" ? "text-steel" : "text-red-400"
                }`}
              >
                {s.status === "won" ? "CLEARED!" : "GAME OVER"}
              </div>
              <div className="text-slate-400 mb-3">Score: {s.score}</div>
              <button
                onClick={reset}
                className="px-6 py-2 bg-accent text-white font-bold rounded-lg"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
