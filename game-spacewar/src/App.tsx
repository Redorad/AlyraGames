import React, { useEffect, useRef, useState } from 'react';

const W = 640;
const H = 480;

type Vec = { x: number; y: number };
type Bullet = { pos: Vec; vel: Vec; from: 'p' | 'e'; dmg: number };
type Enemy = { pos: Vec; vel: Vec; hp: number; maxHp: number; r: number; shootT: number; type: number };
type Boss = { pos: Vec; hp: number; maxHp: number; dir: number; shootT: number; phase: number };
type Star = { x: number; y: number; z: number };

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<any>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const [ui, setUi] = useState({ hp: 100, score: 0, wave: 1, over: false, bossHp: 0, bossActive: false });

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; if (e.key === ' ') e.preventDefault(); };
    const ku = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  function reset() {
    const stars: Star[] = [];
    for (let i = 0; i < 80; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() * 1.5 });
    stateRef.current = {
      p: { x: W / 2, y: H - 50 },
      hp: 100,
      maxHp: 100,
      bullets: [] as Bullet[],
      enemies: [] as Enemy[],
      stars,
      boss: null as Boss | null,
      score: 0,
      wave: 1,
      spawnT: 0,
      waveT: 0,
      fireT: 0,
      over: false,
      waveKills: 0,
      waveTotal: 8,
    };
    setUi({ hp: 100, score: 0, wave: 1, over: false, bossHp: 0, bossActive: false });
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
      if (!s) return;
      if (s.over) { draw(ctx, s); return; }

      // stars
      for (const st of s.stars) {
        st.y += st.z * 2;
        if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
      }

      // player movement
      const k = keysRef.current;
      const spd = 4;
      if (k['a'] || k['arrowleft']) s.p.x -= spd;
      if (k['d'] || k['arrowright']) s.p.x += spd;
      if (k['w'] || k['arrowup']) s.p.y -= spd;
      if (k['s'] || k['arrowdown']) s.p.y += spd;
      s.p.x = Math.max(12, Math.min(W - 12, s.p.x));
      s.p.y = Math.max(12, Math.min(H - 12, s.p.y));

      // fire
      s.fireT--;
      if ((k[' '] || k['space']) && s.fireT <= 0) {
        s.bullets.push({ pos: { x: s.p.x, y: s.p.y - 16 }, vel: { x: 0, y: -8 }, from: 'p', dmg: 10 });
        s.fireT = 10;
      }

      // wave spawn
      if (!s.boss && s.enemies.length === 0 && s.waveKills >= s.waveTotal) {
        s.wave += 1;
        s.waveKills = 0;
        s.waveTotal = 6 + s.wave * 2;
        if (s.wave % 3 === 0) {
          const bossHp = 120 + s.wave * 30;
          s.boss = { pos: { x: W / 2, y: 80 }, hp: bossHp, maxHp: bossHp, dir: 1, shootT: 40, phase: 0 };
        }
      }

      if (!s.boss) {
        s.spawnT--;
        if (s.spawnT <= 0 && s.waveKills < s.waveTotal) {
          s.spawnT = 50;
          const type = Math.random() < 0.2 ? 1 : 0;
          s.enemies.push({
            pos: { x: Math.random() * (W - 40) + 20, y: -20 },
            vel: { x: (Math.random() - 0.5) * 1.5, y: 1 + Math.random() * 0.5 + s.wave * 0.1 },
            hp: type === 1 ? 30 : 10,
            maxHp: type === 1 ? 30 : 10,
            r: type === 1 ? 18 : 12,
            shootT: 60 + Math.random() * 60,
            type,
          });
        }
      }

      // move enemies
      for (const e of s.enemies) {
        e.pos.x += e.vel.x;
        e.pos.y += e.vel.y;
        if (e.pos.x < 10 || e.pos.x > W - 10) e.vel.x *= -1;
        e.shootT--;
        if (e.shootT <= 0) {
          e.shootT = 80 + Math.random() * 80;
          const dx = s.p.x - e.pos.x;
          const dy = s.p.y - e.pos.y;
          const d = Math.hypot(dx, dy) || 1;
          s.bullets.push({ pos: { ...e.pos }, vel: { x: (dx / d) * 3.5, y: (dy / d) * 3.5 }, from: 'e', dmg: 8 });
        }
      }
      s.enemies = s.enemies.filter((e: Enemy) => e.pos.y < H + 30);

      // boss
      if (s.boss) {
        s.boss.pos.x += s.boss.dir * 1.5;
        if (s.boss.pos.x < 60 || s.boss.pos.x > W - 60) s.boss.dir *= -1;
        s.boss.shootT--;
        if (s.boss.shootT <= 0) {
          s.boss.shootT = 30;
          // fire a fan of bullets
          for (let i = -2; i <= 2; i++) {
            s.bullets.push({ pos: { ...s.boss.pos }, vel: { x: i * 1.5, y: 3 }, from: 'e', dmg: 10 });
          }
        }
      }

      // bullets
      for (const b of s.bullets) {
        b.pos.x += b.vel.x;
        b.pos.y += b.vel.y;
      }
      // hit detection
      for (const b of s.bullets) {
        if (b.from === 'p') {
          for (const e of s.enemies) {
            if (Math.hypot(e.pos.x - b.pos.x, e.pos.y - b.pos.y) < e.r) {
              e.hp -= b.dmg;
              b.pos.y = -100;
              break;
            }
          }
          if (s.boss && Math.hypot(s.boss.pos.x - b.pos.x, s.boss.pos.y - b.pos.y) < 30) {
            s.boss.hp -= b.dmg;
            b.pos.y = -100;
          }
        } else {
          if (Math.hypot(s.p.x - b.pos.x, s.p.y - b.pos.y) < 12) {
            s.hp -= b.dmg;
            b.pos.y = H + 100;
          }
        }
      }
      s.bullets = s.bullets.filter((b: Bullet) => b.pos.y > -50 && b.pos.y < H + 50 && b.pos.x > -50 && b.pos.x < W + 50);

      // enemy collision with player
      for (const e of s.enemies) {
        if (Math.hypot(e.pos.x - s.p.x, e.pos.y - s.p.y) < e.r + 10) {
          s.hp -= 15;
          e.hp = 0;
        }
      }

      // dead enemies
      for (const e of s.enemies) {
        if (e.hp <= 0) {
          s.score += e.type === 1 ? 25 : 10;
          s.waveKills += 1;
        }
      }
      s.enemies = s.enemies.filter((e: Enemy) => e.hp > 0);

      // boss dead
      if (s.boss && s.boss.hp <= 0) {
        s.score += 200;
        s.boss = null;
        s.waveKills = s.waveTotal;
      }

      if (s.hp <= 0) {
        s.hp = 0;
        s.over = true;
      }

      setUi({ hp: Math.ceil(s.hp), score: s.score, wave: s.wave, over: s.over, bossHp: s.boss ? Math.ceil(s.boss.hp) : 0, bossActive: !!s.boss });
      draw(ctx, s);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  function draw(ctx: CanvasRenderingContext2D, s: any) {
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = 'white';
    for (const st of s.stars) {
      ctx.globalAlpha = 0.3 + st.z * 0.4;
      ctx.fillRect(st.x, st.y, 1.5 * st.z, 1.5 * st.z);
    }
    ctx.globalAlpha = 1;

    // enemies
    for (const e of s.enemies) {
      ctx.fillStyle = e.type === 1 ? '#f87171' : '#fb923c';
      ctx.beginPath();
      ctx.moveTo(e.pos.x, e.pos.y - e.r);
      ctx.lineTo(e.pos.x + e.r, e.pos.y + e.r);
      ctx.lineTo(e.pos.x - e.r, e.pos.y + e.r);
      ctx.closePath();
      ctx.fill();
    }

    // boss
    if (s.boss) {
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(s.boss.pos.x - 50, s.boss.pos.y - 25, 100, 50);
      ctx.fillStyle = '#fecaca';
      ctx.fillRect(s.boss.pos.x - 10, s.boss.pos.y - 5, 20, 10);
    }

    // bullets
    for (const b of s.bullets) {
      ctx.fillStyle = b.from === 'p' ? '#7ec8e3' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // player
    ctx.fillStyle = '#7ec8e3';
    ctx.beginPath();
    ctx.moveTo(s.p.x, s.p.y - 14);
    ctx.lineTo(s.p.x + 12, s.p.y + 12);
    ctx.lineTo(s.p.x, s.p.y + 6);
    ctx.lineTo(s.p.x - 12, s.p.y + 12);
    ctx.closePath();
    ctx.fill();
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className="flex flex-col items-center gap-2">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Space War</div>
          <div className="text-xs text-slate-500">WASD/Arrows move · Space to fire · Boss every 3 waves</div>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-red-400">HP {ui.hp}</span>
          <span className="text-accent">Wave {ui.wave}</span>
          <span className="text-yellow-300">Score {ui.score}</span>
          {ui.bossActive && <span className="text-purple-400">BOSS {ui.bossHp}</span>}
        </div>
        <div className="relative rounded-xl border border-white/10 overflow-hidden">
          <canvas ref={canvasRef} width={W} height={H} />
          {ui.over && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
              <div className="text-2xl font-bold text-red-400">Destroyed</div>
              <div className="text-sm text-slate-300">Final score: {ui.score}</div>
              <button onClick={reset} className="px-5 py-2 rounded-lg bg-accent text-navy-900 font-bold">Retry</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
