import { useEffect, useRef, useState } from "react";

type Phase = "menu" | "wait" | "go" | "done" | "falseStart";

const P1_KEY = "a";
const P2_KEY = "l";

export default function App() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [winner, setWinner] = useState<string>("");
  const [reactionMs, setReactionMs] = useState<number>(0);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [round, setRound] = useState(1);
  const [hint, setHint] = useState<string>("");
  const goTimeRef = useRef<number>(0);
  const waitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase === "menu" || phase === "done") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          startRound();
        }
        return;
      }
      if (phase === "falseStart") return;
      const k = e.key.toLowerCase();
      if (k !== P1_KEY && k !== P2_KEY) return;
      e.preventDefault();
      if (phase === "wait") {
        // False start
        if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
        setPhase("falseStart");
        const fouler = k === P1_KEY ? "P1" : "P2";
        const winnerName = k === P1_KEY ? "P2" : "P1";
        setHint(`${fouler} pressed too early! ${winnerName} wins round`);
        setWinner(winnerName);
        setScore(s => winnerName === "P1" ? { ...s, p1: s.p1 + 1 } : { ...s, p2: s.p2 + 1 });
        setTimeout(() => setPhase("done"), 1500);
        return;
      }
      if (phase === "go") {
        const dt = performance.now() - goTimeRef.current;
        setReactionMs(Math.round(dt));
        const winnerName = k === P1_KEY ? "P1" : "P2";
        setWinner(winnerName);
        setScore(s => winnerName === "P1" ? { ...s, p1: s.p1 + 1 } : { ...s, p2: s.p2 + 1 });
        setPhase("done");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  useEffect(() => {
    return () => {
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    };
  }, []);

  function startRound() {
    setPhase("wait");
    setHint("");
    setWinner("");
    setReactionMs(0);
    const delay = 1500 + Math.random() * 3000;
    waitTimerRef.current = window.setTimeout(() => {
      goTimeRef.current = performance.now();
      setPhase("go");
    }, delay);
  }

  function nextRound() {
    setRound(r => r + 1);
    startRound();
  }

  function resetMatch() {
    setScore({ p1: 0, p2: 0 });
    setRound(1);
    setPhase("menu");
    setWinner("");
  }

  if (phase === "menu") {
    return (
      <div className="w-full max-w-md p-6">
        <div className="bg-navy-800 border border-white/10 rounded-2xl p-8 text-center mt-14">
          <div className="text-5xl mb-4">⚔️</div>
          <h1 className="text-2xl font-bold text-steel mb-3">2P Duel</h1>
          <p className="text-sm text-white/60 mb-6">When the screen turns green, press your key. First to press wins. Press too early and you lose.</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <div className="text-xs text-white/60 mb-1">Player 1</div>
              <div className="text-2xl font-mono font-bold text-red-300">A</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
              <div className="text-xs text-white/60 mb-1">Player 2</div>
              <div className="text-2xl font-mono font-bold text-blue-300">L</div>
            </div>
          </div>
          <button onClick={() => { setRound(1); setScore({ p1: 0, p2: 0 }); startRound(); }}
            className="w-full bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 rounded-xl transition">
            Start Duel
          </button>
          <p className="text-xs text-white/40 mt-3">or press Space</p>
        </div>
      </div>
    );
  }

  let bg = "bg-navy-800";
  let label = "";
  if (phase === "wait") { bg = "bg-red-900/70"; label = "Wait..."; }
  else if (phase === "go") { bg = "bg-green-600"; label = "GO!"; }
  else if (phase === "falseStart") { bg = "bg-yellow-700"; label = "FALSE START"; }
  else if (phase === "done") {
    bg = winner === "P1" ? "bg-red-700/60" : "bg-blue-700/60";
    label = `${winner} wins!`;
  }

  return (
    <div className="w-full max-w-md p-4 mt-14">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-white/70">Round {round}</div>
        <div className="text-sm text-white/70">
          <span className="text-red-300 font-bold">{score.p1}</span>
          <span className="mx-2 text-white/30">-</span>
          <span className="text-blue-300 font-bold">{score.p2}</span>
        </div>
      </div>
      <div className={`${bg} border border-white/10 rounded-2xl p-8 text-center transition-colors h-[340px] flex flex-col items-center justify-center`}>
        <div className="text-5xl font-black mb-4 drop-shadow-lg">{label}</div>
        {phase === "done" && reactionMs > 0 && (
          <div className="text-white/80 mb-2">Reaction time: {reactionMs}ms</div>
        )}
        {hint && <div className="text-white/80 text-sm mb-2">{hint}</div>}
        <div className="flex items-center gap-6 text-sm text-white/70 mt-3">
          <div><span className="font-mono bg-black/30 px-2 py-1 rounded mr-1">A</span>P1</div>
          <div><span className="font-mono bg-black/30 px-2 py-1 rounded mr-1">L</span>P2</div>
        </div>
      </div>
      {phase === "done" && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={nextRound} className="bg-accent hover:bg-accent/80 text-navy-900 font-bold py-3 rounded-xl transition">Next Round</button>
          <button onClick={resetMatch} className="bg-navy-700 hover:bg-navy-700/70 text-white font-bold py-3 rounded-xl border border-white/10 transition">Reset</button>
        </div>
      )}
    </div>
  );
}
