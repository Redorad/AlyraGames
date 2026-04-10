import { useEffect, useState, useRef } from "react";

const SIZE = 4;
const TILE_COUNT = SIZE * SIZE;
const STORAGE_KEY = "15puzzle-stats";

interface Stats {
  bestMoves: number;
  bestTime: number; // seconds
  wins: number;
}

const loadStats = (): Stats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { bestMoves: 0, bestTime: 0, wins: 0 };
};

const saveStats = (s: Stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

const solvedBoard = () => Array.from({ length: TILE_COUNT }, (_, i) => (i + 1) % TILE_COUNT);

const isSolved = (b: number[]) => b.every((v, i) => v === (i + 1) % TILE_COUNT);

// Shuffle by performing random legal moves to guarantee solvability
const shuffleBoard = (moves: number): number[] => {
  const b = solvedBoard();
  let empty = b.indexOf(0);
  let lastEmpty = -1;
  for (let i = 0; i < moves; i++) {
    const neighbors: number[] = [];
    const r = Math.floor(empty / SIZE);
    const c = empty % SIZE;
    if (r > 0) neighbors.push(empty - SIZE);
    if (r < SIZE - 1) neighbors.push(empty + SIZE);
    if (c > 0) neighbors.push(empty - 1);
    if (c < SIZE - 1) neighbors.push(empty + 1);
    const filtered = neighbors.filter((n) => n !== lastEmpty);
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    [b[empty], b[pick]] = [b[pick], b[empty]];
    lastEmpty = empty;
    empty = pick;
  }
  return b;
};

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function App() {
  const [board, setBoard] = useState<number[]>(() => shuffleBoard(200));
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [stats, setStats] = useState<Stats>(loadStats);
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    if (started && !won) {
      tRef.current = window.setInterval(() => setTime((t) => t + 1), 1000);
      return () => {
        if (tRef.current) window.clearInterval(tRef.current);
      };
    }
  }, [started, won]);

  const tryMove = (idx: number) => {
    if (won) return;
    const empty = board.indexOf(0);
    const r1 = Math.floor(idx / SIZE);
    const c1 = idx % SIZE;
    const r2 = Math.floor(empty / SIZE);
    const c2 = empty % SIZE;
    const isAdjacent = (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1);
    if (!isAdjacent) return;
    if (!started) setStarted(true);
    const nb = [...board];
    [nb[empty], nb[idx]] = [nb[idx], nb[empty]];
    setBoard(nb);
    setMoves((m) => m + 1);
    if (isSolved(nb)) {
      setWon(true);
      if (tRef.current) window.clearInterval(tRef.current);
      const newMoves = moves + 1;
      const next: Stats = {
        wins: stats.wins + 1,
        bestMoves: stats.bestMoves === 0 ? newMoves : Math.min(stats.bestMoves, newMoves),
        bestTime: stats.bestTime === 0 ? time : Math.min(stats.bestTime, time),
      };
      setStats(next);
      saveStats(next);
    }
  };

  const reset = () => {
    if (tRef.current) window.clearInterval(tRef.current);
    setBoard(shuffleBoard(200));
    setMoves(0);
    setTime(0);
    setStarted(false);
    setWon(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-6 px-4">
      <div className="w-full max-w-sm flex items-center justify-between">
        <div className="text-xs">
          <div className="text-steel/60">MOVES</div>
          <div className="font-bold text-steel">{moves}</div>
        </div>
        <h1 className="text-xl font-black tracking-wider">
          <span className="text-steel">SLIDING</span>
          <span className="text-accent">15</span>
        </h1>
        <div className="text-xs text-right">
          <div className="text-steel/60">TIME</div>
          <div className="font-bold text-steel">{formatTime(time)}</div>
        </div>
      </div>

      <div
        className="grid gap-2 p-3 bg-navy-800 rounded-xl border border-navy-700 mt-4"
        style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
      >
        {board.map((tile, i) => (
          <button
            key={i}
            onClick={() => tryMove(i)}
            className={`w-[70px] h-[70px] rounded-lg text-2xl font-black transition ${
              tile === 0
                ? "bg-navy-900/60 border border-navy-700"
                : "bg-gradient-to-br from-accent to-steel text-navy-900 border border-accent/60 hover:scale-105 active:scale-95"
            }`}
          >
            {tile === 0 ? "" : tile}
          </button>
        ))}
      </div>

      {won && (
        <div className="mt-4 text-center">
          <div className="text-2xl font-black text-emerald-400">Solved!</div>
          <div className="text-xs text-slate-400 mt-1">
            {moves} moves &middot; {formatTime(time)}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 w-full mt-4">
        <button
          onClick={reset}
          className="px-8 py-2.5 bg-accent text-white font-bold rounded-lg hover:opacity-90"
        >
          {won ? "Play Again" : "Shuffle"}
        </button>
        <div className="text-[10px] text-slate-500 text-center">
          Best: {stats.bestMoves > 0 ? `${stats.bestMoves} moves` : "—"} &middot; Best time:{" "}
          {stats.bestTime > 0 ? formatTime(stats.bestTime) : "—"} &middot; Wins: {stats.wins}
        </div>
      </div>
    </div>
  );
}
