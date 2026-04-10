import { useEffect, useRef, useState } from "react";

const W = 640;
const H = 360;
const GROUND_Y = H - 60;
const PLAYER_X = 100;
const PLAYER_SIZE = 28;
const GRAVITY = 0.0015;
const JUMP_VEL = -0.55;
const BASE_SPEED = 0.22;

type Obstacle = { x: number; type: "spike" | "block"; w: number; h: number };

function makeObstacle(x: number): Obstacle {
  const r = Math.random();
  if (r < 0.55) return { x, type: "spike", w: 28, h: 28 };
  if (r < 0.85) return { x, type: "block", w: 28, h: 28 };
  return { x, type: "block", w: 28, h: 56 };
}

function loadBest(): number {
  try {
    return parseInt(localStorage.getItem("geo_best") || "0", 10);
  } catch {
    return 0;
  }
}
function saveBest(n: number) {
  try {
    localStorage.setItem("geo_best", String(n));
  } catch {}
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    playerY: GROUND_Y - PLAYER_SIZE,
    playerVY: 0,
    onGround: true,
    rotation: 0,
    obstacles: [] as Obstacle[],
    distance: 0,
    speed: BASE_SPEED,
    dead: false,
    tick: 0,
    spawnCooldown: 200,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
  });
  const [, setTick] = useState(0);
  const [best, setBest] = useState(loadBest());
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = 0;

    const reset = () => {
      stateRef.current = {
        playerY: GROUND_Y - PLAYER_SIZE,
        playerVY: 0,
        onGround: true,
        rotation: 0,
        obstacles: [],
        distance: 0,
        speed: BASE_SPEED,
        dead: false,
        tick: 0,
        spawnCooldown: 200,
        particles: [],
      };
    };

    const jump = () => {
      const s = stateRef.current;
      if (s.dead) {
        reset();
        setStarted(true);
        setTick((t) => t + 1);
        return;
      }
      if (!started) {
        setStarted(true);
      }
      if (s.onGround) {
        s.playerVY = JUMP_VEL;
        s.onGround = false;
      }
    };

    const update = (dt: number) => {
      const s = stateRef.current;
      if (!started || s.dead) return;
      s.tick += dt;
      s.speed = BASE_SPEED + Math.min(0.2, s.distance / 20000);
      s.distance += s.speed * dt;

      // Player
      s.playerVY += GRAVITY * dt;
      s.playerY += s.playerVY * dt;
      if (s.playerY >= GROUND_Y - PLAYER_SIZE) {
        s.playerY = GROUND_Y - PLAYER_SIZE;
        s.playerVY = 0;
        if (!s.onGround) {
          // snap rotation
          s.rotation = 0;
        }
        s.onGround = true;
      }
      if (!s.onGround) {
        s.rotation += dt * 0.008;
      }

      // Move obstacles
      for (const o of s.obstacles) o.x -= s.speed * dt;
      s.obstacles = s.obstacles.filter((o) => o.x + o.w > -20);

      // Spawn
      s.spawnCooldown -= dt;
      if (s.spawnCooldown <= 0) {
        s.obstacles.push(makeObstacle(W + 40));
        s.spawnCooldown = 500 + Math.random() * 700;
      }

      // Collision
      const px = PLAYER_X;
      const py = s.playerY;
      for (const o of s.obstacles) {
        const oy = GROUND_Y - o.h;
        if (
          px + PLAYER_SIZE > o.x &&
          px < o.x + o.w &&
          py + PLAYER_SIZE > oy &&
          py < oy + o.h
        ) {
          s.dead = true;
          for (let i = 0; i < 24; i++) {
            s.particles.push({
              x: px + PLAYER_SIZE / 2,
              y: py + PLAYER_SIZE / 2,
              vx: (Math.random() - 0.5) * 0.6,
              vy: (Math.random() - 0.5) * 0.6,
              life: 600,
            });
          }
          const d = Math.floor(s.distance / 10);
          if (d > best) {
            setBest(d);
            saveBest(d);
          }
          setTick((t) => t + 1);
          break;
        }
      }

      // Particles
      for (const p of s.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.001 * dt;
        p.life -= dt;
      }
      s.particles = s.particles.filter((p) => p.life > 0);
    };

    const draw = () => {
      const s = stateRef.current;
      // BG gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#1a0b3d");
      bg.addColorStop(1, "#0a0e27");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Grid lines scrolling
      ctx.strokeStyle = "rgba(167,139,250,0.08)";
      ctx.lineWidth = 1;
      const gridOffset = (s.distance / 2) % 40;
      for (let x = -gridOffset; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GROUND_Y);
        ctx.stroke();
      }
      for (let y = 0; y < GROUND_Y; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Ground
      ctx.fillStyle = "#1a2050";
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.strokeStyle = "#a78bfa";
      ctx.shadowColor = "#a78bfa";
      ctx.shadowBlur = 15;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(W, GROUND_Y);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Ground scrolling marks
      ctx.strokeStyle = "rgba(126,200,227,0.3)";
      for (let x = -((s.distance / 1) % 20); x < W; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x - 5, H);
        ctx.stroke();
      }

      // Obstacles
      for (const o of s.obstacles) {
        const oy = GROUND_Y - o.h;
        if (o.type === "spike") {
          ctx.fillStyle = "#ef4444";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(o.x, GROUND_Y);
          ctx.lineTo(o.x + o.w / 2, oy);
          ctx.lineTo(o.x + o.w, GROUND_Y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = "#111640";
          ctx.strokeStyle = "#7ec8e3";
          ctx.lineWidth = 2;
          ctx.shadowColor = "#7ec8e3";
          ctx.shadowBlur = 8;
          ctx.fillRect(o.x, oy, o.w, o.h);
          ctx.strokeRect(o.x, oy, o.w, o.h);
          ctx.shadowBlur = 0;
        }
      }

      // Player
      ctx.save();
      ctx.translate(PLAYER_X + PLAYER_SIZE / 2, s.playerY + PLAYER_SIZE / 2);
      ctx.rotate(s.rotation);
      ctx.fillStyle = "#a78bfa";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#a78bfa";
      ctx.shadowBlur = 18;
      ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
      ctx.strokeRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
      ctx.shadowBlur = 0;
      // Eye
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-4, -6, 8, 10);
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(-2, -4, 4, 6);
      ctx.restore();

      // Particles
      for (const p of s.particles) {
        ctx.fillStyle = `rgba(167,139,250,${p.life / 600})`;
        ctx.fillRect(p.x, p.y, 4, 4);
      }

      // Score overlay
      ctx.fillStyle = "#7ec8e3";
      ctx.font = "bold 18px -apple-system";
      ctx.textAlign = "right";
      ctx.fillText(Math.floor(s.distance / 10).toString(), W - 20, 30);
      ctx.font = "10px -apple-system";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("BEST " + best, W - 20, 46);

      if (s.dead) {
        ctx.fillStyle = "rgba(10,14,39,0.85)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 36px -apple-system";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W / 2, H / 2 - 10);
        ctx.fillStyle = "#7ec8e3";
        ctx.font = "14px -apple-system";
        ctx.fillText("Click to restart", W / 2, H / 2 + 20);
      } else if (!started) {
        ctx.fillStyle = "rgba(10,14,39,0.7)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "bold 32px -apple-system";
        ctx.textAlign = "center";
        ctx.fillText("GEOMETRY RUSH", W / 2, H / 2 - 10);
        ctx.fillStyle = "#7ec8e3";
        ctx.font = "14px -apple-system";
        ctx.fillText("Click or press Space to jump", W / 2, H / 2 + 20);
      }
    };

    const loop = (t: number) => {
      const dt = last ? Math.min(t - last, 32) : 16;
      last = t;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = () => jump();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        jump();
      }
    };
    canvas.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [best, started]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-4 px-4 gap-3">
      <h1 className="text-2xl font-black tracking-wider">
        <span className="text-steel">GEOMETRY</span>
        <span className="text-accent"> RUSH</span>
      </h1>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-accent/30 cursor-pointer"
        style={{ maxWidth: "95vw" }}
      />
      <div className="text-xs text-slate-500">
        Click or press Space to jump. Avoid spikes and blocks.
      </div>
    </div>
  );
}
