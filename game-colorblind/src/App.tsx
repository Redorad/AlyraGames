import React, { useEffect, useRef, useState } from 'react';

const SIZE = 320;

// bitmap digits 5x7
const DIGITS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['01110', '10001', '00001', '00110', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
};

function digitHasPixel(digit: string, px: number, py: number) {
  // digit is drawn in center of SIZE, each pixel scaled
  const scale = 30;
  const dw = 5 * scale;
  const dh = 7 * scale;
  const ox = (SIZE - dw) / 2;
  const oy = (SIZE - dh) / 2;
  if (px < ox || px >= ox + dw || py < oy || py >= oy + dh) return false;
  const bx = Math.floor((px - ox) / scale);
  const by = Math.floor((py - oy) / scale);
  return DIGITS[digit][by][bx] === '1';
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState<string>(() => String(Math.floor(Math.random() * 10)));
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function newRound() {
    const t = String(Math.floor(Math.random() * 10));
    const set = new Set<string>([t]);
    while (set.size < 4) set.add(String(Math.floor(Math.random() * 10)));
    setTarget(t);
    setOptions(Array.from(set).sort(() => Math.random() - 0.5));
    setFeedback(null);
  }

  useEffect(() => {
    newRound();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // background color palette (greens/grays) and digit color (reds/oranges)
    const bgColors = ['#4d6b4a', '#5a8a57', '#6b7f66', '#7aa073', '#556b52', '#809a7a'];
    const fgColors = ['#b8593c', '#d96b3e', '#c75a2f', '#e07849', '#a84b30', '#d86244'];
    // place dots
    const dots: { x: number; y: number; r: number; fg: boolean }[] = [];
    const count = 600;
    for (let i = 0; i < count; i++) {
      let tries = 0;
      while (tries < 40) {
        tries++;
        const x = Math.random() * SIZE;
        const y = Math.random() * SIZE;
        const r = 4 + Math.random() * 6;
        const cx = SIZE / 2;
        const cy = SIZE / 2;
        const inCircle = Math.hypot(x - cx, y - cy) < SIZE / 2 - 8;
        if (!inCircle) continue;
        const overlap = dots.some(d => Math.hypot(d.x - x, d.y - y) < d.r + r + 1);
        if (overlap) continue;
        const fg = digitHasPixel(target, x, y);
        dots.push({ x, y, r, fg });
        break;
      }
    }
    for (const d of dots) {
      ctx.fillStyle = d.fg ? fgColors[Math.floor(Math.random() * fgColors.length)] : bgColors[Math.floor(Math.random() * bgColors.length)];
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [target]);

  function pick(o: string) {
    if (feedback) return;
    if (o === target) {
      setScore(s => s + 1);
      setFeedback(`Correct! It was ${target}.`);
    } else {
      setFeedback(`Wrong. It was ${target}.`);
    }
    setTimeout(() => {
      if (round >= 10) setDone(true);
      else {
        setRound(r => r + 1);
        newRound();
      }
    }, 1000);
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
        <div className="text-center flex flex-col gap-4">
          <div className="text-5xl">👁️</div>
          <div className="text-2xl font-bold text-steel">Color Test Complete</div>
          <div className="text-4xl text-accent font-extrabold">{score} / 10</div>
          <button onClick={restart} className="py-3 rounded-xl bg-accent text-navy-900 font-bold">Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Color Vision Test</div>
          <div className="text-xs text-slate-500">Round {round}/10 · Score {score} · What number do you see?</div>
        </div>
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className="rounded-full border border-white/10" />
        <div className="grid grid-cols-4 gap-2">
          {options.map(o => (
            <button
              key={o}
              onClick={() => pick(o)}
              disabled={!!feedback}
              className="w-14 h-14 rounded-xl bg-navy-800 border border-white/10 text-2xl font-bold text-steel hover:bg-navy-700 disabled:opacity-60"
            >
              {o}
            </button>
          ))}
        </div>
        {feedback && (
          <div className={`text-sm ${feedback.startsWith('Correct') ? 'text-green-400' : 'text-red-400'}`}>{feedback}</div>
        )}
      </div>
    </div>
  );
}
