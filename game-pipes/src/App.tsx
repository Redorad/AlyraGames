import { useEffect, useMemo, useState } from 'react';

// Pipe tile types. Each tile has 4 sides (top, right, bottom, left).
// true means there's a pipe connection on that side.
type Tile = {
  type: 'empty' | 'straight' | 'elbow' | 'tee' | 'source' | 'exit';
  rot: number; // 0..3 (× 90deg)
  locked?: boolean;
};

const SIZE = 7;

function getSides(tile: Tile): [boolean, boolean, boolean, boolean] {
  let sides: [boolean, boolean, boolean, boolean];
  switch (tile.type) {
    case 'straight': sides = [true, false, true, false]; break;
    case 'elbow': sides = [true, true, false, false]; break;
    case 'tee': sides = [false, true, true, true]; break;
    case 'source': sides = [false, true, false, false]; break;
    case 'exit': sides = [false, false, false, true]; break;
    default: sides = [false, false, false, false];
  }
  // Rotate sides by rot steps (90°)
  const r = tile.rot % 4;
  const rotated: [boolean, boolean, boolean, boolean] = [
    sides[(0 - r + 4) % 4],
    sides[(1 - r + 4) % 4],
    sides[(2 - r + 4) % 4],
    sides[(3 - r + 4) % 4],
  ];
  return rotated;
}

function randTile(): Tile {
  const types: Tile['type'][] = ['straight', 'elbow', 'tee', 'elbow', 'straight', 'elbow'];
  return {
    type: types[Math.floor(Math.random() * types.length)],
    rot: Math.floor(Math.random() * 4),
  };
}

function generateBoard(): Tile[][] {
  const board: Tile[][] = [];
  for (let y = 0; y < SIZE; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < SIZE; x++) {
      row.push(randTile());
    }
    board.push(row);
  }
  board[Math.floor(SIZE / 2)][0] = { type: 'source', rot: 0, locked: true };
  board[Math.floor(SIZE / 2)][SIZE - 1] = { type: 'exit', rot: 0, locked: true };
  return board;
}

function checkConnected(board: Tile[][]): Set<string> {
  const reached = new Set<string>();
  const sourceY = Math.floor(SIZE / 2);
  const stack: [number, number][] = [[sourceY, 0]];
  reached.add(`${sourceY},0`);
  while (stack.length) {
    const [y, x] = stack.pop()!;
    const sides = getSides(board[y][x]);
    // top
    if (sides[0] && y > 0) {
      const nb = getSides(board[y - 1][x]);
      if (nb[2] && !reached.has(`${y - 1},${x}`)) {
        reached.add(`${y - 1},${x}`);
        stack.push([y - 1, x]);
      }
    }
    // right
    if (sides[1] && x < SIZE - 1) {
      const nb = getSides(board[y][x + 1]);
      if (nb[3] && !reached.has(`${y},${x + 1}`)) {
        reached.add(`${y},${x + 1}`);
        stack.push([y, x + 1]);
      }
    }
    // bottom
    if (sides[2] && y < SIZE - 1) {
      const nb = getSides(board[y + 1][x]);
      if (nb[0] && !reached.has(`${y + 1},${x}`)) {
        reached.add(`${y + 1},${x}`);
        stack.push([y + 1, x]);
      }
    }
    // left
    if (sides[3] && x > 0) {
      const nb = getSides(board[y][x - 1]);
      if (nb[1] && !reached.has(`${y},${x - 1}`)) {
        reached.add(`${y},${x - 1}`);
        stack.push([y, x - 1]);
      }
    }
  }
  return reached;
}

