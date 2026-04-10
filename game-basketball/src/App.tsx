import { useEffect, useRef, useState } from "react";

const W = 420;
const H = 680;
const BALL_R = 18;
const GRAVITY = 0.45;
const FRICTION = 0.98;

type Ball = { x: number; y: number; vx: number; vy: number; active: boolean };
type Hoop = { x: number; y: number };

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem("basketball_best") || "0"); } catch { return 0; }
  });
  const [shots, setShots] = useState(10);

  const stateRef = useRef({
    ball: { x: W / 2, y: H - 80, vx: 0, vy: 0, active: false } as Ball,
    hoop: { x: W / 2, y: 180 } as Hoop,
    dragging: false,
    dragStart: { x: 0, y: 0 },
    dragEnd: { x: 0, y: 0 },
    scored: false,
    wentThroughTop: false,
    shots: 10,
    score: 0,
    nextMove: 0,
  });

  function resetBall() {
    const s = stateRef.current;
    s.ball = { x: W / 2, y: H - 80, vx: 0, vy: 0, active: false };
    s.scored = false;
    s.wentThroughTop = false;
  }

  function moveHoop() {
    const s = stateRef.current;
    s.hoop.x = 80 + Math.random() * (W - 160);
    s.hoop.y = 140 + Math.random() * 80;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    function getPoint(e: MouseEvent | TouchEvent): { x: number; y: number } {
      const rect = canvas!.getBoundingClientRect();
      let cx = 0, cy = 0;
      if ("touches" in e) {
        const t = e.touches[0] || e.changedTouches[0];
        if (!t) return { x: 0, y: 0 };
        cx = t.clientX; cy = t.clientY;
      } else {
        cx = e.clientX; cy = e.clientY;
      }
      return {
        x: (cx - rect.left) * (W / rect.width),
        y: (cy - rect.top) * (H / rect.height),
      };
    }

    function onDown(e: MouseEvent | TouchEvent) {
      if (e.cancelable) e.preventDefault();
      if (s.ball.active) return;
      if (stateRef.current.shots <= 0) return;
      const p = getPoint(e);
      const dx = p.x - s.ball.x;
      const dy = p.y - s.ball.y;
      if (Math.hypot(dx, dy) < BALL_R * 2.5) {
        s.dragging = true;
        s.dragStart = { x: p.x, y: p.y };
        s.dragEnd = { x: p.x, y: p.y };
      }
    }
    function onMove(e: MouseEvent | TouchEvent) {
      if (!s.dragging) return;
      if (e.cancelable) e.preventDefault();
      s.dragEnd = getPoint(e);
    }
    function onUp(e: MouseEvent | TouchEvent) {
      if (!s.dragging) return;
      if (e.cancelable) e.preventDefault();
      s.dragging = false;
      const dx = s.dragStart.x - s.dragEnd.x;
      const dy = s.dragStart.y - s.dragEnd.y;
      const power = 0.18;
      s.ball.vx = dx * power;
      s.ball.vy = dy * power;
      s.ball.active = true;
      stateRef.current.shots--;
      setShots(stateRef.current.shots);
    }

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("touchstart", onDown as any, { passive: false });
    canvas.addEventListener("touchmove", onMove as any, { passive: false });
    canvas.addEventListener("touchend", onUp as any, { passive: false });

    let raf = 0;
    function loop() {
      raf = requestAnimationFrame(loop);
      update();
      draw();
    }

    function checkRimCollision(b: Ball, rx: number, ry: number) {
      const dx = b.x - rx;
      const dy = b.y - ry;
      const d = Math.hypot(dx, dy);
      if (d < BALL_R + 3) {
        const nx = dx / d;
        const ny = dy / d;
        b.x = rx + nx * (BALL_R + 3);
        b.y = ry + ny * (BALL_R + 3);
        const dot = b.vx * nx + b.vy * ny;
        b.vx -= 1.6 * dot * nx;
        b.vy -= 1.6 * dot * ny;
        b.vx *= 0.7;
        b.vy *= 0.7;
      }
    }

    function update() {
      const b = s.ball;
      if (b.active) {
        b.vy += GRAVITY;
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.998;

        // Walls
        if (b.x < BALL_R) { b.x = BALL_R; b.vx *= -0.7; }
        if (b.x > W - BALL_R) { b.x = W - BALL_R; b.vx *= -0.7; }

        // Hoop rim collision (left and right rim pegs)
        const rimL = { x: s.hoop.x - 35, y: s.hoop.y };
        const rimR = { x: s.hoop.x + 35, y: s.hoop.y };
        checkRimCollision(b, rimL.x, rimL.y);
        checkRimCollision(b, rimR.x, rimR.y);

        // Check scoring: ball passes through top of hoop going down between rims
        if (b.vy > 0 && Math.abs(b.x - s.hoop.x) < 30) {
          if (!s.wentThroughTop && b.y - BALL_R >= s.hoop.y - 5 && b.y < s.hoop.y + 5) {
            s.wentThroughTop = true;
          }
          if (s.wentThroughTop && !s.scored && b.y > s.hoop.y + 8) {
            s.scored = true;
            stateRef.current.score++;
            setScore(stateRef.current.score);
            stateRef.current.shots++; // reward for scoring
            setShots(stateRef.current.shots);
          }
        }

        // Floor
        if (b.y > H - BALL_R - 10) {
          b.y = H - BALL_R - 10;
          b.vy *= -0.5;
          b.vx *= FRICTION;
          if (Math.abs(b.vy) < 1.5 && Math.abs(b.vx) < 0.5) {
            // stopped - reset
            setTimeout(() => {
              resetBall();
              if (stateRef.current.score > best) {
                setBest(stateRef.current.score);
                try { localStorage.setItem("basketball_best", String(stateRef.current.score)); } catch {}
              }
              moveHoop();
            }, 600);
            b.active = false;
          }
        }

        // Out of bounds top
        if (b.y < -100) {
          setTimeout(() => {
            resetBall();
            moveHoop();
          }, 300);
          b.active = false;
        }
      }
    }

    function drawBall(x: number, y: number) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, BALL_R);
      grad.addColorStop(0, "#fb923c");
      grad.addColorStop(1, "#c2410c");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "#431407";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // lines
      ctx.beginPath();
      ctx.moveTo(x - BALL_R, y);
      ctx.lineTo(x + BALL_R, y);
      ctx.moveTo(x, y - BALL_R);
      ctx.lineTo(x, y + BALL_R);
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      // bg
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#1a2050");
      grad.addColorStop(1, "#0a0e27");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // floor
      ctx.fillStyle = "#451a03";
      ctx.fillRect(0, H - 10, W, 10);
      ctx.strokeStyle = "#7ec8e3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - 10);
      ctx.lineTo(W, H - 10);
      ctx.stroke();

      // Backboard
      const bb = { x: s.hoop.x, y: s.hoop.y - 40 };
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(bb.x - 45, bb.y - 30, 90, 55);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.strokeRect(bb.x - 45, bb.y - 30, 90, 55);
      ctx.strokeRect(bb.x - 20, bb.y - 5, 40, 25);

      // Rim
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(s.hoop.x - 35, s.hoop.y);
      ctx.lineTo(s.hoop.x + 35, s.hoop.y);
      ctx.stroke();
      // Rim pegs
      ctx.fillStyle = "#dc2626";
      ctx.beginPath(); ctx.arc(s.hoop.x - 35, s.hoop.y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s.hoop.x + 35, s.hoop.y, 3, 0, Math.PI * 2); ctx.fill();

      // Net
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        ctx.beginPath();
        ctx.moveTo(s.hoop.x - 35 + t * 70, s.hoop.y);
        ctx.lineTo(s.hoop.x - 28 + t * 56, s.hoop.y + 28);
        ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(s.hoop.x - 35 + (i / 6) * 70, s.hoop.y);
        ctx.lineTo(s.hoop.x - 32 + ((i + 1) / 6) * 65, s.hoop.y + 28);
        ctx.stroke();
      }

      // Ball
      drawBall(s.ball.x, s.ball.y);

      // Aim line
      if (s.dragging) {
        const dx = s.dragStart.x - s.dragEnd.x;
        const dy = s.dragStart.y - s.dragEnd.y;
        ctx.strokeStyle = "rgba(126,200,227,0.8)";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(s.ball.x, s.ball.y);
        ctx.lineTo(s.ball.x + dx * 1.5, s.ball.y + dy * 1.5);
        ctx.stroke();
        ctx.setLineDash([]);
        // arrow head
        ctx.fillStyle = "rgba(126,200,227,0.9)";
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(s.ball.x + dx * 1.5, s.ball.y + dy * 1.5);
        ctx.lineTo(s.ball.x + dx * 1.5 - Math.cos(angle - 0.4) * 12, s.ball.y + dy * 1.5 - Math.sin(angle - 0.4) * 12);
        ctx.lineTo(s.ball.x + dx * 1.5 - Math.cos(angle + 0.4) * 12, s.ball.y + dy * 1.5 - Math.sin(angle + 0.4) * 12);
        ctx.closePath();
        ctx.fill();
      }
    }

    loop();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onUp);
    };
  }, [best]);

  function restart() {
    const s = stateRef.current;
    s.score = 0;
    s.shots = 10;
    setScore(0);
    setShots(10);
    resetBall();
    moveHoop();
  }

  return (
    <div className="w-full max-w-md p-3 relative">
      <div className="flex items-center justify-between mb-2 mt-14 px-1">
        <div className="text-sm text-steel font-semibold">Basketball</div>
        <div className="text-sm text-white/70">Best: <span className="text-accent font-bold">{best}</span></div>
      </div>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-sm text-white/70">Score: <span className="text-white font-bold">{score}</span></div>
        <div className="text-sm text-white/70">Shots: <span className="text-white font-bold">{shots}</span></div>
      </div>
      <div className="relative bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <canvas ref={canvasRef} width={W} height={H} className="w-full block" style={{ aspectRatio: `${W}/${H}` }} />
        {shots <= 0 && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-6">
            <div className="text-6xl mb-3">🏀</div>
            <h1 className="text-2xl font-bold text-steel mb-2">Game Over</h1>
            <p className="text-white/70 mb-1">Score: {score}</p>
            <p className="text-white/70 mb-5">Best: {best}</p>
            <button onClick={restart} className="bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 px-6 rounded-xl transition">Play Again</button>
          </div>
        )}
      </div>
      <p className="text-xs text-white/40 text-center mt-2">Drag the ball, release to shoot</p>
    </div>
  );
}
