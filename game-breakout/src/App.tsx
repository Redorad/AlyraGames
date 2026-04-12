import { useEffect, useRef, useState } from 'react';

const W = 720;
const H = 540;
const PADDLE_W = 110;
const PADDLE_H = 14;
const BALL_R = 8;
const BRICK_ROWS = 6;
const BRICK_COLS = 11;
const BRICK_W = 58;
const BRICK_H = 22;
const BRICK_MARGIN = 4;
const BRICK_TOP = 60;
const BRICK_LEFT = (W - (BRICK_COLS * (BRICK_W + BRICK_MARGIN) - BRICK_MARGIN)) / 2;

type Ball = { x: number; y: number; vx: number; vy: number };
type Brick = { x: number; y: number; hp: number; color: string };
type Power = { x: number; y: number; type: 'multi' | 'wide' | 'life' };

const BRICK_COLORS = ['#ef4444', '#fbbf24', '#22c55e', '#7ec8e3', '#a78bfa', '#ec4899'];

function buildBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_LEFT + c * (BRICK_W + BRICK_MARGIN),
        y: BRICK_TOP + r * (BRICK_H + BRICK_MARGIN),
        hp: r < 2 ? 2 : 1,
        color: BRICK_COLORS[r],
      });
    }
  }
  return bricks;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'over'>('playing');
  const [best, setBest] = useState<number>(() => parseInt(localStorage.getItem('breakout-best') || '0'));

  const stateRef = useRef({
    paddleX: W / 2 - PADDLE_W / 2,
    paddleW: PADDLE_W,
    balls: [] as Ball[],
    bricks: [] as Brick[],
    powers: [] as Power[],
    mouseX: W / 2,
    score: 0,
    lives: 3,
    over: false,
    won: false,
  });

  const reset = () => {
    stateRef.current = {
      paddleX: W / 2 - PADDLE_W / 2,
      paddleW: PADDLE_W,
      balls: [{ x: W / 2, y: H - 60, vx: 4, vy: -4 }],
      bricks: buildBricks(),
      powers: [],
      mouseX: W / 2,
      score: 0,
      lives: 3,
      over: false,
      won: false,
    };
    setScore(0);
    setLives(3);
    setGameState('playing');
  };

  useEffect(() => {
    reset();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let lastTime = 0;
    const TARGET_DT = 1000 / 60; // 60 fps baseline

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = ((e.clientX - rect.left) / rect.width) * W;
    };
    canvas.addEventListener('mousemove', handleMove);

    const loop = (now: number) => {
      if (!lastTime) lastTime = now;
      const rawDt = now - lastTime;
      lastTime = now;
      const dt = Math.min(rawDt, 50) / TARGET_DT; // clamp to avoid spiral of death

      const s = stateRef.current;
      // Paddle follows mouse
      s.paddleX = Math.max(0, Math.min(W - s.paddleW, s.mouseX - s.paddleW / 2));

      if (!s.over && !s.won) {
        // Balls
        for (let i = s.balls.length - 1; i >= 0; i--) {
          const b = s.balls[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x < BALL_R) { b.x = BALL_R; b.vx *= -1; }
          if (b.x > W - BALL_R) { b.x = W - BALL_R; b.vx *= -1; }
          if (b.y < BALL_R) { b.y = BALL_R; b.vy *= -1; }
          if (b.y > H) {
            s.balls.splice(i, 1);
            continue;
          }
          // Paddle
          if (b.y + BALL_R >= H - 30 && b.y + BALL_R <= H - 30 + PADDLE_H + 4 && b.x >= s.paddleX && b.x <= s.paddleX + s.paddleW && b.vy > 0) {
            b.vy *= -1;
            const hit = (b.x - s.paddleX) / s.paddleW - 0.5;
            b.vx = hit * 8;
          }
          // Bricks
          for (let j = 0; j < s.bricks.length; j++) {
            const br = s.bricks[j];
            if (b.x > br.x && b.x < br.x + BRICK_W && b.y > br.y && b.y < br.y + BRICK_H) {
              br.hp--;
              if (br.hp <= 0) {
                s.bricks.splice(j, 1);
                s.score += 10;
                if (Math.random() < 0.12) {
                  const types: Power['type'][] = ['multi', 'wide', 'life'];
                  s.powers.push({ x: br.x + BRICK_W / 2, y: br.y, type: types[Math.floor(Math.random() * types.length)] });
                }
              }
              b.vy *= -1;
              break;
            }
          }
        }
        // Powers fall
        for (let i = s.powers.length - 1; i >= 0; i--) {
          const p = s.powers[i];
          p.y += 2.5 * dt;
          if (p.y > H) { s.powers.splice(i, 1); continue; }
          if (p.y > H - 30 && p.y < H - 30 + PADDLE_H + 10 && p.x > s.paddleX && p.x < s.paddleX + s.paddleW) {
            if (p.type === 'multi') {
              const extras: Ball[] = [];
              s.balls.forEach(b => {
                extras.push({ x: b.x, y: b.y, vx: -b.vx, vy: b.vy });
                extras.push({ x: b.x, y: b.y, vx: b.vy, vy: -b.vx });
              });
              s.balls.push(...extras);
            } else if (p.type === 'wide') {
              s.paddleW = Math.min(200, s.paddleW + 30);
            } else if (p.type === 'life') {
              s.lives++;
              setLives(s.lives);
            }
            s.powers.splice(i, 1);
          }
        }
        if (s.balls.length === 0) {
          s.lives--;
          setLives(s.lives);
          if (s.lives <= 0) {
            s.over = true;
            setGameState('over');
            if (s.score > best) {
              setBest(s.score);
              localStorage.setItem('breakout-best', String(s.score));
            }
          } else {
            s.balls.push({ x: W / 2, y: H - 60, vx: 4, vy: -4 });
          }
        }
        if (s.bricks.length === 0) {
          s.won = true;
          setGameState('won');
          if (s.score > best) {
            setBest(s.score);
            localStorage.setItem('breakout-best', String(s.score));
          }
        }
        setScore(s.score);
      }

      // Draw
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, W, H);

      // Bricks
      s.bricks.forEach(br => {
        ctx.fillStyle = br.color;
        ctx.globalAlpha = br.hp === 2 ? 1 : 0.7;
        ctx.fillRect(br.x, br.y, BRICK_W, BRICK_H);
        ctx.globalAlpha = 1;
      });

      // Paddle
      ctx.fillStyle = '#7ec8e3';
      ctx.fillRect(s.paddleX, H - 30, s.paddleW, PADDLE_H);

      // Balls
      ctx.fillStyle = '#a78bfa';
      s.balls.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
      });

      // Powers
      s.powers.forEach(p => {
        ctx.fillStyle = p.type === 'multi' ? '#a78bfa' : p.type === 'wide' ? '#7ec8e3' : '#22c55e';
        ctx.fillRect(p.x - 10, p.y - 6, 20, 12);
        ctx.fillStyle = '#0a0e27';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(p.type === 'multi' ? 'M' : p.type === 'wide' ? 'W' : 'L', p.x - 3, p.y + 4);
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', handleMove);
    };
  }, [best]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3">
      <h1 className="text-3xl font-black tracking-tight">
        <span className="text-steel">BREAK</span>
        <span className="text-accent">OUT</span>
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
        className="rounded-xl border border-navy-700 cursor-none"
        style={{ maxWidth: '100%', maxHeight: '75vh' }}
      />
      <div className="text-xs text-slate-400">Move mouse to control paddle. M=multi W=wide L=life</div>
      {gameState !== 'playing' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-navy-800 border border-accent/40 rounded-2xl p-8 text-center">
            <div className="text-2xl font-black text-accent mb-2">{gameState === 'won' ? 'You Win!' : 'Game Over'}</div>
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
