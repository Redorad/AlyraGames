import { useEffect, useRef, useState } from "react";

type Pin = { x: number; y: number; down: boolean; vx: number; vy: number };
type BallPhase = "aiming" | "rolling" | "settling" | "done";

const W = 360;
const H = 560;
const LANE_X = 40;
const LANE_W = W - 80;
const BALL_R = 14;

function pinRack(): Pin[] {
  const pins: Pin[] = [];
  const startY = 80;
  const spacing = 22;
  const cx = W / 2;
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i <= row; i++) {
      const x = cx - row * spacing / 2 + i * spacing;
      const y = startY + row * spacing;
      pins.push({ x, y, down: false, vx: 0, vy: 0 });
    }
  }
  return pins;
}

function scoreFrames(rolls: number[]): { frames: (number | null)[][]; total: number } {
  const frames: (number | null)[][] = [];
  let i = 0;
  let total = 0;
  for (let f = 0; f < 10; f++) {
    if (i >= rolls.length) {
      frames.push([null, null]);
      continue;
    }
    if (f < 9) {
      if (rolls[i] === 10) {
        const a = rolls[i + 1] ?? null;
        const b = rolls[i + 2] ?? null;
        const fs = 10 + (a ?? 0) + (b ?? 0);
        total += fs;
        frames.push([10, null]);
        i++;
      } else {
        const r1 = rolls[i] ?? null;
        const r2 = rolls[i + 1] ?? null;
        if (r1 !== null && r2 !== null && r1 + r2 === 10) {
          const b = rolls[i + 2] ?? null;
          total += 10 + (b ?? 0);
        } else {
          total += (r1 ?? 0) + (r2 ?? 0);
        }
        frames.push([r1, r2]);
        i += 2;
      }
    } else {
      // 10th frame
      const rest = rolls.slice(i);
      total += rest.reduce((a, b) => a + b, 0);
      frames.push(rest.length ? (rest as (number | null)[]) : [null, null]);
    }
  }
  return { frames, total };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    pins: pinRack(),
    ball: { x: W / 2, y: H - 60, vx: 0, vy: 0 },
    phase: "aiming" as BallPhase,
    aimAngle: 0,
    aimDir: 1,
    frame: 0,
    rollInFrame: 0,
    rolls: [] as number[],
    pinsStandingStart: 10,
    lastUpdate: 0,
    settleTime: 0,
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const update = (dt: number) => {
      const s = stateRef.current;
      if (s.phase === "aiming") {
        s.aimAngle += s.aimDir * dt * 0.002;
        if (s.aimAngle > 0.6) {
          s.aimAngle = 0.6;
          s.aimDir = -1;
        } else if (s.aimAngle < -0.6) {
          s.aimAngle = -0.6;
          s.aimDir = 1;
        }
      } else if (s.phase === "rolling") {
        s.ball.x += s.ball.vx * dt;
        s.ball.y += s.ball.vy * dt;
        // Collision with pins
        for (const pin of s.pins) {
          if (pin.down) continue;
          const dx = s.ball.x - pin.x;
          const dy = s.ball.y - pin.y;
          const d = Math.hypot(dx, dy);
          if (d < BALL_R + 10) {
            pin.down = true;
            pin.vx = (dx !== 0 ? -dx / d : 0) * 0.15 + (Math.random() - 0.5) * 0.1;
            pin.vy = -0.15 + Math.random() * 0.05;
            // Chain: nudge neighbors
            for (const p2 of s.pins) {
              if (p2.down || p2 === pin) continue;
              const d2 = Math.hypot(p2.x - pin.x, p2.y - pin.y);
              if (d2 < 28) {
                p2.down = true;
                p2.vx = (p2.x - pin.x) / d2 * 0.1;
                p2.vy = -0.1;
              }
            }
          }
        }
        // Update fallen pin positions
        for (const pin of s.pins) {
          if (pin.down) {
            pin.x += pin.vx * dt;
            pin.y += pin.vy * dt;
            pin.vy += 0.0005 * dt;
          }
        }
        if (s.ball.y < 20 || s.ball.x < 0 || s.ball.x > W) {
          s.phase = "settling";
          s.settleTime = 0;
        }
      } else if (s.phase === "settling") {
        s.settleTime += dt;
        if (s.settleTime > 500) {
          // Count knocked down
          const standing = s.pins.filter((p) => !p.down).length;
          const knocked = s.pinsStandingStart - standing;
          s.rolls.push(knocked);
          s.pinsStandingStart = standing;

          const isStrike = s.rollInFrame === 0 && knocked === 10;
          const frameDone =
            s.rollInFrame === 1 ||
            isStrike ||
            (s.frame === 9 && s.rolls.length - prevRollCount(s.frame, s.rolls) >= requiredRolls(s.frame, s.rolls));

          if (s.frame === 9) {
            // 10th frame: up to 3 rolls if strike/spare
            const frameRolls = s.rolls.slice(-s.rollInFrame - 1);
            const total = frameRolls.reduce((a, b) => a + b, 0);
            const hasBonus = frameRolls[0] === 10 || (frameRolls[0] + (frameRolls[1] ?? 0) === 10);
            const rollsNeeded = hasBonus ? 3 : 2;
            if (frameRolls.length >= rollsNeeded) {
              s.phase = "done";
              return;
            } else {
              s.rollInFrame++;
              if (knocked === 10 || (s.rollInFrame === 2 && !hasBonus)) {
                // reset pins if strike or spare
                s.pins = pinRack();
                s.pinsStandingStart = 10;
              }
              s.ball.x = W / 2;
              s.ball.y = H - 60;
              s.ball.vx = 0;
              s.ball.vy = 0;
              s.phase = "aiming";
              s.aimAngle = 0;
            }
          } else if (frameDone) {
            s.frame++;
            s.rollInFrame = 0;
            s.pins = pinRack();
            s.pinsStandingStart = 10;
            s.ball.x = W / 2;
            s.ball.y = H - 60;
            s.ball.vx = 0;
            s.ball.vy = 0;
            s.phase = "aiming";
            s.aimAngle = 0;
          } else {
            s.rollInFrame++;
            s.ball.x = W / 2;
            s.ball.y = H - 60;
            s.ball.vx = 0;
            s.ball.vy = 0;
            s.phase = "aiming";
            s.aimAngle = 0;
          }
          setTick((t) => t + 1);
        }
      }
    };

    const prevRollCount = (_frameIdx: number, rolls: number[]) => {
      // Not used when frameIdx === 9 handled above. Simplified.
      return rolls.length - 1;
    };

    const requiredRolls = (_f: number, _r: number[]) => 2;

    const draw = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      // Background
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);
      // Lane
      const laneGrad = ctx.createLinearGradient(0, 0, 0, H);
      laneGrad.addColorStop(0, "#d4a574");
      laneGrad.addColorStop(1, "#8b5a2b");
      ctx.fillStyle = laneGrad;
      ctx.fillRect(LANE_X, 40, LANE_W, H - 60);
      // Lane lines
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(LANE_X + (i / 7) * LANE_W, 40);
        ctx.lineTo(LANE_X + (i / 7) * LANE_W, H - 20);
        ctx.stroke();
      }
      // Gutters
      ctx.fillStyle = "#1a2050";
      ctx.fillRect(0, 40, LANE_X, H - 60);
      ctx.fillRect(W - LANE_X, 40, LANE_X, H - 60);
      // Pins
      for (const pin of s.pins) {
        if (pin.down) {
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.beginPath();
          ctx.ellipse(pin.x, pin.y, 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(pin.x, pin.y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#dc2626";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(pin.x - 6, pin.y - 4, 12, 2);
        }
      }
      // Ball
      const ballGrad = ctx.createRadialGradient(
        s.ball.x - 4,
        s.ball.y - 4,
        2,
        s.ball.x,
        s.ball.y,
        BALL_R
      );
      ballGrad.addColorStop(0, "#a78bfa");
      ballGrad.addColorStop(1, "#4c1d95");
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      // Aim line
      if (s.phase === "aiming") {
        ctx.strokeStyle = "rgba(126,200,227,0.6)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.ball.x, s.ball.y);
        ctx.lineTo(
          s.ball.x + Math.sin(s.aimAngle) * 200,
          s.ball.y - Math.cos(s.aimAngle) * 200
        );
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    const loop = (t: number) => {
      const s = stateRef.current;
      const dt = s.lastUpdate ? Math.min(t - s.lastUpdate, 32) : 16;
      s.lastUpdate = t;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const throwBall = () => {
    const s = stateRef.current;
    if (s.phase !== "aiming") return;
    const speed = 0.55;
    s.ball.vx = Math.sin(s.aimAngle) * speed;
    s.ball.vy = -Math.cos(s.aimAngle) * speed;
    s.phase = "rolling";
  };

  const reset = () => {
    stateRef.current = {
      pins: pinRack(),
      ball: { x: W / 2, y: H - 60, vx: 0, vy: 0 },
      phase: "aiming",
      aimAngle: 0,
      aimDir: 1,
      frame: 0,
      rollInFrame: 0,
      rolls: [],
      pinsStandingStart: 10,
      lastUpdate: 0,
      settleTime: 0,
    };
    setTick((t) => t + 1);
  };

  const s = stateRef.current;
  const { frames, total } = scoreFrames(s.rolls);

  return (
    <div className="w-full h-full flex flex-col items-center justify-start py-3 px-2 gap-2">
      <div className="w-full max-w-md flex items-center justify-between px-2">
        <h1 className="text-xl font-black tracking-wider">
          <span className="text-steel">BOW</span>
          <span className="text-accent">LING</span>
        </h1>
        <div className="text-xs text-slate-400">
          Frame <span className="text-steel font-bold">{Math.min(s.frame + 1, 10)}</span> / 10
        </div>
        <div className="text-xs">
          <span className="text-slate-400">Score </span>
          <span className="text-accent font-bold text-lg">{total}</span>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-[2px] w-full max-w-md text-[9px]">
        {frames.map((f, i) => (
          <div
            key={i}
            className={`border border-navy-700 rounded text-center py-0.5 ${
              i === s.frame ? "bg-navy-700" : "bg-navy-800"
            }`}
          >
            <div className="text-slate-500">{i + 1}</div>
            <div className="text-steel font-bold">
              {f.map((r, j) => (r === null ? "-" : r === 10 ? "X" : r)).join(" ")}
            </div>
          </div>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onClick={throwBall}
        className="rounded-xl border border-navy-700 cursor-pointer"
        style={{ maxHeight: "70vh", width: "auto" }}
      />
      <div className="flex gap-2 items-center">
        {s.phase === "done" ? (
          <button
            onClick={reset}
            className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:opacity-90"
          >
            New Game
          </button>
        ) : (
          <div className="text-xs text-slate-500">
            {s.phase === "aiming" ? "Click to throw" : "..."}
          </div>
        )}
      </div>
    </div>
  );
}
