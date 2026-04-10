import { useEffect, useMemo, useState, useRef } from "react";

type Cell = 0 | 1 | 2; // empty, filled, marked
type Size = 5 | 10 | 15;

const STORAGE_KEY = "nonogram-stats";

interface Stats {
  solved: Record<Size, number>;
  bestTime: Record<Size, number>;
}

const loadStats = (): Stats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { solved: { 5: 0, 10: 0, 15: 0 }, bestTime: { 5: 0, 10: 0, 15: 0 } };
};

const saveStats = (s: Stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

// Generate random solution with target density
const genSolution = (size: Size): number[][] => {
  const density = 0.55;
  const grid: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) row.push(Math.random() < density ? 1 : 0);
    grid.push(row);
  }
  // Ensure no empty rows/cols
  for (let r = 0; r < size; r++) {
    if (grid[r].every((v) => v === 0)) grid[r][Math.floor(Math.random() * size)] = 1;
  }
  for (let c = 0; c < size; c++) {
    let sum = 0;
    for (let r = 0; r < size; r++) sum += grid[r][c];
    if (sum === 0) grid[Math.floor(Math.random() * size)][c] = 1;
  }
  return grid;
};

const hintsForLine = (line: number[]): number[] => {
  const hints: number[] = [];
  let count = 0;
  for (const v of line) {
    if (v === 1) count++;
    else if (count > 0) {
      hints.push(count);
      count = 0;
    }
  }
  if (count > 0) hints.push(count);
  if (hints.length === 0) hints.push(0);
  return hints;
};

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function App() {
  const [size, setSize] = useState<Size>(5);
  const [solution, setSolution] = useState<number[][]>(() => genSolution(5));
  const [board, setBoard] = useState<Cell[][]>(() =>
    Array.from({ length: 5 }, () => Array(5).fill(0) as Cell[])
  );
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<"fill" | "mark">("fill");
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

  const rowHints = useMemo(() => solution.map(hintsForLine), [solution]);
  const colHints = useMemo(() => {
    const result: number[][] = [];
    for (let c = 0; c < size; c++) {
      const col = solution.map((r) => r[c]);
      result.push(hintsForLine(col));
    }
    return result;
  }, [solution, size]);

  const newPuzzle = (s: Size) => {
    if (tRef.current) window.clearInterval(tRef.current);
    const sol = genSolution(s);
    setSize(s);
    setSolution(sol);
    setBoard(Array.from({ length: s }, () => Array(s).fill(0) as Cell[]));
    setWon(false);
    setTime(0);
    setStarted(false);
  };

  const checkWin = (b: Cell[][]) => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const filled = b[r][c] === 1;
        const shouldBeFilled = solution[r][c] === 1;
        if (filled !== shouldBeFilled) return false;
      }
    }
    return true;
  };

  const handleCell = (r: number, c: number, rightClick = false) => {
    if (won) return;
    if (!started) setStarted(true);
    const nb = board.map((row) => [...row] as Cell[]);
    const current = nb[r][c];
    const targetMode = rightClick ? "mark" : mode;
    if (targetMode === "fill") {
      nb[r][c] = current === 1 ? 0 : 1;
    } else {
      nb[r][c] = current === 2 ? 0 : 2;
    }
    setBoard(nb);
    if (checkWin(nb)) {
      setWon(true);
      if (tRef.current) window.clearInterval(tRef.current);
      const next: Stats = {
        ...stats,
        solved: { ...stats.solved, [size]: (stats.solved[size] || 0) + 1 },
        bestTime: {
          ...stats.bestTime,
          [size]: stats.bestTime[size] === 0 ? time : Math.min(stats.bestTime[size], time),
        },
      };
      setStats(next);
      saveStats(next);
    }
  };

  const cellSize = size === 5 ? 36 : size === 10 ? 22 : 16;
  const hintSize = size === 5 ? 11 : size === 10 ? 10 : 9;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-4 px-2">
      <div className="w-full max-w-md flex items-center justify-between px-2 mt-2">
        <div className="text-xs">
          <div className="text-steel/60">TIME</div>
          <div className="font-bold text-steel">{formatTime(time)}</div>
        </div>
        <h1 className="text-xl font-black">
          <span className="text-steel">PIC</span>
          <span className="text-accent">ROSS</span>
        </h1>
        <div className="text-xs text-right">
          <div className="text-steel/60">SIZE</div>
          <div className="font-bold text-steel">
            {size}x{size}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {([5, 10, 15] as Size[]).map((s) => (
          <button
            key={s}
            onClick={() => newPuzzle(s)}
            className={`px-3 py-1 text-xs font-bold rounded-md ${
              size === s ? "bg-accent text-white" : "bg-navy-800 text-slate-400"
            }`}
          >
            {s}x{s}
          </button>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center py-2">
        <div className="flex items-start">
          {/* Empty corner + col hints */}
          <div className="flex flex-col">
            <div style={{ height: cellSize * 2 + 4 }} />
            {rowHints.map((h, r) => (
              <div
                key={r}
                className="flex items-center justify-end pr-1 text-steel"
                style={{ height: cellSize, fontSize: hintSize, gap: 2 }}
              >
                {h.join(" ")}
              </div>
            ))}
          </div>

          <div>
            <div className="flex">
              {colHints.map((h, c) => (
                <div
                  key={c}
                  className="flex flex-col items-center justify-end text-steel"
                  style={{ width: cellSize, height: cellSize * 2 + 4, fontSize: hintSize, lineHeight: 1.1 }}
                >
                  {h.map((n, i) => (
                    <div key={i}>{n}</div>
                  ))}
                </div>
              ))}
            </div>

            <div className="border border-navy-700 bg-navy-900/60">
              {board.map((row, r) => (
                <div key={r} className="flex">
                  {row.map((cell, c) => {
                    const bg =
                      cell === 1
                        ? "bg-accent"
                        : cell === 2
                        ? "bg-navy-700"
                        : "bg-navy-800 hover:bg-navy-700";
                    const bold = (r + 1) % 5 === 0 && r < size - 1 ? "border-b-2 border-b-steel/40" : "";
                    const bold2 = (c + 1) % 5 === 0 && c < size - 1 ? "border-r-2 border-r-steel/40" : "";
                    return (
                      <button
                        key={c}
                        onClick={() => handleCell(r, c)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleCell(r, c, true);
                        }}
                        className={`${bg} ${bold} ${bold2} border border-navy-700 flex items-center justify-center`}
                        style={{ width: cellSize, height: cellSize, fontSize: cellSize * 0.6 }}
                      >
                        {cell === 2 && <span className="text-red-400 font-bold">×</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 w-full">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("fill")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md ${
              mode === "fill" ? "bg-accent text-white" : "bg-navy-800 text-slate-400"
            }`}
          >
            ■ Fill
          </button>
          <button
            onClick={() => setMode("mark")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md ${
              mode === "mark" ? "bg-accent text-white" : "bg-navy-800 text-slate-400"
            }`}
          >
            × Mark
          </button>
          <button
            onClick={() => newPuzzle(size)}
            className="px-3 py-1.5 text-xs font-bold rounded-md bg-navy-800 text-steel"
          >
            New
          </button>
        </div>

        {won && (
          <div className="text-emerald-400 font-bold text-sm">
            Solved in {formatTime(time)}!
          </div>
        )}
        <div className="text-[10px] text-slate-500">
          Solved {size}x{size}: {stats.solved[size]} &middot; Best:{" "}
          {stats.bestTime[size] > 0 ? formatTime(stats.bestTime[size]) : "—"}
        </div>
      </div>
    </div>
  );
}
