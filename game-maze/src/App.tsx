import { useEffect, useRef, useState, useCallback } from 'react';

type Cell = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  visited: boolean;
};

const GRID = 15;

function generateMaze(size: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      top: true,
      right: true,
      bottom: true,
      left: true,
      visited: false,
    }))
  );

  const stack: [number, number][] = [];
  const startY = 0, startX = 0;
  grid[startY][startX].visited = true;
  stack.push([startY, startX]);

  while (stack.length) {
    const [y, x] = stack[stack.length - 1];
    const neighbors: [number, number, string][] = [];
    if (y > 0 && !grid[y - 1][x].visited) neighbors.push([y - 1, x, 'top']);
    if (x < size - 1 && !grid[y][x + 1].visited) neighbors.push([y, x + 1, 'right']);
    if (y < size - 1 && !grid[y + 1][x].visited) neighbors.push([y + 1, x, 'bottom']);
    if (x > 0 && !grid[y][x - 1].visited) neighbors.push([y, x - 1, 'left']);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }
    const [ny, nx, dir] = neighbors[Math.floor(Math.random() * neighbors.length)];
    if (dir === 'top') { grid[y][x].top = false; grid[ny][nx].bottom = false; }
    if (dir === 'right') { grid[y][x].right = false; grid[ny][nx].left = false; }
    if (dir === 'bottom') { grid[y][x].bottom = false; grid[ny][nx].top = false; }
    if (dir === 'left') { grid[y][x].left = false; grid[ny][nx].right = false; }
    grid[ny][nx].visited = true;
    stack.push([ny, nx]);
  }
  return grid;
}

export default function App() {
  const [grid, setGrid] = useState<Cell[][]>(() => generateMaze(GRID));
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);
  const [won, setWon] = useState(false);
  const [best, setBest] = useState<number | null>(() => {
    const v = localStorage.getItem('maze-best');
    return v ? parseInt(v) : null;
  });
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (running && !won) {
      timerRef.current = window.setInterval(() => setTime(t => t + 1), 1000);
      return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    }
  }, [running, won]);

  const reset = useCallback(() => {
    setGrid(generateMaze(GRID));
    setPos({ x: 0, y: 0 });
    setTime(0);
    setRunning(true);
    setWon(false);
  }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (won) return;
      const cell = grid[pos.y][pos.x];
      let { x, y } = pos;
      if ((e.key === 'ArrowUp' || e.key === 'w') && !cell.top) y--;
      else if ((e.key === 'ArrowRight' || e.key === 'd') && !cell.right) x++;
      else if ((e.key === 'ArrowDown' || e.key === 's') && !cell.bottom) y++;
      else if ((e.key === 'ArrowLeft' || e.key === 'a') && !cell.left) x--;
      else return;
      e.preventDefault();
      setPos({ x, y });
      if (x === GRID - 1 && y === GRID - 1) {
        setWon(true);
        setRunning(false);
        if (best === null || time < best) {
          setBest(time);
          localStorage.setItem('maze-best', String(time));
        }
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [grid, pos, won, time, best]);

  const cellSize = 32;
  const boardPx = GRID * cellSize;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
      <h1 className="text-3xl font-black tracking-tight">
        <span className="text-steel">MAZE</span>
        <span className="text-accent"> RUNNER</span>
      </h1>
      <div className="flex gap-6 text-sm">
        <div>Time: <span className="text-steel font-mono">{time}s</span></div>
        <div>Best: <span className="text-accent font-mono">{best !== null ? `${best}s` : '—'}</span></div>
      </div>
      <div
        className="relative bg-navy-800 rounded-lg border-2 border-navy-700"
        style={{ width: boardPx, height: boardPx }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * cellSize,
                top: y * cellSize,
                width: cellSize,
                height: cellSize,
                borderTop: cell.top ? '2px solid #7ec8e3' : 'none',
                borderRight: cell.right ? '2px solid #7ec8e3' : 'none',
                borderBottom: cell.bottom ? '2px solid #7ec8e3' : 'none',
                borderLeft: cell.left ? '2px solid #7ec8e3' : 'none',
              }}
            />
          ))
        )}
        <div
          style={{
            position: 'absolute',
            left: (GRID - 1) * cellSize + 4,
            top: (GRID - 1) * cellSize + 4,
            width: cellSize - 8,
            height: cellSize - 8,
            background: '#a78bfa',
            borderRadius: 4,
            boxShadow: '0 0 8px #a78bfa',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: pos.x * cellSize + 6,
            top: pos.y * cellSize + 6,
            width: cellSize - 12,
            height: cellSize - 12,
            background: '#7ec8e3',
            borderRadius: '50%',
            boxShadow: '0 0 10px #7ec8e3',
            transition: 'left 0.08s, top 0.08s',
          }}
        />
      </div>
      <div className="text-xs text-slate-400">Use arrow keys or WASD. Reach the purple square.</div>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg border border-steel/30 hover:bg-navy-700 text-steel text-sm"
      >
        New Maze
      </button>
      {won && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-navy-800 border border-accent/40 rounded-2xl p-8 text-center">
            <div className="text-2xl font-black text-accent mb-2">You escaped!</div>
            <div className="text-sm text-slate-300 mb-4">Time: {time}s</div>
            <button onClick={reset} className="px-4 py-2 rounded-lg bg-accent text-navy-900 font-bold">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
