import { useEffect, useRef, useState } from "react";

const W = 440;
const H = 680;

type Bumper = { x: number; y: number; r: number; points: number; flash: number };

type Flipper = {
  pivot: { x: number; y: number };
  angle: number;
  rest: number;
  active: number;
  length: number;
  side: "L" | "R";
  target: number; // target angle
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [balls, setBalls] = useState(3);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("pinball_hi") || 0)
  );
  const [gameOver, setGameOver] = useState(false);

  const stateRef = useRef({
    ball: { x: W - 25, y: H - 150, vx: 0, vy: 0, launched: false },
    bumpers: [
      { x: 140, y: 180, r: 28, points: 100, flash: 0 },
      { x: 240, y: 120, r: 28, points: 100, flash: 0 },
      { x: 340, y: 180, r: 28, points: 100, flash: 0 },
      { x: 100, y: 280, r: 22, points: 50, flash: 0 },
      { x: 240, y: 260, r: 22, points: 50, flash: 0 },
      { x: 380, y: 280, r: 22, points: 50, flash: 0 },
    ] as Bumper[],
    flippers: [
      {
        pivot: { x: 140, y: 600 },
        angle: 0.5,
        rest: 0.5,
        active: -0.4,
        length: 70,
        side: "L",
        target: 0.5,
      },
      {
        pivot: { x: 320, y: 600 },
        angle: Math.PI - 0.5,
        rest: Math.PI - 0.5,
        active: Math.PI + 0.4,
        length: 70,
        side: "R",
        target: Math.PI - 0.5,
      },
    ] as Flipper[],
    score: 0,
    balls: 3,
    leftHeld: false,
    rightHeld: false,
    launching: false,
    launchPower: 0,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        stateRef.current.leftHeld = true;
        stateRef.current.flippers[0].target = stateRef.current.flippers[0].active;
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        stateRef.current.rightHeld = true;
        stateRef.current.flippers[1].target = stateRef.current.flippers[1].active;
      }
      if (e.key === " ") {
        if (!stateRef.current.ball.launched) {
          stateRef.current.launching = true;
        }
        e.preventDefault();
      }
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        stateRef.current.leftHeld = false;
        stateRef.current.flippers[0].target = stateRef.current.flippers[0].rest;
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        stateRef.current.rightHeld = false;
        stateRef.current.flippers[1].target = stateRef.current.flippers[1].rest;
      }
      if (e.key === " ") {
        if (stateRef.current.launching) {
          const s = stateRef.current;
          s.ball.vy = -Math.min(18, 6 + s.launchPower * 0.15);
          s.ball.launched = true;
          s.launching = false;
          s.launchPower = 0;
        }
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const reset = () => {
      const s = stateRef.current;
      s.ball = { x: W - 25, y: H - 150, vx: 0, vy: 0, launched: false };
    };

    const step = () => {
      const s = stateRef.current;
      const b = s.ball;

      if (s.launching) {
        s.launchPower = Math.min(100, s.launchPower + 2);
      }

      if (b.launched) {
        b.vy += 0.28; // gravity
        b.vx *= 0.995;
        b.vy = Math.min(b.vy, 14);
        b.x += b.vx;
        b.y += b.vy;

        // walls
        if (b.x < 18) {
          b.x = 18;
          b.vx *= -0.8;
        }
        if (b.x > W - 18) {
          b.x = W - 18;
          b.vx *= -0.8;
        }
        if (b.y < 18) {
          b.y = 18;
          b.vy *= -0.8;
        }
        // launch chute wall
        if (b.x > W - 42 && b.y < H - 60 && b.y > 40) {
          if (b.x < W - 35) {
            b.x = W - 35;
            b.vx *= -0.7;
          }
        }

        // bumpers
        for (const bp of s.bumpers) {
          const dx = b.x - bp.x;
          const dy = b.y - bp.y;
          const dist = Math.hypot(dx, dy);
          if (dist < bp.r + 10) {
            const nx = dx / dist;
            const ny = dy / dist;
            b.x = bp.x + nx * (bp.r + 10);
            b.y = bp.y + ny * (bp.r + 10);
            const dot = b.vx * nx + b.vy * ny;
            b.vx -= 2 * dot * nx;
            b.vy -= 2 * dot * ny;
            b.vx *= 1.05;
            b.vy *= 1.05;
            bp.flash = 10;
            s.score += bp.points;
            setScore(s.score);
          }
        }

        // flippers: treat as rotating line segments with ball collision
        for (const f of s.flippers) {
          const diff = f.target - f.angle;
          const prevAngle = f.angle;
          f.angle += diff * 0.45;
          const angVel = f.angle - prevAngle;

          // line segment from pivot along angle
          const ex = f.pivot.x + Math.cos(f.angle) * f.length;
          const ey = f.pivot.y + Math.sin(f.angle) * f.length;
          // closest point on segment
          const ax = ex - f.pivot.x;
          const ay = ey - f.pivot.y;
          const t = Math.max(
            0,
            Math.min(
              1,
              ((b.x - f.pivot.x) * ax + (b.y - f.pivot.y) * ay) /
                (ax * ax + ay * ay)
            )
          );
          const cx = f.pivot.x + ax * t;
          const cy = f.pivot.y + ay * t;
          const dx = b.x - cx;
          const dy = b.y - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < 15) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            b.x = cx + nx * 15;
            b.y = cy + ny * 15;
            const dot = b.vx * nx + b.vy * ny;
            b.vx -= 2 * dot * nx;
            b.vy -= 2 * dot * ny;
            // add velocity from flipper motion
            const kick = angVel * f.length * 2.5;
            b.vx += -Math.sin(f.angle) * kick;
            b.vy += Math.cos(f.angle) * kick;
          }
        }

        // gutter - ball lost
        if (b.y > H + 20) {
          s.balls -= 1;
          setBalls(s.balls);
          if (s.balls <= 0) {
            setGameOver(true);
            if (s.score > highScore) {
              setHighScore(s.score);
              localStorage.setItem("pinball_hi", String(s.score));
            }
          } else {
            reset();
          }
        }
      }

      // DRAW
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);

      // table background glow
      ctx.save();
      const grad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 400);
      grad.addColorStop(0, "rgba(167,139,250,0.12)");
      grad.addColorStop(1, "rgba(10,14,39,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // outer walls
      ctx.strokeStyle = "#7ec8e3";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(18, H);
      ctx.lineTo(18, 18);
      ctx.lineTo(W - 18, 18);
      ctx.lineTo(W - 18, H);
      ctx.stroke();
      // launch chute divider
      ctx.beginPath();
      ctx.moveTo(W - 38, 40);
      ctx.lineTo(W - 38, H - 60);
      ctx.stroke();

      // slanted walls near flippers
      ctx.beginPath();
      ctx.moveTo(18, 520);
      ctx.lineTo(90, 620);
      ctx.moveTo(W - 18, 520);
      ctx.lineTo(W - 90, 620);
      ctx.stroke();

      // bumpers
      for (const bp of s.bumpers) {
        ctx.save();
        ctx.shadowColor = bp.flash > 0 ? "#fff" : "#a78bfa";
        ctx.shadowBlur = bp.flash > 0 ? 25 : 12;
        ctx.fillStyle = bp.flash > 0 ? "#fff" : "#a78bfa";
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#7ec8e3";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        if (bp.flash > 0) bp.flash--;
      }

      // flippers
      for (const f of s.flippers) {
        ctx.save();
        ctx.strokeStyle = "#7ec8e3";
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.shadowColor = "#7ec8e3";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(f.pivot.x, f.pivot.y);
        ctx.lineTo(
          f.pivot.x + Math.cos(f.angle) * f.length,
          f.pivot.y + Math.sin(f.angle) * f.length
        );
        ctx.stroke();
        ctx.restore();
      }

      // plunger
      const plungerY = H - 100 + (s.launching ? s.launchPower * 0.3 : 0);
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(W - 25, plungerY);
      ctx.lineTo(W - 25, H - 20);
      ctx.stroke();
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(W - 32, plungerY - 8, 14, 8);

      // ball
      if (!b.launched) {
        b.x = W - 25;
        b.y = plungerY - 12;
      }
      ctx.save();
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [highScore]);

  const restart = () => {
    const s = stateRef.current;
    s.score = 0;
    s.balls = 3;
    s.ball = { x: W - 25, y: H - 150, vx: 0, vy: 0, launched: false };
    setScore(0);
    setBalls(3);
    setGameOver(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-steel">NEON</span>
          <span className="text-accent"> PINBALL</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Hold SPACE to charge & launch. Arrow keys for flippers.
        </p>
      </div>
      <div className="flex gap-3 text-sm">
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Score: <span className="text-steel font-bold">{score}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Balls: <span className="text-accent font-bold">{balls}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Best: <span className="text-accent font-bold">{highScore}</span>
        </div>
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block max-w-[95vw] max-h-[75dvh]"
        />
        {gameOver && (
          <div className="absolute inset-0 bg-navy-900/90 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">🎯</div>
            <div className="text-2xl font-bold text-accent">Game Over</div>
            <div className="text-lg">Score: {score}</div>
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
