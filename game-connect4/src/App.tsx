import { useState, useCallback, useEffect, useRef } from "react";

const ROWS = 6, COLS = 7;
type Cell = 0 | 1 | 2; // 0=empty, 1=red(player), 2=yellow(AI)
type Board = Cell[][];

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as Cell[]);
}

function getWinStats(): { wins: number; losses: number; draws: number } {
  const raw = localStorage.getItem("connect4-stats");
  return raw ? JSON.parse(raw) : { wins: 0, losses: 0, draws: 0 };
}
function saveStats(s: { wins: number; losses: number; draws: number }) {
  localStorage.setItem("connect4-stats", JSON.stringify(s));
}

/* check 4 in a row for given player */
function checkWin(board: Board, player: Cell): number[][] | null {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== player) continue;
      for (const [dr, dc] of dirs) {
        const cells: number[][] = [];
        let ok = true;
        for (let i = 0; i < 4; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== player) { ok = false; break; }
          cells.push([nr, nc]);
        }
        if (ok) return cells;
      }
    }
  }
  return null;
}

function isFull(board: Board): boolean {
  return board[0].every(c => c !== 0);
}

function dropPiece(board: Board, col: number, player: Cell): Board | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      const nb = board.map(row => [...row]) as Board;
      nb[r][col] = player;
      return nb;
    }
  }
  return null;
}

/* simple AI: minimax with depth limit */
function scorePosition(board: Board, player: Cell): number {
  let sc = 0;
  const opp: Cell = player === 1 ? 2 : 1;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of dirs) {
        let mine = 0, theirs = 0, empty = 0;
        for (let i = 0; i < 4; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { mine = -1; break; }
          if (board[nr][nc] === player) mine++;
          else if (board[nr][nc] === opp) theirs++;
          else empty++;
        }
        if (mine < 0) continue;
        if (theirs === 0) {
          if (mine === 4) sc += 1000;
          else if (mine === 3 && empty === 1) sc += 50;
          else if (mine === 2 && empty === 2) sc += 5;
        }
        if (mine === 0) {
          if (theirs === 3 && empty === 1) sc -= 80;
        }
      }
    }
  }
  // center preference
  for (let r = 0; r < ROWS; r++) {
    if (board[r][3] === player) sc += 3;
  }
  return sc;
}

function minimax(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean): [number, number] {
  const aiPlayer: Cell = 2;
  const humanPlayer: Cell = 1;

  if (checkWin(board, aiPlayer)) return [100000 + depth, -1];
  if (checkWin(board, humanPlayer)) return [-100000 - depth, -1];
  if (isFull(board)) return [0, -1];
  if (depth === 0) return [scorePosition(board, aiPlayer) - scorePosition(board, humanPlayer), -1];

  const validCols = [];
  for (let c = 0; c < COLS; c++) if (board[0][c] === 0) validCols.push(c);

  if (maximizing) {
    let best = -Infinity, bestCol = validCols[0];
    for (const c of validCols) {
      const nb = dropPiece(board, c, aiPlayer);
      if (!nb) continue;
      const [val] = minimax(nb, depth - 1, alpha, beta, false);
      if (val > best) { best = val; bestCol = c; }
      alpha = Math.max(alpha, val);
      if (alpha >= beta) break;
    }
    return [best, bestCol];
  } else {
    let best = Infinity, bestCol = validCols[0];
    for (const c of validCols) {
      const nb = dropPiece(board, c, humanPlayer);
      if (!nb) continue;
      const [val] = minimax(nb, depth - 1, alpha, beta, true);
      if (val < best) { best = val; bestCol = c; }
      beta = Math.min(beta, val);
      if (alpha >= beta) break;
    }
    return [best, bestCol];
  }
}

