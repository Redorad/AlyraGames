import { useGame, rankLabel, Card } from "./store";

function CardView({ card, hidden }: { card: Card | null; hidden?: boolean }) {
  if (!card || hidden) {
    return (
      <div className="w-40 h-56 rounded-2xl border-2 border-steel/40 bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center shadow-xl">
        <div className="text-6xl opacity-30">?</div>
      </div>
    );
  }
  const isRed = card.suit === "♥" || card.suit === "♦";
  return (
    <div className="w-40 h-56 rounded-2xl border-2 border-steel/40 bg-gradient-to-br from-white to-slate-200 flex flex-col items-center justify-center shadow-xl flipIn relative">
      <div
        className={`absolute top-2 left-3 text-2xl font-black ${
          isRed ? "text-red-600" : "text-navy-900"
        }`}
      >
        {rankLabel(card.rank)}
      </div>
      <div
        className={`absolute top-10 left-3 text-xl ${
          isRed ? "text-red-600" : "text-navy-900"
        }`}
      >
        {card.suit}
      </div>
      <div
        className={`text-7xl ${
          isRed ? "text-red-600" : "text-navy-900"
        }`}
      >
        {card.suit}
      </div>
      <div
        className={`absolute bottom-2 right-3 text-2xl font-black rotate-180 ${
          isRed ? "text-red-600" : "text-navy-900"
        }`}
      >
        {rankLabel(card.rank)}
      </div>
    </div>
  );
}

export default function App() {
  const { current, next, streak, best, score, message, status, guess, reset, flipping } =
    useGame();

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-4 px-4">
      <div className="w-full max-w-md flex items-center justify-between mt-4">
        <div className="text-xs">
          <div className="text-slate-500">SCORE</div>
          <div className="font-bold text-steel text-lg">{score}</div>
        </div>
        <h1 className="text-2xl font-black tracking-wider">
          <span className="text-steel">HIGH</span>
          <span className="text-accent">LOW</span>
        </h1>
        <div className="text-xs text-right">
          <div className="text-slate-500">BEST STREAK</div>
          <div className="font-bold text-accent text-lg">{best}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <CardView card={current} />
        <div className="text-4xl text-steel/50">vs</div>
        <CardView card={next} hidden={!next} />
      </div>

      <div className="flex flex-col items-center gap-3 w-full max-w-md">
        <div className="text-sm text-steel bg-navy-800 border border-navy-700 px-4 py-2 rounded-lg fadeIn min-h-[2.5rem] flex items-center">
          {message}
        </div>
        <div className="text-xs text-slate-500">Current streak: {streak}</div>
        {status === "playing" ? (
          <div className="flex gap-3 w-full">
            <button
              onClick={() => guess("low")}
              disabled={flipping}
              className="flex-1 py-3 bg-navy-800 border-2 border-steel/50 rounded-xl font-bold text-steel hover:bg-navy-700 active:scale-95 disabled:opacity-50 transition"
            >
              ↓ LOWER
            </button>
            <button
              onClick={() => guess("same")}
              disabled={flipping}
              className="px-4 py-3 bg-navy-800 border-2 border-yellow-400/50 rounded-xl font-bold text-yellow-400 hover:bg-navy-700 active:scale-95 disabled:opacity-50 transition text-xs"
            >
              = SAME
              <div className="text-[9px] opacity-70">x10</div>
            </button>
            <button
              onClick={() => guess("high")}
              disabled={flipping}
              className="flex-1 py-3 bg-navy-800 border-2 border-accent/50 rounded-xl font-bold text-accent hover:bg-navy-700 active:scale-95 disabled:opacity-50 transition"
            >
              ↑ HIGHER
            </button>
          </div>
        ) : (
          <button
            onClick={reset}
            className="px-8 py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
