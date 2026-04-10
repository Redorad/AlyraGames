import React, { useEffect, useCallback } from 'react';
import { create } from 'zustand';

type Cell = 'wall' | 'floor' | 'door' | 'chest' | 'stairs';
type Monster = { id: number; x: number; y: number; hp: number; atk: number; name: string };
type Chest = { x: number; y: number; opened: boolean; loot: string };

const W = 20;
const H = 14;

function makeMap(floor: number): { grid: Cell[][]; monsters: Monster[]; chests: Chest[]; spawn: [number, number]; stairs: [number, number] } {
  const grid: Cell[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => 'wall' as Cell));
  const rooms: { x: number; y: number; w: number; h: number }[] = [];

  const rng = mulberry32(1337 + floor * 97);
  const roomCount = 5 + Math.floor(rng() * 3);
  let tries = 0;
  while (rooms.length < roomCount && tries < 200) {
    tries++;
    const rw = 3 + Math.floor(rng() * 4);
    const rh = 3 + Math.floor(rng() * 3);
    const rx = 1 + Math.floor(rng() * (W - rw - 2));
    const ry = 1 + Math.floor(rng() * (H - rh - 2));
    const overlap = rooms.some(r => rx < r.x + r.w + 1 && rx + rw + 1 > r.x && ry < r.y + r.h + 1 && ry + rh + 1 > r.y);
    if (overlap) continue;
    rooms.push({ x: rx, y: ry, w: rw, h: rh });
    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++)
        grid[y][x] = 'floor';
  }

  // connect rooms with corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    const ax = Math.floor(a.x + a.w / 2);
    const ay = Math.floor(a.y + a.h / 2);
    const bx = Math.floor(b.x + b.w / 2);
    const by = Math.floor(b.y + b.h / 2);
    let cx = ax;
    let cy = ay;
    while (cx !== bx) {
      grid[cy][cx] = 'floor';
      cx += cx < bx ? 1 : -1;
    }
    while (cy !== by) {
      grid[cy][cx] = 'floor';
      cy += cy < by ? 1 : -1;
    }
  }

  const spawn: [number, number] = [Math.floor(rooms[0].x + rooms[0].w / 2), Math.floor(rooms[0].y + rooms[0].h / 2)];
  const lastRoom = rooms[rooms.length - 1];
  const stairs: [number, number] = [Math.floor(lastRoom.x + lastRoom.w / 2), Math.floor(lastRoom.y + lastRoom.h / 2)];
  grid[stairs[1]][stairs[0]] = 'stairs';

  const monsters: Monster[] = [];
  const chests: Chest[] = [];
  let mid = 0;
  for (let i = 1; i < rooms.length; i++) {
    const r = rooms[i];
    const mx = r.x + Math.floor(rng() * r.w);
    const my = r.y + Math.floor(rng() * r.h);
    if (grid[my][mx] === 'floor' && !(mx === stairs[0] && my === stairs[1])) {
      const kind = rng() < 0.5 ? 'Goblin' : rng() < 0.7 ? 'Orc' : 'Skeleton';
      monsters.push({ id: mid++, x: mx, y: my, hp: 4 + floor * 2 + (kind === 'Orc' ? 4 : 0), atk: 1 + Math.floor(floor / 2) + (kind === 'Orc' ? 1 : 0), name: kind });
    }
    if (rng() < 0.5) {
      const cx = r.x + Math.floor(rng() * r.w);
      const cy = r.y + Math.floor(rng() * r.h);
      if (grid[cy][cx] === 'floor' && !(cx === stairs[0] && cy === stairs[1]) && !monsters.some(m => m.x === cx && m.y === cy)) {
        const loots = ['Gold', 'Potion', 'Sword', 'Shield'];
        chests.push({ x: cx, y: cy, opened: false, loot: loots[Math.floor(rng() * loots.length)] });
      }
    }
  }

  return { grid, monsters, chests, spawn, stairs };
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

type State = {
  floor: number;
  grid: Cell[][];
  monsters: Monster[];
  chests: Chest[];
  px: number;
  py: number;
  hp: number;
  maxHp: number;
  atk: number;
  gold: number;
  potions: number;
  log: string[];
  over: boolean;
  won: boolean;
  start: () => void;
  move: (dx: number, dy: number) => void;
  drink: () => void;
  nextFloor: () => void;
};

