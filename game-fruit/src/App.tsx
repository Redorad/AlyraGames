import { useEffect, useRef, useCallback, useState } from "react";

const W = 480, H = 640;

const FRUITS: { emoji: string; color: string; points: number }[] = [
  { emoji: "🍎", color: "#ff4444", points: 1 },
  { emoji: "🍊", color: "#ff8800", points: 1 },
  { emoji: "🍋", color: "#ffdd00", points: 1 },
  { emoji: "🍉", color: "#44cc44", points: 2 },
  { emoji: "🍇", color: "#aa44ff", points: 2 },
  { emoji: "🍓", color: "#ff2266", points: 1 },
  { emoji: "🥝", color: "#66bb33", points: 3 },
  { emoji: "🍑", color: "#ffaa88", points: 2 },
];

interface Fruit {
  x: number; y: number; vx: number; vy: number; r: number;
  emoji: string; color: string; points: number; sliced: boolean;
  rot: number; rotSpeed: number;
}
interface SliceTrail { x: number; y: number; age: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

function getHi(): number { return Number(localStorage.getItem("fruit-ninja-hi") || "0"); }
function setHi(s: number) { localStorage.setItem("fruit-ninja-hi", String(s)); }

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"menu" | "play" | "over">("menu");
  const stateRef = useRef(state); stateRef.current = state;
  const fruitsRef = useRef<Fruit[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<SliceTrail[]>([]);
  const scoreRef = useRef(0);
  const hiRef = useRef(getHi());
  const comboRef = useRef(0);
  const comboTimerRef = useRef(0);
  const missedRef = useRef(0);
  const livesRef = useRef(3);
  const frameRef = useRef(0);
  const rafRef = useRef(0);
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownRef = useRef(false);

  const spawnFruit = useCallback((isBomb = false) => {
    const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const side = Math.random();
    const x = 40 + Math.random() * (W - 80);
    fruitsRef.current.push({
      x, y: H + 20,
      vx: (Math.random() - 0.5) * 3,
      vy: -(10 + Math.random() * 4),
      r: 22 + Math.random() * 8,
      emoji: isBomb ? "💣" : f.emoji,
      color: isBomb ? "#ff0000" : f.color,
      points: isBomb ? -1 : f.points,
      sliced: false,
      rot: 0, rotSpeed: (Math.random() - 0.5) * 0.15,
    });
  }, []);

  const startGame = useCallback(() => {
    fruitsRef.current = [];
    particlesRef.current = [];
    trailRef.current = [];
    scoreRef.current = 0;
    comboRef.current = 0;
    missedRef.current = 0;
    livesRef.current = 3;
    frameRef.current = 0;
    setState("play");
  }, []);

  const endGame = useCallback(() => {
    if (scoreRef.current > hiRef.current) {
      hiRef.current = scoreRef.current;
      setHi(scoreRef.current);
    }
    setState("over");
  }, []);

  /* mouse / touch input */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const getPos = (e: MouseEvent | Touch): { x: number; y: number } => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
    };
    const md = (e: MouseEvent) => { mouseDownRef.current = true; lastMouseRef.current = getPos(e); };
    const mm = (e: MouseEvent) => { if (mouseDownRef.current) { trailRef.current.push({ ...getPos(e), age: 0 }); lastMouseRef.current = getPos(e); } };
    const mu = () => { mouseDownRef.current = false; lastMouseRef.current = null; };
    const ts = (e: TouchEvent) => { e.preventDefault(); mouseDownRef.current = true; lastMouseRef.current = getPos(e.touches[0]); };
    const tm = (e: TouchEvent) => { e.preventDefault(); if (mouseDownRef.current) { const p = getPos(e.touches[0]); trailRef.current.push({ ...p, age: 0 }); lastMouseRef.current = p; } };
    const te = () => { mouseDownRef.current = false; lastMouseRef.current = null; };

