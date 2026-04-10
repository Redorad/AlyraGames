import { useCallback, useEffect, useMemo, useState } from 'react';

/*
 Legend:
 # = wall
 . = floor
 C = cat start
 E = exit
 G = guard (add direction separately in LEVELS)
*/

type Dir = 'N' | 'E' | 'S' | 'W';

type Level = {
  map: string[];
  guards: { x: number; y: number; dir: Dir; patrol: Dir[] }[];
};

const LEVELS: Level[] = [
  {
    map: [
      '##########',
      '#C.......#',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '#.......E#',
      '##########',
    ],
    guards: [
      { x: 5, y: 3, dir: 'E', patrol: ['E', 'E', 'E', 'S', 'W', 'W', 'W', 'N'] },
      { x: 3, y: 6, dir: 'W', patrol: ['W', 'W', 'E', 'E'] },
    ],
  },
  {
    map: [
      '############',
      '#C.........#',
      '#.####.###.#',
      '#..........#',
      '#.###.####.#',
      '#..........#',
      '#.####.###.#',
      '#.........E#',
      '############',
    ],
    guards: [
      { x: 2, y: 3, dir: 'E', patrol: ['E', 'E', 'E', 'E', 'E', 'E', 'W', 'W', 'W', 'W', 'W', 'W'] },
      { x: 8, y: 5, dir: 'W', patrol: ['W', 'W', 'W', 'W', 'W', 'W', 'E', 'E', 'E', 'E', 'E', 'E'] },
      { x: 5, y: 7, dir: 'E', patrol: ['E', 'E', 'E', 'W', 'W', 'W'] },
    ],
  },
  {
    map: [
      '##############',
      '#C...........#',
      '#.##.###.###.#',
      '#............#',
      '#.##.######..#',
      '#............#',
      '#..######.##.#',
      '#............#',
      '#.###.###.##.#',
      '#...........E#',
      '##############',
    ],
    guards: [
      { x: 5, y: 3, dir: 'E', patrol: ['E', 'E', 'E', 'E', 'E', 'S', 'W', 'W', 'W', 'W', 'W', 'N'] },
      { x: 9, y: 5, dir: 'W', patrol: ['W', 'W', 'W', 'W', 'E', 'E', 'E', 'E'] },
      { x: 3, y: 7, dir: 'E', patrol: ['E', 'E', 'E', 'E', 'E', 'E', 'W', 'W', 'W', 'W', 'W', 'W'] },
      { x: 10, y: 9, dir: 'W', patrol: ['W', 'W', 'W', 'W', 'W', 'E', 'E', 'E', 'E', 'E'] },
    ],
  },
];

const DIR_VEC: Record<Dir, [number, number]> = {
  N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0],
};

function vision(level: Level, guard: { x: number; y: number; dir: Dir }): Set<string> {
  const seen = new Set<string>();
  const [dx, dy] = DIR_VEC[guard.dir];
  for (let i = 1; i <= 3; i++) {
    const x = guard.x + dx * i;
    const y = guard.y + dy * i;
    if (y < 0 || y >= level.map.length || x < 0 || x >= level.map[y].length) break;
    if (level.map[y][x] === '#') break;
    seen.add(`${x},${y}`);
  }
  return seen;
}

