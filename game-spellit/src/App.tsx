import { useEffect, useState, useMemo } from "react";

const WORDS: Record<number, string[]> = {
  4: ["TREE", "BOOK", "FISH", "STAR", "MOON", "GOLD", "FIRE", "WIND", "LOVE", "TIME", "CAKE", "BIRD", "HOME", "SONG", "SNOW", "RAIN", "BEAR", "WOLF", "KING", "DUCK"],
  5: ["APPLE", "HOUSE", "MUSIC", "CLOUD", "RIVER", "OCEAN", "LIGHT", "PIANO", "BREAD", "HEART", "DREAM", "PEACE", "BEACH", "PLANT", "SWORD", "TIGER", "HONEY", "FLAME", "CHESS", "NIGHT"],
  6: ["GARDEN", "FLOWER", "CASTLE", "SPIDER", "FOREST", "PLANET", "DRAGON", "ROCKET", "GOLDEN", "SIMPLE", "SILVER", "WIZARD", "PURPLE", "BRIDGE", "WINTER", "ORANGE", "DANCER", "SUMMER", "PUZZLE", "BUTTON"],
  7: ["RAINBOW", "LIBRARY", "PICTURE", "FANTASY", "MYSTERY", "STATION", "HOLIDAY", "SCIENCE", "AMAZING", "NATURAL", "WHISPER", "BALCONY", "DIAMOND", "KITCHEN", "JOURNEY", "FACTORY", "COTTAGE", "TEACHER", "HARMONY", "CRYSTAL"],
  8: ["COMPUTER", "BIRTHDAY", "ELEPHANT", "MOUNTAIN", "SANDWICH", "TREASURE", "STARLIGHT", "DINOSAUR", "FOOTBALL", "KEYBOARD", "TRIANGLE", "PAINTING", "BUTTERFLY", "SNOWBALL", "SUNSHINE", "UNIVERSE", "HOSPITAL", "VOLCANO", "EVEREST"],
};

const HS_KEY = "spellit_high_score";
const ROUNDS = 10;

function scramble(word: string): string[] {
  const letters = word.split("");
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  if (letters.join("") === word && word.length > 1) {
    [letters[0], letters[1]] = [letters[1], letters[0]];
  }
  return letters;
}

