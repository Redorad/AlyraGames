import { useMemo, useState } from "react";

type CapEntry = { country: string; capital: string; flag: string };

const DATA: CapEntry[] = [
  { country: "France", capital: "Paris", flag: "🇫🇷" },
  { country: "Germany", capital: "Berlin", flag: "🇩🇪" },
  { country: "Italy", capital: "Rome", flag: "🇮🇹" },
  { country: "Spain", capital: "Madrid", flag: "🇪🇸" },
  { country: "Portugal", capital: "Lisbon", flag: "🇵🇹" },
  { country: "United Kingdom", capital: "London", flag: "🇬🇧" },
  { country: "Ireland", capital: "Dublin", flag: "🇮🇪" },
  { country: "Belgium", capital: "Brussels", flag: "🇧🇪" },
  { country: "Netherlands", capital: "Amsterdam", flag: "🇳🇱" },
  { country: "Switzerland", capital: "Bern", flag: "🇨🇭" },
  { country: "Austria", capital: "Vienna", flag: "🇦🇹" },
  { country: "Sweden", capital: "Stockholm", flag: "🇸🇪" },
  { country: "Norway", capital: "Oslo", flag: "🇳🇴" },
  { country: "Denmark", capital: "Copenhagen", flag: "🇩🇰" },
  { country: "Finland", capital: "Helsinki", flag: "🇫🇮" },
  { country: "Iceland", capital: "Reykjavik", flag: "🇮🇸" },
  { country: "Poland", capital: "Warsaw", flag: "🇵🇱" },
  { country: "Greece", capital: "Athens", flag: "🇬🇷" },
  { country: "Turkey", capital: "Ankara", flag: "🇹🇷" },
  { country: "Russia", capital: "Moscow", flag: "🇷🇺" },
  { country: "Ukraine", capital: "Kyiv", flag: "🇺🇦" },
  { country: "Czech Republic", capital: "Prague", flag: "🇨🇿" },
  { country: "Hungary", capital: "Budapest", flag: "🇭🇺" },
  { country: "Romania", capital: "Bucharest", flag: "🇷🇴" },
  { country: "United States", capital: "Washington", flag: "🇺🇸" },
  { country: "Canada", capital: "Ottawa", flag: "🇨🇦" },
  { country: "Mexico", capital: "Mexico City", flag: "🇲🇽" },
  { country: "Brazil", capital: "Brasilia", flag: "🇧🇷" },
  { country: "Argentina", capital: "Buenos Aires", flag: "🇦🇷" },
  { country: "Chile", capital: "Santiago", flag: "🇨🇱" },
  { country: "Colombia", capital: "Bogota", flag: "🇨🇴" },
  { country: "Peru", capital: "Lima", flag: "🇵🇪" },
  { country: "Venezuela", capital: "Caracas", flag: "🇻🇪" },
  { country: "Cuba", capital: "Havana", flag: "🇨🇺" },
  { country: "China", capital: "Beijing", flag: "🇨🇳" },
  { country: "Japan", capital: "Tokyo", flag: "🇯🇵" },
  { country: "South Korea", capital: "Seoul", flag: "🇰🇷" },
  { country: "India", capital: "New Delhi", flag: "🇮🇳" },
  { country: "Thailand", capital: "Bangkok", flag: "🇹🇭" },
  { country: "Vietnam", capital: "Hanoi", flag: "🇻🇳" },
  { country: "Indonesia", capital: "Jakarta", flag: "🇮🇩" },
  { country: "Philippines", capital: "Manila", flag: "🇵🇭" },
  { country: "Singapore", capital: "Singapore", flag: "🇸🇬" },
  { country: "Malaysia", capital: "Kuala Lumpur", flag: "🇲🇾" },
  { country: "Pakistan", capital: "Islamabad", flag: "🇵🇰" },
  { country: "Iran", capital: "Tehran", flag: "🇮🇷" },
  { country: "Saudi Arabia", capital: "Riyadh", flag: "🇸🇦" },
  { country: "Israel", capital: "Jerusalem", flag: "🇮🇱" },
  { country: "Egypt", capital: "Cairo", flag: "🇪🇬" },
  { country: "Morocco", capital: "Rabat", flag: "🇲🇦" },
  { country: "South Africa", capital: "Pretoria", flag: "🇿🇦" },
  { country: "Nigeria", capital: "Abuja", flag: "🇳🇬" },
  { country: "Kenya", capital: "Nairobi", flag: "🇰🇪" },
  { country: "Australia", capital: "Canberra", flag: "🇦🇺" },
  { country: "New Zealand", capital: "Wellington", flag: "🇳🇿" },
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

  const round = useMemo(() => {
    const shuffled = shuffle(DATA).slice(0, 12);
    return shuffled.map(correct => {
      const others = shuffle(DATA.filter(c => c.capital !== correct.capital)).slice(0, 3);
      const opts = shuffle([correct, ...others]).map(c => c.capital);
      return { entry: correct, opts };
    });
  }, [seed]);

  const q = round[idx];

  function pick(name: string) {
    if (picked !== null) return;
    setPicked(name);
    if (name === q.entry.capital) setScore(s => s + 1);
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
          <div className="text-5xl mb-4">🏛️</div>
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
        <div className="text-lg font-bold text-accent">{score}</div>
      </div>
      <div className="bg-navy-800 border border-white/10 rounded-2xl p-6 mb-4">
        <div className="text-7xl text-center leading-none mb-3">{q.entry.flag}</div>
        <div className="text-center text-white/50 text-xs mb-1">Capital of</div>
        <div className="text-center text-2xl font-bold text-steel mb-5">{q.entry.country}</div>
        <div className="grid grid-cols-2 gap-2">
          {q.opts.map(opt => {
            const isCorrect = picked !== null && opt === q.entry.capital;
            const isWrong = picked === opt && opt !== q.entry.capital;
            const cls = isCorrect
              ? "bg-green-500/20 border-green-500 text-green-300"
              : isWrong
                ? "bg-red-500/20 border-red-500 text-red-300"
                : picked !== null
                  ? "bg-navy-700 border-white/5 text-white/50"
                  : "bg-navy-700 border-white/10 text-white hover:border-accent";
            return (
              <button key={opt} onClick={() => pick(opt)} disabled={picked !== null}
                className={`text-center px-3 py-3 rounded-xl border transition text-sm font-medium ${cls}`}>
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
