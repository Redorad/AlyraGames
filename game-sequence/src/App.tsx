import React, { useEffect, useState } from 'react';

const COLORS = [
  { bg: '#ef4444', active: '#fecaca' },
  { bg: '#22c55e', active: '#bbf7d0' },
  { bg: '#3b82f6', active: '#bfdbfe' },
  { bg: '#f59e0b', active: '#fde68a' },
  { bg: '#a855f7', active: '#e9d5ff' },
  { bg: '#06b6d4', active: '#a5f3fc' },
];

type Phase = 'idle' | 'show' | 'input' | 'fail' | 'win';

export default function App() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [highlight, setHighlight] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [best, setBest] = useState<number>(() => {
    const b = localStorage.getItem('seq-best');
    return b ? parseInt(b) : 0;
  });

  function start() {
    const s = [Math.floor(Math.random() * 6)];
    setSequence(s);
    setIdx(0);
    setLevel(1);
    showSequence(s);
  }

  function showSequence(seq: number[]) {
    setPhase('show');
    let i = 0;
    const step = () => {
      if (i >= seq.length) {
        setHighlight(null);
        setPhase('input');
        setIdx(0);
        return;
      }
      setHighlight(seq[i]);
      setTimeout(() => {
        setHighlight(null);
        setTimeout(() => {
          i++;
          step();
        }, 200);
      }, 500);
    };
    setTimeout(step, 600);
  }

  function click(i: number) {
    if (phase !== 'input') return;
    setHighlight(i);
    setTimeout(() => setHighlight(null), 180);
    if (sequence[idx] === i) {
      const ni = idx + 1;
      if (ni >= sequence.length) {
        const newSeq = [...sequence, Math.floor(Math.random() * 6)];
        setSequence(newSeq);
        setLevel(l => {
          const nl = l + 1;
          if (nl > best) {
            setBest(nl);
            localStorage.setItem('seq-best', String(nl));
          }
          return nl;
        });
        setTimeout(() => showSequence(newSeq), 600);
      } else {
        setIdx(ni);
      }
    } else {
      setPhase('fail');
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Sequence Memory</div>
          <div className="text-xs text-slate-500">Watch the sequence, then repeat it.</div>
        </div>
        <div className="flex gap-6 text-sm">
          <span className="text-accent">Level {level}</span>
          <span className="text-yellow-300">Best {best}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {COLORS.map((c, i) => (
            <button
              key={i}
              onClick={() => click(i)}
              disabled={phase !== 'input'}
              className="w-24 h-24 rounded-2xl transition-all border-2 border-white/10"
              style={{
                background: highlight === i ? c.active : c.bg,
                transform: highlight === i ? 'scale(0.95)' : 'scale(1)',
                boxShadow: highlight === i ? `0 0 30px ${c.active}` : 'none',
              }}
            />
          ))}
        </div>
        <div className="h-8 text-sm">
          {phase === 'idle' && <span className="text-slate-400">Press Start</span>}
          {phase === 'show' && <span className="text-accent font-bold">Watch carefully...</span>}
          {phase === 'input' && <span className="text-steel font-bold">Repeat: {idx}/{sequence.length}</span>}
          {phase === 'fail' && <span className="text-red-400 font-bold">Wrong! Final: {level}</span>}
        </div>
        {(phase === 'idle' || phase === 'fail') && (
          <button onClick={start} className="px-6 py-2 rounded-xl bg-accent text-navy-900 font-bold">
            {phase === 'fail' ? 'Retry' : 'Start'}
          </button>
        )}
      </div>
    </div>
  );
}