function getWordForRound(round: number): string {
  let len: number;
  if (round < 3) len = 4;
  else if (round < 5) len = 5;
  else if (round < 7) len = 6;
  else if (round < 9) len = 7;
  else len = 8;
  const pool = WORDS[len];
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function App() {
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState("");
  const [available, setAvailable] = useState<{ letter: string; used: boolean; id: number }[]>([]);
  const [typed, setTyped] = useState<{ letter: string; id: number }[]>([]);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState<"right" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [high, setHigh] = useState(() => Number(localStorage.getItem(HS_KEY) || 0));

  const startRound = (r: number) => {
    const word = getWordForRound(r);
    setTarget(word);
    const scrambled = scramble(word);
    setAvailable(scrambled.map((l, i) => ({ letter: l, used: false, id: i })));
    setTyped([]);
    setShowHint(false);
  };

  const startGame = () => {
    setScore(0);
    setRound(0);
    setPlaying(true);
    startRound(0);
  };

  const addLetter = (id: number) => {
    setAvailable((av) =>
      av.map((a) => (a.id === id ? { ...a, used: true } : a))
    );
    const letter = available.find((a) => a.id === id)?.letter;
    if (letter) setTyped((t) => [...t, { letter, id }]);
  };

  const removeLetter = (id: number) => {
    setTyped((t) => t.filter((x) => x.id !== id));
    setAvailable((av) => av.map((a) => (a.id === id ? { ...a, used: false } : a)));
  };

  const clearTyped = () => {
    setAvailable((av) => av.map((a) => ({ ...a, used: false })));
    setTyped([]);
  };

  const submit = () => {
    const word = typed.map((t) => t.letter).join("");
    if (word.length !== target.length) return;
    if (word === target) {
      const bonus = showHint ? 5 : 10 * target.length;
      setScore((s) => s + bonus);
      setFeedback("right");
      setTimeout(() => {
        setFeedback(null);
        if (round + 1 >= ROUNDS) {
          setPlaying(false);
          setRound(round + 1);
        } else {
          setRound(round + 1);
          startRound(round + 1);
        }
      }, 700);
    } else {
      setFeedback("wrong");
      setTimeout(() => {
        setFeedback(null);
        clearTyped();
      }, 500);
    }
  };

  useEffect(() => {
    if (!playing && round >= ROUNDS && score > high) {
      setHigh(score);
      localStorage.setItem(HS_KEY, String(score));
    }
  }, [playing, round, score, high]);

  const canSubmit = useMemo(() => typed.length === target.length, [typed, target]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-5 bg-navy-900">
      <div className="text-center mb-3">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          <span className="text-steel">SPELL</span>
          <span className="text-accent"> IT</span>
        </h1>
        <p className="text-xs text-slate-500">Unscramble the letters to form a word.</p>
      </div>

      <div className="flex gap-3 mb-4 text-sm">
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Round</div>
          <div className="text-lg font-bold text-steel">
            {playing ? round + 1 : Math.min(round, ROUNDS)}/{ROUNDS}
          </div>
        </div>
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Score</div>
          <div className="text-lg font-bold text-accent">{score}</div>
        </div>
        <div className="bg-navy-800 rounded-lg px-3 py-1.5 border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase">Best</div>
          <div className="text-lg font-bold text-white">{high}</div>
        </div>
      </div>

      {!playing ? (
        <div className="bg-navy-800 rounded-2xl p-6 border border-white/5 text-center shadow-xl">
          {round >= ROUNDS && (
            <>
              <div className="text-xl font-bold text-accent mb-1">Finished!</div>
              <div className="text-slate-400 mb-3">Final score: {score}</div>
            </>
          )}
          <button
            onClick={startGame}
            className="px-6 py-3 rounded-lg bg-accent text-navy-900 font-bold text-sm uppercase tracking-wider hover:brightness-110"
          >
            {round >= ROUNDS ? "Play Again" : "Start Game"}
          </button>
        </div>
      ) : (
        <div
          className="bg-navy-800 rounded-2xl p-5 border border-white/5 shadow-xl"
          style={{
            width: "min(95vw, 520px)",
            boxShadow:
              feedback === "right"
                ? "0 0 30px rgba(74,222,128,0.4)"
                : feedback === "wrong"
                ? "0 0 30px rgba(248,113,113,0.4)"
                : undefined,
            transition: "box-shadow 200ms",
          }}
        >
          <div className="flex justify-center gap-1.5 mb-4 min-h-[50px] flex-wrap">
            {typed.map((t) => (
              <button
                key={t.id}
                onClick={() => removeLetter(t.id)}
                className="w-10 h-12 sm:w-11 sm:h-13 bg-accent text-navy-900 rounded-lg flex items-center justify-center text-xl font-black hover:brightness-110"
              >
                {t.letter}
              </button>
            ))}
            {Array.from({ length: target.length - typed.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-10 h-12 sm:w-11 sm:h-13 bg-navy-900 border-2 border-dashed border-white/10 rounded-lg"
              />
            ))}
          </div>

          <div className="flex justify-center gap-1.5 mb-4 flex-wrap">
            {available.map((a) => (
              <button
                key={a.id}
                disabled={a.used}
                onClick={() => addLetter(a.id)}
                className="w-10 h-12 sm:w-11 sm:h-13 rounded-lg flex items-center justify-center text-xl font-black transition"
                style={{
                  background: a.used ? "#0a0e27" : "#1a2050",
                  color: a.used ? "#334155" : "#e2e8f0",
                  border: a.used ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(126,200,227,0.2)",
                }}
              >
                {a.letter}
              </button>
            ))}
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={clearTyped}
              className="px-4 py-2 rounded-lg bg-navy-700 text-slate-300 text-xs uppercase font-bold hover:bg-navy-900 border border-white/5"
            >
              Clear
            </button>
            <button
              onClick={() => setShowHint(true)}
              className="px-4 py-2 rounded-lg bg-navy-700 text-slate-300 text-xs uppercase font-bold hover:bg-navy-900 border border-white/5"
            >
              Hint
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="px-5 py-2 rounded-lg bg-accent text-navy-900 text-xs uppercase font-bold disabled:opacity-40 hover:brightness-110"
            >
              Submit
            </button>
          </div>

          {showHint && (
            <div className="mt-3 text-center text-xs text-slate-400">
              Starts with: <span className="text-steel font-bold">{target[0]}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