const useGame = create<State>((set, get) => ({
  floor: 1,
  grid: [],
  monsters: [],
  chests: [],
  px: 0,
  py: 0,
  hp: 20,
  maxHp: 20,
  atk: 3,
  gold: 0,
  potions: 2,
  log: ['You enter the dungeon...'],
  over: false,
  won: false,
  start: () => {
    const m = makeMap(1);
    set({
      floor: 1,
      grid: m.grid,
      monsters: m.monsters,
      chests: m.chests,
      px: m.spawn[0],
      py: m.spawn[1],
      hp: 20,
      maxHp: 20,
      atk: 3,
      gold: 0,
      potions: 2,
      log: ['You enter the dungeon...'],
      over: false,
      won: false,
    });
  },
  move: (dx, dy) => {
    const s = get();
    if (s.over || s.won) return;
    const nx = s.px + dx;
    const ny = s.py + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
    if (s.grid[ny][nx] === 'wall') return;

    const mon = s.monsters.find(m => m.x === nx && m.y === ny);
    const log = [...s.log];
    if (mon) {
      const dmg = s.atk;
      const nhp = mon.hp - dmg;
      log.push(`You hit ${mon.name} for ${dmg}.`);
      let monsters = s.monsters;
      let hp = s.hp;
      let gold = s.gold;
      if (nhp <= 0) {
        log.push(`${mon.name} defeated! +${2 + s.floor} gold.`);
        monsters = s.monsters.filter(m => m.id !== mon.id);
        gold += 2 + s.floor;
      } else {
        monsters = s.monsters.map(m => (m.id === mon.id ? { ...m, hp: nhp } : m));
        hp -= mon.atk;
        log.push(`${mon.name} hits you for ${mon.atk}.`);
      }
      if (hp <= 0) {
        set({ hp: 0, monsters, gold, log: [...log, 'You died!'].slice(-6), over: true });
        return;
      }
      set({ hp, monsters, gold, log: log.slice(-6) });
      return;
    }

    const chest = s.chests.find(c => c.x === nx && c.y === ny && !c.opened);
    let potions = s.potions;
    let atk = s.atk;
    let maxHp = s.maxHp;
    let hp = s.hp;
    let gold = s.gold;
    let chests = s.chests;
    if (chest) {
      chests = s.chests.map(c => (c === chest ? { ...c, opened: true } : c));
      if (chest.loot === 'Gold') {
        gold += 5 + s.floor * 2;
        log.push(`Chest: +${5 + s.floor * 2} gold.`);
      } else if (chest.loot === 'Potion') {
        potions += 1;
        log.push('Chest: +1 potion.');
      } else if (chest.loot === 'Sword') {
        atk += 1;
        log.push('Chest: +1 Attack.');
      } else {
        maxHp += 3;
        hp = Math.min(maxHp, hp + 3);
        log.push('Chest: +3 Max HP.');
      }
    }

    // monsters move toward player
    let monsters = s.monsters.map(m => {
      const dist = Math.abs(m.x - nx) + Math.abs(m.y - ny);
      if (dist > 6) return m;
      const dxm = Math.sign(nx - m.x);
      const dym = Math.sign(ny - m.y);
      let mx = m.x;
      let my = m.y;
      if (dxm !== 0 && s.grid[m.y][m.x + dxm] !== 'wall' && !s.monsters.some(mm => mm.id !== m.id && mm.x === m.x + dxm && mm.y === m.y) && !(m.x + dxm === nx && m.y === ny)) {
        mx = m.x + dxm;
      } else if (dym !== 0 && s.grid[m.y + dym][m.x] !== 'wall' && !s.monsters.some(mm => mm.id !== m.id && mm.x === m.x && mm.y === m.y + dym) && !(m.x === nx && m.y + dym === ny)) {
        my = m.y + dym;
      }
      return { ...m, x: mx, y: my };
    });

    // adjacent monster attacks
    for (const m of monsters) {
      if (Math.abs(m.x - nx) + Math.abs(m.y - ny) === 1) {
        hp -= m.atk;
        log.push(`${m.name} hits you for ${m.atk}.`);
      }
    }
    if (hp <= 0) {
      set({ px: nx, py: ny, monsters, chests, hp: 0, maxHp, atk, gold, potions, log: [...log, 'You died!'].slice(-6), over: true });
      return;
    }

    // stairs
    if (s.grid[ny][nx] === 'stairs') {
      log.push(`Reached floor ${s.floor + 1}!`);
      if (s.floor >= 5) {
        set({ px: nx, py: ny, monsters, chests, hp, maxHp, atk, gold, potions, log: [...log, 'You conquered the dungeon!'].slice(-6), won: true });
        return;
      }
    }

    set({ px: nx, py: ny, monsters, chests, hp, maxHp, atk, gold, potions, log: log.slice(-6) });
  },
  drink: () => {
    const s = get();
    if (s.potions <= 0 || s.hp >= s.maxHp) return;
    const heal = 8;
    set({ hp: Math.min(s.maxHp, s.hp + heal), potions: s.potions - 1, log: [...s.log, `You drink a potion (+${heal} HP).`].slice(-6) });
  },
  nextFloor: () => {
    const s = get();
    const nf = s.floor + 1;
    const m = makeMap(nf);
    set({ floor: nf, grid: m.grid, monsters: m.monsters, chests: m.chests, px: m.spawn[0], py: m.spawn[1], log: [...s.log, `Floor ${nf}.`].slice(-6) });
  },
}));

