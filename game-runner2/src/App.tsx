import { useEffect, useRef, useState } from "react";

const HS_KEY = "runner2_high_score";

interface Obstacle {
  x: number;
  y: number;
  type: "tree" | "rock";
  r: number;
}

interface Gate {
  x: number;
  y: number;
  w: number;
  passed: boolean;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [high, setHigh] = useState(() => Number(localStorage.getItem(HS_KEY) || 0));
  const stateRef = useRef({
    player: { x: 0, vx: 0 },
    obstacles: [] as Obstacle[],
    gates: [] as Gate[],
    speed: 3,
    distance: 0,
    bonus: 0,
    running: false,
    keys: { left: false, right: false },
    targetX: null as number | null,
  });

  const resize = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);
  };

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const reset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    stateRef.current = {
      player: { x: canvas.width / 2, vx: 0 },
      obstacles: [],
      gates: [],
      speed: 4,
      distance: 0,
      bonus: 0,
      running: true,
      keys: { left: false, right: false },
      targetX: null,
    };
    setDistance(0);
    setGameOver(false);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      const s = stateRef.current;
      if (!s.running) return;

      const w = canvas.width;
      const h = canvas.height;

      // update speed
      s.speed = Math.min(12, 4 + s.distance / 400);

      // steering
      const steerSpeed = 0.5;
      if (s.targetX !== null) {
        const diff = s.targetX - s.player.x;
        s.player.vx = Math.max(-8, Math.min(8, diff * 0.15));
      } else {
        if (s.keys.left) s.player.vx -= steerSpeed;
        if (s.keys.right) s.player.vx += steerSpeed;
        if (!s.keys.left && !s.keys.right) s.player.vx *= 0.85;
      }
      s.player.vx = Math.max(-8, Math.min(8, s.player.vx));
      s.player.x += s.player.vx * (dt / 16);
      s.player.x = Math.max(20, Math.min(w - 20, s.player.x));

      // distance
      s.distance += s.speed * (dt / 16) * 0.1;
      setDistance(Math.floor(s.distance + s.bonus));

      // spawn obstacles
      if (Math.random() < 0.04) {
        const type = Math.random() < 0.6 ? "tree" : "rock";
        s.obstacles.push({
          x: 20 + Math.random() * (w - 40),
          y: -40,
          type,
          r: type === "tree" ? 18 : 14,
        });
      }
      // spawn gates (flags)
      if (Math.random() < 0.025) {
        const gx = 40 + Math.random() * (w - 100);
        s.gates.push({ x: gx, y: -20, w: 60, passed: false });
      }

      // move
      s.obstacles.forEach((o) => (o.y += s.speed * (dt / 16)));
      s.gates.forEach((g) => (g.y += s.speed * (dt / 16)));
      s.obstacles = s.obstacles.filter((o) => o.y < h + 40);
      s.gates = s.gates.filter((g) => g.y < h + 40);

      // player position y
      const py = h - 70;

      // check gates - scoring
      s.gates.forEach((g) => {
        if (!g.passed && g.y > py) {
          if (s.player.x > g.x && s.player.x < g.x + g.w) {
            s.bonus += 50;
          }
          g.passed = true;
        }
      });

      // check collision
      for (const o of s.obstacles) {
        const dx = s.player.x - o.x;
        const dy = py - o.y;
        if (dx * dx + dy * dy < (o.r + 12) * (o.r + 12)) {
          s.running = false;
          setRunning(false);
          setGameOver(true);
          const finalScore = Math.floor(s.distance + s.bonus);
          setDistance(finalScore);
          if (finalScore > high) {
            setHigh(finalScore);
            localStorage.setItem(HS_KEY, String(finalScore));
          }
          return;
        }
      }

      // draw
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(0, 0, w, h);

      // snow track lines (parallax)
      const offset = (s.distance * 8) % 40;
      ctx.strokeStyle = "rgba(126,200,227,0.2)";
      ctx.lineWidth = 1;
      for (let y = -40 + offset; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // side trees
      ctx.fillStyle = "#166534";
      for (let y = -20 + offset; y < h; y += 60) {
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(18, y - 15);
        ctx.lineTo(2, y - 15);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(w - 10, y);
        ctx.lineTo(w - 2, y - 15);
        ctx.lineTo(w - 18, y - 15);
        ctx.closePath();
        ctx.fill();
      }

      // gates
      s.gates.forEach((g) => {
        ctx.fillStyle = g.passed ? "rgba(167,139,250,0.4)" : "#a78bfa";
        ctx.fillRect(g.x, g.y - 2, 4, 20);
        ctx.fillRect(g.x + g.w - 4, g.y - 2, 4, 20);
        ctx.strokeStyle = g.passed ? "rgba(167,139,250,0.3)" : "#a78bfa";
        ctx.beginPath();
        ctx.moveTo(g.x + 2, g.y + 8);
        ctx.lineTo(g.x + g.w - 2, g.y + 8);
        ctx.stroke();
      });

      // obstacles
      s.obstacles.forEach((o) => {
        if (o.type === "tree") {
          ctx.fillStyle = "#166534";
          ctx.beginPath();
          ctx.moveTo(o.x, o.y - 22);
          ctx.lineTo(o.x + o.r, o.y + 8);
          ctx.lineTo(o.x - o.r, o.y + 8);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#44403c";
          ctx.fillRect(o.x - 3, o.y + 8, 6, 6);
        } else {
          ctx.fillStyle = "#64748b";
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#94a3b8";
          ctx.beginPath();
          ctx.arc(o.x - 3, o.y - 3, o.r * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // player - skier
      ctx.save();
      ctx.translate(s.player.x, py);
      ctx.rotate(s.player.vx * 0.05);
      ctx.fillStyle = "#a78bfa";
      ctx.beginPath();
      ctx.arc(0, -10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7ec8e3";
      ctx.fillRect(-5, -5, 10, 12);
      ctx.strokeStyle = "#0a0e27";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, 12);
      ctx.lineTo(-8, 22);
      ctx.moveTo(8, 12);
      ctx.lineTo(8, 22);
      ctx.stroke();
      ctx.restore();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, high]);

  useEffect(() => {
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        stateRef.current.keys.left = down;
        stateRef.current.targetX = null;
        e.preventDefault();
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        stateRef.current.keys.right = down;
        stateRef.current.targetX = null;
        e.preventDefault();
      }
    };
    const d = onKey(true);
    const u = onKey(false);
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    return () => {
      window.removeEventListener("keydown", d);
      window.removeEventListener("keyup", u);
    };
  }, []);

  const onMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.targetX = clientX - rect.left;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-3 py-3 bg-navy-900">
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          <span className="text-steel">SKI</span>
          <span className="text-accent"> SLALOM</span>
        </h1>
        <p className="text-xs text-slate-500">Arrow keys or mouse to steer. Hit a gate for +50.</p>
      </div>

      <div className="flex gap-3 mb-2 text-sm">
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Distance</div>
          <div className="text-lg font-bold text-steel">{distance}m</div>
        </div>
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Best</div>
          <div className="text-lg font-bold text-accent">{high}m</div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-xl border border-white/10 overflow-hidden bg-white"
        style={{ width: "min(90vw, 420px)", height: "min(75vh, 640px)" }}
        onMouseMove={(e) => onMove(e.clientX)}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) onMove(t.clientX);
          e.preventDefault();
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full block cursor-none" />
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-900/85 backdrop-blur-sm">
            {gameOver && (
              <>
                <div className="text-2xl font-black text-accent mb-1">Crashed!</div>
                <div className="text-slate-400 mb-3">Distance: {distance}m</div>
              </>
            )}
            <button
              onClick={reset}
              className="px-6 py-3 rounded-lg bg-accent text-navy-900 font-bold text-sm uppercase tracking-wider hover:brightness-110"
            >
              {gameOver ? "Race Again" : "Start"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
