import { useEffect, useState } from "react";

// Piece encoding: uppercase = white, lowercase = black
// K/k=King, Q/q=Queen, R/r=Rook, B/b=Bishop, N/n=Knight, P/p=Pawn, "."=empty
type Board = string[][];

const INITIAL: Board = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

const UNI: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

const VAL: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 1000,
};

function isWhite(p: string) { return p !== "." && p === p.toUpperCase(); }
function isBlack(p: string) { return p !== "." && p === p.toLowerCase(); }
function inBounds(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function cloneBoard(b: Board): Board {
  return b.map(row => [...row]);
}

// Get pseudo-legal moves (no check filtering)
function rawMoves(board: Board, r: number, c: number): [number, number][] {
  const p = board[r][c];
  if (p === ".") return [];
  const white = isWhite(p);
  const moves: [number, number][] = [];
  const lower = p.toLowerCase();

  const addRay = (dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const t = board[nr][nc];
      if (t === ".") moves.push([nr, nc]);
      else {
        if (white ? isBlack(t) : isWhite(t)) moves.push([nr, nc]);
        break;
      }
      nr += dr; nc += dc;
    }
  };

  if (lower === "p") {
    const dir = white ? -1 : 1;
    const start = white ? 6 : 1;
    if (inBounds(r + dir, c) && board[r + dir][c] === ".") {
      moves.push([r + dir, c]);
      if (r === start && board[r + 2 * dir][c] === ".") moves.push([r + 2 * dir, c]);
    }
    for (const dc of [-1, 1]) {
      const nr = r + dir, nc = c + dc;
      if (inBounds(nr, nc)) {
        const t = board[nr][nc];
        if (t !== "." && (white ? isBlack(t) : isWhite(t))) moves.push([nr, nc]);
      }
    }
  } else if (lower === "n") {
    const deltas = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (const [dr, dc] of deltas) {
      const nr = r + dr, nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const t = board[nr][nc];
      if (t === "." || (white ? isBlack(t) : isWhite(t))) moves.push([nr, nc]);
    }
  } else if (lower === "b") {
    addRay(-1, -1); addRay(-1, 1); addRay(1, -1); addRay(1, 1);
  } else if (lower === "r") {
    addRay(-1, 0); addRay(1, 0); addRay(0, -1); addRay(0, 1);
  } else if (lower === "q") {
    addRay(-1, -1); addRay(-1, 1); addRay(1, -1); addRay(1, 1);
    addRay(-1, 0); addRay(1, 0); addRay(0, -1); addRay(0, 1);
  } else if (lower === "k") {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const t = board[nr][nc];
      if (t === "." || (white ? isBlack(t) : isWhite(t))) moves.push([nr, nc]);
    }
  }
  return moves;
}

function findKing(board: Board, white: boolean): [number, number] | null {
  const target = white ? "K" : "k";
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c] === target) return [r, c];
  }
  return null;
}

function isSquareAttacked(board: Board, r: number, c: number, byWhite: boolean): boolean {
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const p = board[i][j];
    if (p === ".") continue;
    if (byWhite ? !isWhite(p) : !isBlack(p)) continue;
    const mvs = rawMoves(board, i, j);
    if (mvs.some(([mr, mc]) => mr === r && mc === c)) return true;
  }
  return false;
}

function inCheck(board: Board, white: boolean): boolean {
  const k = findKing(board, white);
  if (!k) return false;
  return isSquareAttacked(board, k[0], k[1], !white);
}

// Legal moves: filter moves that leave king in check
function legalMoves(board: Board, r: number, c: number): [number, number][] {
  const p = board[r][c];
  if (p === ".") return [];
  const white = isWhite(p);
  return rawMoves(board, r, c).filter(([nr, nc]) => {
    const nb = cloneBoard(board);
    nb[nr][nc] = nb[r][c];
    nb[r][c] = ".";
    // auto-queen promotion for check detection
    if (p.toLowerCase() === "p" && (nr === 0 || nr === 7)) {
      nb[nr][nc] = white ? "Q" : "q";
    }
    return !inCheck(nb, white);
  });
}

function allLegalMoves(board: Board, white: boolean): Array<{ from: [number, number]; to: [number, number] }> {
  const out: Array<{ from: [number, number]; to: [number, number] }> = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p === "." || (white ? !isWhite(p) : !isBlack(p))) continue;
    for (const to of legalMoves(board, r, c)) {
      out.push({ from: [r, c], to });
    }
  }
  return out;
}

function materialScore(board: Board): number {
  // positive = good for black (AI), negative = white
  let s = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p === ".") continue;
    const v = VAL[p.toLowerCase()] || 0;
    s += isWhite(p) ? -v : v;
  }
  return s;
}

