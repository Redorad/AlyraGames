import { useEffect, useState } from "react";

type Theme = "food" | "countries" | "animals";

const THEMES: Record<Theme, string[]> = {
  food: ["🍎", "🍌", "🍇", "🍓", "🍕", "🍔", "🍩", "🍰", "🍉", "🥑", "🌮", "🍜"],
  countries: ["🇫🇷", "🇯🇵", "🇺🇸", "🇬🇧", "🇩🇪", "🇮🇹", "🇪🇸", "🇧🇷", "🇨🇦", "🇰🇷", "🇮🇳", "🇲🇽"],
  animals: ["🐶", "🐱", "🦁", "🐼", "🐨", "🐷", "🐸", "🦊", "🐵", "🐢", "🦉", "🐙"],
};

const PAIRS = 8;

const HS_KEY_PREFIX = "matchpairs_best_";

interface Card {
  id: number;
  value: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(theme: Theme): Card[] {
  const items = shuffle(THEMES[theme]).slice(0, PAIRS);
  const doubled = shuffle([...items, ...items]);
  return doubled.map((v, i) => ({ id: i, value: v, flipped: false, matched: false }));
}

export default function App() {
  const [theme, setTheme] = useState<Theme>("food");
  const [cards, setCards] = useState<Card[]>(() => buildDeck("food"));
  const [sel, setSel] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [best, setBest] = useState<{ time: number; moves: number } | null>(() => {
    const s = localStorage.getItem(HS_KEY_PREFIX + "food");
    return s ? JSON.parse(s) : null;
  });

  const newGame = (t: Theme = theme) => {
    setTheme(t);
    setCards(buildDeck(t));
    setSel([]);
    setMoves(0);
    setTime(0);
    setRunning(true);
    setWon(false);
    const stored = localStorage.getItem(HS_KEY_PREFIX + t);
    setBest(stored ? JSON.parse(stored) : null);
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (sel.length !== 2) return;
    const [a, b] = sel;
    const ca = cards[a];
    const cb = cards[b];
    if (ca.value === cb.value) {
      setTimeout(() => {
        setCards((cs) => cs.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
        setSel([]);
      }, 400);
    } else {
      setTimeout(() => {
        setCards((cs) => cs.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
        setSel([]);
      }, 900);
    }
    setMoves((m) => m + 1);
  }, [sel, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      setRunning(false);
      setWon(true);
      const stored = localStorage.getItem(HS_KEY_PREFIX + theme);
      const prev = stored ? (JSON.parse(stored) as { time: number; moves: number }) : null;
      if (!prev || time < prev.time || (time === prev.time && moves < prev.moves)) {
        const next = { time, moves };
        localStorage.setItem(HS_KEY_PREFIX + theme, JSON.stringify(next));
        setBest(next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const flip = (i: number) => {
    if (!running) return;
    if (sel.length === 2) return;
    const c = cards[i];
    if (c.flipped || c.matched) return;
    setCards((cs) => cs.map((card, idx) => (idx === i ? { ...card, flipped: true } : card)));
    setSel((s) => [...s, i]);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center p-4 bg-navy-900">
      <div className="text-center mb-3">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          <span className="text-steel">MATCH</span>
          <span className="text-accent"> PAIRS PLUS</span>
        </h1>
        <p className="text-xs text-slate-500">Match all 8 pairs as fast as you can.</p>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap justify-center">
        {(["food", "countries", "animals"] as Theme[]).map((t) => (
          <button
            key={t}
            onClick={() => newGame(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
              theme === t
                ? "bg-accent text-navy-900"
                : "bg-navy-800 text-slate-300 border border-white/5 hover:bg-navy-700"
            }`}
          >
            {t === "food" ? "🍕 Food" : t === "countries" ? "🌍 Countries" : "🐶 Animals"}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-3 text-sm">
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Time</div>
          <div className="text-lg font-bold text-steel">{fmt(time)}</div>
        </div>
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Moves</div>
          <div className="text-lg font-bold text-accent">{moves}</div>
        </div>
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Best</div>
          <div className="text-lg font-bold text-white">{best ? `${fmt(best.time)} / ${best.moves}` : "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3" style={{ width: "min(95vw, 440px)" }}>
        {cards.map((c, i) => (
          <button
            key={c.id}
            onClick={() => flip(i)}
            className="aspect-square rounded-xl text-3xl sm:text-4xl flex items-center justify-center transition-all duration-200"
            style={{
              background: c.flipped || c.matched ? (c.matched ? "#1a2050" : "#111640") : "#1a2050",
              border: c.matched ? "2px solid #a78bfa" : "2px solid rgba(255,255,255,0.05)",
              opacity: c.matched ? 0.7 : 1,
              transform: c.flipped ? "rotateY(0deg)" : undefined,
              boxShadow: c.matched ? "0 0 15px rgba(167,139,250,0.3)" : undefined,
            }}
          >
            {c.flipped || c.matched ? c.value : ""}
          </button>
        ))}
      </div>

      {won && (
        <div className="mt-4 text-center">
          <div className="text-xl font-bold text-accent mb-2">You won!</div>
          <button
            onClick={() => newGame()}
            className="px-5 py-2 rounded-lg bg-accent text-navy-900 font-bold text-xs uppercase hover:brightness-110"
          >
            Play Again
          </button>
        </div>
      )}

      {!won && (
        <button
          onClick={() => newGame()}
          className="mt-4 px-4 py-1.5 rounded-lg bg-navy-800 text-slate-300 text-xs uppercase font-bold border border-white/5"
        >
          Reset
        </button>
      )}
    </div>
  );
}
