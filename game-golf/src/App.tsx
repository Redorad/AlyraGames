import { useEffect, useRef, useState } from "react";

type Wall = { x1: number; y1: number; x2: number; y2: number };
type Hole = {
  par: number;
  ball: { x: number; y: number };
  cup: { x: number; y: number };
  walls: Wall[];
};

const W = 700;
const H = 500;
const BALL_R = 7;
const CUP_R = 12;
const FRICTION = 0.985;
const MAX_POWER = 14;

function border(): Wall[] {
  return [
    { x1: 20, y1: 20, x2: W - 20, y2: 20 },
    { x1: W - 20, y1: 20, x2: W - 20, y2: H - 20 },
    { x1: W - 20, y1: H - 20, x2: 20, y2: H - 20 },
    { x1: 20, y1: H - 20, x2: 20, y2: 20 },
  ];
}

const HOLES: Hole[] = [
  {
    par: 2,
    ball: { x: 100, y: 250 },
    cup: { x: 600, y: 250 },
    walls: border(),
  },
  {
    par: 3,
    ball: { x: 100, y: 400 },
    cup: { x: 600, y: 100 },
    walls: [
      ...border(),
      { x1: 300, y1: 20, x2: 300, y2: 300 },
    ],
  },
  {
    par: 3,
    ball: { x: 80, y: 80 },
    cup: { x: 620, y: 420 },
    walls: [
      ...border(),
      { x1: 200, y1: 150, x2: 500, y2: 150 },
      { x1: 200, y1: 350, x2: 500, y2: 350 },
    ],
  },
  {
    par: 4,
    ball: { x: 100, y: 250 },
    cup: { x: 600, y: 250 },
    walls: [
      ...border(),
      { x1: 250, y1: 20, x2: 250, y2: 200 },
      { x1: 400, y1: 300, x2: 400, y2: H - 20 },
    ],
  },
  {
    par: 3,
    ball: { x: 100, y: 100 },
    cup: { x: 600, y: 400 },
    walls: [
      ...border(),
      { x1: 200, y1: 200, x2: 500, y2: 200 },
      { x1: 500, y1: 200, x2: 500, y2: 300 },
      { x1: 500, y1: 300, x2: 200, y2: 300 },
    ],
  },
  {
    par: 2,
    ball: { x: 100, y: 400 },
    cup: { x: 600, y: 100 },
    walls: [
      ...border(),
      { x1: 350, y1: 100, x2: 350, y2: 400 },
    ],
  },
  {
    par: 4,
    ball: { x: 100, y: 250 },
    cup: { x: 600, y: 250 },
    walls: [
      ...border(),
      { x1: 200, y1: 150, x2: 200, y2: 350 },
      { x1: 350, y1: 80, x2: 350, y2: 250 },
      { x1: 500, y1: 150, x2: 500, y2: 350 },
    ],
  },
  {
    par: 3,
    ball: { x: 100, y: 100 },
    cup: { x: 600, y: 400 },
    walls: [
      ...border(),
      { x1: 150, y1: 200, x2: 400, y2: 200 },
      { x1: 300, y1: 300, x2: 550, y2: 300 },
    ],
  },
  {
    par: 5,
    ball: { x: 80, y: 250 },
    cup: { x: 620, y: 250 },
    walls: [
      ...border(),
      { x1: 180, y1: 20, x2: 180, y2: 180 },
      { x1: 180, y1: 320, x2: 180, y2: H - 20 },
      { x1: 350, y1: 100, x2: 350, y2: 400 },
      { x1: 520, y1: 20, x2: 520, y2: 180 },
      { x1: 520, y1: 320, x2: 520, y2: H - 20 },
    ],
  },
];

