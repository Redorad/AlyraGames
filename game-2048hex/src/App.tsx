import { useCallback, useEffect, useMemo, useState } from 'react';

// Hexagonal grid using axial coordinates (q, r). Radius 3 -> 37 cells.
const RADIUS = 3;

type Cell = { q: number; r: number; value: number };

function makeBoard(): Cell[] {
  const cells: Cell[] = [];
  for (let q = -RADIUS; q <= RADIUS; q++) {
    const r1 = Math.max(-RADIUS, -q - RADIUS);
    const r2 = Math.min(RADIUS, -q + RADIUS);
    for (let r = r1; r <= r2; r++) {
      cells.push({ q, r, value: 0 });
    }
  }
  return cells;
}

const DIRECTIONS: Record<string, [number, number]> = {
  // Six hex directions
  e: [1, 0],
  w: [-1, 0],
  ne: [1, -1],
  sw: [-1, 1],
  nw: [0, -1],
  se: [0, 1],
};

function key(q: number, r: number) { return `${q},${r}`; }

function spawn(cells: Cell[]): Cell[] {
  const empties = cells.filter(c => c.value === 0);
  if (empties.length === 0) return cells;
  const pick = empties[Math.floor(Math.random() * empties.length)];
  return cells.map(c => (c.q === pick.q && c.r === pick.r ? { ...c, value: Math.random() < 0.9 ? 2 : 4 } : c));
}

function slide(cells: Cell[], dq: number, dr: number): { cells: Cell[]; moved: boolean; gained: number } {
  const map = new Map<string, Cell>();
  cells.forEach(c => map.set(key(c.q, c.r), { ...c }));

  // Process in order opposite to direction (so leading cells move first)
  const sorted = [...cells].sort((a, b) => {
    // Sort along the direction so furthest-along cells are processed first
    const aProj = a.q * dq + a.r * dr;
    const bProj = b.q * dq + b.r * dr;
    return bProj - aProj;
  });

  let moved = false;
  let gained = 0;
  const merged = new Set<string>();

  for (const c of sorted) {
    const cur = map.get(key(c.q, c.r))!;
    if (cur.value === 0) continue;
    let q = cur.q, r = cur.r;
    while (true) {
      const nq = q + dq, nr = r + dr;
      const nk = key(nq, nr);
      if (!map.has(nk)) break;
      const next = map.get(nk)!;
      if (next.value === 0) {
        // move
        map.set(nk, { ...next, value: cur.value });
        map.set(key(q, r), { q, r, value: 0 });
        q = nq; r = nr;
        moved = true;
      } else if (next.value === cur.value && !merged.has(nk) && !merged.has(key(q, r))) {
        // merge
        map.set(nk, { ...next, value: cur.value * 2 });
        map.set(key(q, r), { q, r, value: 0 });
        merged.add(nk);
        gained += cur.value * 2;
        moved = true;
        break;
      } else {
        break;
      }
    }
  }

  return { cells: cells.map(c => map.get(key(c.q, c.r))!), moved, gained };
}

function hasMoves(cells: Cell[]): boolean {
  if (cells.some(c => c.value === 0)) return true;
  for (const dir of Object.values(DIRECTIONS)) {
    const r = slide(cells, dir[0], dir[1]);
    if (r.moved) return true;
  }
  return false;
}

const COLORS: Record<number, string> = {
  0: '#1a2050',
  2: '#1e293b',
  4: '#334155',
  8: '#475569',
  16: '#7ec8e3',
  32: '#60a5fa',
  64: '#a78bfa',
  128: '#c084fc',
  256: '#e879f9',
  512: '#fbbf24',
  1024: '#f97316',
  2048: '#ef4444',
};

