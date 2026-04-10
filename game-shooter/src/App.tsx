import { useEffect, useRef, useState } from 'react';

const W = 800;
const H = 560;
const PLAYER_R = 14;
const BULLET_R = 4;
const ENEMY_R = 16;

type Bullet = { x: number; y: number; vx: number; vy: number };
type Enemy = { x: number; y: number; hp: number };

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [hp, setHp] = useState(3);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState<number>(() => parseInt(localStorage.getItem('shooter-best') || '0'));

  const stateRef = useRef({
    px: W / 2,
    py: H / 2,
    keys: {} as Record<string, boolean>,
    mouse: { x: W / 2, y: H / 2 },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    score: 0,
    wave: 1,
    hp: 3,
    over: false,
    waveTimer: 0,
    spawnTimer: 0,
    toSpawn: 0,
    shootCooldown: 0,
  });

  const reset = () => {
    stateRef.current = {
      px: W / 2,
      py: H / 2,
      keys: {},
      mouse: { x: W / 2, y: H / 2 },
      bullets: [],
      enemies: [],
      score: 0,
      wave: 1,
      hp: 3,
      over: false,
      waveTimer: 0,
      spawnTimer: 0,
      toSpawn: 5,
      shootCooldown: 0,
    };
    setScore(0);
    setWave(1);
    setHp(3);
    setOver(false);
  };

  useEffect(() => {
    reset();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouse.x = ((e.clientX - rect.left) / rect.width) * W;
      stateRef.current.mouse.y = ((e.clientY - rect.top) / rect.height) * H;
    };
    const onClick = (e: MouseEvent) => {
      const s = stateRef.current;
      if (s.over) return;
      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * W;
      const my = ((e.clientY - rect.top) / rect.height) * H;
      const dx = mx - s.px, dy = my - s.py;
      const len = Math.max(1, Math.hypot(dx, dy));
      s.bullets.push({ x: s.px, y: s.py, vx: (dx / len) * 9, vy: (dy / len) * 9 });
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('click', onClick);

    const spawnEnemy = () => {
      const s = stateRef.current;
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (side === 0) { x = Math.random() * W; y = -20; }
      else if (side === 1) { x = W + 20; y = Math.random() * H; }
      else if (side === 2) { x = Math.random() * W; y = H + 20; }
      else { x = -20; y = Math.random() * H; }
      s.enemies.push({ x, y, hp: 1 + Math.floor(s.wave / 3) });
    };

    const loop = () => {
      const s = stateRef.current;

      if (!s.over) {
        // Movement
        const speed = 3.5;
        if (s.keys['arrowup'] || s.keys['w']) s.py -= speed;
        if (s.keys['arrowdown'] || s.keys['s']) s.py += speed;
        if (s.keys['arrowleft'] || s.keys['a']) s.px -= speed;
        if (s.keys['arrowright'] || s.keys['d']) s.px += speed;
        s.px = Math.max(PLAYER_R, Math.min(W - PLAYER_R, s.px));
        s.py = Math.max(PLAYER_R, Math.min(H - PLAYER_R, s.py));

        // Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.x += b.vx;
          b.y += b.vy;
          if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) { s.bullets.splice(i, 1); continue; }
          // Hit enemy?
          for (let j = s.enemies.length - 1; j >= 0; j--) {
            const e = s.enemies[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < ENEMY_R + BULLET_R) {
              e.hp--;
              s.bullets.splice(i, 1);
              if (e.hp <= 0) {
                s.enemies.splice(j, 1);
                s.score += 10;
                setScore(s.score);
              }
              break;
            }
          }
        }

        // Enemies move toward player
        s.enemies.forEach(e => {
          const dx = s.px - e.x, dy = s.py - e.y;
          const len = Math.max(1, Math.hypot(dx, dy));
          e.x += (dx / len) * 1.3;
          e.y += (dy / len) * 1.3;
        });

        // Enemy hit player
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const e = s.enemies[i];
          if (Math.hypot(e.x - s.px, e.y - s.py) < ENEMY_R + PLAYER_R) {
            s.enemies.splice(i, 1);
            s.hp--;
            setHp(s.hp);
            if (s.hp <= 0) {
              s.over = true;
              setOver(true);
              if (s.score > best) {
                setBest(s.score);
                localStorage.setItem('shooter-best', String(s.score));
              }
            }
          }
        }

        // Wave spawning
        if (s.toSpawn > 0) {
          s.spawnTimer -= 1;
          if (s.spawnTimer <= 0) {
            spawnEnemy();
            s.toSpawn -= 1;
            s.spawnTimer = 40;
          }
        } else if (s.enemies.length === 0) {
          s.wave++;
          setWave(s.wave);
          s.toSpawn = 5 + s.wave * 2;
          s.spawnTimer = 60;
        }
      }

      // Draw
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(126,200,227,0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Bullets
      ctx.fillStyle = '#7ec8e3';
      s.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
        ctx.fill();
      });

      // Enemies
      s.enemies.forEach(e => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(e.x, e.y, ENEMY_R, 0, Math.PI * 2);
        ctx.fill();
      });

      // Player
      ctx.fillStyle = '#a78bfa';
      ctx.shadowColor = '#a78bfa';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.px, s.py, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Aim line
      const dx = s.mouse.x - s.px, dy = s.mouse.y - s.py;
      const len = Math.max(1, Math.hypot(dx, dy));
      ctx.strokeStyle = 'rgba(126,200,227,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.px, s.py);
      ctx.lineTo(s.px + (dx / len) * 30, s.py + (dy / len) * 30);
      ctx.stroke();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('click', onClick);
    };
  }, [best]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3">
      <h1 className="text-3xl font-black tracking-tight">
        <span className="text-steel">TOP</span>
        <span className="text-accent">-DOWN SHOOTER</span>
      </h1>
      <div className="flex gap-6 text-sm">
        <div>Score: <span className="text-steel font-mono">{score}</span></div>
        <div>Wave: <span className="text-accent font-mono">{wave}</span></div>
        <div>HP: <span className="text-red-400 font-mono">{hp}</span></div>
        <div>Best: <span className="text-slate-300 font-mono">{best}</span></div>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-navy-700"
        style={{ maxWidth: '100%', maxHeight: '75vh' }}
      />
      <div className="text-xs text-slate-400">WASD / arrows to move. Click to shoot.</div>
      {over && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-navy-800 border border-accent/40 rounded-2xl p-8 text-center">
            <div className="text-2xl font-black text-accent mb-2">Game Over</div>
            <div className="text-sm text-slate-300 mb-4">Score: {score} — Wave {wave}</div>
            <button onClick={reset} className="px-4 py-2 rounded-lg bg-accent text-navy-900 font-bold">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