export default function App() {
  const s = useGame();

  useEffect(() => {
    if (s.grid.length === 0) s.start();
    // eslint-disable-next-line
  }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (s.over || s.won) return;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.move(0, -1);
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') s.move(0, 1);
    else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.move(-1, 0);
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.move(1, 0);
    else if (e.key === ' ') { if (s.grid[s.py][s.px] === 'stairs' && !s.won) s.nextFloor(); }
    else if (e.key === 'q' || e.key === 'Q') s.drink();
  }, [s]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (s.grid.length === 0) return null;

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-steel font-bold">Floor {s.floor}</span>
          <span className="text-red-400">HP {s.hp}/{s.maxHp}</span>
          <span className="text-accent">ATK {s.atk}</span>
          <span className="text-yellow-400">Gold {s.gold}</span>
          <span className="text-green-400">Potions {s.potions}</span>
        </div>
        <div className="inline-block rounded-lg border border-white/10 bg-navy-800/60 p-2">
          {s.grid.map((row, y) => (
            <div key={y} className="flex">
              {row.map((c, x) => {
                const isPlayer = s.px === x && s.py === y;
                const mon = s.monsters.find(m => m.x === x && m.y === y);
                const chest = s.chests.find(ch => ch.x === x && ch.y === y && !ch.opened);
                let bg = 'bg-navy-900';
                let char = ' ';
                let color = 'text-slate-200';
                if (c === 'wall') {
                  bg = 'bg-navy-700';
                } else if (c === 'stairs') {
                  bg = 'bg-navy-800';
                  char = '>';
                  color = 'text-accent';
                }
                if (chest) {
                  char = 'C';
                  color = 'text-yellow-400';
                }
                if (mon) {
                  char = mon.name[0];
                  color = 'text-red-400';
                }
                if (isPlayer) {
                  char = '@';
                  color = 'text-steel';
                }
                return (
                  <div key={x} className={`w-6 h-6 flex items-center justify-center font-mono text-sm ${bg} ${color}`}>
                    {char}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="w-full max-w-lg bg-navy-800/60 border border-white/10 rounded-lg p-2 text-xs min-h-[80px]">
          {s.log.map((l, i) => (
            <div key={i} className="text-slate-300">{l}</div>
          ))}
        </div>
        <div className="text-xs text-slate-500">Arrows/WASD move. Q drink potion. Space descend stairs.</div>
        {(s.over || s.won) && (
          <button onClick={s.start} className="px-4 py-2 rounded-lg bg-accent text-navy-900 font-bold">
            {s.won ? 'Victory! Play Again' : 'Game Over - Retry'}
          </button>
        )}
      </div>
    </div>
  );
}