export default function App() {
  const [cells, setCells] = useState<Cell[]>(() => {
    let b = makeBoard();
    b = spawn(spawn(b));
    return b;
  });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => parseInt(localStorage.getItem('2048hex-best') || '0'));
  const [over, setOver] = useState(false);

  const move = useCallback((dq: number, dr: number) => {
    if (over) return;
    setCells(prev => {
      const { cells: next, moved, gained } = slide(prev, dq, dr);
      if (!moved) return prev;
      const withNew = spawn(next);
      setScore(s => {
        const ns = s + gained;
        if (ns > best) {
          setBest(ns);
          localStorage.setItem('2048hex-best', String(ns));
        }
        return ns;
      });
      if (!hasMoves(withNew)) setOver(true);
      return withNew;
    });
  }, [over, best]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'd': case 'ArrowRight': move(1, 0); break;
        case 'a': case 'ArrowLeft': move(-1, 0); break;
        case 'e': move(1, -1); break;
        case 'q': move(0, -1); break;
        case 'w': case 'ArrowUp': move(0, -1); break;
        case 's': case 'ArrowDown': move(0, 1); break;
        case 'z': move(-1, 1); break;
        case 'c': move(1, -1); break;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [move]);

  const reset = () => {
    let b = makeBoard();
    b = spawn(spawn(b));
    setCells(b);
    setScore(0);
    setOver(false);
  };

  const HEX = 44;
  const layout = useMemo(() => {
    // Axial to pixel (flat top)
    const pts = cells.map(c => {
      const x = HEX * (3 / 2 * c.q);
      const y = HEX * (Math.sqrt(3) / 2 * c.q + Math.sqrt(3) * c.r);
      return { ...c, x, y };
    });
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = maxX - minX + HEX * 2;
    const h = maxY - minY + HEX * 2;
    return { pts, w, h, offsetX: -minX + HEX, offsetY: -minY + HEX };
  }, [cells]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3">
      <h1 className="text-3xl font-black tracking-tight">
        <span className="text-steel">2048</span>
        <span className="text-accent"> HEX</span>
      </h1>
      <div className="flex gap-6 text-sm">
        <div>Score: <span className="text-steel font-mono">{score}</span></div>
        <div>Best: <span className="text-accent font-mono">{best}</span></div>
      </div>
      <svg width={layout.w} height={layout.h} className="bg-navy-800 rounded-xl border border-navy-700">
        {layout.pts.map(p => {
          const cx = p.x + layout.offsetX;
          const cy = p.y + layout.offsetY;
          const points = Array.from({ length: 6 }, (_, i) => {
            const a = (Math.PI / 3) * i;
            return `${cx + HEX * 0.92 * Math.cos(a)},${cy + HEX * 0.92 * Math.sin(a)}`;
          }).join(' ');
          return (
            <g key={`${p.q},${p.r}`}>
              <polygon points={points} fill={COLORS[p.value] || '#1a2050'} stroke="#0a0e27" strokeWidth="2" />
              {p.value > 0 && (
                <text
                  x={cx}
                  y={cy + 6}
                  fontSize={p.value >= 100 ? 16 : 20}
                  fontWeight="900"
                  fill={p.value <= 4 ? '#e2e8f0' : '#0a0e27'}
                  textAnchor="middle"
                >
                  {p.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="text-xs text-slate-400 max-w-md text-center">
        <div>Q W E</div>
        <div>A &nbsp; D</div>
        <div>Z &nbsp; C</div>
        <div className="mt-1">Six directions to slide. Merge equal tiles!</div>
      </div>
      <button onClick={reset} className="px-4 py-2 rounded-lg border border-steel/30 hover:bg-navy-700 text-steel text-sm">
        New Game
      </button>
      {over && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-navy-800 border border-accent/40 rounded-2xl p-8 text-center">
            <div className="text-2xl font-black text-accent mb-2">Game Over</div>
            <div className="text-sm text-slate-300 mb-4">Score: {score}</div>
            <button onClick={reset} className="px-4 py-2 rounded-lg bg-accent text-navy-900 font-bold">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
