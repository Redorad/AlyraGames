import { useState, useEffect } from "react";

const WORDS: Record<string, string[]> = {
  animals: [
    "ELEPHANT","GIRAFFE","KANGAROO","PENGUIN","DOLPHIN","CHEETAH","BUTTERFLY","HEDGEHOG",
    "OCTOPUS","FLAMINGO","ALLIGATOR","CHIMPANZEE","CROCODILE","RHINOCEROS","SQUIRREL","TIGER",
    "ZEBRA","GORILLA","HAMSTER","LEOPARD","PANDA","RACCOON","TURTLE","WOLF",
  ],
  countries: [
    "FRANCE","GERMANY","JAPAN","BRAZIL","CANADA","AUSTRALIA","MEXICO","INDIA",
    "ITALY","SPAIN","PORTUGAL","ARGENTINA","EGYPT","NORWAY","SWEDEN","THAILAND",
    "VIETNAM","NIGERIA","KENYA","POLAND","GREECE","TURKEY","ICELAND","MOROCCO",
  ],
  food: [
    "PIZZA","SUSHI","BURGER","PASTA","TACO","CROISSANT","RAMEN","SANDWICH",
    "PANCAKE","WAFFLE","LASAGNA","BURRITO","DUMPLING","OMELETTE","RISOTTO","CURRY",
    "PAELLA","KEBAB","NACHOS","PRETZEL","BAGEL","MUFFIN","DONUT","BROWNIE",
  ],
};

const MAX_WRONG = 6;
const STORAGE_KEY = "hangman-stats";

interface Stats {
  played: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
}

const loadStats = (): Stats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { played: 0, wins: 0, currentStreak: 0, bestStreak: 0 };
};

const saveStats = (s: Stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

type Category = "animals" | "countries" | "food";

const pickWord = (cat: Category) => {
  const list = WORDS[cat];
  return list[Math.floor(Math.random() * list.length)];
};

export default function App() {
  const [category, setCategory] = useState<Category>("animals");
  const [word, setWord] = useState(() => pickWord("animals"));
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [stats, setStats] = useState<Stats>(loadStats);

  const isLetter = (w: string) => /^[A-Z]$/.test(w);
  const masked = word
    .split("")
    .map((c) => (guessed.has(c) || !isLetter(c) ? c : "_"))
    .join(" ");

  const guess = (letter: string) => {
    if (status !== "playing") return;
    if (guessed.has(letter)) return;
    const next = new Set(guessed);
    next.add(letter);
    setGuessed(next);
    if (!word.includes(letter)) {
      const nw = wrong + 1;
      setWrong(nw);
      if (nw >= MAX_WRONG) {
        setStatus("lost");
        const ns: Stats = {
          played: stats.played + 1,
          wins: stats.wins,
          currentStreak: 0,
          bestStreak: stats.bestStreak,
        };
        setStats(ns);
        saveStats(ns);
      }
    } else {
      const allRevealed = word.split("").every((c) => !isLetter(c) || next.has(c));
      if (allRevealed) {
        setStatus("won");
        const nsStreak = stats.currentStreak + 1;
        const ns: Stats = {
          played: stats.played + 1,
          wins: stats.wins + 1,
          currentStreak: nsStreak,
          bestStreak: Math.max(stats.bestStreak, nsStreak),
        };
        setStats(ns);
        saveStats(ns);
      }
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^[a-zA-Z]$/.test(e.key)) guess(e.key.toUpperCase());
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line
  }, [guessed, status, wrong]);

  const reset = (cat: Category = category) => {
    setCategory(cat);
    setWord(pickWord(cat));
    setGuessed(new Set());
    setWrong(0);
    setStatus("playing");
  };

  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Hangman figure parts revealed progressively
  const parts = [
    <circle key="h" cx="120" cy="60" r="16" stroke="#a78bfa" strokeWidth="3" fill="none" />,
    <line key="b" x1="120" y1="76" x2="120" y2="130" stroke="#a78bfa" strokeWidth="3" />,
    <line key="la" x1="120" y1="90" x2="95" y2="115" stroke="#a78bfa" strokeWidth="3" />,
    <line key="ra" x1="120" y1="90" x2="145" y2="115" stroke="#a78bfa" strokeWidth="3" />,
    <line key="ll" x1="120" y1="130" x2="100" y2="160" stroke="#a78bfa" strokeWidth="3" />,
    <line key="rl" x1="120" y1="130" x2="140" y2="160" stroke="#a78bfa" strokeWidth="3" />,
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-4 px-4">
      <div className="w-full max-w-sm flex items-center justify-between mt-2">
        <div className="text-xs">
          <div className="text-steel/60">STREAK</div>
          <div className="font-bold text-steel">{stats.currentStreak}</div>
        </div>
        <h1 className="text-xl font-black">
          <span className="text-steel">HANG</span>
          <span className="text-accent">MAN</span>
        </h1>
        <div className="text-xs text-right">
          <div className="text-steel/60">BEST</div>
          <div className="font-bold text-steel">{stats.bestStreak}</div>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        {(Object.keys(WORDS) as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => reset(cat)}
            className={`px-3 py-1 text-xs font-bold rounded-md capitalize ${
              category === cat ? "bg-accent text-white" : "bg-navy-800 text-slate-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <svg width="240" height="200" className="my-2">
        <line x1="20" y1="190" x2="100" y2="190" stroke="#7ec8e3" strokeWidth="3" />
        <line x1="60" y1="190" x2="60" y2="20" stroke="#7ec8e3" strokeWidth="3" />
        <line x1="60" y1="20" x2="120" y2="20" stroke="#7ec8e3" strokeWidth="3" />
        <line x1="120" y1="20" x2="120" y2="44" stroke="#7ec8e3" strokeWidth="3" />
        {parts.slice(0, wrong)}
      </svg>

      <div className="text-2xl sm:text-3xl font-black tracking-widest text-steel my-2">
        {masked}
      </div>

      {status !== "playing" && (
        <div className={`text-lg font-black ${status === "won" ? "text-emerald-400" : "text-red-400"}`}>
          {status === "won" ? "You saved him!" : `The word was: ${word}`}
        </div>
      )}

      <div className="w-full max-w-md grid grid-cols-9 gap-1 mt-2">
        {alpha.map((l) => {
          const used = guessed.has(l);
          const inWord = word.includes(l);
          const cls = !used
            ? "bg-navy-700 text-white hover:bg-navy-800"
            : inWord
            ? "bg-emerald-600/70 text-white"
            : "bg-red-900/50 text-red-300";
          return (
            <button
              key={l}
              disabled={used || status !== "playing"}
              onClick={() => guess(l)}
              className={`h-8 text-xs font-bold rounded ${cls}`}
            >
              {l}
            </button>
          );
        })}
      </div>

      {status !== "playing" && (
        <button
          onClick={() => reset()}
          className="mt-3 px-6 py-2 bg-accent text-white font-bold rounded-lg"
        >
          Play Again
        </button>
      )}
      <div className="text-[10px] text-slate-500 mt-1">
        Wrong: {wrong}/{MAX_WRONG} &middot; Won {stats.wins}/{stats.played}
      </div>
    </div>
  );
}
