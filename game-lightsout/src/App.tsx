import { useEffect, useState } from "react";

const SIZE = 5;

function randomBoard(): boolean[][] {
  // Start with all off and apply random clicks for solvability
  const board: boolean[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => false)
  );
  const clicks = 8 + Math.floor(Math.random() * 6);
  for (let i = 0; i < clicks; i++) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    toggleAt(board, r, c);
  }
  // Avoid all-off starting state
  if (board.every((row) => row.every((v) => !v))) toggleAt(board, 0, 0);
  return board;
}

function toggleAt(board: boolean[][], r: number, c: number) {
  const apply = (rr: number, cc: number) => {
    if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) {
      board[rr][cc] = !board[rr][cc];
    }
  };
  apply(r, c);
  apply(r - 1, c);
  apply(r + 1, c);
  apply(r, c - 1);
  apply(r, c + 1);
}

function loadBest(): number | null {
  try {
    const v = localStorage.getItem("lo_best");
    return v !== null ? parseInt(v, 10) : null;
  } catch {
    return null;
  }
}
function saveBest(n: number) {
  try {
    localStorage.setItem("lo_best", String(n));
  } catch {}
}

export default function App() {
  const [board, setBoard] = useState<boolean[][]>(randomBoard);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState<number | null>(loadBest());
  const [won, setWon] = useState(false);

  const handleClick = (r: number, c: number) => {
    if (won) return;
    const next = board.map((row) => [...row]);
    toggleAt(next, r, c);
    setBoard(next);
    const nm = moves + 1;
    setMoves(nm);
    const all = next.every((row) => row.every((v) => !v));
    if (all) {
      setWon(true);
      if (best === null || nm < best) {
        setBest(nm);
        saveBest(nm);
      }
    }
  };

  const reset = () => {
    setBoard(randomBoard());
    setMoves(0);
    setWon(false);
  };

  const onCount = board.flat().filter(Boolean).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-4 px-4 gap-4">
      <h1 className="text-3xl font-black tracking-wider">
        <span className="text-steel">LIGHTS</span>
        <span className="text-accent"> OUT</span>
      </h1>

      <div className="flex items-center gap-6 text-sm">
        <div>
          <div className="text-[10px] text-slate-500">MOVES</div>
          <div className="text-steel text-xl font-bold">{moves}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">REMAINING</div>
          <div className="text-accent text-xl font-bold">{onCount}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">BEST</div>
          <div className="text-yellow-400 text-xl font-bold">{best ?? "-"}</div>
        </div>
      </div>

      <div
        className={`relative grid gap-2 p-4 bg-navy-800 border border-navy-700 rounded-2xl shadow-2xl`}
        style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
      >
        {board.map((row, r) =>
          row.map((on, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => handleClick(r, c)}
              disabled={won}
              className={`w-14 h-14 rounded-xl transition-all duration-150 active:scale-90 ${
                on
                  ? "bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                  : "bg-navy-900 border border-navy-700"
              }`}
            />
          ))
        )}
        {won && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-900/90 rounded-2xl">
            <div className="text-center">
              <div className="text-3xl font-black text-steel mb-2">SOLVED!</div>
              <div className="text-slate-400 mb-4">Moves: {moves}</div>
              <button
                onClick={reset}
                className="px-6 py-2 bg-accent text-white font-bold rounded-lg"
              >
                New Puzzle
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={reset}
        className="px-6 py-2 bg-navy-800 border border-navy-700 text-steel font-bold rounded-lg hover:border-steel/50 transition"
      >
        New Puzzle
      </button>

      <div className="text-[11px] text-slate-500 text-center max-w-xs">
        Click a cell to toggle itself and its 4 neighbors. Turn off all lights.
      </div>
    </div>
  );
}
