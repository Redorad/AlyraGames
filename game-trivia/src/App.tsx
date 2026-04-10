import { useMemo, useState } from "react";

type Q = { cat: string; q: string; opts: string[]; a: number };

const QUESTIONS: Q[] = [
  { cat: "Science", q: "What is the chemical symbol for gold?", opts: ["Go", "Au", "Ag", "Gd"], a: 1 },
  { cat: "Science", q: "How many planets are in our solar system?", opts: ["7", "8", "9", "10"], a: 1 },
  { cat: "Science", q: "What gas do plants absorb from the atmosphere?", opts: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], a: 2 },
  { cat: "Science", q: "What is the hardest natural substance on Earth?", opts: ["Gold", "Iron", "Diamond", "Quartz"], a: 2 },
  { cat: "Science", q: "How many bones are in the adult human body?", opts: ["196", "206", "216", "226"], a: 1 },
  { cat: "Geography", q: "What is the capital of Australia?", opts: ["Sydney", "Melbourne", "Canberra", "Perth"], a: 2 },
  { cat: "Geography", q: "Which is the longest river in the world?", opts: ["Amazon", "Nile", "Yangtze", "Mississippi"], a: 1 },
  { cat: "Geography", q: "Mount Everest is located in which mountain range?", opts: ["Alps", "Rockies", "Andes", "Himalayas"], a: 3 },
  { cat: "Geography", q: "Which country has the most islands?", opts: ["Indonesia", "Sweden", "Finland", "Norway"], a: 1 },
  { cat: "Geography", q: "What is the smallest country in the world?", opts: ["Monaco", "Vatican City", "San Marino", "Malta"], a: 1 },
  { cat: "History", q: "In what year did World War II end?", opts: ["1943", "1944", "1945", "1946"], a: 2 },
  { cat: "History", q: "Who was the first President of the United States?", opts: ["Jefferson", "Washington", "Adams", "Lincoln"], a: 1 },
  { cat: "History", q: "The Great Wall was built in which country?", opts: ["Japan", "China", "Korea", "Mongolia"], a: 1 },
  { cat: "History", q: "Who painted the Mona Lisa?", opts: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"], a: 2 },
  { cat: "History", q: "In which year did the Titanic sink?", opts: ["1910", "1912", "1914", "1916"], a: 1 },
  { cat: "Sports", q: "How many players are on a soccer team on the field?", opts: ["9", "10", "11", "12"], a: 2 },
  { cat: "Sports", q: "In which sport is the term 'home run' used?", opts: ["Cricket", "Baseball", "Tennis", "Golf"], a: 1 },
  { cat: "Sports", q: "How often are the Summer Olympics held?", opts: ["2 years", "3 years", "4 years", "5 years"], a: 2 },
  { cat: "Sports", q: "What color is the bullseye on an archery target?", opts: ["Red", "Gold", "Blue", "Black"], a: 1 },
  { cat: "Sports", q: "Which country hosted the 2016 Summer Olympics?", opts: ["China", "UK", "Brazil", "Russia"], a: 2 },
  { cat: "Movies", q: "Who directed the movie 'Jaws'?", opts: ["Lucas", "Spielberg", "Scorsese", "Coppola"], a: 1 },
  { cat: "Movies", q: "What is the highest-grossing film of all time?", opts: ["Avatar", "Titanic", "Avengers Endgame", "Star Wars"], a: 0 },
  { cat: "Movies", q: "Who played Jack Dawson in Titanic?", opts: ["Brad Pitt", "Tom Cruise", "DiCaprio", "Damon"], a: 2 },
  { cat: "Movies", q: "Which movie features the quote 'I'll be back'?", opts: ["Rocky", "Terminator", "Rambo", "Predator"], a: 1 },
  { cat: "Movies", q: "What year was the first Star Wars released?", opts: ["1975", "1977", "1979", "1981"], a: 1 },
  { cat: "Music", q: "Who is known as the King of Pop?", opts: ["Elvis", "MJ", "Prince", "Bowie"], a: 1 },
  { cat: "Music", q: "How many strings does a standard guitar have?", opts: ["4", "5", "6", "7"], a: 2 },
  { cat: "Music", q: "Which Beatle was known as 'The Quiet One'?", opts: ["John", "Paul", "George", "Ringo"], a: 2 },
  { cat: "Music", q: "What instrument has 88 keys?", opts: ["Organ", "Piano", "Harp", "Xylophone"], a: 1 },
  { cat: "Music", q: "Who composed 'The Four Seasons'?", opts: ["Bach", "Mozart", "Vivaldi", "Beethoven"], a: 2 },
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
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [seed, setSeed] = useState(0);

  const questions = useMemo(() => shuffle(QUESTIONS).slice(0, 15), [seed]);
  const q = questions[idx];

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.a) setScore(s => s + 1);
  }

  function next() {
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
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
    const pct = Math.round((score / questions.length) * 100);
    const msg = pct >= 80 ? "Excellent!" : pct >= 60 ? "Good job!" : pct >= 40 ? "Not bad" : "Keep trying!";
    return (
      <div className="w-full max-w-md p-6">
        <div className="bg-navy-800 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🧠</div>
          <h1 className="text-2xl font-bold text-steel mb-2">Quiz Complete!</h1>
          <p className="text-white/70 mb-4">{msg}</p>
          <div className="text-5xl font-black text-accent mb-6">{score}/{questions.length}</div>
          <div className="text-white/60 mb-6">{pct}% correct</div>
          <button onClick={restart} className="w-full bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 rounded-xl transition">Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-4">
      <div className="flex items-center justify-between mb-4 px-2 mt-14">
        <div className="text-xs uppercase tracking-wider text-steel">{q.cat}</div>
        <div className="text-sm text-white/70">Question {idx + 1}/{questions.length}</div>
      </div>
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-xs text-white/50">Score</div>
        <div className="text-lg font-bold text-accent">{score}</div>
      </div>
      <div className="bg-navy-800 border border-white/10 rounded-2xl p-6 mb-4">
        <div className="h-1 bg-navy-700 rounded-full mb-5 overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
        <h2 className="text-lg font-semibold text-white mb-5 min-h-[3rem]">{q.q}</h2>
        <div className="space-y-2">
          {q.opts.map((opt, i) => {
            const isCorrect = picked !== null && i === q.a;
            const isWrong = picked === i && i !== q.a;
            const cls = isCorrect
              ? "bg-green-500/20 border-green-500 text-green-300"
              : isWrong
                ? "bg-red-500/20 border-red-500 text-red-300"
                : picked !== null
                  ? "bg-navy-700 border-white/5 text-white/50"
                  : "bg-navy-700 border-white/10 text-white hover:border-accent hover:bg-navy-700/70";
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={picked !== null}
                className={`w-full text-left px-4 py-3 rounded-xl border transition ${cls}`}
              >
                <span className="inline-block w-6 text-xs font-mono opacity-60">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
      {picked !== null && (
        <button onClick={next} className="w-full bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 rounded-xl transition">
          {idx + 1 >= questions.length ? "See Results" : "Next Question"}
        </button>
      )}
    </div>
  );
}
