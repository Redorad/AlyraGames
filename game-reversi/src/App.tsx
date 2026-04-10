import { useEffect, useMemo, useState } from "react";

type Cell = 0 | 1 | 2; // 0 empty, 1 black (player), 2 white (AI)
type Board = Cell[][];

const DIRS: Array<[number, number]> = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

function initialBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array<Cell>(8).fill(0));
  b[3][3] = 2; b[3][4] = 1;
  b[4][3] = 1; b[4][4] = 2;
  return b;
}

function flipsFor(board: Board, r: number, c: number, player: Cell): Array<[number, number]> {
  if (board[r][c] !== 0) return [];
  const opp: Cell = player === 1 ? 2 : 1;
  const all: Array<[number, number]> = [];
  for (const [dr, dc] of DIRS) {
    const line: Array<[number, number]> = [];
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === opp) {
      line.push([nr, nc]);
      nr += dr; nc += dc;
    }
    if (line.length > 0 && nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === player) {
      all.push(...line);
    }
  }
  return all;
}

function legalMoves(board: Board, player: Cell): Map<string, Array<[number, number]>> {
  const map = new Map<string, Array<[number, number]>>();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const flips = flipsFor(board, r, c, player);
    if (flips.length > 0) map.set(`${r},${c}`, flips);
  }
  return map;
}

function applyMove(board: Board, r: number, c: number, player: Cell): Board {
  const nb = board.map(row => [...row]) as Board;
  const flips = flipsFor(nb, r, c, player);
  if (flips.length === 0) return board;
  nb[r][c] = player;
  for (const [fr, fc] of flips) nb[fr][fc] = player;
  return nb;
}

function countPieces(board: Board): { black: number; white: number } {
  let b = 0, w = 0;
  for (const row of board) for (const cell of row) {
    if (cell === 1) b++;
    else if (cell === 2) w++;
  }
  return { black: b, white: w };
}

// AI: evaluate = own count - opp count + corner bonus
const WEIGHTS = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10, -2, 5, 1, 1, 5, -2, 10],
  [5, -2, 1, 1, 1, 1, -2, 5],
  [5, -2, 1, 1, 1, 1, -2, 5],
  [10, -2, 5, 1, 1, 5, -2, 10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10, 5, 5, 10, -20, 100],
];

function evaluate(board: Board, player: Cell): number {
  let s = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c] === player) s += WEIGHTS[r][c];
    else if (board[r][c] !== 0) s -= WEIGHTS[r][c];
  }
  return s;
}

function pickAIMove(board: Board): [number, number] | null {
  const moves = legalMoves(board, 2);
  if (moves.size === 0) return null;
  let best = -Infinity;
  let bestMove: [number, number] = [0, 0];
  for (const key of moves.keys()) {
    const [r, c] = key.split(",").map(Number);
    const nb = applyMove(board, r, c, 2);
    const sc = evaluate(nb, 2);
    if (sc > best) { best = sc; bestMove = [r, c]; }
  }
  return bestMove;
}

export default function App() {
  const [board, setBoard] = useState<Board>(initialBoard());
  const [turn, setTurn] = useState<Cell>(1);
  const [status, setStatus] = useState("Your turn");
  const [gameOver, setGameOver] = useState(false);

  const moves = useMemo(() => legalMoves(board, turn), [board, turn]);
  const { black, white } = countPieces(board);

  useEffect(() => {
    if (gameOver) return;
    // If no moves for current player, pass or end
    if (moves.size === 0) {
      const other = turn === 1 ? 2 : 1;
      const otherMoves = legalMoves(board, other);
      if (otherMoves.size === 0) {
        // game over
        setGameOver(true);
        if (black > white) setStatus("You win!");
        else if (white > black) setStatus("AI wins");
        else setStatus("Draw");
        return;
      }
      setStatus(turn === 1 ? "No moves - you pass" : "No moves - AI passes");
      const timer = setTimeout(() => setTurn(other), 900);
      return () => clearTimeout(timer);
    }
    if (turn === 2) {
      setStatus("AI thinking...");
      const timer = setTimeout(() => {
        const mv = pickAIMove(board);
        if (mv) {
          const nb = applyMove(board, mv[0], mv[1], 2);
          setBoard(nb);
          setTurn(1);
          setStatus("Your turn");
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setStatus("Your turn");
    }
  }, [turn, board, gameOver, moves.size]);

  function click(r: number, c: number) {
    if (gameOver || turn !== 1) return;
    if (!moves.has(`${r},${c}`)) return;
    const nb = applyMove(board, r, c, 1);
    setBoard(nb);
    setTurn(2);
  }

  function restart() {
    setBoard(initialBoard());
    setTurn(1);
    setStatus("Your turn");
    setGameOver(false);
  }

  return (
    <div className="w-full max-w-md p-3">
      <div className="flex items-center justify-between mb-3 mt-14 px-2">
        <div className="text-sm text-steel font-semibold">Reversi</div>
        <button onClick={restart} className="text-xs bg-navy-700 hover:bg-navy-700/70 px-3 py-1 rounded border border-white/10">New Game</button>
      </div>
      <div className="flex items-center justify-center gap-6 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-900 border border-white/30" />
          <span className="text-xl font-bold">{black}</span>
          <span className="text-xs text-white/50">You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white border border-white/30" />
          <span className="text-xl font-bold">{white}</span>
          <span className="text-xs text-white/50">AI</span>
        </div>
      </div>
      <div className="text-center text-white/80 text-sm mb-2 h-5">{status}</div>
      <div className="bg-green-900/70 p-2 rounded-xl border-2 border-green-800 shadow-2xl">
        <div className="grid grid-cols-8 gap-[2px] aspect-square">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isLegal = turn === 1 && moves.has(`${r},${c}`);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => click(r, c)}
                  className="aspect-square bg-green-800 hover:bg-green-700 flex items-center justify-center transition relative"
                >
                  {cell === 1 && <div className="w-[80%] h-[80%] rounded-full bg-gray-900 shadow-lg border border-white/30" />}
                  {cell === 2 && <div className="w-[80%] h-[80%] rounded-full bg-white shadow-lg" />}
                  {cell === 0 && isLegal && <div className="w-[35%] h-[35%] rounded-full bg-steel/40" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
