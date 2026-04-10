import React, { useRef, useState } from 'react';

type Genre = { name: string; notes: number[]; tempo: number; pattern: 'steady' | 'blues' | 'classical' | 'reggae' | 'jazz'; };

const GENRES: Genre[] = [
  { name: 'Classical', notes: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88], tempo: 0.35, pattern: 'classical' },
  { name: 'Blues', notes: [220, 246.94, 277.18, 293.66, 329.63, 392.00], tempo: 0.28, pattern: 'blues' },
  { name: 'Jazz', notes: [261.63, 311.13, 369.99, 415.30, 466.16, 554.37], tempo: 0.22, pattern: 'jazz' },
  { name: 'Reggae', notes: [196.00, 246.94, 293.66, 329.63, 392.00], tempo: 0.4, pattern: 'reggae' },
  { name: 'Rock', notes: [146.83, 196.00, 220.00, 246.94, 293.66], tempo: 0.2, pattern: 'steady' },
];

function playSequence(genre: Genre) {
  const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new Ctx();
  const dur = genre.tempo;
  const now = ctx.currentTime;
  const count = 10;
  const gain = ctx.createGain();
  gain.gain.value = 0.12;
  gain.connect(ctx.destination);
  for (let i = 0; i < count; i++) {
    const start = now + i * dur;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    let freq = genre.notes[Math.floor(Math.random() * genre.notes.length)];
    let type: OscillatorType = 'sine';
    if (genre.pattern === 'classical') type = 'sine';
    else if (genre.pattern === 'blues') { type = 'triangle'; freq *= (i % 4 === 3 ? 0.5 : 1); }
    else if (genre.pattern === 'jazz') type = 'sawtooth';
    else if (genre.pattern === 'reggae') { type = 'square'; if (i % 2 === 1) freq = genre.notes[0]; }
    else if (genre.pattern === 'steady') type = 'sawtooth';
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.25, start + 0.02);
    g.gain.linearRampToValueAtTime(0, start + dur * 0.9);
    osc.connect(g).connect(gain);
    osc.start(start);
    osc.stop(start + dur);
  }
  setTimeout(() => ctx.close(), (count * dur + 0.3) * 1000);
}

export default function App() {
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState<Genre | null>(null);
  const [options, setOptions] = useState<Genre[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const playedRef = useRef(false);

  function newRound() {
    setFeedback(null);
    const t = GENRES[Math.floor(Math.random() * GENRES.length)];
    const opts = new Set<Genre>([t]);
    while (opts.size < 4) opts.add(GENRES[Math.floor(Math.random() * GENRES.length)]);
    const arr = Array.from(opts).sort(() => Math.random() - 0.5);
    setTarget(t);
    setOptions(arr);
    playedRef.current = false;
  }

  React.useEffect(() => { newRound(); }, []);

  function play() {
    if (!target) return;
    playSequence(target);
    playedRef.current = true;
  }

  function guess(g: Genre) {
    if (!target || feedback) return;
    if (g.name === target.name) {
      setScore(s => s + 1);
      setFeedback(`Correct! It was ${target.name}.`);
    } else {
      setFeedback(`Wrong. It was ${target.name}.`);
    }
    setTimeout(() => {
      if (round >= 10) {
        setDone(true);
      } else {
        setRound(r => r + 1);
        newRound();
      }
    }, 1200);
  }

  function restart() {
    setRound(1);
    setScore(0);
    setDone(false);
    newRound();
  }

  if (done) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center flex flex-col gap-4 max-w-md">
          <div className="text-5xl">🎵</div>
          <div className="text-2xl font-bold text-steel">Music Quiz Complete</div>
          <div className="text-4xl text-accent font-extrabold">{score} / 10</div>
          <button onClick={restart} className="py-3 rounded-xl bg-accent text-navy-900 font-bold">Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-xl flex flex-col gap-4">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Music Genre Quiz</div>
          <div className="text-xs text-slate-500">Round {round}/10 · Score {score}</div>
        </div>
        <div className="bg-navy-800/80 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="text-6xl animate-pulse">🎧</div>
          <div className="text-sm text-slate-400 text-center">Listen to the tones and identify the genre.</div>
          <button onClick={play} className="px-6 py-3 rounded-xl bg-accent text-navy-900 font-bold">
            {playedRef.current ? '▶ Replay' : '▶ Play'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {options.map(o => (
            <button
              key={o.name}
              onClick={() => guess(o)}
              disabled={!!feedback}
              className="p-4 rounded-xl bg-navy-800 hover:bg-navy-700 border border-white/10 text-steel font-bold disabled:opacity-60"
            >
              {o.name}
            </button>
          ))}
        </div>
        {feedback && (
          <div className={`text-center text-sm ${feedback.startsWith('Correct') ? 'text-green-400' : 'text-red-400'}`}>{feedback}</div>
        )}
      </div>
    </div>
  );
}
