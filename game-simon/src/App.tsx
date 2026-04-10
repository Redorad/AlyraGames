import { useEffect, useRef, useState } from "react";

type Pad = 0 | 1 | 2 | 3;

const PAD_COLORS: Record<Pad, { base: string; lit: string; hz: number }> = {
  0: { base: "#16a34a", lit: "#4ade80", hz: 329.63 },
  1: { base: "#dc2626", lit: "#f87171", hz: 261.63 },
  2: { base: "#eab308", lit: "#facc15", hz: 392.0 },
  3: { base: "#2563eb", lit: "#60a5fa", hz: 523.25 },
};

const HS_KEY = "simon_high_score";

export default function App() {
  const [sequence, setSequence] = useState<Pad[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [active, setActive] = useState<Pad | null>(null);
  const [phase, setPhase] = useState<"idle" | "playing" | "player" | "over">("idle");
  const [score, setScore] = useState(0);
  const [high, setHigh] = useState(() => Number(localStorage.getItem(HS_KEY) || 0));
  const [strict, setStrict] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  const beep = (hz: number, duration = 300) => {
    try {
      if (!audioRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioRef.current = new Ctx();
      }
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = hz;
      osc.type = "sine";
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {
      /* ignore */
    }
  };

  const playErrorSound = () => beep(110, 500);

  const playSequence = async (seq: Pad[]) => {
    setPhase("playing");
    setActive(null);
    const delay = Math.max(220, 600 - seq.length * 15);
    await new Promise((r) => setTimeout(r, 600));
    for (const p of seq) {
      setActive(p);
      beep(PAD_COLORS[p].hz, delay);
      await new Promise((r) => setTimeout(r, delay));
      setActive(null);
      await new Promise((r) => setTimeout(r, 120));
    }
    setPhase("player");
    setPlayerIdx(0);
  };

  const startGame = () => {
    const first = Math.floor(Math.random() * 4) as Pad;
    const seq = [first];
    setSequence(seq);
    setScore(0);
    setPlayerIdx(0);
    setTimeout(() => playSequence(seq), 200);
  };

  const addStep = (seq: Pad[]) => {
    const next = Math.floor(Math.random() * 4) as Pad;
    const newSeq = [...seq, next];
    setSequence(newSeq);
    setTimeout(() => playSequence(newSeq), 700);
  };

  const handlePadClick = (pad: Pad) => {
    if (phase !== "player") return;
    setActive(pad);
    beep(PAD_COLORS[pad].hz, 260);
    setTimeout(() => setActive(null), 260);

    const expected = sequence[playerIdx];
    if (pad !== expected) {
      // wrong
      setTimeout(() => {
        playErrorSound();
        if (strict) {
          setPhase("over");
          if (score > high) {
            setHigh(score);
            localStorage.setItem(HS_KEY, String(score));
          }
        } else {
          // replay current sequence
          setPlayerIdx(0);
          setTimeout(() => playSequence(sequence), 600);
        }
      }, 300);
      return;
    }

    if (playerIdx + 1 === sequence.length) {
      // completed round
      const newScore = score + 1;
      setScore(newScore);
      if (newScore > high) {
        setHigh(newScore);
        localStorage.setItem(HS_KEY, String(newScore));
      }
      setPhase("playing");
      setTimeout(() => addStep(sequence), 500);
    } else {
      setPlayerIdx(playerIdx + 1);
    }
  };

  useEffect(() => {
    if (phase === "idle") setActive(null);
  }, [phase]);

  const statusText =
    phase === "idle"
      ? "Press Start"
      : phase === "playing"
      ? "Watch carefully..."
      : phase === "player"
      ? "Your turn!"
      : "Game Over";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 py-6 bg-navy-900">
      <div className="text-center mb-4">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          <span className="text-steel">SIMON</span>
          <span className="text-accent"> SAYS</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">Repeat the sequence. Watch and listen.</p>
      </div>

      <div className="flex gap-4 sm:gap-8 mb-4 text-sm">
        <div className="bg-navy-800 rounded-xl px-4 py-2 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase">Score</div>
          <div className="text-xl font-bold text-steel">{score}</div>
        </div>
        <div className="bg-navy-800 rounded-xl px-4 py-2 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase">Best</div>
          <div className="text-xl font-bold text-accent">{high}</div>
        </div>
        <div className="bg-navy-800 rounded-xl px-4 py-2 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase">Length</div>
          <div className="text-xl font-bold text-white">{sequence.length}</div>
        </div>
      </div>

      <div
        className="relative rounded-full bg-navy-800 border-4 border-navy-700 shadow-2xl"
        style={{ width: "min(86vw, 360px)", height: "min(86vw, 360px)" }}
      >
        {([0, 1, 2, 3] as Pad[]).map((p) => {
          const positions = [
            "top-0 left-0 rounded-tl-full",
            "top-0 right-0 rounded-tr-full",
            "bottom-0 left-0 rounded-bl-full",
            "bottom-0 right-0 rounded-br-full",
          ];
          return (
            <button
              key={p}
              onClick={() => handlePadClick(p)}
              className={`absolute w-1/2 h-1/2 ${positions[p]} transition-all duration-100`}
              style={{
                background: active === p ? PAD_COLORS[p].lit : PAD_COLORS[p].base,
                boxShadow:
                  active === p ? `0 0 40px ${PAD_COLORS[p].lit}, inset 0 0 30px rgba(255,255,255,0.4)` : "inset 0 0 20px rgba(0,0,0,0.4)",
                opacity: active === p ? 1 : 0.85,
                border: "3px solid #0a0e27",
              }}
            />
          );
        })}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-navy-900 border-4 border-navy-700 flex flex-col items-center justify-center">
          <div className="text-[10px] text-slate-500 uppercase">{statusText}</div>
        </div>
      </div>

      <div className="mt-6 flex gap-3 flex-wrap justify-center">
        <button
          onClick={startGame}
          disabled={phase === "playing"}
          className="px-6 py-2.5 rounded-lg bg-accent text-navy-900 font-bold text-sm uppercase tracking-wider disabled:opacity-40 hover:brightness-110"
        >
          {phase === "over" ? "Retry" : "Start"}
        </button>
        <label className="flex items-center gap-2 text-xs text-slate-400 bg-navy-800 px-3 rounded-lg border border-white/5">
          <input
            type="checkbox"
            checked={strict}
            onChange={(e) => setStrict(e.target.checked)}
            className="accent-accent"
          />
          Strict mode
        </label>
      </div>
    </div>
  );
}
