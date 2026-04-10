import { useEffect, useRef, useState } from "react";

// Track definition: an oval with inner and outer boundaries.
// We'll store checkpoints as polygons for lap detection.
const W = 900;
const H = 600;

// Track shape: outer ring & inner ring (ellipses centered)
const OUTER = { cx: W / 2, cy: H / 2, rx: 380, ry: 240 };
const INNER = { cx: W / 2, cy: H / 2, rx: 200, ry: 110 };

function insideEllipse(x: number, y: number, e: typeof OUTER) {
  const dx = (x - e.cx) / e.rx;
  const dy = (y - e.cy) / e.ry;
  return dx * dx + dy * dy <= 1;
}

function onTrack(x: number, y: number) {
  return insideEllipse(x, y, OUTER) && !insideEllipse(x, y, INNER);
}

type Keys = { up: boolean; down: boolean; left: boolean; right: boolean };

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lap, setLap] = useState(0);
  const [lapTime, setLapTime] = useState(0);
  const [bestLap, setBestLap] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(0);

  const stateRef = useRef({
    x: W / 2,
    y: H - 120,
    angle: -Math.PI / 2,
    vel: 0,
    lapStart: 0,
    lap: 0,
    bestLap: null as number | null,
    sectors: [false, false, false, false],
    running: false,
  });

  const keysRef = useRef<Keys>({ up: false, down: false, left: false, right: false });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") keysRef.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s") keysRef.current.down = true;
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true;
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      )
        e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") keysRef.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s") keysRef.current.down = false;
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = false;
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
    let last = performance.now();

    const drawTrack = () => {
      // grass
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);

      // outer green border glow
      ctx.save();
      ctx.translate(OUTER.cx, OUTER.cy);
      ctx.beginPath();
      ctx.ellipse(0, 0, OUTER.rx + 14, OUTER.ry + 14, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(167,139,250,0.25)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // asphalt (outer)
      ctx.save();
      ctx.translate(OUTER.cx, OUTER.cy);
      ctx.beginPath();
      ctx.ellipse(0, 0, OUTER.rx, OUTER.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#1a2050";
      ctx.fill();
      ctx.strokeStyle = "#7ec8e3";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // infield (cut-out)
      ctx.save();
      ctx.translate(INNER.cx, INNER.cy);
      ctx.beginPath();
      ctx.ellipse(0, 0, INNER.rx, INNER.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0e27";
      ctx.fill();
      ctx.strokeStyle = "#7ec8e3";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // dashed center line (approx)
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.setLineDash([12, 18]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      const midRx = (OUTER.rx + INNER.rx) / 2;
      const midRy = (OUTER.ry + INNER.ry) / 2;
      ctx.ellipse(OUTER.cx, OUTER.cy, midRx, midRy, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // start/finish line
      ctx.save();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(OUTER.cx, OUTER.cy + INNER.ry);
      ctx.lineTo(OUTER.cx, OUTER.cy + OUTER.ry);
      ctx.stroke();
      // checker
      const cs = 8;
      for (let i = 0; i < 8; i++) {
        const y = OUTER.cy + INNER.ry + i * cs;
        ctx.fillStyle = i % 2 === 0 ? "#fff" : "#000";
        ctx.fillRect(OUTER.cx - 14, y, 14, cs);
        ctx.fillStyle = i % 2 === 0 ? "#000" : "#fff";
        ctx.fillRect(OUTER.cx, y, 14, cs);
      }
      ctx.restore();
    };

    const drawCar = (x: number, y: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(-18, -11, 36, 22);
      // body
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(-16, -10, 32, 20);
      // windshield
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(-2, -8, 8, 16);
      // headlights
      ctx.fillStyle = "#fff";
      ctx.fillRect(14, -8, 2, 4);
      ctx.fillRect(14, 4, 2, 4);
      // glow
      ctx.shadowColor = "#a78bfa";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "#7ec8e3";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-16, -10, 32, 20);
      ctx.restore();
    };

    const step = (ts: number) => {
      const dt = Math.min(32, ts - last);
      last = ts;
      const s = stateRef.current;
      const k = keysRef.current;

      if (s.running) {
        const accel = 0.02;
        const brake = 0.035;
        const friction = 0.012;
        const turn = 0.055;
        const maxSpeed = 5.5;

        if (k.up) s.vel += accel * dt;
        if (k.down) s.vel -= brake * dt;
        if (!k.up && !k.down) {
          if (s.vel > 0) s.vel = Math.max(0, s.vel - friction * dt);
          else s.vel = Math.min(0, s.vel + friction * dt);
        }
        if (s.vel > maxSpeed) s.vel = maxSpeed;
        if (s.vel < -maxSpeed / 2) s.vel = -maxSpeed / 2;

        const turnRate = (turn * Math.min(1, Math.abs(s.vel) / 2)) *
          (s.vel >= 0 ? 1 : -1);
        if (k.left) s.angle -= turnRate;
        if (k.right) s.angle += turnRate;

        const nx = s.x + Math.cos(s.angle) * s.vel * (dt / 16);
        const ny = s.y + Math.sin(s.angle) * s.vel * (dt / 16);
        if (onTrack(nx, ny)) {
          s.x = nx;
          s.y = ny;
        } else {
          s.vel *= 0.4;
          // attempt slide
          if (onTrack(nx, s.y)) s.x = nx;
          else if (onTrack(s.x, ny)) s.y = ny;
        }

        // sectors (4 quadrants relative to track center)
        const dx = s.x - OUTER.cx;
        const dy = s.y - OUTER.cy;
        let sector = -1;
        if (dx >= 0 && dy >= 0) sector = 0; // bottom-right
        else if (dx < 0 && dy >= 0) sector = 1; // bottom-left
        else if (dx < 0 && dy < 0) sector = 2; // top-left
        else if (dx >= 0 && dy < 0) sector = 3; // top-right

        // mark sectors in order 0->1->2->3 then back to 0 = lap
        if (sector === 0 && s.sectors[3]) {
          // completed a lap
          const t = (performance.now() - s.lapStart) / 1000;
          if (s.bestLap == null || t < s.bestLap) s.bestLap = t;
          setBestLap(s.bestLap);
          s.lap += 1;
          setLap(s.lap);
          s.lapStart = performance.now();
          s.sectors = [true, false, false, false];
        } else if (sector >= 0) {
          s.sectors[sector] = true;
        }
        setLapTime((performance.now() - s.lapStart) / 1000);
        setSpeed(Math.abs(s.vel));
      }

      drawTrack();
      drawCar(s.x, s.y, s.angle);

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const start = () => {
    const s = stateRef.current;
    s.x = W / 2 + 20;
    s.y = H / 2 + (OUTER.ry + INNER.ry) / 2;
    s.angle = -Math.PI;
    s.vel = 0;
    s.lap = 0;
    s.sectors = [true, false, false, false];
    s.lapStart = performance.now();
    s.running = true;
    setLap(0);
    setLapTime(0);
    setRunning(true);
  };

  const fmt = (t: number) =>
    `${Math.floor(t / 60)
      .toString()
      .padStart(2, "0")}:${(t % 60).toFixed(2).padStart(5, "0")}`;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-steel">NEON</span>
          <span className="text-accent"> RACER</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Arrow keys / WASD to drive. Stay on the track.
        </p>
      </div>
      <div className="flex gap-4 text-sm">
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Lap: <span className="text-steel font-bold">{lap}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Time: <span className="text-steel font-bold">{fmt(lapTime)}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Best: <span className="text-accent font-bold">{bestLap != null ? fmt(bestLap) : "--:--.--"}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Speed: <span className="text-accent font-bold">{(speed * 30).toFixed(0)}</span>
        </div>
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block max-w-[95vw] max-h-[70dvh]"
          style={{ imageRendering: "pixelated" }}
        />
        {!running && (
          <div className="absolute inset-0 bg-navy-900/80 flex items-center justify-center">
            <button
              onClick={start}
              className="px-6 py-3 rounded-xl bg-accent text-navy-900 font-bold text-lg hover:scale-105 transition-transform"
            >
              START RACE
            </button>
          </div>
        )}
      </div>
      {running && (
        <button
          onClick={start}
          className="text-xs text-slate-400 hover:text-steel underline"
        >
          Restart
        </button>
      )}
    </div>
  );
}
