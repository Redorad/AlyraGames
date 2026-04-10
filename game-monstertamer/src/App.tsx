import React, { useState } from 'react';

type Type = 'fire' | 'water' | 'grass' | 'electric';
type MonDef = { name: string; emoji: string; type: Type; baseHp: number; baseAtk: number };

const MON_POOL: MonDef[] = [
  { name: 'Flamy', emoji: '🔥', type: 'fire', baseHp: 24, baseAtk: 7 },
  { name: 'Aquafin', emoji: '🐟', type: 'water', baseHp: 28, baseAtk: 6 },
  { name: 'Leafy', emoji: '🌿', type: 'grass', baseHp: 26, baseAtk: 6 },
  { name: 'Sparky', emoji: '⚡', type: 'electric', baseHp: 22, baseAtk: 8 },
  { name: 'Pyrox', emoji: '🐲', type: 'fire', baseHp: 30, baseAtk: 9 },
  { name: 'Wavely', emoji: '🌊', type: 'water', baseHp: 32, baseAtk: 7 },
  { name: 'Bloom', emoji: '🌺', type: 'grass', baseHp: 28, baseAtk: 7 },
  { name: 'Volt', emoji: '🦔', type: 'electric', baseHp: 26, baseAtk: 9 },
];

type Mon = MonDef & { level: number; xp: number; hp: number; maxHp: number; atk: number };

function makeMon(def: MonDef, level: number): Mon {
  const maxHp = def.baseHp + (level - 1) * 4;
  const atk = def.baseAtk + (level - 1) * 2;
  return { ...def, level, xp: 0, hp: maxHp, maxHp, atk };
}

function levelUp(m: Mon): Mon {
  const nl = m.level + 1;
  const maxHp = m.baseHp + (nl - 1) * 4;
  const atk = m.baseAtk + (nl - 1) * 2;
  return { ...m, level: nl, xp: 0, hp: maxHp, maxHp, atk };
}

function typeMultiplier(att: Type, def: Type) {
  if (att === 'fire' && def === 'grass') return 1.5;
  if (att === 'water' && def === 'fire') return 1.5;
  if (att === 'grass' && def === 'water') return 1.5;
  if (att === 'electric' && def === 'water') return 1.5;
  if (att === 'fire' && def === 'water') return 0.75;
  if (att === 'water' && def === 'grass') return 0.75;
  if (att === 'grass' && def === 'fire') return 0.75;
  return 1;
}

