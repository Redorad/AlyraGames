import { useEffect, useRef, useState } from "react";

const W = 640;
const H = 360;
const PLAYER_X = 120;
const PLAYER_W = 28;
const PLAYER_H = 14;
const GRAVITY = 0.001;
const LIFT = -0.0022;
const SCROLL = 0.25;

type CavePoint = { topY: number; botY: number };

function loadBest(): number {
  try {
    return parseInt(localStorage.getItem("heli_best") || "0", 10);
  } catch {
    return 0;
  }
}
function saveBest(n: number) {
  try {
    localStorage.setItem("heli_best", String(n));
  } catch {}
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heldRef = useRef(false);
  const stateRef = useRef({
    y: H / 2,
    vy: 0,
    cave: [] as CavePoint[],
    caveOffset: 0,
    distance: 0,
    dead: false,
    started: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
  });
  const [, setTick] = useState(0);
  const [best, setBest] = useState(loadBest());

  useEffect(() => {
    // Initialize cave
    const cave: CavePoint[] = [];
    let topY = 40;
    let botY = H - 40;
    for (let i = 0; i < W + 100; i++) {
      cave.push({ topY, botY });
      topY += (Math.random() - 0.5) * 2;
      botY += (Math.random() - 0.5) * 2;
      if (topY < 10) topY = 10;
      if (topY > H / 2 - 30) topY = H / 2 - 30;
      if (botY < H / 2 + 30) botY = H / 2 + 30;
      if (botY > H - 10) botY = H - 10;
    }
    stateRef.current.cave = cave;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = 0;

    const extendCave = () => {
      const s = stateRef.current;
      while (s.cave.length < W + 300) {
        const prev = s.cave[s.cave.length - 1];
        const difficulty = Math.min(1, s.distance / 20000);
        const narrowMin = 70 - difficulty * 30;
        let topY = prev.topY + (Math.random() - 0.5) * 3;
        let botY = prev.botY + (Math.random() - 0.5) * 3;
        // Ensure gap
        if (botY - topY < narrowMin) {
          const mid = (topY + botY) / 2;
          topY = mid - narrowMin / 2;
          botY = mid + narrowMin / 2;
        }
        if (topY < 5) topY = 5;
        if (botY > H - 5) botY = H - 5;
        s.cave.push({ topY, botY });
      }
    };

    const reset = () => {
      stateRef.current.y = H / 2;
      stateRef.current.vy = 0;
      stateRef.current.distance = 0;
      stateRef.current.dead = false;
      stateRef.current.started = false;
      stateRef.current.particles = [];
      stateRef.current.cave = [];
      // Re-init cave
      let topY = 40;
      let botY = H - 40;
      for (let i = 0; i < W + 100; i++) {
        stateRef.current.cave.push({ topY, botY });
        topY += (Math.random() - 0.5) * 2;
        botY += (Math.random() - 0.5) * 2;
        if (topY < 10) topY = 10;
        if (topY > H / 2 - 30) topY = H / 2 - 30;
        if (botY < H / 2 + 30) botY = H / 2 + 30;
        if (botY > H - 10) botY = H - 10;
      }
      stateRef.current.caveOffset = 0;
    };

    const update = (dt: number) => {
      const s = stateRef.current;
      if (s.dead) return;
      if (!s.started) return;

      if (heldRef.current) {
        s.vy += LIFT * dt;
      } else {
        s.vy += GRAVITY * dt;
      }
      s.vy = Math.max(-0.6, Math.min(0.6, s.vy));
      s.y += s.vy * dt;

      s.caveOffset += SCROLL * dt;
      s.distance += SCROLL * dt;

      // Remove old cave points
      while (s.caveOffset >= 1) {
        s.cave.shift();
        s.caveOffset -= 1;
      }
      extendCave();

      // Collision
      const sampleIdx = Math.floor(PLAYER_X);
      const pt = s.cave[sampleIdx];
      if (pt) {
        if (
          s.y - PLAYER_H / 2 < pt.topY ||
          s.y + PLAYER_H / 2 > pt.botY
        ) {
          s.dead = true;
          for (let i = 0; i < 20; i++) {
            s.particles.push({
              x: PLAYER_X,
              y: s.y,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              life: 800,
            });
          }
          const d = Math.floor(s.distance / 10);
          if (d > best) {
            setBest(d);
            saveBest(d);
          }
          setTick((t) => t + 1);
        }
      }

      // Particles
      for (const p of s.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      }
      s.particles = s.particles.filter((p) => p.life > 0);
    };

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);

      // Cave
      ctx.fillStyle = "#1a2050";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x < W; x++) {
        const pt = s.cave[x];
        if (pt) ctx.lineTo(x, pt.topY);
      }
      ctx.lineTo(W, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x < W; x++) {
        const pt = s.cave[x];
        if (pt) ctx.lineTo(x, pt.botY);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Cave outline glow
      ctx.strokeStyle = "#7ec8e3";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#7ec8e3";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const pt = s.cave[x];
        if (pt) {
          if (x === 0) ctx.moveTo(x, pt.topY);
          else ctx.lineTo(x, pt.topY);
        }
      }
      ctx.stroke();
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const pt = s.cave[x];
        if (pt) {
          if (x === 0) ctx.moveTo(x, pt.botY);
          else ctx.lineTo(x, pt.botY);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Helicopter
      if (!s.dead) {
        const tilt = Math.max(-0.4, Math.min(0.4, s.vy * 0.8));
        ctx.save();
        ctx.translate(PLAYER_X, s.y);
        ctx.rotate(tilt);
        // Body
        ctx.fillStyle = "#a78bfa";
        ctx.shadowColor = "#a78bfa";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.fillRect(-18, -2, 8, 4);
        ctx.fillRect(-20, -5, 2, 10);
        // Rotor
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, -8);
        ctx.lineTo(12, -8);
        ctx.stroke();
        ctx.fillStyle = "#0a0e27";
        ctx.fillRect(-1, -10, 2, 4);
        // Cockpit
        ctx.fillStyle = "#7ec8e3";
        ctx.beginPath();
        ctx.arc(4, -1, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Particles
      for (const p of s.particles) {
        ctx.fillStyle = `rgba(239,68,68,${p.life / 800})`;
        ctx.fillRect(p.x, p.y, 3, 3);
      }

      // UI
      ctx.fillStyle = "#7ec8e3";
      ctx.font = "bold 18px -apple-system";
      ctx.textAlign = "right";
      ctx.fillText(Math.floor(s.distance / 10).toString(), W - 20, 28);
      ctx.font = "10px -apple-system";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("BEST " + best, W - 20, 44);

      if (s.dead) {
        ctx.fillStyle = "rgba(10,14,39,0.85)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 36px -apple-system";
        ctx.textAlign = "center";
        ctx.fillText("CRASHED", W / 2, H / 2 - 10);
        ctx.fillStyle = "#7ec8e3";
        ctx.font = "14px -apple-system";
        ctx.fillText("Click to fly again", W / 2, H / 2 + 20);
      } else if (!s.started) {
        ctx.fillStyle = "rgba(10,14,39,0.7)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "bold 28px -apple-system";
        ctx.textAlign = "center";
        ctx.fillText("HELICOPTER", W / 2, H / 2 - 10);
        ctx.fillStyle = "#7ec8e3";
        ctx.font = "13px -apple-system";
        ctx.fillText("Hold click to fly up", W / 2, H / 2 + 20);
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

    const startInput = () => {
      const s = stateRef.current;
      if (s.dead) {
        reset();
        setTick((t) => t + 1);
      }
      if (!s.started) s.started = true;
      heldRef.current = true;
    };
    const endInput = () => {
      heldRef.current = false;
    };

    canvas.addEventListener("mousedown", startInput);
    canvas.addEventListener("touchstart", startInput);
    window.addEventListener("mouseup", endInput);
    window.addEventListener("touchend", endInput);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousedown", startInput);
      canvas.removeEventListener("touchstart", startInput);
      window.removeEventListener("mouseup", endInput);
      window.removeEventListener("touchend", endInput);
    };
  }, [best]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-4 px-4 gap-3">
      <h1 className="text-2xl font-black tracking-wider">
        <span className="text-steel">HELI</span>
        <span className="text-accent">COPTER</span>
      </h1>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-steel/30 cursor-pointer"
        style={{ maxWidth: "95vw" }}
      />
      <div className="text-xs text-slate-500">Hold click to lift, release to fall.</div>
    </div>
  );
}