// Line segment collision for a moving ball
function reflect(
  bx: number,
  by: number,
  vx: number,
  vy: number,
  w: Wall
): [number, number, number, number] | null {
  const dx = w.x2 - w.x1;
  const dy = w.y2 - w.y1;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;

  // distance from ball center to the line
  const tx = bx - w.x1;
  const ty = by - w.y1;
  const dist = tx * nx + ty * ny;
  const proj = (tx * dx + ty * dy) / (len * len);
  if (proj < 0 || proj > 1) return null;
  if (Math.abs(dist) > BALL_R) return null;

  // push out and reflect velocity
  const sign = dist >= 0 ? 1 : -1;
  const push = BALL_R - Math.abs(dist) + 0.5;
  bx += nx * sign * push;
  by += ny * sign * push;
  const dot = vx * nx + vy * ny;
  vx -= 2 * dot * nx;
  vy -= 2 * dot * ny;
  return [bx, by, vx * 0.85, vy * 0.85];
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [holeIdx, setHoleIdx] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [finished, setFinished] = useState(false);

  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const aimRef = useRef<{
    aiming: boolean;
    startX: number;
    startY: number;
    x: number;
    y: number;
  }>({ aiming: false, startX: 0, startY: 0, x: 0, y: 0 });
  const movingRef = useRef(false);
  const sunkRef = useRef(false);

  useEffect(() => {
    const hole = HOLES[holeIdx];
    ballRef.current = { x: hole.ball.x, y: hole.ball.y, vx: 0, vy: 0 };
    setStrokes(0);
    movingRef.current = false;
    sunkRef.current = false;
  }, [holeIdx]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const draw = () => {
      const hole = HOLES[holeIdx];
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);
      // green
      ctx.fillStyle = "#0f2a35";
      ctx.fillRect(20, 20, W - 40, H - 40);

      // walls
      ctx.strokeStyle = "#7ec8e3";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      for (const w of hole.walls) {
        ctx.beginPath();
        ctx.moveTo(w.x1, w.y1);
        ctx.lineTo(w.x2, w.y2);
        ctx.stroke();
      }

      // cup
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(hole.cup.x, hole.cup.y, CUP_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 2;
      ctx.stroke();
      // flag
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hole.cup.x, hole.cup.y);
      ctx.lineTo(hole.cup.x, hole.cup.y - 30);
      ctx.stroke();
      ctx.fillStyle = "#a78bfa";
      ctx.beginPath();
      ctx.moveTo(hole.cup.x, hole.cup.y - 30);
      ctx.lineTo(hole.cup.x + 14, hole.cup.y - 25);
      ctx.lineTo(hole.cup.x, hole.cup.y - 20);
      ctx.closePath();
      ctx.fill();

      // ball
      const b = ballRef.current;
      ctx.save();
      ctx.shadowColor = "#7ec8e3";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // aim line
      if (aimRef.current.aiming && !movingRef.current) {
        const a = aimRef.current;
        const dx = a.startX - a.x;
        const dy = a.startY - a.y;
        const mag = Math.min(1, Math.hypot(dx, dy) / 120);
        const color =
          mag < 0.4 ? "#7ec8e3" : mag < 0.75 ? "#a78bfa" : "#ef4444";
        ctx.strokeStyle = color;
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + dx, b.y + dy);
        ctx.stroke();
        ctx.setLineDash([]);
        // power bar
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(20, H - 40, 200, 12);
        ctx.fillStyle = color;
        ctx.fillRect(20, H - 40, 200 * mag, 12);
      }
    };

    const step = () => {
      const b = ballRef.current;
      const hole = HOLES[holeIdx];
      if (movingRef.current) {
        let nx = b.x + b.vx;
        let ny = b.y + b.vy;
        for (const w of hole.walls) {
          const r = reflect(nx, ny, b.vx, b.vy, w);
          if (r) {
            nx = r[0];
            ny = r[1];
            b.vx = r[2];
            b.vy = r[3];
          }
        }
        b.x = nx;
        b.y = ny;
        b.vx *= FRICTION;
        b.vy *= FRICTION;
        // cup
        const dxc = b.x - hole.cup.x;
        const dyc = b.y - hole.cup.y;
        const distC = Math.hypot(dxc, dyc);
        if (distC < CUP_R - 2 && Math.hypot(b.vx, b.vy) < 6) {
          movingRef.current = false;
          b.vx = 0;
          b.vy = 0;
          b.x = hole.cup.x;
          b.y = hole.cup.y;
          if (!sunkRef.current) {
            sunkRef.current = true;
            setTimeout(() => {
              setTotalStrokes((t) => t + strokes);
              if (holeIdx + 1 >= HOLES.length) {
                setFinished(true);
              } else {
                setHoleIdx((h) => h + 1);
              }
            }, 700);
          }
        }
        if (Math.hypot(b.vx, b.vy) < 0.05) {
          b.vx = 0;
          b.vy = 0;
          movingRef.current = false;
        }
      }
      draw();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [holeIdx, strokes]);

  const pointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return { x, y };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (movingRef.current || sunkRef.current) return;
    const { x, y } = pointer(e);
    const b = ballRef.current;
    if (Math.hypot(x - b.x, y - b.y) < 28) {
      aimRef.current = { aiming: true, startX: x, startY: y, x, y };
    }
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!aimRef.current.aiming) return;
    const { x, y } = pointer(e);
    aimRef.current.x = x;
    aimRef.current.y = y;
  };
  const onUp = () => {
    if (!aimRef.current.aiming) return;
    const a = aimRef.current;
    const dx = a.startX - a.x;
    const dy = a.startY - a.y;
    const mag = Math.min(1, Math.hypot(dx, dy) / 120);
    const b = ballRef.current;
    const dir = Math.atan2(dy, dx);
    b.vx = Math.cos(dir) * MAX_POWER * mag;
    b.vy = Math.sin(dir) * MAX_POWER * mag;
    if (mag > 0.05) {
      movingRef.current = true;
      setStrokes((s) => s + 1);
    }
    aimRef.current.aiming = false;
  };

  const resetGame = () => {
    setHoleIdx(0);
    setTotalStrokes(0);
    setStrokes(0);
    setFinished(false);
  };

  const totalPar = HOLES.reduce((s, h) => s + h.par, 0);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-steel">MINI</span>
          <span className="text-accent"> GOLF</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Click ball, drag to aim, release to hit.
        </p>
      </div>
      <div className="flex gap-3 text-sm">
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Hole: <span className="text-steel font-bold">{holeIdx + 1}/{HOLES.length}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Par: <span className="text-steel font-bold">{HOLES[holeIdx].par}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Strokes: <span className="text-accent font-bold">{strokes}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Total: <span className="text-accent font-bold">{totalStrokes}</span>
        </div>
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block max-w-[95vw] max-h-[70dvh]"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        {finished && (
          <div className="absolute inset-0 bg-navy-900/90 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">🏆</div>
            <div className="text-2xl font-bold text-accent">Course Complete!</div>
            <div className="text-lg">
              Total: <b>{totalStrokes}</b> (Par {totalPar})
            </div>
            <div className="text-steel font-bold">
              {totalStrokes < totalPar
                ? `${totalPar - totalStrokes} under par!`
                : totalStrokes === totalPar
                  ? "Even par"
                  : `+${totalStrokes - totalPar} over par`}
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-3 rounded-xl bg-accent text-navy-900 font-bold hover:scale-105 transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
