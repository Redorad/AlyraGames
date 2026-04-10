import { create } from "zustand";
import { useCallback, useEffect } from "react";

type PieceType = "r" | "b" | "rk" | "bk" | null;

interface Move {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  captures: { r: number; c: number }[];
}

interface GameState {
  board: PieceType[][];
  turn: "r" | "b";
  selected: { r: number; c: number } | null;
  validMoves: Move[];
  winner: "r" | "b" | "draw" | null;
  scores: { r: number; b: number };
  highScore: number;
  status: string;
  init: () => void;
  select: (r: number, c: number) => void;
  makeMove: (move: Move) => void;
  aiMove: () => void;
}

function createBoard(): PieceType[][] {
  const b: PieceType[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) b[r][c] = "b";
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) b[r][c] = "r";
  return b;
}

function cloneBoard(b: PieceType[][]): PieceType[][] {
  return b.map((row) => [...row]);
}

function isOwn(piece: PieceType, side: "r" | "b"): boolean {
  if (!piece) return false;
  return piece[0] === side;
}

function isKing(piece: PieceType): boolean {
  return piece === "rk" || piece === "bk";
}

function getMovesForPiece(board: PieceType[][], r: number, c: number, side: "r" | "b"): Move[] {
  const piece = board[r][c];
  if (!piece || !isOwn(piece, side)) return [];
  const moves: Move[] = [];
  const dirs: number[] = [];
  if (side === "r" || isKing(piece)) dirs.push(-1);
  if (side === "b" || isKing(piece)) dirs.push(1);

  // Simple moves
  for (const dr of dirs) {
    for (const dc of [-1, 1]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !board[nr][nc]) {
        moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, captures: [] });
      }
    }
  }

  // Jump moves (recursive for multi-jumps)
  function findJumps(
    curR: number,
    curC: number,
    b: PieceType[][],
    captured: { r: number; c: number }[]
  ) {
    const jumpDirs: number[] = [];
    if (side === "r" || isKing(piece)) jumpDirs.push(-1);
    if (side === "b" || isKing(piece)) jumpDirs.push(1);
    // Also if the piece WOULD be king after reaching end row
    let foundJump = false;
    for (const dr of jumpDirs) {
      for (const dc of [-1, 1]) {
        const mr = curR + dr;
        const mc = curC + dc;
        const jr = curR + 2 * dr;
        const jc = curC + 2 * dc;
        if (
          jr >= 0 && jr < 8 && jc >= 0 && jc < 8 &&
          b[mr][mc] && !isOwn(b[mr][mc], side) && !b[jr][jc] &&
          !captured.some((cp) => cp.r === mr && cp.c === mc)
        ) {
          foundJump = true;
          const nb = cloneBoard(b);
          nb[jr][jc] = nb[curR][curC];
          nb[curR][curC] = null;
          nb[mr][mc] = null;
          findJumps(jr, jc, nb, [...captured, { r: mr, c: mc }]);
        }
      }
    }
    if (!foundJump && captured.length > 0) {
      moves.push({ fromR: r, fromC: c, toR: curR, toC: curC, captures: captured });
    }
  }
  findJumps(r, c, board, []);

  return moves;
}

function getAllMoves(board: PieceType[][], side: "r" | "b"): Move[] {
  let allMoves: Move[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      allMoves.push(...getMovesForPiece(board, r, c, side));

  // Forced capture: if any captures exist, must capture
  const captures = allMoves.filter((m) => m.captures.length > 0);
  if (captures.length > 0) return captures;
  return allMoves;
}

function applyMove(board: PieceType[][], move: Move): PieceType[][] {
  const b = cloneBoard(board);
  b[move.toR][move.toC] = b[move.fromR][move.fromC];
  b[move.fromR][move.fromC] = null;
  for (const cap of move.captures) {
    b[cap.r][cap.c] = null;
  }
  // King promotion
  if (move.toR === 0 && b[move.toR][move.toC] === "r") b[move.toR][move.toC] = "rk";
  if (move.toR === 7 && b[move.toR][move.toC] === "b") b[move.toR][move.toC] = "bk";
  return b;
}

function evaluateBoard(board: PieceType[][]): number {
  let score = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p === "b") score += 3 + (r * 0.1);
      else if (p === "bk") score += 5;
      else if (p === "r") score -= 3 + ((7 - r) * 0.1);
      else if (p === "rk") score -= 5;
    }
  return score;
}

