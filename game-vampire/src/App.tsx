import React, { useEffect, useRef, useState } from 'react';

type Vec = { x: number; y: number };
type Enemy = { pos: Vec; hp: number; maxHp: number; spd: number; r: number; type: number };
type Bullet = { pos: Vec; vel: Vec; dmg: number; life: number; from: 'auto' | 'orbit' };
type Xp = { pos: Vec; amount: number };

const W = 640;
const H = 420;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<any>(null);
  const [ui, setUi] = useState({ hp: 100, xp: 0, level: 1, time: 0, over: false, paused: false, score: 0 });
  const [levelUp, setLevelUp] = useState<string[] | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const keys = keysRef.current;
    const kd = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const ku = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  function reset() {
    stateRef.current = {
      p: { x: W / 2, y: H / 2 },
      hp: 100,
      maxHp: 100,
      spd: 2.2,
      xp: 0,
      xpNext: 5,
      level: 1,
      enemies: [] as Enemy[],
      bullets: [] as Bullet[],
      xpOrbs: [] as Xp[],
      spawnT: 0,
      shootT: 0,
      time: 0,
      score: 0,
      over: false,
      atk: 10,
      fireRate: 45,
      orbitCount: 0,
      orbitT: 0,
      pickup: 24,
      lastDir: { x: 1, y: 0 },
    };
    setUi({ hp: 100, xp: 0, level: 1, time: 0, over: false, paused: false, score: 0 });
    setLevelUp(null);
  }

  useEffect(() => { reset(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = stateRef.current;
      if (!s || s.over || levelUp) {
        draw(ctx, s);
        return;
      }
      s.time += 1 / 60;
      // movement
      let dx = 0, dy = 0;
      const k = keysRef.current;
      if (k['w'] || k['arrowup']) dy -= 1;
      if (k['s'] || k['arrowdown']) dy += 1;
      if (k['a'] || k['arrowleft']) dx -= 1;
      if (k['d'] || k['arrowright']) dx += 1;
      if (dx || dy) {
        const l = Math.hypot(dx, dy);
        dx /= l; dy /= l;
        s.p.x = Math.max(10, Math.min(W - 10, s.p.x + dx * s.spd));
        s.p.y = Math.max(10, Math.min(H - 10, s.p.y + dy * s.spd));
        s.lastDir = { x: dx, y: dy };
      }

      // spawn enemies
      s.spawnT--;
      if (s.spawnT <= 0) {
        s.spawnT = Math.max(20, 60 - Math.floor(s.time / 5));
        const side = Math.floor(Math.random() * 4);
        let x = 0, y = 0;
        if (side === 0) { x = -20; y = Math.random() * H; }
        else if (side === 1) { x = W + 20; y = Math.random() * H; }
        else if (side === 2) { x = Math.random() * W; y = -20; }
        else { x = Math.random() * W; y = H + 20; }
        const type = Math.random() < 0.15 ? 1 : 0;
        const hp = type === 1 ? 30 + Math.floor(s.time / 10) * 5 : 10 + Math.floor(s.time / 15) * 3;
        s.enemies.push({ pos: { x, y }, hp, maxHp: hp, spd: type === 1 ? 0.8 : 1.2, r: type === 1 ? 12 : 8, type });
      }

      // move enemies
      for (const e of s.enemies) {
        const dxe = s.p.x - e.pos.x;
        const dye = s.p.y - e.pos.y;
        const d = Math.hypot(dxe, dye) || 1;
        e.pos.x += (dxe / d) * e.spd;
        e.pos.y += (dye / d) * e.spd;
        if (d < e.r + 10) {
          s.hp -= 0.3;
        }
      }

      // auto shoot at nearest enemy
      s.shootT--;
      if (s.shootT <= 0 && s.enemies.length > 0) {
        s.shootT = s.fireRate;
        let best: Enemy | null = null;
        let bd = Infinity;
        for (const e of s.enemies) {
          const d = Math.hypot(e.pos.x - s.p.x, e.pos.y - s.p.y);
          if (d < bd) { bd = d; best = e; }
        }
        if (best) {
          const dxe = best.pos.x - s.p.x;
          const dye = best.pos.y - s.p.y;
          const d = Math.hypot(dxe, dye) || 1;
          s.bullets.push({ pos: { x: s.p.x, y: s.p.y }, vel: { x: (dxe / d) * 5, y: (dye / d) * 5 }, dmg: s.atk, life: 80, from: 'auto' });
        }
      }

      // orbit attack
      if (s.orbitCount > 0) {
        s.orbitT += 0.05;
        for (let i = 0; i < s.orbitCount; i++) {
          const ang = s.orbitT + (i / s.orbitCount) * Math.PI * 2;
          const ox = s.p.x + Math.cos(ang) * 40;
          const oy = s.p.y + Math.sin(ang) * 40;
          for (const e of s.enemies) {
            if (Math.hypot(e.pos.x - ox, e.pos.y - oy) < 10 + e.r) {
              e.hp -= 0.3;
            }
          }
        }
      }

      // bullets
      for (const b of s.bullets) {
        b.pos.x += b.vel.x;
        b.pos.y += b.vel.y;
        b.life--;
        for (const e of s.enemies) {
          if (Math.hypot(e.pos.x - b.pos.x, e.pos.y - b.pos.y) < e.r + 4) {
            e.hp -= b.dmg;
            b.life = 0;
            break;
          }
        }
      }
      s.bullets = s.bullets.filter((b: Bullet) => b.life > 0 && b.pos.x >= 0 && b.pos.x <= W && b.pos.y >= 0 && b.pos.y <= H);

      // dead enemies -> xp
      for (const e of s.enemies) {
        if (e.hp <= 0) {
          s.xpOrbs.push({ pos: { ...e.pos }, amount: e.type === 1 ? 3 : 1 });
          s.score += e.type === 1 ? 20 : 5;
        }
      }
      s.enemies = s.enemies.filter((e: Enemy) => e.hp > 0);

      // pickup xp
      for (const o of s.xpOrbs) {
        const d = Math.hypot(o.pos.x - s.p.x, o.pos.y - s.p.y);
        if (d < s.pickup) {
          const dxp = s.p.x - o.pos.x;
          const dyp = s.p.y - o.pos.y;
          const dd = Math.hypot(dxp, dyp) || 1;
          o.pos.x += (dxp / dd) * 3;
          o.pos.y += (dyp / dd) * 3;
        }
        if (d < 10) {
          s.xp += o.amount;
          o.amount = 0;
        }
      }
      s.xpOrbs = s.xpOrbs.filter((o: Xp) => o.amount > 0);

      // level up
      if (s.xp >= s.xpNext) {
        s.xp -= s.xpNext;
        s.level += 1;
        s.xpNext = Math.floor(s.xpNext * 1.5);
        const options = pickUpgrades();
        setLevelUp(options);
      }

      if (s.hp <= 0) {
        s.hp = 0;
        s.over = true;
      }

      setUi({ hp: Math.ceil(s.hp), xp: s.xp, level: s.level, time: Math.floor(s.time), over: s.over, paused: false, score: s.score });

      draw(ctx, s);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [levelUp]);

  function pickUpgrades(): string[] {
    const pool = ['+Damage', '+Fire Rate', '+Max HP', '+Speed', '+Orbit', '+Pickup'];
    const out: string[] = [];
    while (out.length < 3) {
      const c = pool[Math.floor(Math.random() * pool.length)];
      if (!out.includes(c)) out.push(c);
    }
    return out;
  }

  function applyUpgrade(u: string) {
    const s = stateRef.current;
    if (u === '+Damage') s.atk += 5;
    else if (u === '+Fire Rate') s.fireRate = Math.max(10, s.fireRate - 8);
    else if (u === '+Max HP') { s.maxHp += 20; s.hp += 20; }
    else if (u === '+Speed') s.spd += 0.4;
    else if (u === '+Orbit') s.orbitCount += 1;
    else if (u === '+Pickup') s.pickup += 16;
    setLevelUp(null);
  }

  function draw(ctx: CanvasRenderingContext2D, s: any) {
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = 'rgba(126,200,227,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    if (!s) return;

    // xp orbs
    for (const o of s.xpOrbs) {
      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.arc(o.pos.x, o.pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // enemies
    for (const e of s.enemies) {
      ctx.fillStyle = e.type === 1 ? '#ef4444' : '#f97316';
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // bullets
    ctx.fillStyle = '#7ec8e3';
    for (const b of s.bullets) {
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // orbit
    if (s.orbitCount > 0) {
      ctx.fillStyle = '#a78bfa';
      for (let i = 0; i < s.orbitCount; i++) {
        const ang = s.orbitT + (i / s.orbitCount) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(s.p.x + Math.cos(ang) * 40, s.p.y + Math.sin(ang) * 40, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // player
    ctx.fillStyle = '#7ec8e3';
    ctx.beginPath();
    ctx.arc(s.p.x, s.p.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Vampire Night</div>
          <div className="text-xs text-slate-500">WASD to move · Auto attack · Survive as long as you can</div>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="text-red-400">HP {ui.hp}</span>
          <span className="text-accent">Lv {ui.level}</span>
          <span className="text-yellow-300">XP {ui.xp}</span>
          <span className="text-steel">Time {ui.time}s</span>
          <span className="text-slate-400">Score {ui.score}</span>
        </div>
        <div className="relative rounded-xl border border-white/10 overflow-hidden">
          <canvas ref={canvasRef} width={W} height={H} />
          {ui.over && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
              <div className="text-2xl font-bold text-red-400">You perished</div>
              <div className="text-sm text-slate-300">Score: {ui.score}</div>
              <button onClick={reset} className="px-5 py-2 rounded-lg bg-accent text-navy-900 font-bold">Retry</button>
            </div>
          )}
          {levelUp && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
              <div className="text-xl font-bold text-accent">Level Up!</div>
              <div className="flex gap-2">
                {levelUp.map(o => (
                  <button key={o} onClick={() => applyUpgrade(o)} className="px-4 py-3 rounded-xl bg-navy-700 border border-accent text-steel font-bold hover:bg-navy-600">{o}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
