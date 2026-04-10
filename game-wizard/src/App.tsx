import React, { useEffect, useState, useCallback } from 'react';

type Spell = { combo: string[]; name: string; emoji: string; dmg: number; mana: number; color: string };

const SPELLS: Spell[] = [
  { combo: ['q', 'w'], name: 'Fireball', emoji: '🔥', dmg: 15, mana: 8, color: '#ef4444' },
  { combo: ['w', 'e'], name: 'Ice Shard', emoji: '❄️', dmg: 12, mana: 6, color: '#60a5fa' },
  { combo: ['e', 'r'], name: 'Lightning', emoji: '⚡', dmg: 20, mana: 12, color: '#facc15' },
  { combo: ['q', 'e'], name: 'Wind Slash', emoji: '🌪️', dmg: 10, mana: 5, color: '#22d3ee' },
  { combo: ['q', 'w', 'e'], name: 'Meteor', emoji: '☄️', dmg: 35, mana: 20, color: '#f97316' },
  { combo: ['w', 'e', 'r'], name: 'Blizzard', emoji: '🌨️', dmg: 28, mana: 16, color: '#a5f3fc' },
  { combo: ['q', 'r'], name: 'Heal', emoji: '✨', dmg: -25, mana: 10, color: '#4ade80' },
];

type Enemy = { name: string; emoji: string; hp: number; maxHp: number; atk: number; tNext: number };

function makeEnemy(wave: number): Enemy {
  const pool = [
    { name: 'Goblin', emoji: '👺', baseHp: 30, atk: 4 },
    { name: 'Orc', emoji: '👹', baseHp: 50, atk: 7 },
    { name: 'Wraith', emoji: '👻', baseHp: 40, atk: 6 },
    { name: 'Dragon', emoji: '🐲', baseHp: 120, atk: 12 },
  ];
  const d = pool[Math.floor(Math.random() * pool.length)];
  const hp = d.baseHp + wave * 10;
  return { name: d.name, emoji: d.emoji, hp, maxHp: hp, atk: d.atk + Math.floor(wave / 2), tNext: 3 };
}