function minimax(board: PieceType[][], depth: number, side: "r" | "b", alpha: number, beta: number): number {
  if (depth === 0) return evaluateBoard(board);
  const moves = getAllMoves(board, side);
  if (moves.length === 0) return side === "b" ? -100 : 100;

  if (side === "b") {
    let best = -Infinity;
    for (const m of moves) {
      const nb = applyMove(board, m);
      best = Math.max(best, minimax(nb, depth - 1, "r", alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const nb = applyMove(board, m);
      best = Math.min(best, minimax(nb, depth - 1, "b", alpha, beta));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

const useStore = create<GameState>((set, get) => ({
  board: createBoard(),
  turn: "r",
  selected: null,
  validMoves: [],
  winner: null,
  scores: { r: 0, b: 0 },
  highScore: parseInt(localStorage.getItem("checkers-highscore") || "0"),
  status: "Your turn (Red)",

  init: () => {
    set({
      board: createBoard(),
      turn: "r",
      selected: null,
      validMoves: [],
      winner: null,
      status: "Your turn (Red)",
    });
  },

  select: (r, c) => {
    const { board, turn, validMoves, winner } = get();
    if (winner || turn !== "r") return;

    // If clicking a valid move destination
    if (get().selected) {
      const move = validMoves.find((m) => m.toR === r && m.toC === c);
      if (move) {
        get().makeMove(move);
        return;
      }
    }

    // Select own piece
    if (isOwn(board[r][c], "r")) {
      const allMoves = getAllMoves(board, "r");
      const pieceMoves = allMoves.filter((m) => m.fromR === r && m.fromC === c);
      if (pieceMoves.length > 0) {
        set({ selected: { r, c }, validMoves: pieceMoves });
      }
    }
  },

  makeMove: (move) => {
    const { turn } = get();
    const newBoard = applyMove(get().board, move);
    const nextTurn = turn === "r" ? "b" : "r";
    const nextMoves = getAllMoves(newBoard, nextTurn);

    let winner: "r" | "b" | "draw" | null = null;
    if (nextMoves.length === 0) {
      winner = turn;
    }

    // Count pieces
    let rCount = 0, bCount = 0;
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        if (newBoard[r][c]?.[0] === "r") rCount++;
        if (newBoard[r][c]?.[0] === "b") bCount++;
      }
    if (rCount === 0) winner = "b";
    if (bCount === 0) winner = "r";

    let scores = get().scores;
    let highScore = get().highScore;
    if (winner === "r") {
      scores = { ...scores, r: scores.r + 1 };
      if (scores.r > highScore) {
        highScore = scores.r;
        localStorage.setItem("checkers-highscore", String(highScore));
      }
    } else if (winner === "b") {
      scores = { ...scores, b: scores.b + 1 };
    }

    const status = winner
      ? winner === "r"
        ? "You win!"
        : winner === "b"
        ? "AI wins!"
        : "Draw!"
      : nextTurn === "r"
      ? "Your turn (Red)"
      : "AI thinking...";

    set({
      board: newBoard,
      turn: nextTurn,
      selected: null,
      validMoves: [],
      winner,
      scores,
      highScore,
      status,
    });

    if (!winner && nextTurn === "b") {
      setTimeout(() => get().aiMove(), 400);
    }
  },

  aiMove: () => {
    const { board, winner } = get();
    if (winner) return;
    const moves = getAllMoves(board, "b");
    if (moves.length === 0) return;

    let bestScore = -Infinity;
    let bestMove = moves[0];
    for (const m of moves) {
      const nb = applyMove(board, m);
      const score = minimax(nb, 3, "r", -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
      }
    }
    get().makeMove(bestMove);
  },
}));

export default function App() {
  const store = useStore();
  const { board, selected, validMoves, winner, scores, highScore, status } = store;

  useEffect(() => {
    store.init();
  }, []);

  const isValidTarget = useCallback(
    (r: number, c: number) => validMoves.some((m) => m.toR === r && m.toC === c),
    [validMoves]
  );

  const isSelected = useCallback(
    (r: number, c: number) => selected?.r === r && selected?.c === c,
    [selected]
  );

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">
        <span className="text-steel">Checkers</span>
      </h1>
      <div className="text-sm text-gray-400">{status}</div>

      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-red-400">You:</span> {scores.r}
        </div>
        <div>
          <span className="text-blue-400">AI:</span> {scores.b}
        </div>
        <div>
          <span className="text-accent">Best:</span> {highScore}
        </div>
      </div>

      <div
        className="grid grid-cols-8 border-2 border-navy-700 rounded-lg overflow-hidden"
        style={{ width: "min(90vw, 400px)", height: "min(90vw, 400px)" }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const dark = (r + c) % 2 === 1;
            const sel = isSelected(r, c);
            const target = isValidTarget(r, c);
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => store.select(r, c)}
                className="relative flex items-center justify-center cursor-pointer"
                style={{
                  backgroundColor: dark
                    ? sel
                      ? "#2d3a6d"
                      : "#1a2050"
                    : "#111640",
                }}
              >
                {target && (
                  <div className="absolute w-3 h-3 rounded-full bg-green-400 opacity-60" />
                )}
                {cell && (
                  <div
                    className="rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      width: "75%",
                      height: "75%",
                      background:
                        cell[0] === "r"
                          ? "radial-gradient(circle at 35% 35%, #ef4444, #991b1b)"
                          : "radial-gradient(circle at 35% 35%, #60a5fa, #1e40af)",
                      boxShadow: sel
                        ? "0 0 12px rgba(126,200,227,0.6)"
                        : "0 2px 6px rgba(0,0,0,0.4)",
                      border: isKing(cell) ? "2px solid #fbbf24" : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {isKing(cell) && "K"}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {winner && (
        <button
          onClick={() => store.init()}
          className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:opacity-90 transition"
        >
          Play Again
        </button>
      )}
    </div>
  );
}
