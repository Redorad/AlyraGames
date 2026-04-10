import { useEffect, useRef, useState } from 'react';

const W = 800;
const H = 500;
const PLAYER_SIZE = 24;
const GROUND_H = 60;
const CEIL_H = 60;

type Spike = { x: number; top: boolean; w: number };

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => parseInt(localStorage.getItem('gravity-best') || '0'));
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const stateRef = useRef({
    y: H - GROUND_H - PLAYER_SIZE,
    vy: 0,
    gravity: 1, // 1 = down, -1 = up
    flipping: 0,
    spikes: [] as Spike[],
    spawnTimer: 0,
    speed: 4,
    score: 0,
    over: false,
    running: false,
  });

  const reset = () => {
    stateRef.current = {
      y: H - GROUND_H - PLAYER_SIZE,
      vy: 0,
      gravity: 1,
      flipping: 0,
      spikes: [],
      spawnTimer: 0,
      speed: 4,
      score: 0,
      over: false,
      running: true,
    };
    setScore(0);
    setRunning(true);
    setGameOver(false);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (stateRef.current.over) {
          reset();
          return;
        }
        if (!stateRef.current.running) {
          reset();
          return;
        }
        stateRef.current.gravity *= -1;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const loop = () => {
      const s = stateRef.current;

      if (s.running && !s.over) {
        // Apply gravity
        s.vy += s.gravity * 0.9;
        s.vy = Math.max(-14, Math.min(14, s.vy));
        s.y += s.vy;

        const floorY = H - GROUND_H - PLAYER_SIZE;
        const ceilY = CEIL_H;
        if (s.y >= floorY) { s.y = floorY; s.vy = 0; }
        if (s.y <= ceilY) { s.y = ceilY; s.vy = 0; }

        // Spawn spikes
        s.spawnTimer -= 1;
        if (s.spawnTimer <= 0) {
          s.spawnTimer = 60 + Math.random() * 40;
          const top = Math.random() < 0.5;
          s.spikes.push({ x: W + 40, top, w: 40 });
        }

        // Move spikes
        s.spikes.forEach(sp => sp.x -= s.speed);
        s.spikes = s.spikes.filter(sp => sp.x + sp.w > 0);

        // Collision (player at fixed x)
        const px = 120;
        for (const sp of s.spikes) {
          if (sp.x < px + PLAYER_SIZE && sp.x + sp.w > px) {
            const spikeY = sp.top ? CEIL_H : H - GROUND_H - 40;
            const spikeH = 40;
            if (s.y < spikeY + spikeH && s.y + PLAYER_SIZE > spikeY) {
              s.over = true;
              setGameOver(true);
              if (s.score > best) {
                setBest(s.score);
                localStorage.setItem('gravity-best', String(s.score));
              }
            }
          }
        }

        s.score += 1;
        setScore(s.score);
        if (s.score % 500 === 0) s.speed += 0.4;
      }

      // Draw
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137 + Math.floor(s.score * 0.5)) % W;
        const sy = (i * 79) % H;
        ctx.fillStyle = `rgba(126,200,227,${0.3 + (i % 3) * 0.2})`;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Floor/ceiling
      ctx.fillStyle = '#1a2050';
      ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
      ctx.fillRect(0, 0, W, CEIL_H);
      ctx.strokeStyle = '#7ec8e3';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - GROUND_H);
      ctx.lineTo(W, H - GROUND_H);
      ctx.moveTo(0, CEIL_H);
      ctx.lineTo(W, CEIL_H);
      ctx.stroke();

      // Spikes
      s.spikes.forEach(sp => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        if (sp.top) {
          ctx.moveTo(sp.x, CEIL_H);
          ctx.lineTo(sp.x + sp.w / 2, CEIL_H + 40);
          ctx.lineTo(sp.x + sp.w, CEIL_H);
        } else {
          ctx.moveTo(sp.x, H - GROUND_H);
          ctx.lineTo(sp.x + sp.w / 2, H - GROUND_H - 40);
          ctx.lineTo(sp.x + sp.w, H - GROUND_H);
        }
        ctx.closePath();
        ctx.fill();
      });

      // Player
      ctx.fillStyle = '#a78bfa';
      ctx.shadowColor = '#a78bfa';
      ctx.shadowBlur = 12;
      ctx.fillRect(120, s.y, PLAYER_SIZE, PLAYER_SIZE);
      ctx.shadowBlur = 0;

      if (!s.running) {
        ctx.fillStyle = 'rgba(10,14,39,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#7ec8e3';
        ctx.font = 'bold 28px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to start', W / 2, H / 2);
        ctx.font = '14px -apple-system, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Press SPACE to flip gravity. Avoid the spikes!', W / 2, H / 2 + 30);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [best]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3">
      <h1 className="text-3xl font-black tracking-tight">
        <span className="text-steel">GRAVITY</span>
        <span className="text-accent"> FLIP</span>
      </h1>
      <div className="flex gap-6 text-sm">
        <div>Score: <span className="text-steel font-mono">{score}</span></div>
        <div>Best: <span className="text-accent font-mono">{best}</span></div>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-navy-700"
        style={{ maxWidth: '100%', maxHeight: '75vh' }}
      />
      <div className="text-xs text-slate-400">SPACE to flip gravity. Avoid the red spikes.</div>
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
