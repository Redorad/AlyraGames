import { useEffect, useRef, useState } from "react";

const W = 440;
const H = 620;
const CX = W / 2;
const CY = H / 2 - 20;
const R_OUTER = 180;
const R_DOUBLE_OUTER = R_OUTER;
const R_DOUBLE_INNER = R_OUTER - 14;
const R_TRIPLE_OUTER = R_OUTER - 60;
const R_TRIPLE_INNER = R_TRIPLE_OUTER - 14;
const R_BULL_OUTER = 18;
const R_BULL_INNER = 8;

// Standard dartboard order
const SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

type Dart = { x: number; y: number; score: number; label: string };

function calcHit(x: number, y: number): { score: number; label: string } {
  const dx = x - CX;
  const dy = y - CY;
  const dist = Math.hypot(dx, dy);
  if (dist > R_OUTER) return { score: 0, label: "Miss" };
  if (dist <= R_BULL_INNER) return { score: 50, label: "Bullseye!" };
  if (dist <= R_BULL_OUTER) return { score: 25, label: "25" };
  // Angle: 0 is top, segments span 18deg each. Segment 20 is at top (angle -90 deg).
  let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // 0 = top
  if (angleDeg < 0) angleDeg += 360;
  // Each segment offset by -9deg (so 20 spans -9..+9)
  angleDeg = (angleDeg + 9) % 360;
  const segIdx = Math.floor(angleDeg / 18);
  const base = SEGMENTS[segIdx];
  let mult = 1;
  let label = `${base}`;
  if (dist >= R_DOUBLE_INNER && dist <= R_DOUBLE_OUTER) {
    mult = 2;
    label = `Double ${base}`;
  } else if (dist >= R_TRIPLE_INNER && dist <= R_TRIPLE_OUTER) {
    mult = 3;
    label = `Triple ${base}`;
  }
  return { score: base * mult, label };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [darts, setDarts] = useState<Dart[]>([]);
  const [total, setTotal] = useState(0);
  const [round, setRound] = useState(1);
  const [last, setLast] = useState<string>("");
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem("darts_best") || "0"); } catch { return 0; }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function draw() {
      // bg
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);

      // Board bg (black outer)
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.arc(CX, CY, R_OUTER + 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#78716c";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Segments
      for (let i = 0; i < 20; i++) {
        const startAngle = (i * 18 - 90 - 9) * (Math.PI / 180);
        const endAngle = ((i + 1) * 18 - 90 - 9) * (Math.PI / 180);
        // single areas
        const isLight = i % 2 === 0;
        const col1 = isLight ? "#fde68a" : "#1f2937";
        const col2 = isLight ? "#dc2626" : "#16a34a";

        // outer single
        ctx.fillStyle = col1;
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, R_DOUBLE_INNER, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        // inner single (between triple and bull)
        // we'll redraw triples/doubles on top
        // Double ring
        ctx.fillStyle = col2;
        ctx.beginPath();
        ctx.arc(CX, CY, R_DOUBLE_OUTER, startAngle, endAngle);
        ctx.arc(CX, CY, R_DOUBLE_INNER, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();

        // Triple ring
        ctx.fillStyle = col2;
        ctx.beginPath();
        ctx.arc(CX, CY, R_TRIPLE_OUTER, startAngle, endAngle);
        ctx.arc(CX, CY, R_TRIPLE_INNER, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();
      }

      // Segment separator lines
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const ang = (i * 18 - 90 - 9) * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(ang) * R_BULL_OUTER, CY + Math.sin(ang) * R_BULL_OUTER);
        ctx.lineTo(CX + Math.cos(ang) * R_OUTER, CY + Math.sin(ang) * R_OUTER);
        ctx.stroke();
      }

      // Bullseye
      ctx.fillStyle = "#16a34a";
      ctx.beginPath();
      ctx.arc(CX, CY, R_BULL_OUTER, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(CX, CY, R_BULL_INNER, 0, Math.PI * 2);
      ctx.fill();

      // Numbers
      ctx.fillStyle = "#fafafa";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < 20; i++) {
        const ang = (i * 18 - 90) * (Math.PI / 180);
        const nx = CX + Math.cos(ang) * (R_OUTER + 10);
        const ny = CY + Math.sin(ang) * (R_OUTER + 10);
        ctx.fillText(String(SEGMENTS[i]), nx, ny);
      }

      // Darts
      for (const d of darts) {
        // feathers
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
        ctx.fill();
        // shaft
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x - 8, d.y - 8);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
        // flight
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.moveTo(d.x - 8, d.y - 8);
        ctx.lineTo(d.x - 16, d.y - 4);
        ctx.lineTo(d.x - 12, d.y - 12);
        ctx.closePath();
        ctx.fill();
      }
    }

    draw();
  }, [darts]);

  function handleThrow(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (darts.length >= 3) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let cx = 0, cy = 0;
    if ("touches" in e) {
      const t = (e as React.TouchEvent<HTMLCanvasElement>).changedTouches[0];
      if (!t) return;
      cx = t.clientX; cy = t.clientY;
    } else {
      cx = (e as React.MouseEvent).clientX;
      cy = (e as React.MouseEvent).clientY;
    }
    // apply small aim inaccuracy
    const ax = (cx - rect.left) * (W / rect.width);
    const ay = (cy - rect.top) * (H / rect.height);
    const noise = 8;
    const x = ax + (Math.random() - 0.5) * noise;
    const y = ay + (Math.random() - 0.5) * noise;
    const hit = calcHit(x, y);
    const newDart: Dart = { x, y, score: hit.score, label: hit.label };
    const newDarts = [...darts, newDart];
    setDarts(newDarts);
    setTotal(t => t + hit.score);
    setLast(`${hit.label} (+${hit.score})`);
  }

  function nextRound() {
    if (total > best) {
      setBest(total);
      try { localStorage.setItem("darts_best", String(total)); } catch {}
    }
    setRound(r => r + 1);
    setDarts([]);
    setLast("");
  }

  function resetGame() {
    if (total > best) {
      setBest(total);
      try { localStorage.setItem("darts_best", String(total)); } catch {}
    }
    setRound(1);
    setTotal(0);
    setDarts([]);
    setLast("");
  }

  const roundScore = darts.reduce((a, b) => a + b.score, 0);
  const finishedRound = darts.length >= 3;

  return (
    <div className="w-full max-w-md p-3 relative">
      <div className="flex items-center justify-between mb-2 mt-14 px-1">
        <div className="text-sm text-steel font-semibold">Round {round}</div>
        <div className="text-sm text-white/70">Total: <span className="text-accent font-bold">{total}</span></div>
      </div>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-sm text-white/70">Best: <span className="text-white font-bold">{best}</span></div>
        <div className="text-sm text-white/70">Darts: <span className="text-white font-bold">{darts.length}/3</span></div>
      </div>
      <div className="relative bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full block cursor-crosshair"
          style={{ aspectRatio: `${W}/${H}` }}
          onClick={handleThrow}
          onTouchEnd={handleThrow}
        />
        <div className="absolute top-2 left-0 right-0 text-center">
          <div className="text-white/80 text-sm">Round score: <span className="font-bold text-accent">{roundScore}</span></div>
          {last && <div className="text-steel text-xs mt-1">{last}</div>}
        </div>
        {finishedRound && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 px-3">
            <button onClick={nextRound} className="flex-1 bg-accent hover:bg-accent/80 text-navy-900 font-bold py-2 rounded-xl">Next Round</button>
            <button onClick={resetGame} className="bg-navy-700 border border-white/10 text-white font-bold py-2 px-4 rounded-xl">Reset</button>
          </div>
        )}
      </div>
      <p className="text-xs text-white/40 text-center mt-2">Tap/click to throw</p>
    </div>
  );
}