function PipeSvg({ tile, flow }: { tile: Tile; flow: boolean }) {
  const color = flow ? '#7ec8e3' : '#64748b';
  const glow = flow ? 'drop-shadow(0 0 4px #7ec8e3)' : 'none';
  const rotStyle = { transform: `rotate(${tile.rot * 90}deg)`, transformOrigin: 'center', filter: glow };

  if (tile.type === 'source') {
    return (
      <svg viewBox="0 0 60 60" style={rotStyle} width="100%" height="100%">
        <circle cx="30" cy="30" r="14" fill="#a78bfa" />
        <rect x="30" y="24" width="30" height="12" fill={color} />
      </svg>
    );
  }
  if (tile.type === 'exit') {
    return (
      <svg viewBox="0 0 60 60" style={rotStyle} width="100%" height="100%">
        <circle cx="30" cy="30" r="14" fill={flow ? '#a78bfa' : '#475569'} stroke="#a78bfa" strokeWidth="2" />
        <rect x="0" y="24" width="30" height="12" fill={color} />
      </svg>
    );
  }
  if (tile.type === 'straight') {
    return (
      <svg viewBox="0 0 60 60" style={rotStyle} width="100%" height="100%">
        <rect x="24" y="0" width="12" height="60" fill={color} />
      </svg>
    );
  }
  if (tile.type === 'elbow') {
    return (
      <svg viewBox="0 0 60 60" style={rotStyle} width="100%" height="100%">
        <rect x="24" y="0" width="12" height="36" fill={color} />
        <rect x="24" y="24" width="36" height="12" fill={color} />
      </svg>
    );
  }
  if (tile.type === 'tee') {
    return (
      <svg viewBox="0 0 60 60" style={rotStyle} width="100%" height="100%">
        <rect x="0" y="24" width="60" height="12" fill={color} />
        <rect x="24" y="24" width="12" height="36" fill={color} />
      </svg>
    );
  }
  return null;
}

export default function App() {
  const [board, setBoard] = useState<Tile[][]>(() => generateBoard());
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const reached = useMemo(() => checkConnected(board), [board]);
  const exitKey = `${Math.floor(SIZE / 2)},${SIZE - 1}`;

  useEffect(() => {
    if (reached.has(exitKey) && !won) setWon(true);
  }, [reached, exitKey, won]);

  const rotate = (y: number, x: number) => {
    if (won) return;
    if (board[y][x].locked) return;
    setBoard(b => {
      const nb = b.map(row => row.slice());
      nb[y][x] = { ...nb[y][x], rot: (nb[y][x].rot + 1) % 4 };
      return nb;
    });
    setMoves(m => m + 1);
  };

  const reset = () => {
    setBoard(generateBoard());
    setMoves(0);
    setWon(false);
  };

  const tileSize = 56;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
      <h1 className="text-3xl font-black tracking-tight">
        <span className="text-steel">PIPE</span>
        <span className="text-accent"> CONNECT</span>
      </h1>
      <div className="flex gap-6 text-sm">
        <div>Moves: <span className="text-steel font-mono">{moves}</span></div>
        <div>Status: <span className={won ? 'text-accent' : 'text-slate-400'}>{won ? 'Connected!' : 'In Progress'}</span></div>
      </div>
      <div
        className="grid bg-navy-800 p-2 rounded-xl border border-navy-700"
        style={{ gridTemplateColumns: `repeat(${SIZE}, ${tileSize}px)`, gap: 2 }}
      >
        {board.map((row, y) =>
          row.map((tile, x) => {
            const isFlow = reached.has(`${y},${x}`);
            return (
              <div
                key={`${x}-${y}`}
                onClick={() => rotate(y, x)}
                className={`rounded-md cursor-pointer transition-transform hover:scale-105 ${
                  tile.locked ? 'cursor-default' : ''
                }`}
                style={{
                  width: tileSize,
                  height: tileSize,
                  background: '#0a0e27',
                  border: '1px solid #1a2050',
                }}
              >
                <PipeSvg tile={tile} flow={isFlow} />
              </div>
            );
          })
        )}
      </div>
      <div className="text-xs text-slate-400">Click tiles to rotate them. Connect the purple source to the exit.</div>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg border border-steel/30 hover:bg-navy-700 text-steel text-sm"
      >
        New Puzzle
      </button>
      {won && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-navy-800 border border-accent/40 rounded-2xl p-8 text-center">
            <div className="text-2xl font-black text-accent mb-2">Pipes Connected!</div>
            <div className="text-sm text-slate-300 mb-4">Solved in {moves} moves</div>
            <button onClick={reset} className="px-4 py-2 rounded-lg bg-accent text-navy-900 font-bold">
              New Puzzle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
