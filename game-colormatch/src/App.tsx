import { useEffect, useState, useRef } from "react";

const COLORS = [
  { name: "RED", hex: "#ef4444" },
  { name: "BLUE", hex: "#3b82f6" },
  { name: "GREEN", hex: "#22c55e" },
  { name: "YELLOW", hex: "#eab308" },
  { name: "PURPLE", hex: "#a855f7" },
  { name: "ORANGE", hex: "#f97316" },
  { name: "PINK", hex: "#ec4899" },
  { name: "CYAN", hex: "#06b6d4" },
];

const HS_KEY = "colormatch_high_score";
const ROUND_TIME = 45;

export default function App() {
  const [word, setWord] = useState(COLORS[0]);
  const [ink, setInk] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState<"right" | "wrong" | null>(null);
  const [high, setHigh] = useState(() => Number(localStorage.getItem(HS_KEY) || 0));
  const lastRoundStart = useRef(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);

  const newRound = () => {
    const w = COLORS[Math.floor(Math.random() * COLORS.length)];
    const matches = Math.random() < 0.5;
    const i = matches ? w : (() => {
      const others = COLORS.filter((c) => c.name !== w.name);
      return others[Math.floor(Math.random() * others.length)];
    })();
    setWord(w);
    setInk(i);
    lastRoundStart.current = performance.now();
  };

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setReactionTimes([]);
    setTimeLeft(ROUND_TIME);
    setPlaying(true);
    newRound();
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPlaying(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (!playing && timeLeft === 0 && score > high) {
      setHigh(score);
      localStorage.setItem(HS_KEY, String(score));
    }
  }, [playing, timeLeft, score, high]);

  const answer = (matches: boolean) => {
    if (!playing) return;
    const actual = word.name === ink.name;
    const correct = matches === actual;
    const rt = performance.now() - lastRoundStart.current;
    if (correct) {
      setReactionTimes((r) => [...r, rt]);
      const base = 10;
      const speedBonus = Math.max(0, Math.floor((2000 - rt) / 50));
      const streakBonus = streak * 2;
      setScore((s) => s + base + speedBonus + streakBonus);
      setStreak((s) => s + 1);
      setFeedback("right");
    } else {
      setStreak(0);
      setScore((s) => Math.max(0, s - 5));
      setFeedback("wrong");
    }
    setTimeout(() => setFeedback(null), 200);
    newRound();
  };

  const avgRt =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-5 bg-navy-900">
      <div className="text-center mb-3">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          <span className="text-steel">COLOR</span>
          <span className="text-accent"> MATCH</span>
        </h1>
        <p className="text-xs text-slate-500">Does the word match the ink color?</p>
      </div>

      <div className="flex gap-3 mb-4 text-sm">
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Score</div>
          <div className="text-lg font-bold text-steel">{score}</div>
        </div>
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Time</div>
          <div className="text-lg font-bold text-accent">{timeLeft}s</div>
        </div>
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Streak</div>
          <div className="text-lg font-bold text-yellow-400">{streak}</div>
        </div>
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Best</div>
          <div className="text-lg font-bold text-white">{high}</div>
        </div>
      </div>

      <div
        className="relative rounded-2xl bg-navy-800 border border-white/10 flex items-center justify-center shadow-2xl"
        style={{
          width: "min(90vw, 480px)",
          height: "min(40vh, 220px)",
          transform: feedback === "right" ? "scale(1.03)" : feedback === "wrong" ? "scale(0.97)" : "scale(1)",
          transition: "transform 120ms",
          boxShadow: feedback === "right" ? "0 0 30px rgba(74,222,128,0.4)" : feedback === "wrong" ? "0 0 30px rgba(248,113,113,0.4)" : undefined,
        }}
      >
        {playing ? (
          <div
            className="text-5xl sm:text-6xl font-black tracking-widest"
            style={{ color: ink.hex, textShadow: `0 0 20px ${ink.hex}88` }}
          >
            {word.name}
          </div>
        ) : (
          <div className="text-center">
            {timeLeft === 0 && (
              <>
                <div className="text-xl font-bold text-accent mb-1">Time's up!</div>
                <div className="text-slate-400 text-sm">
                  Score: {score} · Avg: {avgRt}ms
                </div>
              </>
            )}
            <button
              onClick={startGame}
              className="mt-3 px-6 py-3 rounded-lg bg-accent text-navy-900 font-bold text-sm uppercase tracking-wider hover:brightness-110"
            >
              {timeLeft === 0 ? "Play Again" : "Start"}
            </button>
          </div>
        )}
      </div>

      {playing && (
        <div className="flex gap-4 mt-5">
          <button
            onClick={() => answer(false)}
            className="px-8 py-4 rounded-xl bg-red-500 text-white font-black text-lg uppercase tracking-wider hover:brightness-110 active:scale-95 transition"
          >
            ✕ NO
          </button>
          <button
            onClick={() => answer(true)}
            className="px-8 py-4 rounded-xl bg-green-500 text-white font-black text-lg uppercase tracking-wider hover:brightness-110 active:scale-95 transition"
          >
            ✓ YES
          </button>
        </div>
      )}
    </div>
  );
}
