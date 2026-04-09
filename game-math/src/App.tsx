import { useState, useEffect, useCallback, useRef } from "react";

const GAME_TIME = 60;
const OPS = ["+", "-", "x"] as const;
type Op = typeof OPS[number];

interface Problem {
  a: number;
  b: number;
  op: Op;
  answer: number;
}

function generateProblem(): Problem {
  const op = OPS[Math.floor(Math.random() * OPS.length)];
  let a: number, b: number, answer: number;
  switch (op) {
    case "+":
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
      break;
    case "-":
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case "x":
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }
  return { a, b, op, answer };
}

function getHi(): number { return Number(localStorage.getItem("math-blitz-hi") || "0"); }
function setHiScore(s: number) { localStorage.setItem("math-blitz-hi", String(s)); }

export default function App() {
  const [phase, setPhase] = useState<"menu" | "play" | "over">("menu");
  const [problem, setProblem] = useState<Problem>(generateProblem);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [hi, setHi] = useState(getHi());
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const scoreRef = useRef(0);

  const startGame = useCallback(() => {
    setPhase("play");
    setProblem(generateProblem());
    setInput("");
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setTimeLeft(GAME_TIME);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (scoreRef.current > getHi()) { setHiScore(scoreRef.current); setHi(scoreRef.current); }
          setPhase("over");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const submitAnswer = useCallback((val: string) => {
    if (phase !== "play") return;
    const num = parseInt(val);
    if (isNaN(num)) return;

    if (num === problem.answer) {
      const multiplier = Math.max(1, Math.floor((streak + 1) / 3));
      const points = 10 * multiplier;
      scoreRef.current += points;
      setScore(scoreRef.current);
      setStreak(s => s + 1);
      setCorrect(c => c + 1);
      setFeedback("correct");
      setTimeout(() => setFeedback(null), 300);
      setProblem(generateProblem());
      setInput("");
    } else {
      setStreak(0);
      setWrong(w => w + 1);
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 300);
      setInput("");
    }
  }, [phase, problem, streak]);

  const pressKey = useCallback((key: string) => {
    if (phase !== "play") return;
    if (key === "DEL") {
      setInput(prev => prev.slice(0, -1));
    } else if (key === "GO") {
      submitAnswer(input);
    } else if (key === "-") {
      setInput(prev => prev.startsWith("-") ? prev.slice(1) : "-" + prev);
    } else {
      const next = input + key;
      setInput(next);
      // Auto-submit if answer length matches
      const num = parseInt(next);
      if (!isNaN(num) && String(num) === next && next.length >= String(problem.answer).length) {
        submitAnswer(next);
      }
    }
  }, [phase, input, problem, submitAnswer]);

  /* keyboard support */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === "menu" && e.key === "Enter") { startGame(); return; }
      if (phase === "over" && e.key === "Enter") { startGame(); return; }
      if (phase !== "play") return;
      if (e.key >= "0" && e.key <= "9") pressKey(e.key);
      else if (e.key === "Backspace") pressKey("DEL");
      else if (e.key === "Enter") pressKey("GO");
      else if (e.key === "-") pressKey("-");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, pressKey, startGame]);

  const streakMultiplier = Math.max(1, Math.floor((streak) / 3));

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-sm mx-auto">
      <a href="/AlyraGames/" className="text-steel text-sm hover:underline self-start">&larr; Hub</a>
      <h1 className="text-3xl font-black text-steel">MATH BLITZ</h1>

      {phase === "menu" && (
        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-6xl">🧮</p>
          <p className="text-slate-400">Solve as many as you can in 60 seconds!</p>
          {hi > 0 && <p className="text-accent">High Score: {hi}</p>}
          <button onClick={startGame}
            className="px-8 py-3 rounded-xl bg-accent text-white font-bold text-lg hover:opacity-90 transition">
            Start
          </button>
        </div>
      )}

      {phase === "play" && (
        <>
          {/* HUD */}
          <div className="flex w-full justify-between text-lg">
            <span>Score: <span className="text-accent font-bold">{score}</span></span>
            <span className={timeLeft <= 10 ? "text-red-400 font-bold" : "text-steel"}>{timeLeft}s</span>
          </div>

          {streak >= 3 && (
            <div className="text-accent font-bold text-sm">
              {streakMultiplier}x multiplier! (streak: {streak})
            </div>
          )}

          {/* Problem */}
          <div className={`text-5xl font-black text-center mt-2 p-4 rounded-xl w-full
            ${feedback === "correct" ? "correct-flash" : ""}
            ${feedback === "wrong" ? "shake" : ""}`}>
            {problem.a} {problem.op} {problem.b} = ?
          </div>

          {/* Input display */}
          <div className="text-4xl font-bold text-steel h-12 flex items-center justify-center min-w-[100px] border-b-2 border-steel/30">
            {input || <span className="text-white/20">...</span>}
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-4 gap-2 w-full mt-2">
            {["7", "8", "9", "DEL", "4", "5", "6", "-", "1", "2", "3", "GO", "0"].map(key => (
              <button key={key}
                onClick={() => pressKey(key)}
                className={`py-4 rounded-lg font-bold text-xl transition active:scale-95
                  ${key === "GO" ? "bg-green-600 text-white row-span-1" :
                    key === "DEL" ? "bg-red-500/20 text-red-400" :
                    key === "-" ? "bg-navy-700 text-accent" :
                    key === "0" ? "bg-navy-700 text-white col-span-1" :
                    "bg-navy-700 text-white hover:bg-navy-800"}`}
                style={key === "0" ? {} : {}}>
                {key}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "over" && (
        <div className="flex flex-col items-center gap-4 mt-4">
          <p className="text-2xl font-bold text-red-400">Time's Up!</p>
          <p className="text-4xl font-black text-accent">{score}</p>
          <div className="flex gap-6 text-sm">
            <span className="text-green-400">Correct: {correct}</span>
            <span className="text-red-400">Wrong: {wrong}</span>
          </div>
          {hi > 0 && <p className="text-sm text-slate-400">Best: {hi}</p>}
          <button onClick={startGame}
            className="px-8 py-3 rounded-xl bg-accent text-white font-bold hover:opacity-90 transition">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
