import { useEffect, useState, useCallback } from 'react';

/*
  # = wall
  . = target
  @ = player
  + = player on target
  $ = box
  * = box on target
  (space) = floor
*/

const LEVELS: string[] = [
  `#####
#.  #
#  $#
#@  #
#####`,
  `######
#   .#
# $  #
# @ $#
#.   #
######`,
  `#######
#  .  #
#  $  #
#.$@$.#
#  $  #
#  .  #
#######`,
  `######
#.   #
#$$$ #
#. @.#
# $  #
#.   #
######`,
  `########
#   #  #
# $ $  #
#  @   #
# $ $  #
#..  ..#
########`,
  `#######
#.....#
#$$$$$#
#  @  #
#     #
#######`,
  `########
#  .   #
# $$$  #
#.@ . .#
# $$$  #
#  .   #
########`,
  `#######
#. . .#
# $$$ #
#  @  #
# $$$ #
#. . .#
#######`,
  `########
#..  ..#
#.$  $.#
#  @   #
#.$  $.#
#..  ..#
########`,
  `#########
#   .   #
# $$$$$ #
#. @@@ .#
# $$$$$ #
#   .   #
#########`,
];

type Cell = 'wall' | 'floor' | 'target' | 'box' | 'boxOnTarget' | 'player' | 'playerOnTarget';

function parseLevel(raw: string): { grid: Cell[][]; px: number; py: number } {
  const rows = raw.split('\n');
  const grid: Cell[][] = [];
  let px = 0, py = 0;
  for (let y = 0; y < rows.length; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < rows[y].length; x++) {
      const c = rows[y][x];
      switch (c) {
        case '#': row.push('wall'); break;
        case '.': row.push('target'); break;
        case '$': row.push('box'); break;
        case '*': row.push('boxOnTarget'); break;
        case '@': row.push('player'); px = x; py = y; break;
        case '+': row.push('playerOnTarget'); px = x; py = y; break;
        default: row.push('floor');
      }
    }
    grid.push(row);
  }
  return { grid, px, py };
}

function cloneGrid(g: Cell[][]): Cell[][] {
  return g.map(r => r.slice());
}

function isSolved(g: Cell[][]): boolean {
  for (const row of g) for (const c of row) if (c === 'box') return false;
  // Also need: every target is a boxOnTarget or playerOnTarget -> actually simpler: no lone boxes and no lone targets
  for (const row of g) for (const c of row) if (c === 'target') return false;
  return true;
}

