import React, { useEffect, useState } from 'react';

type Size = 3 | 4 | 5;

const IMAGES = [
  { name: 'Nebula', grad: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #ec4899 100%)' },
  { name: 'Sunset', grad: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)' },
  { name: 'Ocean', grad: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 50%, #1e1b4b 100%)' },
  { name: 'Forest', grad: 'linear-gradient(135deg, #14532d 0%, #22c55e 50%, #facc15 100%)' },
  { name: 'Galaxy', grad: 'linear-gradient(135deg, #0f172a 0%, #6d28d9 50%, #f59e0b 100%)' },
];

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function App() {
  const [size, setSize] = useState<Size>(3);
  const [img, setImg] = useState(IMAGES[0]);
  const [pieces, setPieces] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  function start(s: Size = size, image = img) {
    const count = s * s;
    let arr: number[];
    do {
      arr = shuffle(Array.from({ length: count }, (_, i) => i));
    } while (arr.every((v, i) => v === i));
    setPieces(arr);
    setSelected(null);
    setMoves(0);
    setWon(false);
    setSize(s);
    setImg(image);
  }

  useEffect(() => {
    start(3, IMAGES[0]);
    // eslint-disable-next-line
  }, []);

  function click(idx: number) {
    if (won) return;
    if (selected === null) {
      setSelected(idx);
    } else if (selected === idx) {
      setSelected(null);
    } else {
      const p = [...pieces];
      [p[selected], p[idx]] = [p[idx], p[selected]];
      setPieces(p);
      setSelected(null);
      setMoves(m => m + 1);
      if (p.every((v, i) => v === i)) setWon(true);
    }
  }

  const pct = 100 / size;

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
      <div className="flex flex-col items-center gap-3 max-w-lg">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Jigsaw Puzzle</div>
          <div className="text-xs text-slate-500">Click two pieces to swap them. Solve the image.</div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {([3, 4, 5] as Size[]).map(s => (
            <button
              key={s}
              onClick={() => start(s, img)}
              className={`px-3 py-1 rounded-lg text-sm font-bold ${size === s ? 'bg-accent text-navy-900' : 'bg-navy-700 text-slate-300'}`}
            >
              {s}x{s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {IMAGES.map(i => (
            <button
              key={i.name}
              onClick={() => start(size, i)}
              className={`px-3 py-1 rounded-lg text-xs ${img.name === i.name ? 'bg-accent text-navy-900' : 'bg-navy-700 text-slate-300'}`}
            >
              {i.name}
            </button>
          ))}
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-steel">Moves: {moves}</span>
          {won && <span className="text-green-400 font-bold">Solved!</span>}
        </div>
        <div className="relative bg-navy-800 border border-white/10 rounded-xl p-1" style={{ width: 320, height: 320 }}>
          <div className="grid gap-1 w-full h-full" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {pieces.map((piece, idx) => {
              const col = piece % size;
              const row = Math.floor(piece / size);
              return (
                <button
                  key={idx}
                  onClick={() => click(idx)}
                  className={`rounded-sm border transition-all ${selected === idx ? 'border-accent scale-95 shadow-lg shadow-accent/50' : 'border-white/5'}`}
                  style={{
                    backgroundImage: img.grad,
                    backgroundSize: `${size * 100}% ${size * 100}%`,
                    backgroundPosition: `${(col / (size - 1)) * 100}% ${(row / (size - 1)) * 100}%`,
                  }}
                >
                  <span className="text-xs text-white/30 font-bold">{piece + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
        <button onClick={() => start(size, img)} className="px-4 py-2 rounded-lg bg-navy-700 text-steel font-bold">Shuffle</button>
      </div>
    </div>
  );
}