export default function App() {
  const [team, setTeam] = useState<Mon[]>([makeMon(MON_POOL[0], 2)]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [wild, setWild] = useState<Mon | null>(null);
  const [log, setLog] = useState<string[]>(['You carry a Flamy. Explore to find wild monsters.']);
  const [balls, setBalls] = useState(5);
  const [busy, setBusy] = useState(false);

  function addLog(s: string) {
    setLog(l => [...l, s].slice(-5));
  }

  function explore() {
    if (wild || busy) return;
    const def = MON_POOL[Math.floor(Math.random() * MON_POOL.length)];
    const level = Math.max(1, team[activeIdx].level - 1 + Math.floor(Math.random() * 3));
    const m = makeMon(def, level);
    setWild(m);
    addLog(`A wild ${m.name} (Lv${m.level}) appeared!`);
  }

  function attack() {
    if (!wild || busy) return;
    setBusy(true);
    const active = team[activeIdx];
    const mult = typeMultiplier(active.type, wild.type);
    const dmg = Math.max(1, Math.floor((active.atk + Math.floor(Math.random() * 4)) * mult));
    const nhp = Math.max(0, wild.hp - dmg);
    addLog(`${active.name} hits for ${dmg}${mult > 1 ? ' (super effective!)' : mult < 1 ? ' (not very effective)' : ''}.`);
    const newWild = { ...wild, hp: nhp };
    setWild(newWild);
    if (nhp <= 0) {
      addLog(`${wild.name} fainted! +${wild.level * 8} XP.`);
      const gainedXp = wild.level * 8;
      const newTeam = [...team];
      let updated = { ...active, xp: active.xp + gainedXp };
      while (updated.xp >= updated.level * 15) {
        updated = levelUp(updated);
        addLog(`${updated.name} leveled up! Lv${updated.level}.`);
      }
      newTeam[activeIdx] = updated;
      setTeam(newTeam);
      setTimeout(() => {
        setWild(null);
        setBusy(false);
      }, 600);
      return;
    }
    setTimeout(() => {
      wildAttack(newWild);
    }, 450);
  }

  function wildAttack(w: Mon) {
    if (!w) return;
    const active = team[activeIdx];
    const mult = typeMultiplier(w.type, active.type);
    const dmg = Math.max(1, Math.floor((w.atk + Math.floor(Math.random() * 3)) * mult));
    const nhp = Math.max(0, active.hp - dmg);
    addLog(`${w.name} hits ${active.name} for ${dmg}.`);
    const newTeam = [...team];
    newTeam[activeIdx] = { ...active, hp: nhp };
    setTeam(newTeam);
    if (nhp <= 0) {
      addLog(`${active.name} fainted!`);
      const alive = newTeam.findIndex(m => m.hp > 0);
      if (alive < 0) {
        addLog('You blacked out! Team restored.');
        setTeam(newTeam.map(m => ({ ...m, hp: m.maxHp })));
        setWild(null);
      } else {
        setActiveIdx(alive);
      }
    }
    setBusy(false);
  }

  function tryCatch() {
    if (!wild || balls <= 0 || busy) return;
    setBusy(true);
    setBalls(balls - 1);
    const chance = 0.25 + (1 - wild.hp / wild.maxHp) * 0.55;
    if (Math.random() < chance) {
      addLog(`Caught ${wild.name}!`);
      if (team.length < 6) {
        setTeam([...team, { ...wild, hp: wild.maxHp }]);
      } else {
        addLog('Team full. Released.');
      }
      setWild(null);
      setBusy(false);
    } else {
      addLog(`${wild.name} broke free!`);
      setTimeout(() => wildAttack(wild), 450);
    }
  }

  function flee() {
    if (!wild || busy) return;
    setWild(null);
    addLog('You fled.');
  }

  function heal() {
    setTeam(team.map(m => ({ ...m, hp: m.maxHp })));
    addLog('Team fully healed.');
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-xl flex flex-col gap-3">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Monster Tamer</div>
          <div className="text-xs text-slate-500">Balls: {balls} · Team: {team.length}/6</div>
        </div>

        {wild ? (
          <div className="bg-navy-800/80 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <div className="text-5xl">{wild.emoji}</div>
            <div className="font-bold">{wild.name} Lv{wild.level} ({wild.type})</div>
            <div className="w-full h-2 bg-navy-900 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${(wild.hp / wild.maxHp) * 100}%` }} />
            </div>
            <div className="text-xs text-slate-500">{wild.hp}/{wild.maxHp}</div>
          </div>
        ) : (
          <div className="bg-navy-800/80 border border-white/10 rounded-2xl p-4 text-center text-slate-400">
            <div className="text-4xl">🌲</div>
            <div className="text-sm mt-2">No wild monster. Explore to find one.</div>
          </div>
        )}

        {team[activeIdx] && (
          <div className="bg-navy-800/80 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{team[activeIdx].emoji}</span>
              <div className="flex-1">
                <div className="font-bold">{team[activeIdx].name} Lv{team[activeIdx].level}</div>
                <div className="text-xs text-slate-500">{team[activeIdx].type} · ATK {team[activeIdx].atk}</div>
              </div>
            </div>
            <div className="w-full h-2 bg-navy-900 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${(team[activeIdx].hp / team[activeIdx].maxHp) * 100}%` }} />
            </div>
            <div className="text-xs text-slate-500">HP {team[activeIdx].hp}/{team[activeIdx].maxHp}</div>
            <div className="w-full h-1.5 bg-navy-900 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-yellow-400" style={{ width: `${(team[activeIdx].xp / (team[activeIdx].level * 15)) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="bg-navy-900/70 border border-white/5 rounded-xl p-3 text-xs min-h-[80px]">
          {log.map((l, i) => (
            <div key={i} className="text-slate-300">{l}</div>
          ))}
        </div>

        {wild ? (
          <div className="grid grid-cols-3 gap-2">
            <button onClick={attack} disabled={busy} className="py-3 rounded-xl bg-red-500 text-white font-bold disabled:opacity-50">Attack</button>
            <button onClick={tryCatch} disabled={busy || balls <= 0} className="py-3 rounded-xl bg-accent text-navy-900 font-bold disabled:opacity-50">Catch</button>
            <button onClick={flee} disabled={busy} className="py-3 rounded-xl bg-slate-600 text-white font-bold disabled:opacity-50">Flee</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={explore} className="py-3 rounded-xl bg-accent text-navy-900 font-bold">Explore</button>
            <button onClick={heal} className="py-3 rounded-xl bg-green-500 text-white font-bold">Rest</button>
          </div>
        )}

        {team.length > 1 && (
          <div className="bg-navy-800/50 border border-white/10 rounded-xl p-2 flex gap-2 overflow-x-auto">
            {team.map((m, i) => (
              <button
                key={i}
                onClick={() => m.hp > 0 && setActiveIdx(i)}
                disabled={m.hp <= 0}
                className={`px-2 py-1 rounded-lg text-xs whitespace-nowrap ${i === activeIdx ? 'bg-accent text-navy-900' : 'bg-navy-700 text-slate-300'} ${m.hp <= 0 ? 'opacity-40' : ''}`}
              >
                {m.emoji} Lv{m.level}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
