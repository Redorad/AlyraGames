import { useEffect, useRef, useState } from "react";

const W = 480;
const H = 480;
const TARGET_X = W - 80;
const TARGET_Y = H / 2;
const BOW_X = 60;
const BOW_Y = H / 2;

type Phase = "aiming" | "flying" | "hit" | "done";

interface Arrow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
}

interface Shot {
  score: number;
  x: number;
  y: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    phase: "aiming" as Phase,
    mouseX: W / 2,
    mouseY: H / 2,
    arrow: null as Arrow | null,
    wind: 0,
    shots: [] as Shot[],
    arrowsLeft: 10,
    hitTime: 0,
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    stateRef.current.wind = (Math.random() - 0.5) * 0.4;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = 0;

    const scoreAt = (dx: number, dy: number) => {
      const d = Math.hypot(dx, dy);
      if (d < 8) return 10;
      if (d < 20) return 8;
      if (d < 32) return 6;
      if (d < 44) return 4;
      if (d < 56) return 2;
      return 0;
    };

    const update = (dt: number) => {
      const s = stateRef.current;
      if (s.phase === "flying" && s.arrow) {
        s.arrow.x += s.arrow.vx * dt;
        s.arrow.y += s.arrow.vy * dt;
        s.arrow.vy += 0.0004 * dt; // gravity
        s.arrow.vx += s.wind * 0.001 * dt;
        s.arrow.angle = Math.atan2(s.arrow.vy, s.arrow.vx);
        // Check hit target
        const dx = s.arrow.x - TARGET_X;
        const dy = s.arrow.y - TARGET_Y;
        if (Math.abs(dx) < 60 && Math.abs(dy) < 60 && s.arrow.vx > 0) {
          const score = scoreAt(dx, dy);
          s.shots.push({ score, x: dx, y: dy });
          s.arrowsLeft--;
          s.arrow = null;
          if (s.arrowsLeft <= 0) {
            s.phase = "done";
          } else {
            s.phase = "hit";
            s.hitTime = 0;
            s.wind = (Math.random() - 0.5) * 0.4;
          }
          setTick((t) => t + 1);
          return;
        }
        if (s.arrow.x < 0 || s.arrow.x > W || s.arrow.y > H) {
          s.shots.push({ score: 0, x: 100, y: 100 });
          s.arrowsLeft--;
          s.arrow = null;
          if (s.arrowsLeft <= 0) {
            s.phase = "done";
          } else {
            s.phase = "hit";
            s.hitTime = 0;
            s.wind = (Math.random() - 0.5) * 0.4;
          }
          setTick((t) => t + 1);
        }
      } else if (s.phase === "hit") {
        s.hitTime += dt;
        if (s.hitTime > 800) {
          s.phase = "aiming";
        }
      }
    };