export default function App() {
  const [hp, setHp] = useState(100);
  const [maxHp] = useState(100);
  const [mana, setMana] = useState(30);
  const [maxMana] = useState(30);
  const [wave, setWave] = useState(1);
  const [enemy, setEnemy] = useState<Enemy>(() => makeEnemy(1));
  const [buffer, setBuffer] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>(['Press Q W E R to cast spells. Try Q W for Fireball.']);
  const [over, setOver] = useState(false);
  const [lastCast, setLastCast] = useState<string | null>(null);

  function addLog(s: string) {
    setLog(l => [...l, s].slice(-6));
  }

  // regenerate mana
  useEffect(() => {
    if (over) return;
    const id = setInterval(() => {
      setMana(m => Math.min(maxMana, m + 1));
    }, 800);
    return () => clearInterval(id);
  }, [over, maxMana]);

  // enemy attack loop
  useEffect(() => {
    if (over) return;
    const id = setInterval(() => {
      setEnemy(e => {
        if (!e) return e;
        const nt = e.tNext - 1;
        if (nt <= 0) {
          setHp(hp => {
            const nh = Math.max(0, hp - e.atk);
            if (nh <= 0) setOver(true);
            return nh;
          });
          addLog(`${e.name} attacks for ${e.atk}.`);
          return { ...e, tNext: 3 };
        }
        return { ...e, tNext: nt };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [over]);

  const tryCast = useCallback((buf: string[]) => {
    // longest match first
    const sorted = [...SPELLS].sort((a, b) => b.combo.length - a.combo.length);
    for (const sp of sorted) {
      if (buf.length >= sp.combo.length) {
        const tail = buf.slice(-sp.combo.length);
        if (tail.every((k, i) => k === sp.combo[i])) {
          return sp;
        }
      }
    }
    return null;
  }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (over) return;
    const key = e.key.toLowerCase();
    if (!['q', 'w', 'e', 'r'].includes(key)) return;
    setBuffer(prev => {
      const nb = [...prev, key].slice(-4);
      const sp = tryCast(nb);
      if (sp) {
        setMana(m => {
          if (m < sp.mana) {
            addLog(`Not enough mana for ${sp.name}.`);
            return m;
          }
          if (sp.dmg < 0) {
            setHp(h => Math.min(maxHp, h - sp.dmg));
            addLog(`${sp.emoji} ${sp.name} heals ${-sp.dmg}!`);
          } else {
            setEnemy(en => {
              const nh = en.hp - sp.dmg;
              addLog(`${sp.emoji} ${sp.name} hits for ${sp.dmg}!`);
              if (nh <= 0) {
                const nw = wave + 1;
                setWave(nw);
                addLog(`${en.name} defeated! Wave ${nw}.`);
                return makeEnemy(nw);
              }
              return { ...en, hp: nh };
            });
          }
          setLastCast(sp.name);
          setTimeout(() => setLastCast(null), 700);
          return m - sp.mana;
        });
        return [];
      }
      return nb;
    });
  }, [over, wave, tryCast, maxHp]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  function restart() {
    setHp(100);
    setMana(30);
    setWave(1);
    setEnemy(makeEnemy(1));
    setBuffer([]);
    setLog(['Press Q W E R to cast spells.']);
    setOver(false);
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col gap-3">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Wizard Combat</div>
          <div className="text-xs text-slate-500">Wave {wave} · Press Q W E R</div>
        </div>

        <div className="bg-navy-800/80 border border-white/10 rounded-2xl p-6 flex flex-col items-center relative">
          <div className={`text-6xl transition-transform ${lastCast ? 'scale-110' : ''}`}>{enemy.emoji}</div>
          <div className="text-lg font-bold">{enemy.name}</div>
          <div className="w-full h-3 bg-navy-900 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
          </div>
          <div className="text-xs text-slate-400 mt-1">{enemy.hp}/{enemy.maxHp}</div>
          <div className="text-xs text-slate-500 mt-1">Attack in {enemy.tNext}s</div>
          {lastCast && <div className="absolute top-2 right-2 text-accent font-bold animate-fade-in">{lastCast}!</div>}
        </div>

        <div className="bg-navy-800/80 border border-white/10 rounded-2xl p-4">
          <div className="text-xs text-red-400">HP {hp}/{maxHp}</div>
          <div className="w-full h-3 bg-navy-900 rounded-full overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${(hp / maxHp) * 100}%` }} />
          </div>
          <div className="text-xs text-blue-300 mt-2">Mana {mana}/{maxMana}</div>
          <div className="w-full h-3 bg-navy-900 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${(mana / maxMana) * 100}%` }} />
          </div>
        </div>

        <div className="bg-navy-900/70 border border-accent/30 rounded-xl p-3">
          <div className="text-xs text-slate-500 mb-1">Input buffer</div>
          <div className="flex gap-1 min-h-[28px]">
            {buffer.map((k, i) => (
              <span key={i} className="px-3 py-1 rounded-md bg-accent text-navy-900 font-bold text-xs uppercase">{k}</span>
            ))}
          </div>
        </div>

        <div className="bg-navy-800/50 border border-white/10 rounded-xl p-3">
          <div className="text-xs text-slate-500 mb-2">Spellbook</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {SPELLS.map(s => (
              <div key={s.name} className="flex items-center gap-2">
                <span>{s.emoji}</span>
                <span className="text-steel font-bold">{s.name}</span>
                <span className="text-slate-500 uppercase">{s.combo.join('+')}</span>
                <span className="text-blue-400">{s.mana}mp</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-navy-900/70 border border-white/5 rounded-xl p-2 text-xs min-h-[70px]">
          {log.map((l, i) => (
            <div key={i} className="text-slate-300">{l}</div>
          ))}
        </div>

        {over && (
          <button onClick={restart} className="py-3 rounded-xl bg-accent text-navy-900 font-bold">Retry</button>
        )}
      </div>
    </div>
  );
}
