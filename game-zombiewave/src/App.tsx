import { useEffect, useRef, useState } from "react";

type Zombie = { x: number; y: number; hp: number; r: number; speed: number; maxHp: number };
type Bullet = { x: number; y: number; vx: number; vy: number; life: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const W = 480;
const H = 720;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [hp, setHp] = useState(100);
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const stateRef = useRef({
    player: { x: W / 2, y: H / 2, r: 16, cool: 0 },
    zombies: [] as Zombie[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    mouse: { x: W / 2, y: H / 2, down: false },
    wave: 1,
    score: 0,
    hp: 100,
    spawnTimer: 0,
    waveZombiesLeft: 0,
    waveInterval: 0,
    running: false,
  });

  function spawnWave(n: number) {
    const s = stateRef.current;
    s.waveZombiesLeft = 5 + n * 3;
    s.waveInterval = Math.max(30, 80 - n * 4);
    s.spawnTimer = 0;
  }

  function start() {
    const s = stateRef.current;
    s.player = { x: W / 2, y: H / 2, r: 16, cool: 0 };
    s.zombies = [];
    s.bullets = [];
    s.particles = [];
    s.wave = 1;
    s.score = 0;
    s.hp = 100;
    s.running = true;
    spawnWave(1);
    setWave(1);
    setScore(0);
    setHp(100);
    setGameState("playing");
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      s.mouse.x = (e.clientX - rect.left) * (W / rect.width);
      s.mouse.y = (e.clientY - rect.top) * (H / rect.height);
    }
    function onTouch(e: TouchEvent) {
      e.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      const t = e.touches[0] || e.changedTouches[0];
      if (!t) return;
      s.mouse.x = (t.clientX - rect.left) * (W / rect.width);
      s.mouse.y = (t.clientY - rect.top) * (H / rect.height);
    }
    function onMouseDown() { s.mouse.down = true; }
    function onMouseUp() { s.mouse.down = false; }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    canvas.addEventListener("touchend", e => { e.preventDefault(); s.mouse.down = false; });
    canvas.addEventListener("touchstart", () => { s.mouse.down = true; });

    let raf = 0;
    function loop() {
      raf = requestAnimationFrame(loop);
      update();
      draw();
    }

    function update() {
      if (!s.running) return;

      // Spawn zombies
      s.spawnTimer++;
      if (s.waveZombiesLeft > 0 && s.spawnTimer > s.waveInterval) {
        s.spawnTimer = 0;
        s.waveZombiesLeft--;
        const side = Math.floor(Math.random() * 4);
        let x = 0, y = 0;
        if (side === 0) { x = Math.random() * W; y = -20; }
        else if (side === 1) { x = W + 20; y = Math.random() * H; }
        else if (side === 2) { x = Math.random() * W; y = H + 20; }
        else { x = -20; y = Math.random() * H; }
        const hp = 2 + Math.floor(s.wave / 2);
        s.zombies.push({ x, y, hp, maxHp: hp, r: 14, speed: 0.6 + s.wave * 0.08 });
      }

      // Next wave
      if (s.waveZombiesLeft === 0 && s.zombies.length === 0) {
        s.wave++;
        setWave(s.wave);
        spawnWave(s.wave);
      }

      // Shooting
      if (s.mouse.down && s.player.cool <= 0) {
        const dx = s.mouse.x - s.player.x;
        const dy = s.mouse.y - s.player.y;
        const mag = Math.hypot(dx, dy) || 1;
        const sp = 9;
        s.bullets.push({ x: s.player.x, y: s.player.y, vx: dx / mag * sp, vy: dy / mag * sp, life: 70 });
        s.player.cool = 10;
      }
      if (s.player.cool > 0) s.player.cool--;

      // Bullets
      for (const b of s.bullets) {
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
      }
      s.bullets = s.bullets.filter(b => b.life > 0 && b.x > -10 && b.x < W + 10 && b.y > -10 && b.y < H + 10);

      // Zombies
      for (const z of s.zombies) {
        const dx = s.player.x - z.x;
        const dy = s.player.y - z.y;
        const m = Math.hypot(dx, dy) || 1;
        z.x += (dx / m) * z.speed;
        z.y += (dy / m) * z.speed;

        // Collision with player
        if (m < z.r + s.player.r) {
          s.hp -= 1;
          setHp(s.hp);
          if (s.hp <= 0) {
            s.running = false;
            setGameState("over");
          }
        }
      }

      // Bullet vs zombie
      for (const b of s.bullets) {
        for (const z of s.zombies) {
          const d = Math.hypot(b.x - z.x, b.y - z.y);
          if (d < z.r + 3) {
            z.hp--;
            b.life = 0;
            // particles
            for (let i = 0; i < 4; i++) {
              s.particles.push({
                x: z.x, y: z.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 20,
                color: "#a78bfa",
              });
            }
            if (z.hp <= 0) {
              s.score += 10;
              setScore(s.score);
              for (let i = 0; i < 10; i++) {
                s.particles.push({
                  x: z.x, y: z.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  life: 30,
                  color: "#10b981",
                });
              }
            }
            break;
          }
        }
      }
      s.zombies = s.zombies.filter(z => z.hp > 0);
      s.bullets = s.bullets.filter(b => b.life > 0);

      // Particles
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.life--;
      }
      s.particles = s.particles.filter(p => p.life > 0);
    }

    function draw() {
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(126,200,227,0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Player
      ctx.save();
      const angle = Math.atan2(s.mouse.y - s.player.y, s.mouse.x - s.player.x);
      ctx.translate(s.player.x, s.player.y);
      ctx.rotate(angle);
      ctx.fillStyle = "#7ec8e3";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#7ec8e3";
      ctx.beginPath();
      ctx.arc(0, 0, s.player.r, 0, Math.PI * 2);
      ctx.fill();
      // gun barrel
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(s.player.r - 2, -3, 14, 6);
      ctx.restore();
      ctx.shadowBlur = 0;

      // Zombies
      for (const z of s.zombies) {
        ctx.fillStyle = "#22c55e";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#22c55e";
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // eyes
        ctx.fillStyle = "#0a0e27";
        ctx.beginPath();
        ctx.arc(z.x - 5, z.y - 3, 2, 0, Math.PI * 2);
        ctx.arc(z.x + 5, z.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        // hp bar
        if (z.hp < z.maxHp) {
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(z.x - 14, z.y - z.r - 6, 28, 3);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(z.x - 14, z.y - z.r - 6, 28 * (z.hp / z.maxHp), 3);
        }
      }

      // Bullets
      for (const b of s.bullets) {
        ctx.fillStyle = "#fbbf24";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#fbbf24";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Particles
      for (const p of s.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Crosshair
      ctx.strokeStyle = "rgba(126,200,227,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(s.mouse.x, s.mouse.y, 10, 0, Math.PI * 2);
      ctx.moveTo(s.mouse.x - 14, s.mouse.y);
      ctx.lineTo(s.mouse.x + 14, s.mouse.y);
      ctx.moveTo(s.mouse.x, s.mouse.y - 14);
      ctx.lineTo(s.mouse.x, s.mouse.y + 14);
      ctx.stroke();
    }

    loop();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div className="w-full max-w-md p-3 relative">
      <div className="flex items-center justify-between mb-2 mt-14 px-1">
        <div className="text-sm text-steel font-semibold">Wave {wave}</div>
        <div className="text-sm text-white/70">Score: <span className="text-accent font-bold">{score}</span></div>
      </div>
      <div className="mb-2 bg-navy-800 rounded-full h-2 overflow-hidden border border-white/10">
        <div className="h-full bg-red-500 transition-all" style={{ width: `${Math.max(0, hp)}%` }} />
      </div>
      <div className="relative bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <canvas ref={canvasRef} width={W} height={H} className="w-full block" style={{ aspectRatio: `${W}/${H}` }} />
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-6">
            {gameState === "menu" ? (
              <>
                <div className="text-6xl mb-3">🧟</div>
                <h1 className="text-2xl font-bold text-steel mb-2">Zombie Wave</h1>
                <p className="text-xs text-white/60 mb-5 text-center">Aim with mouse. Hold to shoot. Survive as many waves as you can.</p>
                <button onClick={start} className="bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 px-6 rounded-xl transition">
                  Start
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-3">💀</div>
                <h1 className="text-2xl font-bold text-red-400 mb-1">Game Over</h1>
                <p className="text-white/70 mb-1">Wave: {wave}</p>
                <p className="text-white/70 mb-5">Score: {score}</p>
                <button onClick={start} className="bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 px-6 rounded-xl transition">
                  Play Again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
