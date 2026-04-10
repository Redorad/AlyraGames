import { useCallback, useEffect, useState } from 'react';

const SIZE = 8;
const GEM_COUNT = 6;

const GEMS = [
  { color: '#ef4444', shape: 'diamond' },
  { color: '#7ec8e3', shape: 'circle' },
  { color: '#a78bfa', shape: 'square' },
  { color: '#22c55e', shape: 'triangle' },
  { color: '#fbbf24', shape: 'hex' },
  { color: '#ec4899', shape: 'star' },
];

type Grid = number[][];

function randGem() { return Math.floor(Math.random() * GEM_COUNT); }

function makeGrid(): Grid {
  while (true) {
    const g: Grid = [];
    for (let y = 0; y < SIZE; y++) {
      const row: number[] = [];
      for (let x = 0; x < SIZE; x++) {
        let v: number;
        do {
          v = randGem();
        } while (
          (x >= 2 && row[x - 1] === v && row[x - 2] === v) ||
          (y >= 2 && g[y - 1][x] === v && g[y - 2][x] === v)
        );
        row.push(v);
      }
      g.push(row);
    }
    if (findMatches(g).size === 0) return g;
  }
}

function findMatches(g: Grid): Set<string> {
  const matches = new Set<string>();
  // Horizontal
  for (let y = 0; y < SIZE; y++) {
    let run = 1;
    for (let x = 1; x <= SIZE; x++) {
      if (x < SIZE && g[y][x] === g[y][x - 1] && g[y][x] !== -1) {
        run++;
      } else {
        if (run >= 3) {
          for (let k = 0; k < run; k++) matches.add(`${y},${x - 1 - k}`);
        }
        run = 1;
      }
    }
  }
  // Vertical
  for (let x = 0; x < SIZE; x++) {
    let run = 1;
    for (let y = 1; y <= SIZE; y++) {
      if (y < SIZE && g[y][x] === g[y - 1][x] && g[y][x] !== -1) {
        run++;
      } else {
        if (run >= 3) {
          for (let k = 0; k < run; k++) matches.add(`${y - 1 - k},${x}`);
        }
        run = 1;
      }
    }
  }
  return matches;
}

function applyMatches(g: Grid, matches: Set<string>): Grid {
  const ng = g.map(r => r.slice());
  matches.forEach(k => {
    const [y, x] = k.split(',').map(Number);
    ng[y][x] = -1;
  });
  // Drop
  for (let x = 0; x < SIZE; x++) {
    let bottom = SIZE - 1;
    for (let y = SIZE - 1; y >= 0; y--) {
      if (ng[y][x] !== -1) {
        ng[bottom][x] = ng[y][x];
        if (bottom !== y) ng[y][x] = -1;
        bottom--;
      }
    }
    for (let y = bottom; y >= 0; y--) {
      ng[y][x] = randGem();
    }
  }
  return ng;
}

