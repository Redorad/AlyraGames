import { useEffect, useState } from "react";

type Cell = "X" | "O" | null;
type Board = Cell[];

const STORAGE_KEY = "tictactoe-stats";

interface Stats {
  wins: number;
  losses: number;
  draws: number;
}

const loadStats = (): Stats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { wins: 0, losses: 0, draws: 0 };
};

const saveStats = (s: Stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const checkWinner = (b: Board): { winner: Cell; line: number[] | null } => {
  for (const line of LINES) {
    const [a, b1, c] = line;
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return { winner: b[a], line };
  }
  return { winner: null, line: null };
};

const isFull = (b: Board) => b.every((c) => c !== null);

// minimax: X = player, O = AI
const minimax = (b: Board, isAI: boolean): { score: number; move: number } => {
  const { winner } = checkWinner(b);
  if (winner === "O") return { score: 1, move: -1 };
  if (winner === "X") return { score: -1, move: -1 };
  if (isFull(b)) return { score: 0, move: -1 };

  let bestScore = isAI ? -Infinity : Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (b[i] !== null) continue;
    const nb = [...b];
    nb[i] = isAI ? "O" : "X";
    const { score } = minimax(nb, !isAI);
    if (isAI && score > bestScore) {
      bestScore = score;
      bestMove = i;
    } else if (!isAI && score < bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return { score: bestScore, move: bestMove };
};

export default function App() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [status, setStatus] = useState<"playing" | "won" | "lost" | "draw">("playing");
  const [stats, setStats] = useState<Stats>(loadStats);
  const [aiThinking, setAiThinking] = useState(false);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setWinningLine(null);
    setStatus("playing");
    setAiThinking(false);
  };

  const applyMove = (b: Board) => {
    const { winner, line } = checkWinner(b);
    if (winner === "X") {
      setWinningLine(line);
      setStatus("won");
      const ns = { ...stats, wins: stats.wins + 1 };
      setStats(ns);
      saveStats(ns);
      return true;
    }
    if (winner === "O") {
      setWinningLine(line);
      setStatus("lost");
      const ns = { ...stats, losses: stats.losses + 1 };
      setStats(ns);
      saveStats(ns);
      return true;
    }
    if (isFull(b)) {
      setStatus("draw");
      const ns = { ...stats, draws: stats.draws + 1 };
      setStats(ns);
      saveStats(ns);
      return true;
    }
    return false;
  };

  const play = (i: number) => {
    if (status !== "playing" || turn !== "X" || board[i] !== null || aiThinking) return;
    const nb = [...board];
    nb[i] = "X";
    setBoard(nb);
    if (applyMove(nb)) return;
    setTurn("O");
  };

  useEffect(() => {
    if (turn === "O" && status === "playing") {
      setAiThinking(true);
      const timer = setTimeout(() => {
        const { move } = minimax(board, true);
        if (move !== -1) {
          const nb = [...board];
          nb[move] = "O";
          setBoard(nb);
          if (!applyMove(nb)) {
            setTurn("X");
          }
        }
        setAiThinking(false);
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [turn, status]);

  const cellText = (c: Cell) => (c === "X" ? "X" : c === "O" ? "O" : "");
  const cellColor = (c: Cell) => (c === "X" ? "text-steel" : c === "O" ? "text-accent" : "");

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-6 px-4">
      <div className="w-full max-w-sm flex items-center justify-between mt-2">
        <div className="text-xs text-center">
          <div className="text-steel/60">WINS</div>
          <div className="font-bold text-emerald-400">{stats.wins}</div>
        </div>
        <h1 className="text-xl font-black">
          <span className="text-steel">TIC</span>
          <span className="text-accent">TAC</span>
          <span className="text-steel">TOE</span>
        </h1>
        <div className="text-xs text-center">
          <div className="text-steel/60">LOSSES</div>
          <div className="font-bold text-red-400">{stats.losses}</div>
        </div>
      </div>

      <div className="text-sm text-slate-400 h-6">
        {status === "playing"
          ? turn === "X"
            ? "Your turn (X)"
            : "AI thinking..."
          : status === "won"
          ? "You win!"
          : status === "lost"
          ? "AI wins!"
          : "Draw"}
      </div>

      <div className="grid grid-cols-3 gap-2 p-3 bg-navy-800 rounded-xl border border-navy-700">
        {board.map((cell, i) => {
          const highlight = winningLine?.includes(i);
          return (
            <button
              key={i}
              onClick={() => play(i)}
              className={`w-20 h-20 rounded-lg text-5xl font-black transition ${
                highlight ? "bg-emerald-500/30 border-emerald-400" : "bg-navy-900 border-navy-700"
              } border-2 ${cellColor(cell)} hover:bg-navy-700`}
            >
              {cellText(cell)}
            </button>
          );
        })}
      </div>

      <button
        onClick={reset}
        className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:opacity-90"
      >
        New Game
      </button>

      <div className="text-[10px] text-slate-500">
        Draws: {stats.draws} &middot; AI uses minimax (unbeatable)
      </div>
    </div>
  );
}
