import { useEffect, useMemo, useRef, useState } from "react";

type Country = { name: string; flag: string };

const COUNTRIES: Country[] = [
  { name: "France", flag: "🇫🇷" }, { name: "Germany", flag: "🇩🇪" }, { name: "Italy", flag: "🇮🇹" },
  { name: "Spain", flag: "🇪🇸" }, { name: "Portugal", flag: "🇵🇹" }, { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Ireland", flag: "🇮🇪" }, { name: "Belgium", flag: "🇧🇪" }, { name: "Netherlands", flag: "🇳🇱" },
  { name: "Switzerland", flag: "🇨🇭" }, { name: "Austria", flag: "🇦🇹" }, { name: "Sweden", flag: "🇸🇪" },
  { name: "Norway", flag: "🇳🇴" }, { name: "Denmark", flag: "🇩🇰" }, { name: "Finland", flag: "🇫🇮" },
  { name: "Iceland", flag: "🇮🇸" }, { name: "Poland", flag: "🇵🇱" }, { name: "Greece", flag: "🇬🇷" },
  { name: "Turkey", flag: "🇹🇷" }, { name: "Russia", flag: "🇷🇺" }, { name: "Ukraine", flag: "🇺🇦" },
  { name: "Czech Republic", flag: "🇨🇿" }, { name: "Hungary", flag: "🇭🇺" }, { name: "Romania", flag: "🇷🇴" },
  { name: "United States", flag: "🇺🇸" }, { name: "Canada", flag: "🇨🇦" }, { name: "Mexico", flag: "🇲🇽" },
  { name: "Brazil", flag: "🇧🇷" }, { name: "Argentina", flag: "🇦🇷" }, { name: "Chile", flag: "🇨🇱" },
  { name: "Colombia", flag: "🇨🇴" }, { name: "Peru", flag: "🇵🇪" }, { name: "Venezuela", flag: "🇻🇪" },
  { name: "Cuba", flag: "🇨🇺" }, { name: "China", flag: "🇨🇳" }, { name: "Japan", flag: "🇯🇵" },
  { name: "South Korea", flag: "🇰🇷" }, { name: "India", flag: "🇮🇳" }, { name: "Thailand", flag: "🇹🇭" },
  { name: "Vietnam", flag: "🇻🇳" }, { name: "Indonesia", flag: "🇮🇩" }, { name: "Philippines", flag: "🇵🇭" },
  { name: "Singapore", flag: "🇸🇬" }, { name: "Malaysia", flag: "🇲🇾" }, { name: "Pakistan", flag: "🇵🇰" },
  { name: "Bangladesh", flag: "🇧🇩" }, { name: "Iran", flag: "🇮🇷" }, { name: "Iraq", flag: "🇮🇶" },
  { name: "Saudi Arabia", flag: "🇸🇦" }, { name: "Israel", flag: "🇮🇱" }, { name: "Egypt", flag: "🇪🇬" },
  { name: "Morocco", flag: "🇲🇦" }, { name: "South Africa", flag: "🇿🇦" }, { name: "Nigeria", flag: "🇳🇬" },
  { name: "Kenya", flag: "🇰🇪" }, { name: "Australia", flag: "🇦🇺" }, { name: "New Zealand", flag: "🇳🇿" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [seed, setSeed] = useState(0);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [time, setTime] = useState(15);
  const timerRef = useRef<number | null>(null);

  const round = useMemo(() => {
    const shuffled = shuffle(COUNTRIES);
    return Array.from({ length: 12 }, (_, i) => {
      const correct = shuffled[i];
      const others = shuffle(COUNTRIES.filter(c => c.name !== correct.name)).slice(0, 3);
      const opts = shuffle([correct, ...others]).map(c => c.name);
      return { country: correct, opts };
    });
  }, [seed]);

  const q = round[idx];

  useEffect(() => {
    if (done || picked !== null) return;
    setTime(15);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPicked("__TIMEOUT__");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [idx, done]);

  function pick(name: string) {
    if (picked !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setPicked(name);
    if (name === q.country.name) setScore(s => s + 1);
  }

  function next() {
    if (idx + 1 >= round.length) setDone(true);
    else {
      setIdx(idx + 1);
      setPicked(null);
    }
  }

  function restart() {
    setIdx(0);
    setScore(0);
    setPicked(null);
    setDone(false);
    setSeed(s => s + 1);
  }

  if (done) {
    const pct = Math.round((score / round.length) * 100);
    return (
      <div className="w-full max-w-md p-6">
        <div className="bg-navy-800 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🏳️</div>
          <h1 className="text-2xl font-bold text-steel mb-2">Quiz Complete!</h1>
          <div className="text-5xl font-black text-accent my-4">{score}/{round.length}</div>
          <div className="text-white/60 mb-6">{pct}% correct</div>
          <button onClick={restart} className="w-full bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 rounded-xl transition">Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-4">
      <div className="flex items-center justify-between mb-3 px-2 mt-14">
        <div className="text-sm text-white/70">Question {idx + 1}/{round.length}</div>
        <div className={`text-sm font-bold ${time <= 5 ? "text-red-400" : "text-steel"}`}>⏱ {time}s</div>
      </div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-xs text-white/50">Score</div>
        <div className="text-lg font-bold text-accent">{score}</div>
      </div>
      <div className="bg-navy-800 border border-white/10 rounded-2xl p-6 mb-4">
        <div className="text-[150px] text-center leading-none mb-4 drop-shadow-[0_0_20px_rgba(167,139,250,0.3)]">{q.country.flag}</div>
        <h2 className="text-center text-white/80 mb-5 text-sm">Which country is this?</h2>
        <div className="grid grid-cols-1 gap-2">
          {q.opts.map(opt => {
            const isCorrect = picked !== null && opt === q.country.name;
            const isWrong = picked === opt && opt !== q.country.name;
            const cls = isCorrect
              ? "bg-green-500/20 border-green-500 text-green-300"
              : isWrong
                ? "bg-red-500/20 border-red-500 text-red-300"
                : picked !== null
                  ? "bg-navy-700 border-white/5 text-white/50"
                  : "bg-navy-700 border-white/10 text-white hover:border-accent";
            return (
              <button key={opt} onClick={() => pick(opt)} disabled={picked !== null}
                className={`w-full text-center px-4 py-3 rounded-xl border transition ${cls}`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
      {picked !== null && (
        <button onClick={next} className="w-full bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 rounded-xl transition">
          {idx + 1 >= round.length ? "See Results" : "Next"}
        </button>
      )}
    </div>
  );
}