function GemShape({ gem, size }: { gem: number; size: number }) {
  const g = GEMS[gem];
  const c = size / 2;
  if (g.shape === 'diamond') {
    return (
      <polygon
        points={`${c},4 ${size - 4},${c} ${c},${size - 4} 4,${c}`}
        fill={g.color}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
      />
    );
  }
  if (g.shape === 'circle') {
    return <circle cx={c} cy={c} r={c - 6} fill={g.color} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />;
  }
  if (g.shape === 'square') {
    return <rect x="6" y="6" width={size - 12} height={size - 12} rx="4" fill={g.color} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />;
  }
  if (g.shape === 'triangle') {
    return <polygon points={`${c},5 ${size - 5},${size - 5} 5,${size - 5}`} fill={g.color} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />;
  }
  if (g.shape === 'hex') {
    const r = c - 5;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`;
    }).join(' ');
    return <polygon points={pts} fill={g.color} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />;
  }
  if (g.shape === 'star') {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? c - 5 : (c - 5) / 2.2;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      return `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`;
    }).join(' ');
    return <polygon points={pts} fill={g.color} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />;
  }
  return null;
}

export default function App() {
  const [grid, setGrid] = useState<Grid>(() => makeGrid());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => parseInt(localStorage.getItem('match3-best') || '0'));
  const [moves, setMoves] = useState(30);
  const [over, setOver] = useState(false);

  const resolve = useCallback((g: Grid, combo = 1): { grid: Grid; gained: number } => {
    let cur = g;
    let gained = 0;
    let mul = combo;
    while (true) {
      const m = findMatches(cur);
      if (m.size === 0) break;
      gained += m.size * 10 * mul;
      cur = applyMatches(cur, m);
      mul++;
    }
    return { grid: cur, gained };
  }, []);

  const trySwap = useCallback((y1: number, x1: number, y2: number, x2: number) => {
    if (Math.abs(y1 - y2) + Math.abs(x1 - x2) !== 1) return;
    const ng = grid.map(r => r.slice());
    [ng[y1][x1], ng[y2][x2]] = [ng[y2][x2], ng[y1][x1]];
    const m = findMatches(ng);
    if (m.size === 0) {
      // Invalid - shake
      return;
    }
    const { grid: resolved, gained } = resolve(ng);
    setGrid(resolved);
    const newScore = score + gained;
    setScore(newScore);
    if (newScore > best) {
      setBest(newScore);
      localStorage.setItem('match3-best', String(newScore));
    }
    const nm = moves - 1;
    setMoves(nm);
    if (nm <= 0) setOver(true);
  }, [grid, resolve, score, best, moves]);

  const onCell = (y: number, x: number) => {
    if (over) return;
    if (!selected) { setSelected([y, x]); return; }
    const [sy, sx] = selected;
    if (sy === y && sx === x) { setSelected(null); return; }
    if (Math.abs(sy - y) + Math.abs(sx - x) === 1) {
      trySwap(sy, sx, y, x);
      setSelected(null);
    } else {
      setSelected([y, x]);
    }
  };

  const reset = () => {
    setGrid(makeGrid());
    setSelected(null);
    setScore(0);
    setMoves(30);
    setOver(false);
  };

  useEffect(() => {
    // Resolve on init in case
    const m = findMatches(grid);
    if (m.size > 0) {
      const { grid: ng } = resolve(grid);
      setGrid(ng);
    }
    // eslint-disable-next-line
  }, []);

  const cellSize = 52;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3">
      <h1 className="text-3xl font-black tracking-tight">
        <span className="text-steel">GEM</span>
        <span className="text-accent"> MATCH</span>
      </h1>
      <div className="flex gap-6 text-sm">
        <div>Score: <span className="text-steel font-mono">{score}</span></div>
        <div>Moves: <span className="text-accent font-mono">{moves}</span></div>
        <div>Best: <span className="text-slate-300 font-mono">{best}</span></div>
      </div>
      <div
        className="grid bg-navy-800 p-2 rounded-xl border border-navy-700"
        style={{ gridTemplateColumns: `repeat(${SIZE}, ${cellSize}px)`, gap: 2 }}
      >
        {grid.map((row, y) =>
          row.map((gem, x) => {
            const sel = selected && selected[0] === y && selected[1] === x;
            return (
              <div
                key={`${x}-${y}`}
                onClick={() => onCell(y, x)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: sel ? '#1a2050' : '#0a0e27',
                  border: sel ? '2px solid #a78bfa' : '1px solid #1a2050',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <svg width={cellSize} height={cellSize}>
                  <GemShape gem={gem} size={cellSize} />
                </svg>
              </div>
            );
          })
        )}
      </div>
      <div className="text-xs text-slate-400">Click two adjacent gems to swap. Match 3+ in a row.</div>
      <button onClick={reset} className="px-4 py-2 rounded-lg border border-steel/30 hover:bg-navy-700 text-steel text-sm">
        New Game
      </button>
      {over && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-navy-800 border border-accent/40 rounded-2xl p-8 text-center">
            <div className="text-2xl font-black text-accent mb-2">Out of Moves!</div>
            <div className="text-sm text-slate-300 mb-4">Final score: {score}</div>
            <button onClick={reset} className="px-4 py-2 rounded-lg bg-accent text-navy-900 font-bold">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
