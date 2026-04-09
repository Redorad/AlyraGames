import { useEffect, useRef, useCallback, useState } from "react";

/* ───── constants ───── */
const W = 480, H = 720;
const SHIP_W = 32, SHIP_H = 24;
const STAR_COUNT = 80;

interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }
interface Asteroid { x: number; y: number; r: number; speed: number; angle: number; }
interface Bullet { x: number; y: number; speed: number; }

/* ───── audio helper (Web Audio API) ───── */
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}
function playSound(freq: number, dur: number, type: OscillatorType = "square", vol = 0.1) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch {}
}

function getHighScore(): number { return Number(localStorage.getItem("space-dodge-hi") || "0"); }
function setHighScore(s: number) { localStorage.setItem("space-dodge-hi", String(s)); }

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"menu" | "play" | "over">("menu");
  const stateRef = useRef(state);
  stateRef.current = state;

  const shipRef = useRef({ x: W / 2, y: H - 100 });
  const asteroidsRef = useRef<Asteroid[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<{ x: number; y: number; speed: number; bright: number }[]>([]);
  const scoreRef = useRef(0);
  const hiRef = useRef(getHighScore());
  const keysRef = useRef<Set<string>>(new Set());
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const diffRef = useRef(1);
  const frameRef = useRef(0);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);

  /* init stars */
  useEffect(() => {
    starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      speed: 0.3 + Math.random() * 1.5, bright: 0.3 + Math.random() * 0.7,
    }));
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particlesRef.current.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 30, maxLife: 60, color, size: 1 + Math.random() * 2,
      });
    }
  }, []);

  const startGame = useCallback(() => {
    shipRef.current = { x: W / 2, y: H - 100 };
    asteroidsRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    diffRef.current = 1;
    frameRef.current = 0;
    startTimeRef.current = performance.now();
    setState("play");
    playSound(660, 0.15, "sine");
  }, []);

  const endGame = useCallback(() => {
    if (scoreRef.current > hiRef.current) {
      hiRef.current = scoreRef.current;
      setHighScore(scoreRef.current);
    }
    spawnParticles(shipRef.current.x, shipRef.current.y, "#ff4444", 40);
    playSound(150, 0.5, "sawtooth", 0.15);
    setState("over");
  }, [spawnParticles]);

  /* input */
  useEffect(() => {
    const kd = (e: KeyboardEvent) => { keysRef.current.add(e.key); if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault(); };
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ts = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; const r = canvas.getBoundingClientRect(); touchRef.current = { x: (t.clientX - r.left) * (W / r.width), y: (t.clientY - r.top) * (H / r.height) }; };
    const te = () => { touchRef.current = null; };
    canvas.addEventListener("touchstart", ts, { passive: false });
    canvas.addEventListener("touchmove", ts, { passive: false });
    canvas.addEventListener("touchend", te);
    return () => { canvas.removeEventListener("touchstart", ts); canvas.removeEventListener("touchmove", ts); canvas.removeEventListener("touchend", te); };
  }, []);

  /* game loop */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const playing = stateRef.current === "play";
      frameRef.current++;

      /* update stars */
      for (const s of starsRef.current) {
        s.y += s.speed;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      }

      if (playing) {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        scoreRef.current = Math.floor(elapsed * 10);
        diffRef.current = 1 + elapsed / 15;

        /* move ship */
        const spd = 5;
        const ship = shipRef.current;
        const keys = keysRef.current;
        if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) ship.x -= spd;
        if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) ship.x += spd;
        if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) ship.y -= spd;
        if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) ship.y += spd;

        if (touchRef.current) {
          const dx = touchRef.current.x - ship.x;
          const dy = touchRef.current.y - ship.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 3) {
            ship.x += (dx / dist) * Math.min(spd, dist);
            ship.y += (dy / dist) * Math.min(spd, dist);
          }
        }

        ship.x = Math.max(SHIP_W / 2, Math.min(W - SHIP_W / 2, ship.x));
        ship.y = Math.max(SHIP_H / 2, Math.min(H - SHIP_H / 2, ship.y));

        /* spawn asteroids */
        const spawnRate = Math.max(10, 40 - Math.floor(diffRef.current * 3));
        if (frameRef.current % spawnRate === 0) {
          asteroidsRef.current.push({
            x: Math.random() * W, y: -20,
            r: 8 + Math.random() * 12,
            speed: 1.5 + Math.random() * diffRef.current,
            angle: (Math.PI / 2) + (Math.random() - 0.5) * 0.6,
          });
        }

        /* spawn bullets */
        const bulletRate = Math.max(5, 25 - Math.floor(diffRef.current * 2));
        if (frameRef.current % bulletRate === 0 && diffRef.current > 2) {
          bulletsRef.current.push({
            x: Math.random() * W, y: -5,
            speed: 3 + Math.random() * diffRef.current,
          });
        }

        /* update asteroids */
        asteroidsRef.current = asteroidsRef.current.filter(a => {
          a.x += Math.cos(a.angle) * a.speed;
          a.y += Math.sin(a.angle) * a.speed;
          return a.y < H + 30 && a.x > -30 && a.x < W + 30;
        });

        /* update bullets */
        bulletsRef.current = bulletsRef.current.filter(b => {
          b.y += b.speed;
          return b.y < H + 10;
        });

        /* collision detect */
        for (const a of asteroidsRef.current) {
          const dx = a.x - ship.x, dy = a.y - ship.y;
          if (Math.sqrt(dx * dx + dy * dy) < a.r + 10) { endGame(); break; }
        }
        if (stateRef.current === "play") {
          for (const b of bulletsRef.current) {
            const dx = b.x - ship.x, dy = b.y - ship.y;
            if (Math.sqrt(dx * dx + dy * dy) < 12) { endGame(); break; }
          }
        }

        /* engine particles */
        if (frameRef.current % 2 === 0) {
          particlesRef.current.push({
            x: ship.x + (Math.random() - 0.5) * 8,
            y: ship.y + SHIP_H / 2,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 1 + Math.random() * 2,
            life: 15 + Math.random() * 10, maxLife: 25,
            color: Math.random() > 0.5 ? "#7ec8e3" : "#a78bfa",
            size: 1 + Math.random(),
          });
        }
      }

      /* update particles */
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life--;
        return p.life > 0;
      });

      /* ── draw ── */
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);

      /* stars */
      for (const s of starsRef.current) {
        ctx.globalAlpha = s.bright * 0.6;
        ctx.fillStyle = "#fff";
        ctx.fillRect(s.x, s.y, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;

      /* particles */
      for (const p of particlesRef.current) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* asteroids */
      for (const a of asteroidsRef.current) {
        ctx.fillStyle = "#555";
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#777";
        ctx.beginPath(); ctx.arc(a.x - a.r * 0.3, a.y - a.r * 0.2, a.r * 0.2, 0, Math.PI * 2); ctx.fill();
      }

      /* bullets */
      ctx.fillStyle = "#ff4444";
      ctx.shadowColor = "#ff4444";
      ctx.shadowBlur = 8;
      for (const b of bulletsRef.current) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      /* ship */
      if (stateRef.current !== "over") {
        const s = shipRef.current;
        ctx.fillStyle = "#7ec8e3";
        ctx.shadowColor = "#7ec8e3";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - SHIP_H / 2);
        ctx.lineTo(s.x - SHIP_W / 2, s.y + SHIP_H / 2);
        ctx.lineTo(s.x + SHIP_W / 2, s.y + SHIP_H / 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#a78bfa";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - SHIP_H / 4);
        ctx.lineTo(s.x - 6, s.y + SHIP_H / 4);
        ctx.lineTo(s.x + 6, s.y + SHIP_H / 4);
        ctx.closePath();
        ctx.fill();
      }

      /* HUD */
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);
      ctx.textAlign = "right";
      ctx.fillStyle = "#a78bfa";
      ctx.fillText(`Best: ${hiRef.current}`, W - 12, 28);
      ctx.textAlign = "left";

      /* overlay */
      if (stateRef.current === "menu") {
        ctx.fillStyle = "rgba(10,14,39,0.7)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#7ec8e3";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SPACE DODGE", W / 2, H / 2 - 50);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "18px sans-serif";
        ctx.fillText("Arrow keys / Touch to move", W / 2, H / 2);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText("Click or press Enter to start", W / 2, H / 2 + 40);
        ctx.textAlign = "left";
      } else if (stateRef.current === "over") {
        ctx.fillStyle = "rgba(10,14,39,0.7)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W / 2, H / 2 - 50);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "22px sans-serif";
        ctx.fillText(`Score: ${scoreRef.current}`, W / 2, H / 2);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "16px sans-serif";
        ctx.fillText("Click or press Enter to retry", W / 2, H / 2 + 40);
        ctx.textAlign = "left";
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [endGame]);

  /* click / enter handler */
  useEffect(() => {
    const onClick = () => {
      if (stateRef.current !== "play") startGame();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && stateRef.current !== "play") startGame();
    };
    const canvas = canvasRef.current;
    canvas?.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => { canvas?.removeEventListener("click", onClick); window.removeEventListener("keydown", onKey); };
  }, [startGame]);

  return (
    <div className="flex flex-col items-center gap-3">
      <a href="/AlyraGames/" className="text-steel text-sm hover:underline self-start ml-2">
        &larr; Hub
      </a>
      <canvas ref={canvasRef} width={W} height={H}
        className="rounded-xl border border-white/10 max-h-[85dvh] w-auto"
        style={{ imageRendering: "pixelated" }} />
    </div>
  );
}
