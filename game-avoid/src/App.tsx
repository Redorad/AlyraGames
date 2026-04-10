import { useEffect, useRef, useState } from "react";

const HS_KEY = "avoid_high_score";

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [high, setHigh] = useState(() => Number(localStorage.getItem(HS_KEY) || 0));
  const stateRef = useRef({
    player: { x: 0, y: 0 },
    blocks: [] as Block[],
    startTime: 0,
    elapsed: 0,
    speedMul: 1,
    spawnRate: 500,
    lastSpawn: 0,
    running: false,
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
      player: { x: canvas.width / 2, y: canvas.height - 50 },
      blocks: [],
      startTime: performance.now(),
      elapsed: 0,
      speedMul: 1,
      spawnRate: 500,
      lastSpawn: performance.now(),
      running: true,
    };
    setScore(0);
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
    const loop = (now: number) => {
      const s = stateRef.current;
      if (!s.running) return;
      s.elapsed = (now - s.startTime) / 1000;
      s.speedMul = 1 + s.elapsed / 15;
      const currentSpawnRate = Math.max(100, 500 - s.elapsed * 8);

      if (now - s.lastSpawn > currentSpawnRate) {
        s.lastSpawn = now;
        const w = 20 + Math.random() * 60;
        s.blocks.push({
          x: Math.random() * (canvas.width - w),
          y: -w,
          w,
          h: w,
          vy: (2 + Math.random() * 2) * s.speedMul,
        });
      }

      // update
      s.blocks.forEach((b) => {
        b.y += b.vy;
      });
      s.blocks = s.blocks.filter((b) => b.y < canvas.height + 100);

      // check collision
      const pr = 14;
      for (const b of s.blocks) {
        const cx = Math.max(b.x, Math.min(s.player.x, b.x + b.w));
        const cy = Math.max(b.y, Math.min(s.player.y, b.y + b.h));
        const dx = s.player.x - cx;
        const dy = s.player.y - cy;
        if (dx * dx + dy * dy < pr * pr) {
          s.running = false;
          setRunning(false);
          setGameOver(true);
          const finalScore = Math.floor(s.elapsed * 10);
          setScore(finalScore);
          if (finalScore > high) {
            setHigh(finalScore);
            localStorage.setItem(HS_KEY, String(finalScore));
          }
          return;
        }
      }

      setScore(Math.floor(s.elapsed * 10));

      // draw
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // grid bg
      ctx.strokeStyle = "rgba(126,200,227,0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // blocks
      s.blocks.forEach((b) => {
        ctx.fillStyle = "#dc2626";
        ctx.shadowColor = "#f87171";
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x, b.y, b.w, b.h);
      });
      ctx.shadowBlur = 0;

      // player
      ctx.fillStyle = "#7ec8e3";
      ctx.shadowColor = "#7ec8e3";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(s.player.x, s.player.y, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, high]);

  const onPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.player.x = clientX - rect.left;
    stateRef.current.player.y = clientY - rect.top;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-3 py-4 bg-navy-900">
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          <span className="text-steel">AVOID</span>
          <span className="text-accent"> THE BLOCKS</span>
        </h1>
        <p className="text-xs text-slate-500">Move with mouse or touch</p>
      </div>

      <div className="flex gap-3 mb-2 text-sm">
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Score</div>
          <div className="text-lg font-bold text-steel">{score}</div>
        </div>
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Best</div>
          <div className="text-lg font-bold text-accent">{high}</div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-xl border border-white/10 overflow-hidden bg-navy-800"
        style={{ width: "min(95vw, 480px)", height: "min(75vh, 640px)" }}
        onMouseMove={(e) => onPointer(e.clientX, e.clientY)}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) onPointer(t.clientX, t.clientY);
          e.preventDefault();
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full block cursor-none" />
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-900/80 backdrop-blur-sm">
            {gameOver && (
              <>
                <div className="text-2xl font-black text-accent mb-1">Game Over</div>
                <div className="text-slate-400 mb-3">Score: {score}</div>
              </>
            )}
            <button
              onClick={reset}
              className="px-6 py-3 rounded-lg bg-accent text-navy-900 font-bold text-sm uppercase tracking-wider hover:brightness-110"
            >
              {gameOver ? "Play Again" : "Start"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
