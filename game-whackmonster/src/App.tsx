import { useEffect, useRef, useState, useCallback } from "react";

type MonsterKind = "goblin" | "slime" | "imp" | "ghost" | "boss";

interface Monster {
  id: number;
  kind: MonsterKind;
  hole: number;
  spawnedAt: number;
  ttl: number;
  hits: number;
  maxHits: number;
  hit: boolean;
}

const MONSTERS: Record<MonsterKind, { emoji: string; points: number; weight: number; ttl: number; maxHits: number }> = {
  goblin: { emoji: "👹", points: 10, weight: 40, ttl: 1100, maxHits: 1 },
  slime: { emoji: "🟢", points: 5, weight: 30, ttl: 1300, maxHits: 1 },
  imp: { emoji: "👺", points: 20, weight: 18, ttl: 900, maxHits: 1 },
  ghost: { emoji: "👻", points: 30, weight: 10, ttl: 800, maxHits: 1 },
  boss: { emoji: "🧌", points: 100, weight: 2, ttl: 1800, maxHits: 3 },
};

const HOLES = 9;
const ROUND_TIME = 60;
const HS_KEY = "whackmonster_high_score";

function pickKind(): MonsterKind {
  const total = Object.values(MONSTERS).reduce((s, m) => s + m.weight, 0);
  let r = Math.random() * total;
  for (const k of Object.keys(MONSTERS) as MonsterKind[]) {
    r -= MONSTERS[k].weight;
    if (r <= 0) return k;
  }
  return "goblin";
}

export default function App() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [playing, setPlaying] = useState(false);
  const [high, setHigh] = useState(() => Number(localStorage.getItem(HS_KEY) || 0));
  const [floaters, setFloaters] = useState<{ id: number; hole: number; text: string }[]>([]);
  const nextId = useRef(1);
  const floaterId = useRef(1);

  const spawn = useCallback(() => {
    setMonsters((cur) => {
      const occupied = new Set(cur.map((m) => m.hole));
      if (occupied.size >= HOLES) return cur;
      let hole: number;
      do {
        hole = Math.floor(Math.random() * HOLES);
      } while (occupied.has(hole));
      const kind = pickKind();
      const cfg = MONSTERS[kind];
      const ttlVar = cfg.ttl * (0.9 + Math.random() * 0.2);
      return [
        ...cur,
        {
          id: nextId.current++,
          kind,
          hole,
          spawnedAt: Date.now(),
          ttl: ttlVar,
          hits: 0,
          maxHits: cfg.maxHits,
          hit: false,
        },
      ];
    });
  }, []);

  useEffect(() => {
    if (!playing) return;
    const spawnInterval = setInterval(() => spawn(), 700);
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setMonsters((cur) => cur.filter((m) => now - m.spawnedAt < m.ttl || m.hit));
    }, 100);
    const timerInterval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPlaying(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(spawnInterval);
      clearInterval(cleanupInterval);
      clearInterval(timerInterval);
    };
  }, [playing, spawn]);

  useEffect(() => {
    if (!playing && timeLeft === 0 && score > high) {
      setHigh(score);
      localStorage.setItem(HS_KEY, String(score));
    }
  }, [playing, timeLeft, score, high]);

  const whack = (m: Monster) => {
    if (!playing || m.hit) return;
    setMonsters((cur) =>
      cur.map((x) => {
        if (x.id !== m.id) return x;
        const newHits = x.hits + 1;
        if (newHits >= x.maxHits) {
          const pts = MONSTERS[x.kind].points;
          setScore((s) => s + pts);
          const fid = floaterId.current++;
          setFloaters((f) => [...f, { id: fid, hole: x.hole, text: "+" + pts }]);
          setTimeout(() => setFloaters((f) => f.filter((fl) => fl.id !== fid)), 800);
          return { ...x, hits: newHits, hit: true };
        }
        return { ...x, hits: newHits };
      })
    );
    setTimeout(() => {
      setMonsters((cur) => cur.filter((x) => !(x.id === m.id && x.hit)));
    }, 250);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(ROUND_TIME);
    setMonsters([]);
    setPlaying(true);
  };

  const currentByHole = new Map<number, Monster>();
  monsters.forEach((m) => currentByHole.set(m.hole, m));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 py-6 bg-navy-900">
      <div className="text-center mb-3">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          <span className="text-steel">WHACK-A-</span>
          <span className="text-accent">MONSTER</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">Bosses need 3 hits! 60 seconds.</p>
      </div>

      <div className="flex gap-3 mb-4 text-sm">
        <div className="bg-navy-800 rounded-xl px-4 py-2 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase">Score</div>
          <div className="text-xl font-bold text-steel">{score}</div>
        </div>
        <div className="bg-navy-800 rounded-xl px-4 py-2 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase">Time</div>
          <div className="text-xl font-bold text-accent">{timeLeft}s</div>
        </div>
        <div className="bg-navy-800 rounded-xl px-4 py-2 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase">Best</div>
          <div className="text-xl font-bold text-white">{high}</div>
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-3 sm:gap-4"
        style={{ width: "min(90vw, 440px)" }}
      >
        {Array.from({ length: HOLES }).map((_, i) => {
          const m = currentByHole.get(i);
          const fl = floaters.find((f) => f.hole === i);
          return (
            <div
              key={i}
              className="relative rounded-full bg-navy-800 border-4 border-navy-700 flex items-center justify-center cursor-pointer overflow-hidden"
              style={{ aspectRatio: "1/1", boxShadow: "inset 0 10px 20px rgba(0,0,0,0.5)" }}
              onClick={() => m && whack(m)}
            >
              {m && (
                <div
                  className={`text-5xl sm:text-6xl transition-transform ${m.hit ? "scale-50 opacity-30" : "animate-bounce"}`}
                  style={{ transform: m.hit ? "scale(0.5)" : undefined }}
                >
                  {MONSTERS[m.kind].emoji}
                  {m.kind === "boss" && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-red-500 text-white px-1 rounded">
                      {m.hits}/{m.maxHits}
                    </div>
                  )}
                </div>
              )}
              {fl && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-accent" style={{ animation: "floatup 0.8s forwards" }}>
                    {fl.text}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!playing && (
        <div className="mt-5">
          <button
            onClick={startGame}
            className="px-8 py-3 rounded-lg bg-accent text-navy-900 font-bold text-sm uppercase tracking-wider hover:brightness-110"
          >
            {timeLeft === 0 && score > 0 ? "Play Again" : "Start Game"}
          </button>
        </div>
      )}

      <div className="mt-3 text-[10px] text-slate-600 flex gap-3 flex-wrap justify-center">
        <span>👹 10pts</span>
        <span>🟢 5pts</span>
        <span>👺 20pts</span>
        <span>👻 30pts</span>
        <span>🧌 100pts (3 hits)</span>
      </div>

      <style>{`
        @keyframes floatup {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-30px); }
        }
      `}</style>
    </div>
  );
}
