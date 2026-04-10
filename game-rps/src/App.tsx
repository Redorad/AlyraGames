import { useState } from "react";

type Move = "rock" | "paper" | "scissors";
const MOVES: Move[] = ["rock", "paper", "scissors"];
const EMOJI: Record<Move, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };
const LABEL: Record<Move, string> = { rock: "Rock", paper: "Paper", scissors: "Scissors" };

const STORAGE_KEY = "rps-stats";

interface Stats {
  wins: number;
  losses: number;
  draws: number;
  seriesWins: number;
  seriesLosses: number;
}

const loadStats = (): Stats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { wins: 0, losses: 0, draws: 0, seriesWins: 0, seriesLosses: 0 };
};

const saveStats = (s: Stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

const beats = (a: Move, b: Move): "win" | "lose" | "draw" => {
  if (a === b) return "draw";
  if ((a === "rock" && b === "scissors") || (a === "paper" && b === "rock") || (a === "scissors" && b === "paper"))
    return "win";
  return "lose";
};

type BestOf = 5 | 10;

export default function App() {
  const [bestOf, setBestOf] = useState<BestOf>(5);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [round, setRound] = useState(1);
  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [aiMove, setAiMove] = useState<Move | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [seriesOver, setSeriesOver] = useState<null | "win" | "lose">(null);
  const [stats, setStats] = useState<Stats>(loadStats);

  const target = Math.floor(bestOf / 2) + 1;

  const play = (move: Move) => {
    if (seriesOver) return;
    const ai = MOVES[Math.floor(Math.random() * 3)];
    const r = beats(move, ai);
    setPlayerMove(move);
    setAiMove(ai);
    setResult(r);
    const newP = playerScore + (r === "win" ? 1 : 0);
    const newA = aiScore + (r === "lose" ? 1 : 0);
    setPlayerScore(newP);
    setAiScore(newA);

    const newStats = {
      ...stats,
      wins: stats.wins + (r === "win" ? 1 : 0),
      losses: stats.losses + (r === "lose" ? 1 : 0),
      draws: stats.draws + (r === "draw" ? 1 : 0),
    };
    setStats(newStats);
    saveStats(newStats);

    if (newP >= target) {
      setSeriesOver("win");
      const ns = { ...newStats, seriesWins: newStats.seriesWins + 1 };
      setStats(ns);
      saveStats(ns);
    } else if (newA >= target) {
      setSeriesOver("lose");
      const ns = { ...newStats, seriesLosses: newStats.seriesLosses + 1 };
      setStats(ns);
      saveStats(ns);
    } else {
      setRound((rnd) => rnd + 1);
    }
  };

  const reset = () => {
    setPlayerScore(0);
    setAiScore(0);
    setRound(1);
    setPlayerMove(null);
    setAiMove(null);
    setResult(null);
    setSeriesOver(null);
  };

  const resultText = result === "win" ? "You win!" : result === "lose" ? "AI wins!" : result === "draw" ? "Draw" : "";
  const resultColor = result === "win" ? "text-emerald-400" : result === "lose" ? "text-red-400" : "text-steel";

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-5 px-4">
      <div className="w-full max-w-sm flex items-center justify-between mt-2">
        <div className="text-center">
          <div className="text-xs text-steel/60">YOU</div>
          <div className="text-3xl font-black text-steel">{playerScore}</div>
        </div>
        <h1 className="text-xl font-black">
          <span className="text-steel">R</span>
          <span className="text-accent">P</span>
          <span className="text-steel">S</span>
        </h1>
        <div className="text-center">
          <div className="text-xs text-steel/60">AI</div>
          <div className="text-3xl font-black text-accent">{aiScore}</div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        Best of {bestOf} &middot; First to {target} &middot; Round {round}
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-6xl mb-2">{playerMove ? EMOJI[playerMove] : "❓"}</div>
            <div className="text-[11px] text-slate-400 uppercase">You</div>
          </div>
          <div className="text-2xl font-black text-slate-600">VS</div>
          <div className="text-center">
            <div className="text-6xl mb-2">{aiMove ? EMOJI[aiMove] : "❓"}</div>
            <div className="text-[11px] text-slate-400 uppercase">AI</div>
          </div>
        </div>
      </div>

      <div className={`text-lg font-black h-6 ${resultColor}`}>{resultText}</div>

      {!seriesOver ? (
        <div className="flex gap-3 mt-3">
          {MOVES.map((m) => (
            <button
              key={m}
              onClick={() => play(m)}
              className="flex flex-col items-center gap-1 px-4 py-3 bg-navy-800 border-2 border-navy-700 rounded-xl hover:border-accent active:scale-95 transition"
            >
              <span className="text-3xl">{EMOJI[m]}</span>
              <span className="text-[10px] font-bold uppercase text-slate-400">{LABEL[m]}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 mt-3">
          <div className={`text-2xl font-black ${seriesOver === "win" ? "text-emerald-400" : "text-red-400"}`}>
            {seriesOver === "win" ? "Series Won!" : "Series Lost"}
          </div>
          <button onClick={reset} className="px-6 py-2 bg-accent text-white font-bold rounded-lg">
            Play Again
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-col items-center gap-1 w-full">
        <div className="flex gap-2">
          {([5, 10] as BestOf[]).map((n) => (
            <button
              key={n}
              onClick={() => {
                setBestOf(n);
                reset();
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md ${
                bestOf === n ? "bg-accent text-white" : "bg-navy-800 text-slate-400"
              }`}
            >
              Best of {n}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-slate-500">
          W {stats.wins} &middot; L {stats.losses} &middot; D {stats.draws} &middot; Series {stats.seriesWins}-
          {stats.seriesLosses}
        </div>
      </div>
    </div>
  );
}
