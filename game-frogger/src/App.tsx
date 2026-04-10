import { useEffect, useRef, useState } from 'react';

const CELL = 48;
const COLS = 13;
const ROWS = 13;
const W = CELL * COLS;
const H = CELL * ROWS;

type Car = { x: number; y: number; w: number; speed: number; lane: number };

interface Lane {
  row: number;
  dir: 1 | -1;
  speed: number;
  carLen: number;
  spacing: number;
}

const LANES: Lane[] = [
  { row: 10, dir: 1, speed: 80, carLen: 60, spacing: 200 },
  { row: 9, dir: -1, speed: 120, carLen: 80, spacing: 260 },
  { row: 8, dir: 1, speed: 140, carLen: 50, spacing: 180 },
  { row: 7, dir: -1, speed: 100, carLen: 100, spacing: 300 },
  { row: 6, dir: 1, speed: 180, carLen: 60, spacing: 220 },
  { row: 5, dir: -1, speed: 90, carLen: 70, spacing: 240 },
  { row: 4, dir: 1, speed: 130, carLen: 90, spacing: 280 },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [best, setBest] = useState<number>(() => parseInt(localStorage.getItem('frogger-best') || '0'));

  const frogRef = useRef({ x: Math.floor(COLS / 2), y: ROWS - 1 });
  const carsRef = useRef<Car[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const overRef = useRef(false);

  useEffect(() => {
    // Initialize cars
    const cars: Car[] = [];
    LANES.forEach((lane, i) => {
      const count = Math.floor(W / lane.spacing) + 1;
      for (let c = 0; c < count; c++) {
        cars.push({
          x: c * lane.spacing + (lane.dir === 1 ? 0 : W),
          y: lane.row * CELL + 6,
          w: lane.carLen,
          speed: lane.speed * lane.dir,
          lane: i,
        });
      }
    });
    carsRef.current = cars;
  }, []);

  const reset = () => {
    frogRef.current = { x: Math.floor(COLS / 2), y: ROWS - 1 };
    setScore(0); scoreRef.current = 0;
    setLives(3); livesRef.current = 3;
    setGameOver(false); overRef.current = false;
  };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (overRef.current) return;
      if (e.key === 'ArrowUp' || e.key === 'w') { frogRef.current.y = Math.max(0, frogRef.current.y - 1); e.preventDefault(); }
      else if (e.key === 'ArrowDown' || e.key === 's') { frogRef.current.y = Math.min(ROWS - 1, frogRef.current.y + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'a') { frogRef.current.x = Math.max(0, frogRef.current.x - 1); e.preventDefault(); }
      else if (e.key === 'ArrowRight' || e.key === 'd') { frogRef.current.x = Math.min(COLS - 1, frogRef.current.x + 1); e.preventDefault(); }
      if (frogRef.current.y === 0) {
        scoreRef.current += 100;
        setScore(scoreRef.current);
        frogRef.current = { x: Math.floor(COLS / 2), y: ROWS - 1 };
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let last = performance.now();
    let raf = 0;

    const draw = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;

      // Update cars
      if (!overRef.current) {
        carsRef.current.forEach(car => {
          car.x += car.speed * dt;
          if (car.speed > 0 && car.x > W + 100) car.x = -car.w - 20;
          if (car.speed < 0 && car.x < -car.w - 100) car.x = W + 20;
        });
        // Collision
        const fx = frogRef.current.x * CELL + CELL / 2;
        const fy = frogRef.current.y * CELL + CELL / 2;
        for (const car of carsRef.current) {
          if (fy >= car.y && fy <= car.y + CELL - 12) {
            if (fx > car.x && fx < car.x + car.w) {
              livesRef.current--;
              setLives(livesRef.current);
              frogRef.current = { x: Math.floor(COLS / 2), y: ROWS - 1 };
              if (livesRef.current <= 0) {
                overRef.current = true;
                setGameOver(true);
                if (scoreRef.current > best) {
                  setBest(scoreRef.current);
                  localStorage.setItem('frogger-best', String(scoreRef.current));
                }
              }
              break;
            }
          }
        }
      }

      // Draw
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, W, H);

      // Goal (top row)
      ctx.fillStyle = '#1a2050';
      ctx.fillRect(0, 0, W, CELL);
      ctx.fillStyle = '#a78bfa';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(i * CELL * 2.5 + 10, 8, CELL - 20, CELL - 16);
      }

      // Safe rows
      ctx.fillStyle = '#111640';
      ctx.fillRect(0, 3 * CELL, W, CELL);
      ctx.fillRect(0, 11 * CELL, W, CELL);
      ctx.fillRect(0, 12 * CELL, W, CELL);

      // Road lines
      ctx.strokeStyle = 'rgba(126,200,227,0.2)';
      ctx.setLineDash([8, 8]);
      for (let r = 4; r <= 10; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(W, r * CELL);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Cars
      carsRef.current.forEach(car => {
        ctx.fillStyle = car.speed > 0 ? '#7ec8e3' : '#a78bfa';
        ctx.fillRect(car.x, car.y, car.w, CELL - 12);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(car.x + 8, car.y + 6, 10, 6);
        ctx.fillRect(car.x + car.w - 18, car.y + 6, 10, 6);
      });

      // Frog
      const fx = frogRef.current.x * CELL;
      const fy = frogRef.current.y * CELL;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(fx + 6, fy + 6, CELL - 12, CELL - 12);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(fx + 10, fy + 10, 6, 6);
      ctx.fillRect(fx + CELL - 16, fy + 10, 6, 6);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [best]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
      <h1 className="text-3xl font-black tracking-tight">
        <span className="text-steel">FROG</span>
        <span className="text-accent">GER</span>
      </h1>
      <div className="flex gap-6 text-sm">
        <div>Score: <span className="text-steel font-mono">{score}</span></div>
        <div>Lives: <span className="text-accent font-mono">{lives}</span></div>
        <div>Best: <span className="text-slate-300 font-mono">{best}</span></div>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-navy-700"
        style={{ maxWidth: '100%', maxHeight: '75vh' }}
      />
      <div className="text-xs text-slate-400">Arrow keys / WASD to move. Reach the top to score.</div>
      {gameOver && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-navy-800 border border-accent/40 rounded-2xl p-8 text-center">
            <div className="text-2xl font-black text-accent mb-2">Game Over</div>
            <div className="text-sm text-slate-300 mb-4">Score: {score}</div>
            <button onClick={reset} className="px-4 py-2 rounded-lg bg-accent text-navy-900 font-bold">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
