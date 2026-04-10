import React, { useEffect, useState } from 'react';

const GRID = 8;

const PALINDROMES = [
  'ABA', 'LOL', 'POP', 'WOW', 'EYE', 'DID', 'RADAR', 'LEVEL', 'MADAM', 'REFER',
  'CIVIC', 'KAYAK', 'ROTOR', 'SOLOS', 'STATS', 'NOON', 'PEEP', 'DEED', 'TOOT', 'SEES',
  'ANNA', 'OTTO',
];

function seededGrid(seed: number): string[][] {
  // pick 3 palindromes and place in grid, then fill
  const rng = mulberry32(seed);
  const grid: string[][] = Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => ''));
  const placed: string[] = [];
  let tries = 0;
  while (placed.length < 4 && tries < 200) {
    tries++;
    const word = PALINDROMES[Math.floor(rng() * PALINDROMES.length)];
    if (placed.includes(word)) continue;
    const horizontal = rng() < 0.5;
    const x = Math.floor(rng() * (GRID - (horizontal ? word.length : 1)));
    const y = Math.floor(rng() * (GRID - (horizontal ? 1 : word.length)));
    let ok = true;
    for (let i = 0; i < word.length; i++) {
      const gx = horizontal ? x + i : x;
      const gy = horizontal ? y : y + i;
      if (grid[gy][gx] !== '' && grid[gy][gx] !== word[i]) { ok = false; break; }
    }
    if (!ok) continue;
    for (let i = 0; i < word.length; i++) {
      const gx = horizontal ? x + i : x;
      const gy = horizontal ? y : y + i;
      grid[gy][gx] = word[i];
    }
    placed.push(word);
  }
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++)
      if (grid[y][x] === '') grid[y][x] = letters[Math.floor(rng() * letters.length)];
  return grid;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isPalindrome(s: string) {
  if (s.length < 3) return false;
  return s === s.split('').reverse().join('');
}

export default function App() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [grid] = useState(() => seededGrid(seed));
  const [selected, setSelected] = useState<[number, number][]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(120);
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (over) return;
    const id = setInterval(() => {
      setTime(t => {
        if (t <= 1) { setOver(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [over]);

  function click(x: number, y: number) {
    if (over) return;
    if (selected.length === 0) {
      setSelected([[x, y]]);
      return;
    }
    const last = selected[selected.length - 1];
    const alreadyIdx = selected.findIndex(([sx, sy]) => sx === x && sy === y);
    if (alreadyIdx >= 0) {
      setSelected(selected.slice(0, alreadyIdx + 1));
      return;
    }
    // must be inline (horizontal or vertical)
    const first = selected[0];
    if (selected.length === 1) {
      const dx = x - first[0];
      const dy = y - first[1];
      if (Math.abs(dx) + Math.abs(dy) !== 1) {
        setSelected([[x, y]]);
        return;
      }
      setSelected([...selected, [x, y]]);
      return;
    }
    // determine direction
    const dirx = Math.sign(selected[1][0] - first[0]);
    const diry = Math.sign(selected[1][1] - first[1]);
    if (x - last[0] === dirx && y - last[1] === diry) {
      setSelected([...selected, [x, y]]);
    } else {
      setSelected([[x, y]]);
    }
  }

  function submit() {
    const word = selected.map(([x, y]) => grid[y][x]).join('');
    if (word.length >= 3 && isPalindrome(word) && !found.includes(word)) {
      setFound([...found, word]);
      setScore(s => s + word.length * 10);
      setTime(t => t + 3);
    }
    setSelected([]);
  }

  function restart() {
    const ns = Math.floor(Math.random() * 1e9);
    setSeed(ns);
    setSelected([]);
    setFound([]);
    setScore(0);
    setTime(120);
    setOver(false);
    // Reload grid via key
    window.location.reload();
  }

  const isSelected = (x: number, y: number) => selected.some(([sx, sy]) => sx === x && sy === y);
  const currentWord = selected.map(([x, y]) => grid[y][x]).join('');
  const currentIsValid = currentWord.length >= 3 && isPalindrome(currentWord);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 max-w-xl">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Palindrome Hunt</div>
          <div className="text-xs text-slate-500">Find palindromes (read same forwards and backwards). 3+ letters.</div>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-accent">Score {score}</span>
          <span className="text-steel">Time {time}s</span>
          <span className="text-yellow-300">Found {found.length}</span>
        </div>
        <div className="inline-block bg-navy-800/80 border border-white/10 rounded-2xl p-2">
          {grid.map((row, y) => (
            <div key={y} className="flex">
              {row.map((l, x) => {
                const sel = isSelected(x, y);
                return (
                  <button
                    key={x}
                    onClick={() => click(x, y)}
                    disabled={over}
                    className={`w-10 h-10 m-0.5 rounded-md font-bold text-lg transition-all ${sel ? 'bg-accent text-navy-900 scale-95' : 'bg-navy-700 text-slate-200 hover:bg-navy-600'}`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className={`h-8 px-3 py-1 rounded-lg font-bold ${currentIsValid ? 'bg-green-500/30 text-green-300' : 'bg-navy-800 text-slate-400'}`}>
          {currentWord || '—'} {currentIsValid && '✓'}
        </div>
        <div className="flex gap-2">
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-accent text-navy-900 font-bold">Submit</button>
          <button onClick={() => setSelected([])} className="px-4 py-2 rounded-lg bg-navy-700 text-slate-200 font-bold">Clear</button>
        </div>
        <div className="w-full bg-navy-800/50 border border-white/10 rounded-xl p-2 text-xs">
          <div className="text-slate-500">Found words:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {found.length === 0 && <span className="text-slate-600">none yet</span>}
            {found.map(w => <span key={w} className="px-2 py-0.5 rounded bg-green-500/20 text-green-300">{w}</span>)}
          </div>
        </div>
        {over && (
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">Time's up!</div>
            <div className="text-sm text-slate-400">Final score: {score}</div>
            <button onClick={restart} className="mt-2 px-5 py-2 rounded-lg bg-accent text-navy-900 font-bold">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