export default function App() {
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [turn, setTurn] = useState<1 | 2>(1);
  const [winCells, setWinCells] = useState<number[][] | null>(null);
  const [status, setStatus] = useState<string>("Your turn (Red)");
  const [gameOver, setGameOver] = useState(false);
  const [stats, setStats] = useState(getWinStats());
  const [lastDrop, setLastDrop] = useState<[number, number] | null>(null);
  const aiThinking = useRef(false);

  const resetGame = useCallback(() => {
    setBoard(emptyBoard());
    setTurn(1);
    setWinCells(null);
    setStatus("Your turn (Red)");
    setGameOver(false);
    setLastDrop(null);
    aiThinking.current = false;
  }, []);

  const handleDrop = useCallback((col: number) => {
    if (gameOver || turn !== 1 || aiThinking.current) return;
    const nb = dropPiece(board, col, 1);
    if (!nb) return;

    // find the row where piece landed
    let landedRow = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (nb[r][col] === 1 && board[r][col] === 0) { landedRow = r; break; }
    }
    setLastDrop([landedRow, col]);

    setBoard(nb);
    const win = checkWin(nb, 1);
    if (win) {
      setWinCells(win);
      setStatus("You win!");
      setGameOver(true);
      const s = { ...getWinStats(), wins: getWinStats().wins + 1 };
      saveStats(s); setStats(s);
      return;
    }
    if (isFull(nb)) {
      setStatus("Draw!");
      setGameOver(true);
      const s = { ...getWinStats(), draws: getWinStats().draws + 1 };
      saveStats(s); setStats(s);
      return;
    }
    setTurn(2);
    setStatus("AI thinking...");
  }, [board, turn, gameOver]);

  /* AI move */
  useEffect(() => {
    if (turn !== 2 || gameOver) return;
    aiThinking.current = true;
    const timer = setTimeout(() => {
      const [, col] = minimax(board, 5, -Infinity, Infinity, true);
      if (col < 0) return;
      const nb = dropPiece(board, col, 2);
      if (!nb) return;

      let landedRow = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (nb[r][col] === 2 && board[r][col] === 0) { landedRow = r; break; }
      }
      setLastDrop([landedRow, col]);

      setBoard(nb);
      const win = checkWin(nb, 2);
      if (win) {
        setWinCells(win);
        setStatus("AI wins!");
        setGameOver(true);
        const s = { ...getWinStats(), losses: getWinStats().losses + 1 };
        saveStats(s); setStats(s);
      } else if (isFull(nb)) {
        setStatus("Draw!");
        setGameOver(true);
        const s = { ...getWinStats(), draws: getWinStats().draws + 1 };
        saveStats(s); setStats(s);
      } else {
        setTurn(1);
        setStatus("Your turn (Red)");
      }
      aiThinking.current = false;
    }, 300);
    return () => clearTimeout(timer);
  }, [turn, board, gameOver]);

  const isWinCell = (r: number, c: number) => winCells?.some(([wr, wc]) => wr === r && wc === c) ?? false;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <a href="/AlyraGames/" className="text-steel text-sm hover:underline self-start">&larr; Hub</a>
      <h1 className="text-3xl font-black text-steel">CONNECT FOUR</h1>

      <p className="text-lg font-semibold">{status}</p>

      {/* Column headers for drop */}
      <div className="grid grid-cols-7 gap-1" style={{ width: "min(95vw, 380px)" }}>
        {Array.from({ length: COLS }).map((_, c) => (
          <button key={c} onClick={() => handleDrop(c)}
            className="h-8 rounded-t-lg bg-navy-700 hover:bg-navy-800 transition text-xs text-slate-500 flex items-center justify-center"
            disabled={gameOver || turn !== 1}>
            &#9660;
          </button>
        ))}
      </div>

      {/* Board */}
      <div className="grid grid-cols-7 gap-1 p-3 rounded-xl bg-navy-800 border border-white/10"
        style={{ width: "min(95vw, 380px)" }}>
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isDrop = lastDrop && lastDrop[0] === r && lastDrop[1] === c;
            return (
              <div key={`${r}-${c}`}
                className={`aspect-square rounded-full border-2 flex items-center justify-center transition-all
                  ${cell === 0 ? "bg-navy-900 border-navy-700" : ""}
                  ${cell === 1 ? "bg-red-500 border-red-400" : ""}
                  ${cell === 2 ? "bg-yellow-400 border-yellow-300" : ""}
                  ${isDrop ? "cell-drop" : ""}
                  ${isWinCell(r, c) ? "cell-win" : ""}
                `}
                onClick={() => handleDrop(c)}
                style={{ cursor: !gameOver && turn === 1 && cell === 0 ? "pointer" : "default" }}
              />
            );
          })
        )}
      </div>

      <div className="flex gap-4 text-sm text-slate-400">
        <span>W: <span className="text-green-400">{stats.wins}</span></span>
        <span>L: <span className="text-red-400">{stats.losses}</span></span>
        <span>D: <span className="text-slate-300">{stats.draws}</span></span>
      </div>

      {gameOver && (
        <button onClick={resetGame}
          className="px-6 py-2 rounded-lg bg-accent text-white font-bold hover:opacity-90 transition">
          New Game
        </button>
      )}
    </div>
  );
}