export default function App() {
  const [level, setLevel] = useState(0);
  const [history, setHistory] = useState<{ grid: Cell[][]; px: number; py: number }[]>(() => {
    const init = parseLevel(LEVELS[0]);
    return [init];
  });

  const current = history[history.length - 1];
  const solved = isSolved(current.grid);

  const loadLevel = useCallback((i: number) => {
    setLevel(i);
    setHistory([parseLevel(LEVELS[i])]);
  }, []);

  const undo = useCallback(() => {
    if (history.length > 1) setHistory(h => h.slice(0, -1));
  }, [history.length]);

  const move = useCallback((dx: number, dy: number) => {
    if (solved) return;
    const { grid, px, py } = current;
    const nx = px + dx, ny = py + dy;
    if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[ny].length) return;
    const target = grid[ny][nx];
    if (target === 'wall') return;
    const newGrid = cloneGrid(grid);
    const playerCell: Cell = grid[py][px] === 'playerOnTarget' ? 'target' : 'floor';

    if (target === 'box' || target === 'boxOnTarget') {
      const bx = nx + dx, by = ny + dy;
      if (by < 0 || by >= grid.length || bx < 0 || bx >= grid[by].length) return;
      const behind = grid[by][bx];
      if (behind === 'wall' || behind === 'box' || behind === 'boxOnTarget') return;
      newGrid[by][bx] = behind === 'target' ? 'boxOnTarget' : 'box';
      newGrid[ny][nx] = target === 'boxOnTarget' ? 'playerOnTarget' : 'player';
      newGrid[py][px] = playerCell;
    } else {
      newGrid[ny][nx] = target === 'target' ? 'playerOnTarget' : 'player';
      newGrid[py][px] = playerCell;
    }
    setHistory(h => [...h, { grid: newGrid, px: nx, py: ny }]);
  }, [current, solved]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); move(0, -1); }
      else if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); move(0, 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); move(-1, 0); }
      else if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); move(1, 0); }
      else if (e.key === 'z' || e.key === 'u') { undo(); }
      else if (e.key === 'r') { loadLevel(level); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [move, undo, level, loadLevel]);

  const cellSize = 40;
  const rows = current.grid.length;
  const cols = Math.max(...current.grid.map(r => r.length));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3">
      <h1 className="text-3xl font-black tracking-tight">
        <span className="text-steel">SOKO</span>
        <span className="text-accent">BAN</span>
      </h1>
      <div className="flex gap-3 items-center flex-wrap justify-center">
        {LEVELS.map((_, i) => (
          <button
            key={i}
            onClick={() => loadLevel(i)}
            className={`w-8 h-8 rounded-md text-xs font-bold border ${
              i === level ? 'bg-accent text-navy-900 border-accent' : 'border-steel/30 text-steel hover:bg-navy-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div
        className="bg-navy-800 rounded-lg p-2 border border-navy-700"
        style={{ width: cols * cellSize + 16, height: rows * cellSize + 16, position: 'relative' }}
      >
        {current.grid.map((row, y) =>
          row.map((cell, x) => {
            let bg = 'transparent';
            let content: string | null = null;
            let color = '#7ec8e3';
            switch (cell) {
              case 'wall': bg = '#1a2050'; break;
              case 'target': bg = '#0a0e27'; content = '·'; color = '#a78bfa'; break;
              case 'box': bg = '#7ec8e3'; content = ''; break;
              case 'boxOnTarget': bg = '#a78bfa'; content = ''; break;
              case 'player': bg = '#0a0e27'; content = '◉'; color = '#7ec8e3'; break;
              case 'playerOnTarget': bg = '#0a0e27'; content = '◉'; color = '#a78bfa'; break;
              default: bg = '#0a0e27';
            }
            return (
              <div
                key={`${x}-${y}`}
                style={{
                  position: 'absolute',
                  left: 8 + x * cellSize,
                  top: 8 + y * cellSize,
                  width: cellSize - 2,
                  height: cellSize - 2,
                  background: bg,
                  borderRadius: cell === 'box' || cell === 'boxOnTarget' ? 6 : 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color,
                  fontSize: cell === 'player' || cell === 'playerOnTarget' ? 24 : 28,
                  fontWeight: 'bold',
                }}
              >
                {content}
              </div>
            );
          })
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={undo} className="px-4 py-2 rounded-lg border border-steel/30 hover:bg-navy-700 text-steel text-sm">
          Undo (Z)
        </button>
        <button onClick={() => loadLevel(level)} className="px-4 py-2 rounded-lg border border-steel/30 hover:bg-navy-700 text-steel text-sm">
          Reset (R)
        </button>
      </div>
      <div className="text-xs text-slate-400">Arrow keys / WASD to move. Push boxes onto purple targets.</div>
      {solved && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-navy-800 border border-accent/40 rounded-2xl p-8 text-center">
            <div className="text-2xl font-black text-accent mb-2">Level Solved!</div>
            <div className="flex gap-2 justify-center">
              {level < LEVELS.length - 1 && (
                <button onClick={() => loadLevel(level + 1)} className="px-4 py-2 rounded-lg bg-accent text-navy-900 font-bold">
                  Next Level
                </button>
              )}
              <button onClick={() => loadLevel(level)} className="px-4 py-2 rounded-lg border border-steel text-steel">
                Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
