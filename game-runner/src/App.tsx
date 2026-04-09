import { useEffect, useRef, useCallback, useState } from "react";

const W = 600, H = 300;
const GROUND_Y = H - 50;
const PLAYER_W = 30, PLAYER_H = 50;
const SLIDE_H = 25;
const GRAVITY = 0.7;
const JUMP_VEL = -12;

interface Obstacle { x: number; type: "jump" | "slide"; w: number; h: number; }
interface NeonLine { x: number; y: number; len: number; color: string; speed: number; }

function getHi(): number { return Number(localStorage.getItem("cyber-runner-hi") || "0"); }
function setHi(s: number) { localStorage.setItem("cyber-runner-hi", String(s)); }

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"menu" | "play" | "over">("menu");
  const stateRef = useRef(state); stateRef.current = state;
  const rafRef = useRef(0);

  const playerRef = useRef({ y: GROUND_Y - PLAYER_H, vy: 0, jumping: false, sliding: false });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const neonLinesRef = useRef<NeonLine[]>([]);
  const scoreRef = useRef(0);
  const hiRef = useRef(getHi());
  const speedRef = useRef(5);
  const frameRef = useRef(0);
  const nextSpawnRef = useRef(120);

  /* init neon bg lines */
  useEffect(() => {
    neonLinesRef.current = Array.from({ length: 20 }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.7,
      len: 30 + Math.random() * 80, color: Math.random() > 0.5 ? "#7ec8e3" : "#a78bfa",
      speed: 0.5 + Math.random() * 2,
    }));
  }, []);

  const startGame = useCallback(() => {
    playerRef.current = { y: GROUND_Y - PLAYER_H, vy: 0, jumping: false, sliding: false };
    obstaclesRef.current = [];
    scoreRef.current = 0;
    speedRef.current = 5;
    frameRef.current = 0;
    nextSpawnRef.current = 120;
    setState("play");
  }, []);

  const endGame = useCallback(() => {
    if (scoreRef.current > hiRef.current) { hiRef.current = scoreRef.current; setHi(scoreRef.current); }
    setState("over");
  }, []);

  /* input */
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (stateRef.current !== "play") {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startGame(); }
        return;
      }
      if ((e.key === "ArrowUp" || e.key === " " || e.key === "w" || e.key === "W") && !playerRef.current.jumping) {
        e.preventDefault();
        playerRef.current.vy = JUMP_VEL;
        playerRef.current.jumping = true;
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        playerRef.current.sliding = true;
      }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") playerRef.current.sliding = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [startGame]);

  /* touch */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ts = (e: TouchEvent) => {
      e.preventDefault();
      if (stateRef.current !== "play") { startGame(); return; }
      const r = canvas.getBoundingClientRect();
      const ty = (e.touches[0].clientY - r.top) / r.height;
      if (ty > 0.6) { playerRef.current.sliding = true; }
      else if (!playerRef.current.jumping) {
        playerRef.current.vy = JUMP_VEL;
        playerRef.current.jumping = true;
      }
    };
    const te = () => { playerRef.current.sliding = false; };
    canvas.addEventListener("touchstart", ts, { passive: false });
    canvas.addEventListener("touchend", te);
    return () => { canvas.removeEventListener("touchstart", ts); canvas.removeEventListener("touchend", te); };
  }, [startGame]);

  /* game loop */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const playing = stateRef.current === "play";
      frameRef.current++;

      /* update neon bg */
      for (const nl of neonLinesRef.current) {
        nl.x -= nl.speed;
        if (nl.x + nl.len < 0) { nl.x = W; nl.y = Math.random() * H * 0.7; }
      }

      if (playing) {
        const p = playerRef.current;
        scoreRef.current = Math.floor(frameRef.current / 6);
        speedRef.current = 5 + scoreRef.current / 100;

        /* player physics */
        p.vy += GRAVITY;
        p.y += p.vy;
        if (p.y >= GROUND_Y - PLAYER_H) {
          p.y = GROUND_Y - PLAYER_H;
          p.vy = 0;
          p.jumping = false;
        }

        /* spawn obstacles */
        nextSpawnRef.current--;
        if (nextSpawnRef.current <= 0) {
          const type = Math.random() > 0.4 ? "jump" : "slide";
          obstaclesRef.current.push({
            x: W + 10,
            type,
            w: type === "jump" ? 25 + Math.random() * 15 : 60 + Math.random() * 30,
            h: type === "jump" ? 30 + Math.random() * 20 : 25,
          });
          nextSpawnRef.current = 60 + Math.floor(Math.random() * 80 / (speedRef.current / 5));
        }

        /* update obstacles */
        obstaclesRef.current = obstaclesRef.current.filter(o => {
          o.x -= speedRef.current;
          return o.x + o.w > -10;
        });

        /* collision */
        const pH = p.sliding ? SLIDE_H : PLAYER_H;
        const pY = p.sliding ? (GROUND_Y - SLIDE_H) : p.y;
        const px1 = 50, px2 = 50 + PLAYER_W;
        const py1 = pY, py2 = pY + pH;

        for (const o of obstaclesRef.current) {
          let ox1 = o.x, ox2 = o.x + o.w;
          let oy1: number, oy2: number;
          if (o.type === "jump") {
            oy1 = GROUND_Y - o.h; oy2 = GROUND_Y;
          } else {
            oy1 = GROUND_Y - PLAYER_H - 5; oy2 = GROUND_Y - PLAYER_H - 5 + o.h;
          }
          if (px2 > ox1 && px1 < ox2 && py2 > oy1 && py1 < oy2) {
            endGame(); break;
          }
        }
      }

      /* ── draw ── */
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);

      /* neon bg lines */
      for (const nl of neonLinesRef.current) {
        ctx.strokeStyle = nl.color;
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(nl.x, nl.y); ctx.lineTo(nl.x + nl.len, nl.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      /* ground line with glow */
      ctx.shadowColor = "#7ec8e3";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "#7ec8e3";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();
      ctx.shadowBlur = 0;

      /* grid lines on ground */
      ctx.strokeStyle = "rgba(126,200,227,0.1)";
      ctx.lineWidth = 1;
      const gridOffset = (frameRef.current * speedRef.current) % 40;
      for (let x = -gridOffset; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, GROUND_Y); ctx.lineTo(x - 20, H); ctx.stroke();
      }
      for (let y = GROUND_Y + 15; y < H; y += 15) {
        ctx.globalAlpha = 0.05;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      /* player */
      if (stateRef.current !== "over") {
        const p = playerRef.current;
        const pH = p.sliding ? SLIDE_H : PLAYER_H;
        const pY = p.sliding ? (GROUND_Y - SLIDE_H) : p.y;

        ctx.fillStyle = "#a78bfa";
        ctx.shadowColor = "#a78bfa";
        ctx.shadowBlur = 12;
        ctx.fillRect(50, pY, PLAYER_W, pH);
        ctx.shadowBlur = 0;

        /* visor */
        ctx.fillStyle = "#7ec8e3";
        if (!p.sliding) {
          ctx.fillRect(62, pY + 8, 14, 6);
        } else {
          ctx.fillRect(62, pY + 4, 14, 6);
        }
      }

      /* obstacles */
      for (const o of obstaclesRef.current) {
        if (o.type === "jump") {
          ctx.fillStyle = "#ff4466";
          ctx.shadowColor = "#ff4466";
          ctx.shadowBlur = 8;
          ctx.fillRect(o.x, GROUND_Y - o.h, o.w, o.h);
          ctx.shadowBlur = 0;
          /* warning stripes */
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          for (let s = 0; s < o.h; s += 10) {
            ctx.fillRect(o.x, GROUND_Y - o.h + s, o.w, 3);
          }
        } else {
          ctx.fillStyle = "#ffaa00";
          ctx.shadowColor = "#ffaa00";
          ctx.shadowBlur = 8;
          const by = GROUND_Y - PLAYER_H - 5;
          ctx.fillRect(o.x, by, o.w, o.h);
          ctx.shadowBlur = 0;
        }
      }

      /* HUD */
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${scoreRef.current}m`, 12, 28);
      ctx.textAlign = "right";
      ctx.fillStyle = "#a78bfa";
      ctx.font = "14px sans-serif";
      ctx.fillText(`Best: ${hiRef.current}m`, W - 12, 28);

      /* overlay */
      ctx.textAlign = "center";
      if (stateRef.current === "menu") {
        ctx.fillStyle = "rgba(10,14,39,0.7)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#7ec8e3";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText("CYBER RUNNER", W / 2, H / 2 - 40);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "16px sans-serif";
        ctx.fillText("Up/Space = Jump | Down = Slide", W / 2, H / 2);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText("Press Enter or tap to start", W / 2, H / 2 + 30);
      } else if (stateRef.current === "over") {
        ctx.fillStyle = "rgba(10,14,39,0.7)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText("CRASHED", W / 2, H / 2 - 40);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "20px sans-serif";
        ctx.fillText(`Distance: ${scoreRef.current}m`, W / 2, H / 2);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "14px sans-serif";
        ctx.fillText("Press Enter or tap to retry", W / 2, H / 2 + 30);
      }
      ctx.textAlign = "left";
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [endGame]);

  /* click to start/restart */
  useEffect(() => {
    const canvas = canvasRef.current;
    const onClick = () => { if (stateRef.current !== "play") startGame(); };
    canvas?.addEventListener("click", onClick);
    return () => { canvas?.removeEventListener("click", onClick); };
  }, [startGame]);

  return (
    <div className="flex flex-col items-center gap-3">
      <a href="/AlyraGames/" className="text-steel text-sm hover:underline self-start ml-2">&larr; Hub</a>
      <canvas ref={canvasRef} width={W} height={H}
        className="rounded-xl border border-white/10 max-w-[95vw] w-auto" />
    </div>
  );
}
