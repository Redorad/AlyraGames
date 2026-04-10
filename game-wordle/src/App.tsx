import { useEffect } from "react";
import { useGame, LetterState } from "./store";

const KEYS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
];

const stateColor = (s: LetterState) => {
  switch (s) {
    case "correct":
      return "bg-emerald-500 border-emerald-500 text-white";
    case "present":
      return "bg-yellow-500 border-yellow-500 text-white";
    case "absent":
      return "bg-navy-700 border-navy-700 text-slate-400";
    default:
      return "bg-transparent border-slate-600 text-white";
  }
};

const keyColor = (s: LetterState | undefined) => {
  switch (s) {
    case "correct":
      return "bg-emerald-500 text-white";
    case "present":
      return "bg-yellow-500 text-white";
    case "absent":
      return "bg-navy-900 text-slate-500";
    default:
      return "bg-navy-700 text-white";
  }
};

export default function App() {
  const {
    rows,
    current,
    rowIndex,
    status,
    message,
    keyStates,
    shakeRow,
    stats,
    typeLetter,
    deleteLetter,
    submit,
    newGame,
  } = useGame();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") submit();
      else if (e.key === "Backspace") deleteLetter();
      else if (/^[a-zA-Z]$/.test(e.key)) typeLetter(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submit, deleteLetter, typeLetter]);

  const rowsView = rows.map((row, r) => {
    const isCurrent = r === rowIndex && status === "playing";
    const cells = row.map((cell, c) => {
      const letter = isCurrent ? current[c] ?? "" : cell.letter;
      const state = isCurrent ? (letter ? ("empty" as LetterState) : ("empty" as LetterState)) : cell.state;
      const isFilled = !!letter;
      return (
        <div
          key={c}
          className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl font-black uppercase border-2 rounded-md ${stateColor(
            state
          )} ${isFilled && state === "empty" ? "border-slate-400 pop" : ""} ${
            !isCurrent && state !== "empty" ? "flip" : ""
          }`}
        >
          {letter}
        </div>
      );
    });
    return (
      <div key={r} className={`flex gap-1.5 justify-center ${isCurrent && shakeRow ? "shake" : ""}`}>
        {cells}
      </div>
    );
  });

  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-4 px-2 relative">
      <div className="w-full max-w-md flex items-center justify-between px-4 mt-2">
        <div className="text-steel text-xs">
          <div className="opacity-60">PLAYED</div>
          <div className="font-bold">{stats.played}</div>
        </div>
        <h1 className="text-2xl font-black tracking-wider">
          <span className="text-steel">WORD</span>
          <span className="text-accent">GUESS</span>
        </h1>
        <div className="text-steel text-xs text-right">
          <div className="opacity-60">STREAK</div>
          <div className="font-bold">{stats.currentStreak}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">{rowsView}</div>

      <div className="w-full max-w-lg flex flex-col items-center gap-2 mt-4">
        {message && (
          <div className="text-sm bg-navy-800 px-3 py-1.5 rounded-md border border-navy-700 text-steel">
            {message}
          </div>
        )}

        {status !== "playing" ? (
          <button
            onClick={newGame}
            className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:opacity-90 transition mb-2"
          >
            Play Again
          </button>
        ) : null}

        <div className="w-full flex flex-col gap-1 px-1">
          {KEYS.map((row, ri) => (
            <div key={ri} className="flex gap-1 justify-center">
              {row.map((k) => {
                const isSpecial = k === "ENTER" || k === "BACK";
                const handler = () => {
                  if (k === "ENTER") submit();
                  else if (k === "BACK") deleteLetter();
                  else typeLetter(k);
                };
                return (
                  <button
                    key={k}
                    onClick={handler}
                    className={`${isSpecial ? "px-2 text-[10px]" : "w-8 sm:w-9"} h-12 rounded font-bold text-sm ${keyColor(
                      keyStates[k]
                    )} active:scale-95 transition`}
                  >
                    {k === "BACK" ? "⌫" : k}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="text-[10px] text-slate-500 mt-1">
          Win rate: {winRate}% &middot; Best streak: {stats.bestStreak}
        </div>
      </div>
    </div>
  );
}