function applyMove(board: Board, from: [number, number], to: [number, number]): Board {
  const nb = cloneBoard(board);
  const p = nb[from[0]][from[1]];
  nb[to[0]][to[1]] = p;
  nb[from[0]][from[1]] = ".";
  // auto-queen promotion
  if (p === "P" && to[0] === 0) nb[to[0]][to[1]] = "Q";
  if (p === "p" && to[0] === 7) nb[to[0]][to[1]] = "q";
  return nb;
}

// Simple AI: pick move that maximizes material after opponent's best reply (depth 2)
function pickAIMove(board: Board): { from: [number, number]; to: [number, number] } | null {
  const moves = allLegalMoves(board, false); // black = AI
  if (moves.length === 0) return null;
  let best = -Infinity;
  let bestMove: typeof moves[0] = moves[0];
  for (const m of moves) {
    const nb1 = applyMove(board, m.from, m.to);
    // opponent (white) tries best capture
    const replies = allLegalMoves(nb1, true);
    let worst = Infinity;
    if (replies.length === 0) {
      const sc = materialScore(nb1) + (inCheck(nb1, true) ? 500 : 0);
      if (sc > best) { best = sc; bestMove = m; }
      continue;
    }
    for (const r of replies) {
      const nb2 = applyMove(nb1, r.from, r.to);
      const sc = materialScore(nb2);
      if (sc < worst) worst = sc;
    }
    const jitter = Math.random() * 0.3;
    if (worst + jitter > best) { best = worst + jitter; bestMove = m; }
  }
  return bestMove;
}

export default function App() {
  const [board, setBoard] = useState<Board>(INITIAL);
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [status, setStatus] = useState("Your turn");
  const [gameOver, setGameOver] = useState(false);

  const selMoves = sel ? legalMoves(board, sel[0], sel[1]) : [];

  useEffect(() => {
    if (gameOver) return;
    if (turn === "b") {
      const timer = setTimeout(() => {
        const mv = pickAIMove(board);
        if (!mv) {
          if (inCheck(board, false)) setStatus("Checkmate! You win!");
          else setStatus("Stalemate");
          setGameOver(true);
          return;
        }
        const nb = applyMove(board, mv.from, mv.to);
        setBoard(nb);
        setTurn("w");
        if (allLegalMoves(nb, true).length === 0) {
          if (inCheck(nb, true)) setStatus("Checkmate! AI wins");
          else setStatus("Stalemate");
          setGameOver(true);
        } else if (inCheck(nb, true)) {
          setStatus("Check! Your turn");
        } else {
          setStatus("Your turn");
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [turn, board, gameOver]);

  function click(r: number, c: number) {
    if (gameOver || turn !== "w") return;
    const p = board[r][c];
    if (sel) {
      if (sel[0] === r && sel[1] === c) {
        setSel(null);
        return;
      }
      if (selMoves.some(([mr, mc]) => mr === r && mc === c)) {
        const nb = applyMove(board, sel, [r, c]);
        setBoard(nb);
        setSel(null);
        setTurn("b");
        if (allLegalMoves(nb, false).length === 0) {
          if (inCheck(nb, false)) setStatus("Checkmate! You win!");
          else setStatus("Stalemate");
          setGameOver(true);
        } else {
          setStatus("AI thinking...");
        }
        return;
      }
      if (isWhite(p)) setSel([r, c]);
      else setSel(null);
    } else if (isWhite(p)) {
      setSel([r, c]);
    }
  }

  function restart() {
    setBoard(INITIAL);
    setSel(null);
    setTurn("w");
    setStatus("Your turn");
    setGameOver(false);
  }

  return (
    <div className="w-full max-w-md p-3">
      <div className="flex items-center justify-between mb-3 mt-14 px-2">
        <div className="text-sm text-steel font-semibold">Chess vs AI</div>
        <button onClick={restart} className="text-xs bg-navy-700 hover:bg-navy-700/70 px-3 py-1 rounded border border-white/10">New Game</button>
      </div>
      <div className="text-center text-white/80 text-sm mb-2 h-5">{status}</div>
      <div className="bg-navy-800 p-2 rounded-xl border border-white/10 shadow-2xl">
        <div className="grid grid-cols-8 gap-0 aspect-square">
          {board.map((row, r) =>
            row.map((p, c) => {
              const dark = (r + c) % 2 === 1;
              const isSel = sel && sel[0] === r && sel[1] === c;
              const canMove = selMoves.some(([mr, mc]) => mr === r && mc === c);
              const bg = isSel
                ? "bg-accent/60"
                : canMove
                  ? (dark ? "bg-steel/40" : "bg-steel/30")
                  : dark ? "bg-navy-700" : "bg-navy-800";
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => click(r, c)}
                  className={`aspect-square flex items-center justify-center text-3xl sm:text-4xl ${bg} transition relative`}
                >
                  {p !== "." && (
                    <span className={isWhite(p) ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" : "text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]"}>
                      {UNI[p]}
                    </span>
                  )}
                  {canMove && p === "." && (
                    <div className="absolute w-3 h-3 rounded-full bg-steel/60" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
