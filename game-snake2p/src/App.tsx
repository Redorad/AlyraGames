import { useEffect, useRef, useState } from "react";

const COLS = 28;
const ROWS = 22;
const TICK = 120;
const HS_KEY = "snake2p_high_score";

type Dir = { x: number; y: number };
interface Snake {
  body: { x: number; y: number }[];
  dir: Dir;
  nextDir: Dir;
  alive: boolean;
  color: string;
  score: number;
}

function makeSnake(startX: number, startY: number, dir: Dir, color: string): Snake {
  return {
    body: [
      { x: startX, y: startY },
      { x: startX - dir.x, y: startY - dir.y },
      { x: startX - dir.x * 2, y: startY - dir.y * 2 },
    ],
    dir,
    nextDir: dir,
    alive: true,
    color,
    score: 0,
  };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [high, setHigh] = useState(() => Number(localStorage.getItem(HS_KEY) || 0));
  const stateRef = useRef({
    p1: makeSnake(6, 11, { x: 1, y: 0 }, "#7ec8e3"),
    p2: makeSnake(21, 11, { x: -1, y: 0 }, "#a78bfa"),
    food: { x: 14, y: 11 },
  });
  const [, force] = useState(0);

  const spawnFood = () => {
    const { p1, p2 } = stateRef.current;
    const occ = new Set<string>();
    p1.body.forEach((b) => occ.add(`${b.x},${b.y}`));
    p2.body.forEach((b) => occ.add(`${b.x},${b.y}`));
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * COLS);
      y = Math.floor(Math.random() * ROWS);
    } while (occ.has(`${x},${y}`));
    stateRef.current.food = { x, y };
  };

  const reset = () => {
    stateRef.current = {
      p1: makeSnake(6, 11, { x: 1, y: 0 }, "#7ec8e3"),
      p2: makeSnake(21, 11, { x: -1, y: 0 }, "#a78bfa"),
      food: { x: 14, y: 11 },
    };
    setWinner(null);
    setRunning(true);
    force((n) => n + 1);
  };

  const tick = () => {
    const s = stateRef.current;
    const advance = (snake: Snake) => {
      if (!snake.alive) return;
      snake.dir = snake.nextDir;
      const head = snake.body[0];
      const nh = { x: head.x + snake.dir.x, y: head.y + snake.dir.y };
      if (nh.x < 0 || nh.x >= COLS || nh.y < 0 || nh.y >= ROWS) {
        snake.alive = false;
        return;
      }
      snake.body.unshift(nh);
      if (nh.x === s.food.x && nh.y === s.food.y) {
        snake.score += 10;
        spawnFood();
      } else {
        snake.body.pop();
      }
    };
    advance(s.p1);
    advance(s.p2);

    const collide = (self: Snake, other: Snake) => {
      if (!self.alive) return;
      const head = self.body[0];
      for (let i = 1; i < self.body.length; i++) {
        if (self.body[i].x === head.x && self.body[i].y === head.y) {
          self.alive = false;
          return;
        }
      }
      for (let i = 0; i < other.body.length; i++) {
        if (other.body[i].x === head.x && other.body[i].y === head.y) {
          self.alive = false;
          return;
        }
      }
    };
    collide(s.p1, s.p2);
    collide(s.p2, s.p1);

    if (!s.p1.alive || !s.p2.alive) {
      setRunning(false);
      let w: string;
      if (!s.p1.alive && !s.p2.alive) {
        w = s.p1.score > s.p2.score ? "Player 1 Wins!" : s.p2.score > s.p1.score ? "Player 2 Wins!" : "Draw!";
      } else if (!s.p1.alive) {
        w = "Player 2 Wins!";
      } else {
        w = "Player 1 Wins!";
      }
      setWinner(w);
      const total = s.p1.score + s.p2.score;
      if (total > high) {
        setHigh(total);
        localStorage.setItem(HS_KEY, String(total));
      }
    }
    draw();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cw = w / COLS;
    const ch = h / ROWS;
    ctx.fillStyle = "#0a0e27";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(126,200,227,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cw, 0);
      ctx.lineTo(x * cw, h);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * ch);
      ctx.lineTo(w, y * ch);
      ctx.stroke();
    }

    const s = stateRef.current;
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(s.food.x * cw + cw / 2, s.food.y * ch + ch / 2, Math.min(cw, ch) * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const drawSnake = (snake: Snake) => {
      ctx.fillStyle = snake.color;
      ctx.shadowColor = snake.color;
      ctx.shadowBlur = 10;
      snake.body.forEach((b, i) => {
        const inset = i === 0 ? 1 : 2;
        ctx.fillRect(b.x * cw + inset, b.y * ch + inset, cw - inset * 2, ch - inset * 2);
      });
      ctx.shadowBlur = 0;
    };
    drawSnake(s.p1);
    drawSnake(s.p2);
  };

  useEffect(() => {
    if (!running) {
      draw();
      return;
    }
    const id = setInterval(tick, TICK);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // compensate: reset to use pixels directly
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { p1, p2 } = stateRef.current;
      const setDir = (snake: Snake, d: Dir) => {
        if (snake.dir.x + d.x === 0 && snake.dir.y + d.y === 0) return;
        snake.nextDir = d;
      };
      switch (e.key) {
        case "ArrowUp":
          setDir(p1, { x: 0, y: -1 });
          e.preventDefault();
          break;
        case "ArrowDown":
          setDir(p1, { x: 0, y: 1 });
          e.preventDefault();
          break;
        case "ArrowLeft":
          setDir(p1, { x: -1, y: 0 });
          e.preventDefault();
          break;
        case "ArrowRight":
          setDir(p1, { x: 1, y: 0 });
          e.preventDefault();
          break;
        case "w":
        case "W":
          setDir(p2, { x: 0, y: -1 });
          break;
        case "s":
        case "S":
          setDir(p2, { x: 0, y: 1 });
          break;
        case "a":
        case "A":
          setDir(p2, { x: -1, y: 0 });
          break;
        case "d":
        case "D":
          setDir(p2, { x: 1, y: 0 });
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const s = stateRef.current;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-3 py-4 bg-navy-900">
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          <span className="text-steel">SNAKE</span>
          <span className="text-accent"> BATTLE</span>
        </h1>
        <p className="text-xs text-slate-500">P1 Arrows · P2 WASD</p>
      </div>

      <div className="flex gap-3 mb-2 text-sm">
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border-l-4" style={{ borderColor: "#7ec8e3" }}>
          <div className="text-[9px] text-slate-500 uppercase">Player 1</div>
          <div className="text-lg font-bold text-steel">{s.p1.score}</div>
        </div>
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border-l-4" style={{ borderColor: "#a78bfa" }}>
          <div className="text-[9px] text-slate-500 uppercase">Player 2</div>
          <div className="text-lg font-bold text-accent">{s.p2.score}</div>
        </div>
        <div className="bg-navy-800 rounded-lg px-3 py-1.5">
          <div className="text-[9px] text-slate-500 uppercase">Best Total</div>
          <div className="text-lg font-bold text-white">{high}</div>
        </div>
      </div>

      <div
        className="relative rounded-xl border border-white/10 overflow-hidden"
        style={{ width: "min(95vw, 720px)", aspectRatio: `${COLS}/${ROWS}` }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-900/80 backdrop-blur-sm">
            {winner && <div className="text-2xl font-black text-accent mb-3">{winner}</div>}
            <button
              onClick={reset}
              className="px-6 py-3 rounded-lg bg-accent text-navy-900 font-bold text-sm uppercase tracking-wider hover:brightness-110"
            >
              {winner ? "Play Again" : "Start"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
