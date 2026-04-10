import { useEffect, useRef, useState } from "react";

const W = 420;
const H = 680;
const LOG_CX = W / 2;
const LOG_CY = 220;
const LOG_R = 80;

type StuckKnife = { angle: number }; // angle relative to log rotation

type State = {
  rotation: number;
  rotSpeed: number;
  stuck: StuckKnife[];
  target: number; // knives to throw for level
  remaining: number;
  level: number;
  throwing: null | { y: number };
  game: "menu" | "playing" | "over" | "levelComplete";
  score: number;
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ui, setUI] = useState({ level: 1, remaining: 0, score: 0 });
  const [game, setGame] = useState<"menu" | "playing" | "over" | "levelComplete">("menu");
  const stateRef = useRef<State>({
    rotation: 0,
    rotSpeed: 0.02,
    stuck: [],
    target: 5,
    remaining: 5,
    level: 1,
    throwing: null,
    game: "menu",
    score: 0,
  });

  function startLevel(level: number) {
    const s = stateRef.current;
    s.rotation = 0;
    s.rotSpeed = 0.015 + level * 0.005;
    if (level % 3 === 0) s.rotSpeed *= -1; // reverse direction
    s.stuck = [];
    // add some pre-stuck knives as obstacles
    const obstacles = Math.min(Math.floor(level / 2), 5);
    for (let i = 0; i < obstacles; i++) {
      s.stuck.push({ angle: (i * Math.PI * 2) / obstacles + 0.4 });
    }
    s.target = 4 + level;
    s.remaining = s.target;
    s.level = level;
    s.throwing = null;
    s.game = "playing";
    setUI({ level, remaining: s.remaining, score: s.score });
    setGame("playing");
  }

  function start() {
    const s = stateRef.current;
    s.score = 0;
    startLevel(1);
  }

  function nextLevel() {
    startLevel(stateRef.current.level + 1);
  }

  function throwKnife() {
    const s = stateRef.current;
    if (s.game !== "playing") return;
    if (s.throwing) return;
    if (s.remaining <= 0) return;
    s.throwing = { y: H - 100 };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    function handlePress(e: Event) {
      e.preventDefault();
      throwKnife();
    }
    canvas.addEventListener("click", handlePress);
    canvas.addEventListener("touchstart", handlePress, { passive: false });

    let raf = 0;
    function loop() {
      raf = requestAnimationFrame(loop);
      update();
      draw();
    }

    function update() {
      if (s.game !== "playing") return;
      s.rotation += s.rotSpeed;

      // Throwing knife
      if (s.throwing) {
        s.throwing.y -= 18;
        // Reached log?
        if (s.throwing.y <= LOG_CY + LOG_R) {
          // check collision with existing knives
          // knife lands at angle such that it sticks at bottom of log
          // the tip hits at angle = -PI/2 (top) in world... Actually our knife approaches from below.
          // Let's say it enters at the bottom of the log (angle PI/2 in canvas where y down)
          // relative angle = PI/2 - rotation
          const landingAngle = Math.PI / 2 - s.rotation;
          // normalize to [-PI, PI]
          const norm = (a: number) => {
            let x = a;
            while (x > Math.PI) x -= Math.PI * 2;
            while (x < -Math.PI) x += Math.PI * 2;
            return x;
          };
          const la = norm(landingAngle);
          const tooClose = s.stuck.some(k => {
            const d = Math.abs(norm(la - k.angle));
            return d < 0.22;
          });
          if (tooClose) {
            s.game = "over";
            setGame("over");
            s.throwing = null;
            return;
          }
          s.stuck.push({ angle: la });
          s.remaining--;
          s.score += 10;
          setUI({ level: s.level, remaining: s.remaining, score: s.score });
          s.throwing = null;
          if (s.remaining === 0) {
            s.game = "levelComplete";
            setGame("levelComplete");
          }
        }
      }
    }

    function drawKnife(x: number, y: number, angle: number, length: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      // handle
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-4, 0, 8, length * 0.45);
      // guard
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(-7, -3, 14, 6);
      // blade
      ctx.fillStyle = "#e5e7eb";
      ctx.beginPath();
      ctx.moveTo(-5, -3);
      ctx.lineTo(5, -3);
      ctx.lineTo(2, -length * 0.6);
      ctx.lineTo(-2, -length * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, W, H);

      // Log
      ctx.save();
      ctx.translate(LOG_CX, LOG_CY);
      // outer ring
      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.arc(0, 0, LOG_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.arc(0, 0, LOG_R - 6, 0, Math.PI * 2);
      ctx.fill();
      // rings
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 2;
      ctx.rotate(s.rotation);
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, (LOG_R - 10) * (i / 5), 0, Math.PI * 2);
        ctx.stroke();
      }
      // center
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      // stuck knives
      for (const k of s.stuck) {
        const kx = Math.cos(k.angle) * LOG_R;
        const ky = Math.sin(k.angle) * LOG_R;
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(k.angle - Math.PI / 2 + Math.PI);
        // draw knife (embedded half)
        ctx.fillStyle = "#e5e7eb";
        ctx.beginPath();
        ctx.moveTo(-5, -10);
        ctx.lineTo(5, -10);
        ctx.lineTo(2, -28);
        ctx.lineTo(-2, -28);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(-7, -10, 14, 6);
        ctx.fillStyle = "#78350f";
        ctx.fillRect(-4, -4, 8, 24);
        ctx.restore();
      }
      ctx.restore();

      // Flying knife
      if (s.throwing) {
        drawKnife(LOG_CX, s.throwing.y, 0, 50);
      }
      // Waiting knife at bottom
      if (!s.throwing && s.game === "playing" && s.remaining > 0) {
        drawKnife(LOG_CX, H - 80, 0, 50);
      }

      // Remaining indicators
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      for (let i = 0; i < s.remaining - (s.throwing ? 1 : 0); i++) {
        ctx.fillRect(W - 30 - i * 14, H - 40, 10, 28);
      }

      // HUD text
      ctx.fillStyle = "#7ec8e3";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Level ${s.level}`, 16, H - 16);
    }

    loop();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click", handlePress);
      canvas.removeEventListener("touchstart", handlePress);
    };
  }, []);

  return (
    <div className="w-full max-w-md p-3 relative">
      <div className="flex items-center justify-between mb-2 mt-14 px-1">
        <div className="text-sm text-steel font-semibold">Knife Throw</div>
        <div className="text-sm text-accent font-bold">Score: {ui.score}</div>
      </div>
      <div className="relative bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <canvas ref={canvasRef} width={W} height={H} className="w-full block" style={{ aspectRatio: `${W}/${H}`, cursor: "pointer" }} />
        {game !== "playing" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-6">
            {game === "menu" && (
              <>
                <div className="text-6xl mb-3">🔪</div>
                <h1 className="text-2xl font-bold text-steel mb-2">Knife Throw</h1>
                <p className="text-xs text-white/60 mb-5 text-center">Tap to throw knives at the spinning log. Don't hit the other knives!</p>
                <button onClick={start} className="bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 px-6 rounded-xl transition">Start</button>
              </>
            )}
            {game === "over" && (
              <>
                <div className="text-6xl mb-3">💥</div>
                <h1 className="text-2xl font-bold text-red-400 mb-1">Oof!</h1>
                <p className="text-white/70 mb-1">Level: {ui.level}</p>
                <p className="text-white/70 mb-5">Score: {ui.score}</p>
                <button onClick={start} className="bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 px-6 rounded-xl transition">Try Again</button>
              </>
            )}
            {game === "levelComplete" && (
              <>
                <div className="text-6xl mb-3">⭐</div>
                <h1 className="text-2xl font-bold text-green-400 mb-2">Level Clear!</h1>
                <p className="text-white/70 mb-5">Score: {ui.score}</p>
                <button onClick={nextLevel} className="bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 px-6 rounded-xl transition">Next Level</button>
              </>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-white/40 text-center mt-2">Tap/click to throw</p>
    </div>
  );
}
