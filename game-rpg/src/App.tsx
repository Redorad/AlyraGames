import React, { useState } from 'react';

type Enemy = { name: string; emoji: string; hp: number; maxHp: number; atk: number; xp: number };

const ENEMIES: Omit<Enemy, 'hp'>[] = [
  { name: 'Slime', emoji: '🟢', maxHp: 10, atk: 2, xp: 5 },
  { name: 'Bat', emoji: '🦇', maxHp: 14, atk: 3, xp: 8 },
  { name: 'Wolf', emoji: '🐺', maxHp: 20, atk: 4, xp: 12 },
  { name: 'Skeleton', emoji: '💀', maxHp: 26, atk: 5, xp: 16 },
  { name: 'Goblin', emoji: '👺', maxHp: 32, atk: 6, xp: 22 },
  { name: 'Troll', emoji: '👹', maxHp: 44, atk: 8, xp: 30 },
  { name: 'Dragon', emoji: '🐉', maxHp: 80, atk: 12, xp: 60 },
];

function makeEnemy(level: number): Enemy {
  const base = ENEMIES[Math.min(level - 1, ENEMIES.length - 1)];
  const extra = Math.max(0, level - ENEMIES.length) * 10;
  const hp = base.maxHp + extra;
  return { ...base, hp, maxHp: hp };
}

export default function App() {
  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(30);
  const [maxHp, setMaxHp] = useState(30);
  const [mp, setMp] = useState(10);
  const [maxMp, setMaxMp] = useState(10);
  const [atk, setAtk] = useState(5);
  const [def, setDef] = useState(0);
  const [xp, setXp] = useState(0);
  const [xpNext, setXpNext] = useState(10);
  const [enemy, setEnemy] = useState<Enemy>(() => makeEnemy(1));
  const [log, setLog] = useState<string[]>(['A wild Slime appears!']);
  const [defending, setDefending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  function addLog(s: string) {
    setLog(l => [...l, s].slice(-6));
  }

  function enemyTurn(curHp: number, curDef: boolean, curEnemy: Enemy) {
    const raw = curEnemy.atk + Math.floor(Math.random() * 3);
    const dmg = Math.max(1, raw - def - (curDef ? 3 : 0));
    const nhp = curHp - dmg;
    addLog(`${curEnemy.name} hits for ${dmg}.`);
    setHp(Math.max(0, nhp));
    setDefending(false);
    if (nhp <= 0) {
      addLog('You fell in battle.');
      setOver(true);
    }
    setBusy(false);
  }

  function attack() {
    if (busy || over) return;
    setBusy(true);
    const dmg = atk + Math.floor(Math.random() * 4);
    const nhp = enemy.hp - dmg;
    addLog(`You hit ${enemy.name} for ${dmg}.`);
    if (nhp <= 0) {
      const newXp = xp + enemy.xp;
      addLog(`${enemy.name} defeated! +${enemy.xp} XP.`);
      setEnemy({ ...enemy, hp: 0 });
      setTimeout(() => {
        let lvl = level;
        let nMax = maxHp;
        let nMaxMp = maxMp;
        let nAtk = atk;
        let nDef = def;
        let cXp = newXp;
        let cNext = xpNext;
        while (cXp >= cNext) {
          cXp -= cNext;
          lvl += 1;
          nMax += 6;
          nMaxMp += 3;
          nAtk += 2;
          nDef += 1;
          cNext = Math.floor(cNext * 1.5);
          addLog(`Level up! Lv ${lvl}.`);
        }
        setLevel(lvl);
        setMaxHp(nMax);
        setMaxMp(nMaxMp);
        setAtk(nAtk);
        setDef(nDef);
        setHp(nMax);
        setMp(nMaxMp);
        setXp(cXp);
        setXpNext(cNext);
        const next = makeEnemy(lvl);
        setEnemy(next);
        addLog(`A wild ${next.name} appears!`);
        setBusy(false);
      }, 600);
      return;
    }
    setEnemy({ ...enemy, hp: nhp });
    setTimeout(() => enemyTurn(hp, false, { ...enemy, hp: nhp }), 500);
  }

  function defend() {
    if (busy || over) return;
    setBusy(true);
    setDefending(true);
    addLog('You brace for impact.');
    setTimeout(() => enemyTurn(hp, true, enemy), 400);
  }

  function heal() {
    if (busy || over) return;
    if (mp < 4) {
      addLog('Not enough MP.');
      return;
    }
    setBusy(true);
    const amt = 10 + level * 2;
    setMp(mp - 4);
    setHp(Math.min(maxHp, hp + amt));
    addLog(`You heal +${amt} HP.`);
    setTimeout(() => enemyTurn(Math.min(maxHp, hp + amt), false, enemy), 500);
  }

  function restart() {
    setLevel(1);
    setHp(30);
    setMaxHp(30);
    setMp(10);
    setMaxMp(10);
    setAtk(5);
    setDef(0);
    setXp(0);
    setXpNext(10);
    setEnemy(makeEnemy(1));
    setLog(['A wild Slime appears!']);
    setOver(false);
    setBusy(false);
    setDefending(false);
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-xl flex flex-col gap-4">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Turn-Based RPG</div>
          <div className="text-xs text-slate-500">Level {level}</div>
        </div>

        <div className="bg-navy-800/80 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
          <div className="text-6xl mb-2">{enemy.emoji}</div>
          <div className="text-lg font-bold">{enemy.name}</div>
          <div className="w-full h-2 bg-navy-900 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
          </div>
          <div className="text-xs text-slate-400 mt-1">{enemy.hp}/{enemy.maxHp}</div>
        </div>

        <div className="bg-navy-800/80 border border-white/10 rounded-2xl p-4">
          <div className="flex justify-between text-sm font-bold mb-2">
            <span className="text-steel">Hero</span>
            <span className="text-slate-400">ATK {atk} · DEF {def}</span>
          </div>
          <div className="text-xs text-red-400">HP {hp}/{maxHp}</div>
          <div className="w-full h-2 bg-navy-900 rounded-full overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${(hp / maxHp) * 100}%` }} />
          </div>
          <div className="text-xs text-blue-300 mt-2">MP {mp}/{maxMp}</div>
          <div className="w-full h-2 bg-navy-900 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${(mp / maxMp) * 100}%` }} />
          </div>
          <div className="text-xs text-yellow-300 mt-2">XP {xp}/{xpNext}</div>
          <div className="w-full h-2 bg-navy-900 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400" style={{ width: `${(xp / xpNext) * 100}%` }} />
          </div>
        </div>

        <div className="bg-navy-900/70 border border-white/5 rounded-xl p-3 text-xs min-h-[100px]">
          {log.map((l, i) => (
            <div key={i} className="text-slate-300">{l}</div>
          ))}
        </div>

        {over ? (
          <button onClick={restart} className="py-3 rounded-xl bg-accent text-navy-900 font-bold">Retry</button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button onClick={attack} disabled={busy} className="py-3 rounded-xl bg-red-500 text-white font-bold disabled:opacity-50">Attack</button>
            <button onClick={defend} disabled={busy} className="py-3 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50">Defend</button>
            <button onClick={heal} disabled={busy || mp < 4} className="py-3 rounded-xl bg-green-500 text-white font-bold disabled:opacity-50">Heal (4 MP)</button>
          </div>
        )}
      </div>
    </div>
  );
}