    const draw = () => {
      const s = stateRef.current;
      // BG sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#1e3a8a");
      sky.addColorStop(1, "#0a0e27");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // Grass
      ctx.fillStyle = "#14532d";
      ctx.fillRect(0, H - 40, W, 40);
      // Target
      const rings = [
        { r: 56, c: "#ffffff" },
        { r: 44, c: "#111827" },
        { r: 32, c: "#3b82f6" },
        { r: 20, c: "#ef4444" },
        { r: 8, c: "#fbbf24" },
      ];
      for (const r of rings) {
        ctx.fillStyle = r.c;
        ctx.beginPath();
        ctx.arc(TARGET_X, TARGET_Y, r.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      for (const r of rings) {
        ctx.beginPath();
        ctx.arc(TARGET_X, TARGET_Y, r.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Target stand
      ctx.fillStyle = "#78350f";
      ctx.fillRect(TARGET_X - 3, TARGET_Y + 56, 6, H - 40 - (TARGET_Y + 56));

      // Previous shots
      for (const shot of s.shots) {
        if (shot.score === 0) continue;
        ctx.fillStyle = "#a78bfa";
        ctx.beginPath();
        ctx.arc(TARGET_X + shot.x, TARGET_Y + shot.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bow
      ctx.strokeStyle = "#7ec8e3";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(BOW_X, BOW_Y, 26, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Aiming arrow
      if (s.phase === "aiming") {
        const dx = s.mouseX - BOW_X;
        const dy = s.mouseY - BOW_Y;
        const angle = Math.atan2(dy, dx);
        ctx.save();
        ctx.translate(BOW_X, BOW_Y);
        ctx.rotate(angle);
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(0, -1, 30, 2);
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(26, -4);
        ctx.lineTo(26, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // String
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(BOW_X, BOW_Y - 26);
        ctx.lineTo(BOW_X + Math.cos(angle) * 10, BOW_Y + Math.sin(angle) * 10);
        ctx.lineTo(BOW_X, BOW_Y + 26);
        ctx.stroke();
        // Trajectory hint
        ctx.strokeStyle = "rgba(126,200,227,0.25)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        const speed = 0.6;
        let tx = BOW_X;
        let ty = BOW_Y;
        let tvx = Math.cos(angle) * speed;
        let tvy = Math.sin(angle) * speed;
        ctx.moveTo(tx, ty);
        for (let i = 0; i < 40; i++) {
          tx += tvx * 16;
          ty += tvy * 16;
          tvy += 0.0004 * 16;
          tvx += s.wind * 0.001 * 16;
          ctx.lineTo(tx, ty);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Flying arrow
      if (s.arrow) {
        ctx.save();
        ctx.translate(s.arrow.x, s.arrow.y);
        ctx.rotate(s.arrow.angle);
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(-15, -1, 30, 2);
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(11, -4);
        ctx.lineTo(11, 4);
        ctx.closePath();
        ctx.fill();
        // feathers
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-18, -3);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-18, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Wind indicator
      ctx.fillStyle = "#ffffff";
      ctx.font = "11px -apple-system";
      ctx.textAlign = "left";
      ctx.fillText(`Wind: ${s.wind >= 0 ? "→" : "←"} ${Math.abs(s.wind * 25).toFixed(1)}`, 10, 20);
      ctx.fillText(`Arrows: ${s.arrowsLeft}`, 10, 38);
    };

    const loop = (t: number) => {
      const dt = last ? Math.min(t - last, 32) : 16;
      last = t;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = ((e.clientX - rect.left) / rect.width) * W;
      stateRef.current.mouseY = ((e.clientY - rect.top) / rect.height) * H;
    };
    const onClick = () => {
      const s = stateRef.current;
      if (s.phase !== "aiming") return;
      const dx = s.mouseX - BOW_X;
      const dy = s.mouseY - BOW_Y;
      const angle = Math.atan2(dy, dx);
      const speed = 0.6;
      s.arrow = {
        x: BOW_X + Math.cos(angle) * 20,
        y: BOW_Y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle,
      };
      s.phase = "flying";
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  const reset = () => {
    stateRef.current = {
      phase: "aiming",
      mouseX: W / 2,
      mouseY: H / 2,
      arrow: null,
      wind: (Math.random() - 0.5) * 0.4,
      shots: [],
      arrowsLeft: 10,
      hitTime: 0,
    };
    setTick((t) => t + 1);
  };

  const s = stateRef.current;
  const totalScore = s.shots.reduce((a, b) => a + b.score, 0);

  return (
    <div className="w-full h-full flex flex-col items-center justify-start py-3 px-2 gap-2">
      <div className="w-full max-w-lg flex items-center justify-between px-4">
        <h1 className="text-xl font-black tracking-wider">
          <span className="text-steel">ARC</span>
          <span className="text-accent">HERY</span>
        </h1>
        <div className="text-xs text-slate-400">
          Shot {s.shots.length}/10
        </div>
        <div className="text-xs">
          <span className="text-slate-400">Score </span>
          <span className="text-accent font-bold text-lg">{totalScore}</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-navy-700 cursor-crosshair"
        style={{ maxHeight: "75vh", width: "auto" }}
      />
      <div className="flex gap-1 text-xs">
        {Array.from({ length: 10 }).map((_, i) => {
          const shot = s.shots[i];
          return (
            <div
              key={i}
              className={`w-6 h-6 rounded flex items-center justify-center border ${
                shot
                  ? shot.score === 10
                    ? "bg-yellow-400 text-navy-900 border-yellow-400 font-bold"
                    : shot.score > 0
                    ? "bg-navy-700 text-steel border-navy-700"
                    : "bg-navy-800 text-slate-600 border-navy-700"
                  : "border-navy-700 text-slate-600"
              }`}
            >
              {shot ? shot.score : "-"}
            </div>
          );
        })}
      </div>
      {s.phase === "done" && (
        <button
          onClick={reset}
          className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:opacity-90"
        >
          Play Again
        </button>
      )}
    </div>
  );
}
