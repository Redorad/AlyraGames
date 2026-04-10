import { useEffect, useRef, useState } from "react";

type Phase = "aim" | "shoot" | "result" | "over";

const FIELD_W = 700;
const FIELD_H = 520;
const GOAL_LEFT = 150;
const GOAL_RIGHT = 550;
const GOAL_TOP = 70;
const GOAL_BOTTOM = 200;
const BALL_START = { x: FIELD_W / 2, y: 440 };

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shots, setShots] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("aim");
  const [result, setResult] = useState("");
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("penalty_hi") || 0)
  );
  const TOTAL = 5;

  const stateRef = useRef({
    ball: { x: BALL_START.x, y: BALL_START.y, vx: 0, vy: 0, scale: 1 },
    keeper: { x: FIELD_W / 2, y: GOAL_TOP + 65, vx: 0, targetX: FIELD_W / 2 },
    target: { x: FIELD_W / 2, y: GOAL_TOP + 60 },
    phase: "aim" as Phase,
    t: 0,
  });

  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    stateRef.current.phase = phase;
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();

    const draw = () => {
      const s = stateRef.current;
      // grass
      ctx.fillStyle = "#0f2a35";
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      // stripes
      ctx.fillStyle = "#10313d";
      for (let i = 0; i < 6; i++) {
        if (i % 2 === 0) ctx.fillRect(0, i * (FIELD_H / 6), FIELD_W, FIELD_H / 6);
      }
      // goal
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(GOAL_LEFT, GOAL_TOP, GOAL_RIGHT - GOAL_LEFT, GOAL_BOTTOM - GOAL_TOP);
      // net (lines)
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      for (let x = GOAL_LEFT; x <= GOAL_RIGHT; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, GOAL_TOP);
        ctx.lineTo(x, GOAL_BOTTOM);
        ctx.stroke();
      }
      for (let y = GOAL_TOP; y <= GOAL_BOTTOM; y += 12) {
        ctx.beginPath();
        ctx.moveTo(GOAL_LEFT, y);
        ctx.lineTo(GOAL_RIGHT, y);
        ctx.stroke();
      }
      // posts
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(GOAL_LEFT, GOAL_BOTTOM);
      ctx.lineTo(GOAL_LEFT, GOAL_TOP);
      ctx.lineTo(GOAL_RIGHT, GOAL_TOP);
      ctx.lineTo(GOAL_RIGHT, GOAL_BOTTOM);
      ctx.stroke();

      // penalty spot
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(FIELD_W / 2, 440, 4, 0, Math.PI * 2);
      ctx.fill();

      // keeper (simple stickman)
      const k = s.keeper;
      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(-14, -30, 28, 50);
      ctx.fillStyle = "#7ec8e3";
      ctx.beginPath();
      ctx.arc(0, -40, 10, 0, Math.PI * 2);
      ctx.fill();
      // arms
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-14, -20);
      ctx.lineTo(-24, -35);
      ctx.moveTo(14, -20);
      ctx.lineTo(24, -35);
      ctx.stroke();
      ctx.restore();

      // ball
      const b = s.ball;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(b.scale, b.scale);
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // aim crosshair
      if (s.phase === "aim") {
        const p = pointerRef.current;
        if (
          p.x > GOAL_LEFT &&
          p.x < GOAL_RIGHT &&
          p.y > GOAL_TOP &&
          p.y < GOAL_BOTTOM
        ) {
          ctx.strokeStyle = "#7ec8e3";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p.x - 24, p.y);
          ctx.lineTo(p.x + 24, p.y);
          ctx.moveTo(p.x, p.y - 24);
          ctx.lineTo(p.x, p.y + 24);
          ctx.stroke();
        }
      }
    };

    const step = (ts: number) => {
      const dt = Math.min(32, ts - last);
      last = ts;
      const s = stateRef.current;

      if (s.phase === "shoot") {
        s.t += dt;
        const b = s.ball;
        b.x += b.vx * (dt / 16);
        b.y += b.vy * (dt / 16);
        b.scale = Math.max(0.4, b.scale - 0.005 * (dt / 16));
        // keeper moves to target
        const k = s.keeper;
        k.x += (k.targetX - k.x) * 0.12 * (dt / 16);

        if (s.t > 600) {
          // determine outcome
          const inGoalX = b.x > GOAL_LEFT + 10 && b.x < GOAL_RIGHT - 10;
          const inGoalY = b.y > GOAL_TOP + 10 && b.y < GOAL_BOTTOM - 10;
          const keeperCatch =
            Math.abs(b.x - k.x) < 30 && Math.abs(b.y - k.y) < 40;
          let res = "";
          if (!inGoalX || !inGoalY) {
            res = "MISS!";
          } else if (keeperCatch) {
            res = "SAVED!";
          } else {
            res = "GOAL!";
          }
          setResult(res);
          if (res === "GOAL!") setScore((sc) => sc + 1);
          setPhase("result");
          setShots((n) => n + 1);
        }
      }

      draw();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const canvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * FIELD_W,
      y: ((e.clientY - rect.top) / rect.height) * FIELD_H,
    };
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerRef.current = canvasCoords(e);
  };

  const onClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phase !== "aim") return;
    const p = canvasCoords(e);
    if (p.x < GOAL_LEFT || p.x > GOAL_RIGHT) return;
    if (p.y < GOAL_TOP || p.y > GOAL_BOTTOM) return;
    const s = stateRef.current;
    s.target = { x: p.x, y: p.y };
    const b = s.ball;
    // velocity to reach target over ~600ms
    const frames = 600 / 16;
    b.vx = (p.x - b.x) / frames;
    b.vy = (p.y - b.y) / frames;
    s.t = 0;
    // keeper AI dives to a guessed zone
    const zones = [FIELD_W / 2 - 140, FIELD_W / 2 - 70, FIELD_W / 2, FIELD_W / 2 + 70, FIELD_W / 2 + 140];
    // 60% chance to guess near target, otherwise random
    let targetX: number;
    if (Math.random() < 0.55) {
      // find closest zone to player's shot
      targetX = zones.reduce((a, b) =>
        Math.abs(a - p.x) < Math.abs(b - p.x) ? a : b
      );
    } else {
      targetX = zones[Math.floor(Math.random() * zones.length)];
    }
    s.keeper.targetX = targetX;
    setPhase("shoot");
  };

  const nextShot = () => {
    const s = stateRef.current;
    if (shots >= TOTAL) {
      setPhase("over");
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("penalty_hi", String(score));
      }
      return;
    }
    s.ball = { x: BALL_START.x, y: BALL_START.y, vx: 0, vy: 0, scale: 1 };
    s.keeper.x = FIELD_W / 2;
    s.keeper.targetX = FIELD_W / 2;
    setResult("");
    setPhase("aim");
  };

  const restart = () => {
    const s = stateRef.current;
    s.ball = { x: BALL_START.x, y: BALL_START.y, vx: 0, vy: 0, scale: 1 };
    s.keeper.x = FIELD_W / 2;
    s.keeper.targetX = FIELD_W / 2;
    setShots(0);
    setScore(0);
    setResult("");
    setPhase("aim");
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-steel">PENALTY</span>
          <span className="text-accent"> KICK</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Click where you want the ball to go. Beat the keeper!
        </p>
      </div>
      <div className="flex gap-3 text-sm">
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Shot: <span className="text-steel font-bold">{Math.min(shots + (phase !== "over" ? 1 : 0), TOTAL)}/{TOTAL}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Score: <span className="text-accent font-bold">{score}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Best: <span className="text-accent font-bold">{highScore}</span>
        </div>
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={FIELD_W}
          height={FIELD_H}
          className="block max-w-[95vw] max-h-[70dvh] cursor-crosshair"
          onPointerMove={onMove}
          onPointerDown={onClick}
        />
        {phase === "result" && (
          <div className="absolute inset-0 bg-navy-900/70 flex flex-col items-center justify-center gap-4 pointer-events-none">
            <div
              className={`text-5xl font-black ${
                result === "GOAL!"
                  ? "text-accent"
                  : result === "SAVED!"
                    ? "text-steel"
                    : "text-red-400"
              }`}
            >
              {result}
            </div>
            <button
              onClick={nextShot}
              className="pointer-events-auto px-6 py-3 rounded-xl bg-accent text-navy-900 font-bold hover:scale-105 transition"
            >
              {shots >= TOTAL ? "See Results" : "Next Shot"}
            </button>
          </div>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 bg-navy-900/90 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">⚽</div>
            <div className="text-2xl font-bold text-accent">Final: {score}/{TOTAL}</div>
            <div className="text-sm text-slate-400">
              {score === 5
                ? "Perfect!"
                : score >= 3
                  ? "Nice shooting!"
                  : "Try again"}
            </div>
            <button
              onClick={restart}
              className="px-6 py-3 rounded-xl bg-accent text-navy-900 font-bold hover:scale-105 transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
