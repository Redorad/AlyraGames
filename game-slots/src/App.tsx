import { useEffect, useRef, useState } from "react";

const SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"];
const PAYOUTS: Record<string, number> = {
  "🍒": 3,
  "🍋": 5,
  "🔔": 10,
  "⭐": 20,
  "💎": 50,
  "7️⃣": 100,
};
const ANY_FRUIT_PAYOUT = 2; // two cherries etc

function randomSymbol(): string {
  const weights = [30, 25, 18, 12, 8, 7];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= weights[i];
    if (r <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[0];
}

function loadBalance(): number {
  try {
    const v = localStorage.getItem("slots_balance");
    return v !== null ? parseInt(v, 10) : 100;
  } catch {
    return 100;
  }
}
function saveBalance(n: number) {
  try {
    localStorage.setItem("slots_balance", String(n));
  } catch {}
}

export default function App() {
  const [reels, setReels] = useState<string[]>(["🍒", "🍋", "🔔"]);
  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(loadBalance());
  const [bet, setBet] = useState(5);
  const [message, setMessage] = useState("Press SPIN to play!");
  const [lastWin, setLastWin] = useState(0);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    saveBalance(balance);
  }, [balance]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const spin = () => {
    if (spinning) return;
    if (balance < bet) {
      setMessage("Not enough balance!");
      return;
    }
    setBalance((b) => b - bet);
    setLastWin(0);
    setMessage("Spinning...");
    setSpinning(true);

    const final = [randomSymbol(), randomSymbol(), randomSymbol()];
    const spinInterval = 60;
    let tick = 0;
    const spinTick = () => {
      setReels(() => [randomSymbol(), randomSymbol(), randomSymbol()]);
      tick++;
      if (tick < 20) {
        timeoutsRef.current.push(window.setTimeout(spinTick, spinInterval));
      } else {
        // Reveal one by one
        setReels([randomSymbol(), randomSymbol(), randomSymbol()]);
        timeoutsRef.current.push(
          window.setTimeout(() => {
            setReels([final[0], randomSymbol(), randomSymbol()]);
            timeoutsRef.current.push(
              window.setTimeout(() => {
                setReels([final[0], final[1], randomSymbol()]);
                timeoutsRef.current.push(
                  window.setTimeout(() => {
                    setReels(final);
                    evaluate(final);
                    setSpinning(false);
                  }, 300)
                );
              }, 300)
            );
          }, 300)
        );
      }
    };
    spinTick();
  };

  const evaluate = (final: string[]) => {
    const [a, b, c] = final;
    let win = 0;
    let msg = "";
    if (a === b && b === c) {
      win = PAYOUTS[a] * bet;
      msg = `${a} ${a} ${a} — Jackpot! +${win}`;
    } else if (a === "🍒" && b === "🍒") {
      win = ANY_FRUIT_PAYOUT * bet;
      msg = `Cherry pair! +${win}`;
    } else if (a === b || b === c) {
      win = Math.floor(bet * 0.5);
      msg = `Small pair +${win}`;
    } else {
      msg = "No win — try again!";
    }
    if (win > 0) {
      setBalance((bal) => bal + win);
      setLastWin(win);
    }
    setMessage(msg);
  };

  const resetBalance = () => {
    setBalance(100);
    setMessage("Balance reset to 100");
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-4 px-4 gap-4">
      <h1 className="text-3xl font-black tracking-wider">
        <span className="text-steel">LUCKY</span>
        <span className="text-accent">SLOTS</span>
      </h1>

      <div className="bg-gradient-to-b from-yellow-600 to-yellow-800 p-4 rounded-2xl shadow-2xl border-4 border-yellow-900">
        <div className="flex gap-2 bg-navy-900 p-3 rounded-xl border-4 border-yellow-900">
          {reels.map((sym, i) => (
            <div
              key={i}
              className={`w-20 h-24 bg-gradient-to-b from-white to-slate-300 rounded-lg flex items-center justify-center text-5xl shadow-inner ${
                spinning ? "animate-pulse" : ""
              }`}
            >
              {sym}
            </div>
          ))}
        </div>
        <div className="mt-3 text-center text-xs text-yellow-100 font-bold">
          ⭐ PLACE YOUR BET ⭐
        </div>
      </div>

      <div
        className={`text-center font-bold min-h-[1.5rem] ${
          lastWin > 0 ? "text-yellow-400 text-lg" : "text-steel"
        }`}
      >
        {message}
      </div>

      <div className="flex items-center gap-4 bg-navy-800 border border-navy-700 rounded-xl p-3">
        <div>
          <div className="text-[10px] text-slate-500">BALANCE</div>
          <div className="text-steel text-xl font-bold">${balance}</div>
        </div>
        <div className="w-px h-10 bg-navy-700" />
        <div>
          <div className="text-[10px] text-slate-500">BET</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBet((b) => Math.max(1, b - 1))}
              disabled={spinning}
              className="w-6 h-6 rounded bg-navy-700 text-steel font-bold disabled:opacity-50"
            >
              −
            </button>
            <div className="text-accent font-bold w-8 text-center">{bet}</div>
            <button
              onClick={() => setBet((b) => Math.min(balance, b + 1))}
              disabled={spinning}
              className="w-6 h-6 rounded bg-navy-700 text-steel font-bold disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning || balance < bet}
        className="px-12 py-4 bg-gradient-to-b from-accent to-purple-700 text-white font-black text-xl rounded-2xl shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-40 transition"
      >
        {spinning ? "SPINNING..." : "SPIN"}
      </button>

      <div className="text-[10px] text-slate-500 text-center max-w-xs">
        3 of a kind pays: 🍒×3 · 🍋×5 · 🔔×10 · ⭐×20 · 💎×50 · 7️⃣×100
      </div>

      {balance < 5 && (
        <button
          onClick={resetBalance}
          className="text-xs text-steel underline"
        >
          Reset balance
        </button>
      )}
    </div>
  );
}