    canvas.addEventListener("mousedown", md);
    canvas.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    canvas.addEventListener("touchstart", ts, { passive: false });
    canvas.addEventListener("touchmove", tm, { passive: false });
    canvas.addEventListener("touchend", te);
    return () => {
      canvas.removeEventListener("mousedown", md);
      canvas.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      canvas.removeEventListener("touchstart", ts);
      canvas.removeEventListener("touchmove", tm);
      canvas.removeEventListener("touchend", te);
    };
  }, []);

  /* game loop */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const playing = stateRef.current === "play";
      frameRef.current++;

      if (playing) {
        /* spawn fruits */
        const spawnRate = Math.max(20, 50 - Math.floor(frameRef.current / 300));
        if (frameRef.current % spawnRate === 0) {
          const count = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < count; i++) {
            const isBomb = Math.random() < 0.12;
            spawnFruit(isBomb);
          }
        }

        /* update fruits */
        const gravity = 0.22;
        fruitsRef.current = fruitsRef.current.filter(f => {
          f.x += f.vx;
          f.y += f.vy;
          f.vy += gravity;
          f.rot += f.rotSpeed;

          /* check if sliced by mouse trail */
          if (!f.sliced && mouseDownRef.current && lastMouseRef.current) {
            const dx = lastMouseRef.current.x - f.x;
            const dy = lastMouseRef.current.y - f.y;
            if (Math.sqrt(dx * dx + dy * dy) < f.r + 15) {
              f.sliced = true;
              if (f.points < 0) {
                /* bomb */
                endGame();
                for (let i = 0; i < 20; i++) {
                  const angle = Math.random() * Math.PI * 2;
                  particlesRef.current.push({
                    x: f.x, y: f.y,
                    vx: Math.cos(angle) * (2 + Math.random() * 4),
                    vy: Math.sin(angle) * (2 + Math.random() * 4),
                    life: 30 + Math.random() * 20, color: "#ff4444", size: 3 + Math.random() * 3,
                  });
                }
              } else {
                comboRef.current++;
                comboTimerRef.current = 30;
                const mult = comboRef.current >= 3 ? comboRef.current : 1;
                scoreRef.current += f.points * mult;
                for (let i = 0; i < 8; i++) {
                  const angle = Math.random() * Math.PI * 2;
                  particlesRef.current.push({
                    x: f.x, y: f.y,
                    vx: Math.cos(angle) * (1 + Math.random() * 3),
                    vy: Math.sin(angle) * (1 + Math.random() * 3),
                    life: 20 + Math.random() * 20, color: f.color, size: 2 + Math.random() * 3,
                  });
                }
              }
            }
          }

          /* missed fruit (fell off bottom without being sliced) */
          if (!f.sliced && f.y > H + 40 && f.points > 0) {
            livesRef.current--;
            if (livesRef.current <= 0) endGame();
            return false;
          }

          return f.y < H + 60 && (!f.sliced || f.vy < 10);
        });

        /* combo timer */
        if (comboTimerRef.current > 0) {
          comboTimerRef.current--;
          if (comboTimerRef.current <= 0) comboRef.current = 0;
        }
      }

      /* update particles */
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--;
        return p.life > 0;
      });

      /* update trail */
      trailRef.current = trailRef.current.filter(t => { t.age++; return t.age < 15; });

      /* ── draw ── */
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);

      /* trail */
      for (let i = 1; i < trailRef.current.length; i++) {
        const a = trailRef.current[i - 1], b = trailRef.current[i];
        ctx.strokeStyle = `rgba(167,139,250,${1 - b.age / 15})`;
        ctx.lineWidth = 3 * (1 - b.age / 15);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      /* fruits */
      for (const f of fruitsRef.current) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.globalAlpha = f.sliced ? 0.4 : 1;
        ctx.font = `${f.r * 2}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(f.emoji, 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      /* particles */
      for (const p of particlesRef.current) {
        ctx.globalAlpha = p.life / 50;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* HUD */
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 12, 30);

      if (stateRef.current === "play") {
        /* lives */
        ctx.font = "18px serif";
        ctx.textAlign = "right";
        ctx.fillText("❤️".repeat(livesRef.current), W - 12, 30);

        /* combo display */
        if (comboRef.current >= 3) {
          ctx.fillStyle = "#a78bfa";
          ctx.font = "bold 24px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${comboRef.current}x COMBO!`, W / 2, 70);
        }
      }

      ctx.textAlign = "right";
      ctx.fillStyle = "#a78bfa";
      ctx.font = "16px sans-serif";
      ctx.fillText(`Best: ${hiRef.current}`, W - 12, 55);

      /* overlay */
      ctx.textAlign = "center";
      if (stateRef.current === "menu") {
        ctx.fillStyle = "rgba(10,14,39,0.75)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#7ec8e3";
        ctx.font = "bold 36px sans-serif";
        ctx.fillText("FRUIT NINJA", W / 2, H / 2 - 60);
        ctx.font = "60px serif";
        ctx.fillText("🍉🍎🍊🍋", W / 2, H / 2 + 10);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "18px sans-serif";
        ctx.fillText("Swipe / drag to slice fruits", W / 2, H / 2 + 60);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText("Avoid bombs! Click to start", W / 2, H / 2 + 90);
      } else if (stateRef.current === "over") {
        ctx.fillStyle = "rgba(10,14,39,0.75)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 36px sans-serif";
        ctx.fillText("GAME OVER", W / 2, H / 2 - 50);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "22px sans-serif";
        ctx.fillText(`Score: ${scoreRef.current}`, W / 2, H / 2);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "16px sans-serif";
        ctx.fillText("Click to play again", W / 2, H / 2 + 40);
      }
      ctx.textAlign = "left";
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [spawnFruit, endGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const onClick = () => { if (stateRef.current !== "play") startGame(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" && stateRef.current !== "play") startGame(); };
    canvas?.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => { canvas?.removeEventListener("click", onClick); window.removeEventListener("keydown", onKey); };
  }, [startGame]);

  return (
    <div className="flex flex-col items-center gap-3">
      <a href="/AlyraGames/" className="text-steel text-sm hover:underline self-start ml-2">&larr; Hub</a>
      <canvas ref={canvasRef} width={W} height={H}
        className="rounded-xl border border-white/10 max-h-[85dvh] w-auto" />
    </div>
  );
}