export default function App() {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];

  const initialCat = useMemo(() => {
    for (let y = 0; y < level.map.length; y++) {
      const x = level.map[y].indexOf('C');
      if (x >= 0) return { x, y };
    }
    return { x: 1, y: 1 };
  }, [level]);

  const [cat, setCat] = useState(initialCat);
  const [turn, setTurn] = useState(0);
  const [caught, setCaught] = useState(false);
  const [won, setWon] = useState(false);

  const resetLevel = useCallback(() => {
    setCat(initialCat);
    setTurn(0);
    setCaught(false);
    setWon(false);
  }, [initialCat]);

  useEffect(() => {
    resetLevel();
  }, [levelIdx, resetLevel]);

  const guardStates = useMemo(() => {
    return level.guards.map(g => {
      const pos = { x: g.x, y: g.y };
      let dir: Dir = g.dir;
      for (let t = 0; t < turn; t++) {
        const action = g.patrol[t % g.patrol.length];
        const [dx, dy] = DIR_VEC[action];
        const nx = pos.x + dx, ny = pos.y + dy;
        if (ny >= 0 && ny < level.map.length && nx >= 0 && nx < level.map[ny].length && level.map[ny][nx] !== '#') {
          pos.x = nx; pos.y = ny;
          dir = action;
        } else {
          // Turn around
          const opp: Record<Dir, Dir> = { N: 'S', S: 'N', E: 'W', W: 'E' };
          dir = opp[action];
        }
      }
      return { ...pos, dir };
    });
  }, [level, turn]);

  const dangerTiles = useMemo(() => {
    const tiles = new Set<string>();
    guardStates.forEach(g => {
      tiles.add(`${g.x},${g.y}`);
      const v = vision(level, g);
      v.forEach(t => tiles.add(t));
    });
    return tiles;
  }, [level, guardStates]);

  const move = useCallback((dx: number, dy: number) => {
    if (caught || won) return;
    const nx = cat.x + dx, ny = cat.y + dy;
    if (ny < 0 || ny >= level.map.length || nx < 0 || nx >= level.map[ny].length) return;
    if (level.map[ny][nx] === '#') return;
    setCat({ x: nx, y: ny });
    setTurn(t => t + 1);
  }, [cat, caught, won, level]);

  // Check caught/win after position changes
  useEffect(() => {
    const key = `${cat.x},${cat.y}`;
    if (dangerTiles.has(key) && turn > 0) setCaught(true);
    if (level.map[cat.y][cat.x] === 'E') setWon(true);
  }, [cat, dangerTiles, level, turn]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); move(0, -1); }
      else if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); move(0, 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); move(-1, 0); }
      else if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); move(1, 0); }
      else if (e.key === ' ' || e.key === '.') { e.preventDefault(); setTurn(t => t + 1); }
      else if (e.key === 'r') { resetLevel(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [move, resetLevel]);

  const CELL = 44;
  const rows = level.map.length;
  const cols = Math.max(...level.map.map(r => r.length));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3">
      <h1 className="text-3xl font-black tracking-tight">
        <span className="text-steel">SHADOW</span>
        <span className="text-accent"> CAT</span>
      </h1>
      <div className="flex gap-3 items-center">
        {LEVELS.map((_, i) => (
          <button
            key={i}
            onClick={() => setLevelIdx(i)}
            className={`w-8 h-8 rounded-md text-xs font-bold border ${
              i === levelIdx ? 'bg-accent text-navy-900 border-accent' : 'border-steel/30 text-steel hover:bg-navy-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div
        className="bg-navy-800 rounded-lg p-2 border border-navy-700"
        style={{ width: cols * CELL + 16, height: rows * CELL + 16, position: 'relative' }}
      >
        {level.map.map((row, y) =>
          row.split('').map((c, x) => {
            const isDanger = dangerTiles.has(`${x},${y}`);
            const isWall = c === '#';
            const isExit = c === 'E';
            return (
              <div
                key={`${x}-${y}`}
                style={{
                  position: 'absolute',
                  left: 8 + x * CELL,
                  top: 8 + y * CELL,
                  width: CELL - 2,
                  height: CELL - 2,
                  background: isWall ? '#1a2050' : isDanger ? 'rgba(239,68,68,0.25)' : '#0a0e27',
                  border: isDanger && !isWall ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(26,32,80,0.5)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#a78bfa',
                }}
              >
                {isExit ? '⬒' : ''}
              </div>
            );
          })
        )}
        {guardStates.map((g, i) => (
          <div
            key={`guard-${i}`}
            style={{
              position: 'absolute',
              left: 8 + g.x * CELL + 2,
              top: 8 + g.y * CELL + 2,
              width: CELL - 6,
              height: CELL - 6,
              background: '#ef4444',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: '#fff',
            }}
          >
            {g.dir === 'N' ? '↑' : g.dir === 'E' ? '→' : g.dir === 'S' ? '↓' : '←'}
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            left: 8 + cat.x * CELL + 6,
            top: 8 + cat.y * CELL + 6,
            width: CELL - 14,
            height: CELL - 14,
            background: '#7ec8e3',
            borderRadius: '50%',
            boxShadow: '0 0 10px #7ec8e3',
            transition: 'left 0.1s, top 0.1s',
          }}
        />
      </div>
      <div className="text-xs text-slate-400">Arrows/WASD to move. Space to wait. Avoid red vision cones!</div>
      <button onClick={resetLevel} className="px-4 py-2 rounded-lg border border-steel/30 hover:bg-navy-700 text-steel text-sm">
        Reset (R)
      </button>
      {caught && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-navy-800 border border-red-500/40 rounded-2xl p-8 text-center">
            <div className="text-2xl font-black text-red-400 mb-2">Caught!</div>
            <button onClick={resetLevel} className="px-4 py-2 rounded-lg bg-red-500 text-navy-900 font-bold">
              Try Again
            </button>
          </div>
        </div>
      )}
      {won && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-navy-800 border border-accent/40 rounded-2xl p-8 text-center">
            <div className="text-2xl font-black text-accent mb-2">Escaped!</div>
            <div className="flex gap-2 justify-center">
              {levelIdx < LEVELS.length - 1 && (
                <button onClick={() => setLevelIdx(levelIdx + 1)} className="px-4 py-2 rounded-lg bg-accent text-navy-900 font-bold">
                  Next Level
                </button>
              )}
              <button onClick={resetLevel} className="px-4 py-2 rounded-lg border border-steel text-steel">
                Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
