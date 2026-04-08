import type {
  TowerDef,
  TowerInstance,
  EnemyInstance,
  Projectile,
  LevelDef,
  GameState,
} from "../types";
import { TOWER_DEFS, getTowerDamage, getTowerRange, getTowerAttackSpeed, getUpgradeCost, getSellValue } from "../data/towers";
import { ENEMY_DEFS } from "../data/enemies";
import * as sfx from "../utils/sounds";

const TOWER_EMOJI: Record<string, string> = {
  goblin: "\u{1F3F9}", ranga: "\u{1F43A}", shion: "\u{2694}\u{FE0F}",
  benimaru: "\u{1F525}", souei: "\u{1F578}\u{FE0F}", shuna: "\u{1F338}",
  hakurou: "\u{1F3AF}", geld: "\u{1F6E1}\u{FE0F}", diablo: "\u{1F608}",
  rimuru: "\u{1F9CA}",
};

const ENEMY_EMOJI: Record<string, string> = {
  direwolf: "\u{1F43A}", orc: "\u{1F479}", orcCaptain: "\u{1F47A}",
  ogre: "\u{1F4AA}", lizardman: "\u{1F98E}", shadow: "\u{1F47B}",
  holyKnight: "\u{1F6E1}\u{FE0F}", otherworlder: "\u{1F300}", demon: "\u{1F47F}",
  gabiru: "\u{1F40A}", gelmud: "\u{1F9DF}", clayman: "\u{1F3AD}",
  hinata: "\u{2694}\u{FE0F}", milim: "\u{1F4A5}", charybdis: "\u{1F30A}",
};

/* ═══════════════════════════════════════════════════════════
   GameEngine — handles logic, spawning, and canvas rendering
   ═══════════════════════════════════════════════════════════ */

export class GameEngine {
  /* ── refs ─────────────────────────── */
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  /* ── level ───────────────────────── */
  private level: LevelDef;
  private availableTowerIds: string[];

  /* ── game state ──────────────────── */
  private towers: TowerInstance[] = [];
  private enemies: EnemyInstance[] = [];
  private projectiles: Projectile[] = [];
  private gold = 0;
  private lives = 0;
  private maxLives = 0;
  private currentWave = 0;
  private waveActive = false;
  private gameStatus: "playing" | "won" | "lost" = "playing";
  private speed = 1;

  /* ── spawn queue ─────────────────── */
  private spawnQueue: { defId: string; delay: number }[] = [];
  private spawnTimer = 0;

  /* ── UI state ────────────────────── */
  private selectedTowerDef: TowerDef | null = null;
  private selectedTower: TowerInstance | null = null;

  /* ── IDs ─────────────────────────── */
  private nextId = 1;
  private lastShootSound = 0;

  /* ── particles ────────────────────── */
  private particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[] = [];
  private frameCount = 0;

  /* ── rendering ───────────────────── */
  private cellSize = 0;
  private cols = 0;
  private rows = 0;
  private animFrame = 0;
  private lastTime = 0;
  private running = false;
  private gridCache: ImageBitmap | null = null;
  private gridDirty = true;

  /* ── mode ─────────────────────────── */
  private hardMode: boolean;

  /* ── callback ────────────────────── */
  private onUpdate: (s: GameState) => void;

  /* ══════════════════════════════════════════════════════ */
  constructor(
    canvas: HTMLCanvasElement,
    level: LevelDef,
    availableTowerIds: string[],
    onUpdate: (s: GameState) => void,
    hardMode = false,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.level = level;
    this.availableTowerIds = availableTowerIds;
    this.onUpdate = onUpdate;
    this.hardMode = hardMode;

    this.rows = level.grid.length;
    this.cols = level.grid[0].length;
    // Hard mode: same gold, fewer lives
    this.gold = level.startGold;
    this.lives = hardMode ? Math.max(3, Math.floor(level.lives * 0.6)) : level.lives;
    this.maxLives = this.lives;

    this.resize();
    this.emitState();
  }

  /* ── public API ──────────────────────────────────────── */

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.animFrame = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
  }

  resize() {
    const parent = this.canvas.parentElement!;
    const maxW = parent.clientWidth;
    const maxH = parent.clientHeight;
    // Fit grid in available space using whichever dimension is tighter
    const cellByW = Math.floor(maxW / this.cols);
    const cellByH = Math.floor(maxH / this.rows);
    this.cellSize = Math.max(1, Math.min(cellByW, cellByH));
    const canvasW = this.cellSize * this.cols;
    const canvasH = this.cellSize * this.rows;
    this.canvas.width = canvasW * devicePixelRatio;
    this.canvas.height = canvasH * devicePixelRatio;
    this.canvas.style.width = `${canvasW}px`;
    this.canvas.style.height = `${canvasH}px`;
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    this.gridDirty = true;
    this.render();
  }

  selectTowerDef(def: TowerDef | null) {
    this.selectedTowerDef = def;
    this.selectedTower = null;
    this.emitState();
  }

  handleClick(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

    // Check if clicking an existing tower
    const existing = this.towers.find((t) => t.col === col && t.row === row);
    if (existing) {
      this.selectedTower = this.selectedTower?.id === existing.id ? null : existing;
      this.selectedTowerDef = null;
      this.emitState();
      return;
    }

    // Place tower (only between waves)
    if (this.selectedTowerDef && this.level.grid[row][col] === 0 && !this.waveActive) {
      const def = this.selectedTowerDef;
      if (this.gold < def.cost) return;

      this.gold -= def.cost;
      const tower: TowerInstance = {
        id: this.nextId++,
        defId: def.id,
        col,
        row,
        level: 1,
        cooldown: 0,
        buffMultiplier: 1,
      };
      this.towers.push(tower);
      this.recalcBuffs();
      sfx.playPlace();
      this.emitState();
      return;
    }

    // Deselect
    this.selectedTower = null;
    this.selectedTowerDef = null;
    this.emitState();
  }

  startWave() {
    if (this.waveActive || this.gameStatus !== "playing") return;
    if (this.currentWave >= this.level.waves.length) return;

    const wave = this.level.waves[this.currentWave];
    this.spawnQueue = [];

    for (const group of wave.groups) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          defId: group.enemyId,
          delay: i * group.interval,
        });
      }
    }

    // Sort by delay so they spawn in order
    this.spawnQueue.sort((a, b) => a.delay - b.delay);
    this.spawnTimer = 0;
    this.waveActive = true;
    sfx.playWaveStart();
    this.emitState();
  }

  upgradeTower() {
    if (!this.selectedTower) return;
    const def = TOWER_DEFS[this.selectedTower.defId];
    const cost = getUpgradeCost(def, this.selectedTower.level);
    if (this.selectedTower.level >= 3 || this.gold < cost) return;

    this.gold -= cost;
    this.selectedTower.level++;
    this.recalcBuffs();
    sfx.playUpgrade();
    this.emitState();
  }

  sellTower() {
    if (!this.selectedTower) return;
    const def = TOWER_DEFS[this.selectedTower.defId];
    this.gold += getSellValue(def, this.selectedTower.level);
    this.towers = this.towers.filter((t) => t.id !== this.selectedTower!.id);
    this.selectedTower = null;
    this.recalcBuffs();
    sfx.playSell();
    this.emitState();
  }

  setSpeed(s: number) {
    this.speed = s;
  }

  getCanvasHeight(): number {
    return this.cellSize * this.rows;
  }

  private spawnParticles(x: number, y: number, color: string, count: number, speed = 2, size = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.5 + Math.random()) * speed;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color,
        size: size * (0.5 + Math.random() * 0.5),
      });
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 2 * dt; // gravity
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  /* ── main loop ───────────────────────────────────────── */

  private loop(time: number) {
    if (!this.running) return;
    const raw = (time - this.lastTime) / 1000;
    const dt = Math.min(raw, 0.1) * this.speed;
    this.lastTime = time;

    if (this.gameStatus === "playing") {
      this.updateSpawner(dt);
      this.updateEnemies(dt);
      this.updateTowers(dt);
      this.updateProjectiles(dt);
      this.updateParticles(dt);
      this.checkWaveEnd();
    } else {
      this.updateParticles(dt);
    }
    this.frameCount++;

    this.render();
    this.animFrame = requestAnimationFrame((t) => this.loop(t));
  }

  /* ── spawner ─────────────────────────────────────────── */

  private updateSpawner(dt: number) {
    if (!this.waveActive || this.spawnQueue.length === 0) return;

    this.spawnTimer += dt;

    while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].delay) {
      const entry = this.spawnQueue.shift()!;
      this.spawnEnemy(entry.defId);
    }
  }

  private spawnEnemy(defId: string) {
    const def = ENEMY_DEFS[defId];
    if (!def) return;
    const start = this.level.path[0];
    // Hard mode: 1.8x HP, 15% faster, +1 armor
    const hpMult = this.hardMode ? 1.8 : 1;
    const spdMult = this.hardMode ? 1.15 : 1;
    const armorBonus = this.hardMode ? 1 : 0;
    const hp = Math.round(def.hp * hpMult);
    const enemy: EnemyInstance = {
      id: this.nextId++,
      defId,
      hp,
      maxHp: hp,
      x: start.col + 0.5,
      y: start.row + 0.5,
      speed: def.speed * spdMult,
      pathIndex: 1,
      reward: def.reward,
      armor: def.armor + armorBonus,
      slowTimer: 0,
      slowFactor: 0,
      dead: false,
      isBoss: def.isBoss,
    };
    this.enemies.push(enemy);
  }

  /* ── enemy movement ──────────────────────────────────── */

  private updateEnemies(dt: number) {
    for (const e of this.enemies) {
      if (e.dead) continue;

      let spd = e.speed;
      if (e.slowTimer > 0) {
        spd *= 1 - e.slowFactor;
        e.slowTimer -= dt;
      }

      const wp = this.level.path[e.pathIndex];
      if (!wp) {
        // Reached end
        this.lives = Math.max(0, this.lives - (e.isBoss ? 3 : 1));
        e.dead = true;
        sfx.playLeak();
        this.emitState();
        if (this.lives <= 0) {
          this.gameStatus = "lost";
          sfx.playDefeat();
          this.emitState();
        }
        continue;
      }

      const tx = wp.col + 0.5;
      const ty = wp.row + 0.5;
      const dx = tx - e.x;
      const dy = ty - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = spd * dt;

      if (dist <= step) {
        e.x = tx;
        e.y = ty;
        e.pathIndex++;
      } else {
        e.x += (dx / dist) * step;
        e.y += (dy / dist) * step;
      }
    }

    this.enemies = this.enemies.filter((e) => !e.dead);
  }

  /* ── towers ──────────────────────────────────────────── */

  private updateTowers(dt: number) {
    for (const tower of this.towers) {
      const def = TOWER_DEFS[tower.defId];

      // Shuna — passive buff, no attack
      if (def.special === "buff") continue;

      // Geld — aura damage
      if (def.special === "aura") {
        this.applyAura(tower, dt);
        continue;
      }

      if (def.attackSpeed === 0) continue;

      tower.cooldown -= dt;
      if (tower.cooldown > 0) continue;

      const target = this.findTarget(tower, def);
      if (!target) continue;

      const atkSpd = getTowerAttackSpeed(def, tower.level);
      tower.cooldown = 1 / atkSpd;

      let dmg = getTowerDamage(def, tower.level) * tower.buffMultiplier;
      let isCrit = false;
      if (def.special === "crit" && Math.random() < (def.specialValue ?? 0)) {
        isCrit = true;
      }

      this.projectiles.push({
        id: this.nextId++,
        x: tower.col + 0.5,
        y: tower.row + 0.5,
        targetId: target.id,
        damage: dmg,
        speed: 8,
        color: def.color,
        splashRadius: def.special === "splash" || def.special === "predator" ? def.specialValue : undefined,
        slowAmount: def.special === "slow" ? def.specialValue : def.special === "predator" ? 0.3 : undefined,
        isCrit,
        dead: false,
      });

      // Throttled shoot sound (~5 per second max)
      const now = performance.now();
      if (now - this.lastShootSound > 200) {
        this.lastShootSound = now;
        sfx.playShoot();
      }
    }
  }

  private findTarget(tower: TowerInstance, def: TowerDef): EnemyInstance | undefined {
    const range = getTowerRange(def, tower.level);
    const tx = tower.col + 0.5;
    const ty = tower.row + 0.5;

    let best: EnemyInstance | undefined;

    if (def.special === "priority") {
      let maxHp = 0;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - tx, e.y - ty);
        if (d <= range && e.hp > maxHp) {
          maxHp = e.hp;
          best = e;
        }
      }
    } else {
      // Target furthest along path
      let maxProgress = -1;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - tx, e.y - ty);
        if (d <= range && e.pathIndex > maxProgress) {
          maxProgress = e.pathIndex;
          best = e;
        }
      }
    }

    return best;
  }

  private applyAura(tower: TowerInstance, dt: number) {
    const def = TOWER_DEFS[tower.defId];
    const range = getTowerRange(def, tower.level);
    const tx = tower.col + 0.5;
    const ty = tower.row + 0.5;
    const dps = (def.specialValue ?? 15) * (tower.level === 1 ? 1 : tower.level === 2 ? 1.4 : 2.0) * tower.buffMultiplier;

    for (const e of this.enemies) {
      const d = Math.hypot(e.x - tx, e.y - ty);
      if (d <= range) {
        const dmg = Math.max(1, dps * dt - e.armor * dt);
        e.hp -= dmg;
        if (e.hp <= 0 && !e.dead) {
          e.dead = true;
          this.gold += e.reward;
          this.emitState();
        }
      }
    }
  }

  private recalcBuffs() {
    // Reset all
    for (const t of this.towers) t.buffMultiplier = 1;

    // Apply Shuna buffs
    for (const shuna of this.towers) {
      const def = TOWER_DEFS[shuna.defId];
      if (def.special !== "buff") continue;
      const range = getTowerRange(def, shuna.level);
      const buffAmt = (def.specialValue ?? 0.35) * (1 + (shuna.level - 1) * 0.2);

      for (const t of this.towers) {
        if (t.id === shuna.id) continue;
        const d = Math.hypot(t.col - shuna.col, t.row - shuna.row);
        if (d <= range) {
          t.buffMultiplier += buffAmt;
        }
      }
    }
  }

  /* ── projectiles ─────────────────────────────────────── */

  private updateProjectiles(dt: number) {
    for (const p of this.projectiles) {
      if (p.dead) continue;
      const target = this.enemies.find((e) => e.id === p.targetId);
      if (!target || target.dead) {
        p.dead = true;
        continue;
      }

      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.2) {
        this.hitEnemy(target, p);
        p.dead = true;
      } else {
        p.x += (dx / dist) * p.speed * dt;
        p.y += (dy / dist) * p.speed * dt;
      }
    }

    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  private hitEnemy(target: EnemyInstance, p: Projectile) {
    let dmg = p.isCrit ? p.damage * 3 : p.damage;
    if (p.isCrit) sfx.playCrit();
    dmg = Math.max(1, dmg - target.armor);
    target.hp -= dmg;

    if (target.hp <= 0 && !target.dead) {
      target.dead = true;
      this.gold += target.reward;
      if (target.isBoss) {
        sfx.playBossKill();
        this.spawnParticles(target.x * this.cellSize, target.y * this.cellSize, "#fbbf24", 20, 4, 5);
      } else {
        sfx.playKill();
        this.spawnParticles(target.x * this.cellSize, target.y * this.cellSize, ENEMY_DEFS[target.defId]?.color ?? "#fff", 8, 2, 3);
      }
      this.emitState();
    }

    // Splash
    if (p.splashRadius) {
      sfx.playSplash();
      for (const e of this.enemies) {
        if (e === target || e.dead) continue;
        const d = Math.hypot(e.x - target.x, e.y - target.y);
        if (d <= p.splashRadius) {
          const sd = Math.max(1, dmg * 0.5 - e.armor);
          e.hp -= sd;
          if (e.hp <= 0 && !e.dead) {
            e.dead = true;
            this.gold += e.reward;
            this.emitState();
          }
        }
      }
    }

    // Slow
    if (p.slowAmount) {
      target.slowTimer = 2;
      target.slowFactor = p.slowAmount;
    }
  }

  /* ── wave check ──────────────────────────────────────── */

  private checkWaveEnd() {
    if (!this.waveActive) return;
    if (this.spawnQueue.length > 0) return;
    if (this.enemies.length > 0) return;

    // Wave complete
    this.waveActive = false;
    this.currentWave++;

    if (this.currentWave >= this.level.waves.length) {
      this.gameStatus = "won";
      sfx.playVictory();
    }
    this.emitState();
  }

  /* ── emit state to React ─────────────────────────────── */

  private emitState() {
    const st = this.selectedTower;
    const def = st ? TOWER_DEFS[st.defId] : null;
    this.onUpdate({
      gold: this.gold,
      lives: this.lives,
      maxLives: this.maxLives,
      currentWave: this.currentWave,
      totalWaves: this.level.waves.length,
      waveActive: this.waveActive,
      gameStatus: this.gameStatus,
      selectedTowerDef: this.selectedTowerDef,
      selectedTower: st,
      canUpgrade: st ? st.level < 3 && this.gold >= getUpgradeCost(def!, st.level) : false,
      upgradeCost: st && def ? getUpgradeCost(def, st.level) : 0,
      sellValue: st && def ? getSellValue(def, st.level) : 0,
      towersPlaced: this.towers.length,
    });
  }

  /* ═══════════════════════════════════════════════════════
     RENDERING
     ═══════════════════════════════════════════════════════ */

  private render() {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const w = this.cols * cs;
    const h = this.rows * cs;

    ctx.clearRect(0, 0, w, h);
    this.drawGrid(ctx, cs);
    this.drawRangeCircle(ctx, cs);
    this.drawTowers(ctx, cs);
    this.drawEnemies(ctx, cs);
    this.drawProjectiles(ctx, cs);
    this.drawParticles(ctx);
  }

  /* ── helpers ──────────────────────────────────────────── */

  private isPath(r: number, c: number): boolean {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
    const t = this.level.grid[r][c];
    return t === 1 || t === 3 || t === 4;
  }

  /** Seeded random per tile for consistent decoration */
  private tileRand(r: number, c: number, seed = 0): number {
    const n = Math.sin(r * 127.1 + c * 311.7 + seed * 43.3) * 43758.5453;
    return n - Math.floor(n);
  }

  /* ── grid ────────────────────────────────────────────── */

  private drawGrid(ctx: CanvasRenderingContext2D, cs: number) {
    const grid = this.level.grid;

    // ── Pass 1: Grass base ──
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * cs;
        const y = r * cs;
        // All tiles get grass first
        const v = this.tileRand(r, c);
        const g = Math.floor(40 + v * 15);
        ctx.fillStyle = `rgb(${30 + (v > 0.5 ? 5 : 0)},${100 + g},${25 + (v > 0.7 ? 8 : 0)})`;
        ctx.fillRect(x, y, cs, cs);
        // Subtle checkerboard
        if ((c + r) % 2 === 0) {
          ctx.fillStyle = "rgba(0,0,0,0.03)";
          ctx.fillRect(x, y, cs, cs);
        }
      }
    }

    // ── Pass 2: Grass details (flowers, stones, grass blades) ──
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = grid[r][c];
        if (tile !== 0) continue;
        const x = c * cs;
        const y = r * cs;
        const v = this.tileRand(r, c, 1);

        // Small flowers
        if (v > 0.82) {
          const fx = x + cs * (0.2 + this.tileRand(r, c, 2) * 0.6);
          const fy = y + cs * (0.2 + this.tileRand(r, c, 3) * 0.6);
          const colors = ["#fde047", "#f9a8d4", "#c4b5fd", "#fca5a5", "#86efac"];
          ctx.fillStyle = colors[Math.floor(this.tileRand(r, c, 4) * colors.length)];
          ctx.beginPath();
          ctx.arc(fx, fy, cs * 0.04, 0, Math.PI * 2);
          ctx.fill();
        }
        // Small stones
        if (v > 0.65 && v < 0.72) {
          ctx.fillStyle = "rgba(120,110,90,0.3)";
          const sx = x + cs * (0.3 + this.tileRand(r, c, 5) * 0.4);
          const sy = y + cs * (0.3 + this.tileRand(r, c, 6) * 0.4);
          ctx.beginPath();
          ctx.ellipse(sx, sy, cs * 0.06, cs * 0.04, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // Grass blades
        if (v < 0.3) {
          ctx.strokeStyle = "rgba(20,80,15,0.4)";
          ctx.lineWidth = 1;
          const gx = x + cs * (0.3 + this.tileRand(r, c, 7) * 0.4);
          const gy = y + cs * 0.7;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.quadraticCurveTo(gx + cs * 0.05, gy - cs * 0.2, gx + cs * 0.02, gy - cs * 0.25);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(gx + cs * 0.06, gy);
          ctx.quadraticCurveTo(gx + cs * 0.12, gy - cs * 0.15, gx + cs * 0.1, gy - cs * 0.2);
          ctx.stroke();
        }
      }
    }

    // ── Pass 3: Path tiles with edge detection ──
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = grid[r][c];
        if (!this.isPath(r, c)) continue;
        const x = c * cs;
        const y = r * cs;

        const up = this.isPath(r - 1, c);
        const dn = this.isPath(r + 1, c);
        const lt = this.isPath(r, c - 1);
        const rt = this.isPath(r, c + 1);

        // Main path fill
        const pathGrad = ctx.createLinearGradient(x, y, x + cs, y + cs);
        pathGrad.addColorStop(0, "#a09078");
        pathGrad.addColorStop(0.5, "#b0a088");
        pathGrad.addColorStop(1, "#908068");
        ctx.fillStyle = pathGrad;
        ctx.fillRect(x, y, cs, cs);

        // Cobblestone pattern
        const stoneSize = cs * 0.22;
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 0.5;
        for (let sy = 0; sy < 3; sy++) {
          for (let sx = 0; sx < 3; sx++) {
            const offset = sy % 2 === 0 ? 0 : stoneSize * 0.5;
            const px = x + sx * stoneSize + offset + cs * 0.08;
            const py = y + sy * stoneSize + cs * 0.08;
            const sv = this.tileRand(r * 3 + sy, c * 3 + sx, 10);
            ctx.fillStyle = `rgba(${sv > 0.5 ? 0 : 255},${sv > 0.5 ? 0 : 255},${sv > 0.5 ? 0 : 255},0.04)`;
            this.roundRect(ctx, px, py, stoneSize * 0.9, stoneSize * 0.9, 2);
            ctx.fill();
            ctx.stroke();
          }
        }

        // Edge shadows (dark border where path meets grass)
        ctx.lineWidth = 2;
        if (!up) {
          ctx.strokeStyle = "rgba(0,0,0,0.2)";
          ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x + cs, y + 1); ctx.stroke();
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x + cs, y + 3); ctx.stroke();
        }
        if (!dn) {
          ctx.strokeStyle = "rgba(0,0,0,0.15)";
          ctx.beginPath(); ctx.moveTo(x, y + cs - 1); ctx.lineTo(x + cs, y + cs - 1); ctx.stroke();
        }
        if (!lt) {
          ctx.strokeStyle = "rgba(0,0,0,0.2)";
          ctx.beginPath(); ctx.moveTo(x + 1, y); ctx.lineTo(x + 1, y + cs); ctx.stroke();
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.beginPath(); ctx.moveTo(x + 3, y); ctx.lineTo(x + 3, y + cs); ctx.stroke();
        }
        if (!rt) {
          ctx.strokeStyle = "rgba(0,0,0,0.15)";
          ctx.beginPath(); ctx.moveTo(x + cs - 1, y); ctx.lineTo(x + cs - 1, y + cs); ctx.stroke();
        }

        // Grass overhang (small grass tufts creeping onto path edges)
        if (!up) {
          for (let i = 0; i < 4; i++) {
            const gx = x + cs * (0.1 + i * 0.25 + this.tileRand(r, c, 20 + i) * 0.1);
            ctx.fillStyle = `rgba(45,${110 + Math.floor(this.tileRand(r, c, 30 + i) * 20)},30,0.6)`;
            ctx.beginPath();
            ctx.moveTo(gx, y);
            ctx.lineTo(gx + cs * 0.06, y + cs * 0.08);
            ctx.lineTo(gx - cs * 0.06, y + cs * 0.06);
            ctx.closePath();
            ctx.fill();
          }
        }
        if (!dn) {
          for (let i = 0; i < 3; i++) {
            const gx = x + cs * (0.15 + i * 0.3 + this.tileRand(r, c, 40 + i) * 0.1);
            ctx.fillStyle = `rgba(40,${105 + Math.floor(this.tileRand(r, c, 50 + i) * 20)},25,0.5)`;
            ctx.beginPath();
            ctx.moveTo(gx, y + cs);
            ctx.lineTo(gx + cs * 0.05, y + cs - cs * 0.07);
            ctx.lineTo(gx - cs * 0.05, y + cs - cs * 0.05);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    }

    // ── Pass 4: Direction arrows on path ──
    ctx.globalAlpha = 0.12;
    const path = this.level.path;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const dx = b.col - a.col;
      const dy = b.row - a.row;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      const sx = dx === 0 ? 0 : dx / Math.abs(dx);
      const sy = dy === 0 ? 0 : dy / Math.abs(dy);
      for (let s = 0; s < steps; s++) {
        const col = a.col + sx * s;
        const row = a.row + sy * s;
        const cx = (col + 0.5) * cs;
        const cy = (row + 0.5) * cs;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.atan2(sy, sx));
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(cs * 0.15, 0);
        ctx.lineTo(-cs * 0.08, -cs * 0.08);
        ctx.lineTo(-cs * 0.08, cs * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;

    // ── Pass 5: Decorations, spawn, base ──
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = grid[r][c];
        const x = c * cs;
        const y = r * cs;

        // Trees
        if (tile === 2) {
          // Shadow
          ctx.fillStyle = "rgba(0,0,0,0.15)";
          ctx.beginPath();
          ctx.ellipse(x + cs * 0.55, y + cs * 0.85, cs * 0.3, cs * 0.1, 0, 0, Math.PI * 2);
          ctx.fill();
          // Trunk
          ctx.fillStyle = "#5a3a1a";
          const tw = cs * 0.12;
          this.roundRect(ctx, x + cs * 0.5 - tw / 2, y + cs * 0.5, tw, cs * 0.35, 2);
          ctx.fill();
          ctx.fillStyle = "#4a2a10";
          ctx.fillRect(x + cs * 0.5 - tw / 4, y + cs * 0.55, tw / 2, cs * 0.1);
          // Canopy layers (3 overlapping circles)
          const layers = [
            { cy: 0.42, r: 0.28, color: "#1a6a0e" },
            { cy: 0.32, r: 0.24, color: "#228a14" },
            { cy: 0.24, r: 0.18, color: "#2a9a1c" },
          ];
          for (const l of layers) {
            ctx.fillStyle = l.color;
            ctx.beginPath();
            ctx.arc(x + cs * 0.5, y + cs * l.cy, cs * l.r, 0, Math.PI * 2);
            ctx.fill();
          }
          // Highlight
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.beginPath();
          ctx.arc(x + cs * 0.42, y + cs * 0.22, cs * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }

        // Spawn portal
        if (tile === 3) {
          const pulse = Math.sin(this.frameCount * 0.05) * 0.15 + 0.85;
          // Outer glow ring
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 * pulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x + cs / 2, y + cs / 2, cs * 0.42 * pulse, 0, Math.PI * 2);
          ctx.stroke();
          // Inner glow
          const glow = ctx.createRadialGradient(x + cs / 2, y + cs / 2, 0, x + cs / 2, y + cs / 2, cs * 0.4);
          glow.addColorStop(0, `rgba(239, 68, 68, ${0.35 * pulse})`);
          glow.addColorStop(0.6, `rgba(180, 30, 30, ${0.15 * pulse})`);
          glow.addColorStop(1, "rgba(239, 68, 68, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x + cs / 2, y + cs / 2, cs * 0.4, 0, Math.PI * 2);
          ctx.fill();
          // Spinning rune circle
          ctx.save();
          ctx.translate(x + cs / 2, y + cs / 2);
          ctx.rotate(this.frameCount * 0.02);
          ctx.strokeStyle = `rgba(255,100,100,${0.3 * pulse})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.arc(0, 0, cs * 0.32, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
          // Icon
          ctx.font = `${cs * 0.4}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("\u{2620}\u{FE0F}", x + cs / 2, y + cs / 2);
        }

        // Base (Rimuru slime)
        if (tile === 4) {
          const pulse = Math.sin(this.frameCount * 0.03) * 0.1 + 0.9;
          const breathe = Math.sin(this.frameCount * 0.04) * 0.03;
          // Protection circle
          ctx.strokeStyle = `rgba(96, 165, 250, ${0.2 + Math.sin(this.frameCount * 0.02) * 0.1})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(x + cs / 2, y + cs / 2, cs * 0.45, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          // Glow
          const glow = ctx.createRadialGradient(x + cs / 2, y + cs / 2, 0, x + cs / 2, y + cs / 2, cs * 0.5);
          glow.addColorStop(0, "rgba(96, 165, 250, 0.35)");
          glow.addColorStop(0.5, "rgba(96, 165, 250, 0.1)");
          glow.addColorStop(1, "rgba(96, 165, 250, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x + cs / 2, y + cs / 2, cs * 0.5, 0, Math.PI * 2);
          ctx.fill();
          // Shadow
          ctx.fillStyle = "rgba(0,0,0,0.15)";
          ctx.beginPath();
          ctx.ellipse(x + cs * 0.52, y + cs * 0.72, cs * 0.25, cs * 0.08, 0, 0, Math.PI * 2);
          ctx.fill();
          // Slime body (gradient)
          const slimeGrad = ctx.createRadialGradient(
            x + cs * 0.45, y + cs * 0.48, 0,
            x + cs * 0.5, y + cs * 0.55, cs * 0.3,
          );
          slimeGrad.addColorStop(0, "#93c5fd");
          slimeGrad.addColorStop(0.5, "#60a5fa");
          slimeGrad.addColorStop(1, "#3b82f6");
          ctx.fillStyle = slimeGrad;
          ctx.beginPath();
          ctx.ellipse(x + cs / 2, y + cs * 0.55, cs * (0.28 + breathe) * pulse, cs * (0.22 - breathe) * pulse, 0, 0, Math.PI * 2);
          ctx.fill();
          // Eyes
          ctx.fillStyle = "#1e3a5f";
          ctx.beginPath();
          ctx.ellipse(x + cs * 0.42, y + cs * 0.52, cs * 0.035, cs * 0.045, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(x + cs * 0.58, y + cs * 0.52, cs * 0.035, cs * 0.045, 0, 0, Math.PI * 2);
          ctx.fill();
          // Shine
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.beginPath();
          ctx.ellipse(x + cs * 0.4, y + cs * 0.46, cs * 0.06, cs * 0.04, -0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Highlight buildable when placing (only between waves)
        if (tile === 0 && this.selectedTowerDef && !this.waveActive) {
          const occupied = this.towers.some((t) => t.col === c && t.row === r);
          if (!occupied) {
            ctx.fillStyle = "rgba(74, 222, 128, 0.15)";
            ctx.fillRect(x, y, cs, cs);
            ctx.strokeStyle = "rgba(74, 222, 128, 0.35)";
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);
            ctx.setLineDash([]);
          }
        }
      }
    }
  }

  /* ── range circle ────────────────────────────────────── */

  private drawRangeCircle(ctx: CanvasRenderingContext2D, cs: number) {
    if (this.selectedTower) {
      const def = TOWER_DEFS[this.selectedTower.defId];
      const range = getTowerRange(def, this.selectedTower.level) * cs;
      const cx = (this.selectedTower.col + 0.5) * cs;
      const cy = (this.selectedTower.row + 0.5) * cs;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, range);
      grad.addColorStop(0, "rgba(126, 200, 227, 0.15)");
      grad.addColorStop(0.7, "rgba(126, 200, 227, 0.08)");
      grad.addColorStop(1, "rgba(126, 200, 227, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, range, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(126, 200, 227, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /* ── towers ──────────────────────────────────────────── */

  private drawTowers(ctx: CanvasRenderingContext2D, cs: number) {
    for (const tower of this.towers) {
      const def = TOWER_DEFS[tower.defId];
      const cx = (tower.col + 0.5) * cs;
      const cy = (tower.row + 0.5) * cs;
      const r = cs * 0.4;
      const selected = this.selectedTower?.id === tower.id;

      // Platform shadow
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.9, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Platform
      ctx.fillStyle = "#555";
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.4, r * 0.85, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tower body with gradient
      const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
      grad.addColorStop(0, this.lightenColor(def.color, 40));
      grad.addColorStop(1, def.color);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Border
      ctx.lineWidth = selected ? 3 : 2;
      ctx.strokeStyle = selected
        ? "#ffffff"
        : tower.buffMultiplier > 1
          ? "#fbbf24"
          : "rgba(255,255,255,0.2)";
      ctx.stroke();

      // Emoji
      const emoji = TOWER_EMOJI[tower.defId];
      if (emoji) {
        ctx.font = `${cs * 0.45}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(emoji, cx, cy);
      }

      // Level stars
      if (tower.level >= 2) {
        ctx.font = `${cs * 0.2}px serif`;
        ctx.textAlign = "center";
        const stars = tower.level === 2 ? "\u{2B50}" : "\u{2B50}\u{2B50}";
        ctx.fillText(stars, cx, cy + r + cs * 0.12);
      }

      // Aura ring for Geld (animated)
      if (def.special === "aura") {
        const range = getTowerRange(def, tower.level) * cs;
        const pulse = 0.7 + Math.sin(this.frameCount * 0.08) * 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, range, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(161, 98, 7, ${0.4 * pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = `rgba(161, 98, 7, ${0.05 * pulse})`;
        ctx.fill();
      }

      // Buff ring for Shuna (animated)
      if (def.special === "buff") {
        const range = getTowerRange(def, tower.level) * cs;
        const pulse = 0.7 + Math.sin(this.frameCount * 0.06) * 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, range, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249, 168, 212, ${0.4 * pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = `rgba(249, 168, 212, ${0.05 * pulse})`;
        ctx.fill();
      }

      // Predator aura for Rimuru (animated blue glow)
      if (def.special === "predator") {
        const range = getTowerRange(def, tower.level) * cs;
        const pulse = 0.6 + Math.sin(this.frameCount * 0.05) * 0.4;
        // Outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, range, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(96, 165, 250, ${0.5 * pulse})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = `rgba(96, 165, 250, ${0.06 * pulse})`;
        ctx.fill();
        // Inner spinning rune
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.frameCount * 0.015);
        ctx.strokeStyle = `rgba(147, 197, 253, ${0.3 * pulse})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, range * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }

  private lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  }

  /* ── enemies ─────────────────────────────────────────── */

  private drawEnemies(ctx: CanvasRenderingContext2D, cs: number) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      const def = ENEMY_DEFS[e.defId];
      const cx = e.x * cs;
      const cy = e.y * cs;
      const radius = cs * 0.32 * def.size;

      // Shadow
      ctx.beginPath();
      ctx.ellipse(cx, cy + radius * 0.9, radius * 0.9, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fill();

      // Body with gradient
      const grad = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.3, 0, cx, cy, radius);
      grad.addColorStop(0, this.lightenColor(def.color, 50));
      grad.addColorStop(1, def.color);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Boss crown glow
      if (e.isBoss) {
        const glow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.5);
        glow.addColorStop(0, "rgba(251, 191, 36, 0)");
        glow.addColorStop(0.6, "rgba(251, 191, 36, 0.15)");
        glow.addColorStop(1, "rgba(251, 191, 36, 0)");
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#fbbf24";
        ctx.stroke();
      }

      // Slow tint overlay
      if (e.slowTimer > 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(96, 165, 250, 0.35)";
        ctx.fill();
      }

      // Emoji
      const emoji = ENEMY_EMOJI[e.defId];
      if (emoji) {
        ctx.font = `${radius * 1.4}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(emoji, cx, cy);
      }

      // Boss crown
      if (e.isBoss) {
        ctx.font = `${cs * 0.25}px serif`;
        ctx.textAlign = "center";
        ctx.fillText("\u{1F451}", cx, cy - radius - cs * 0.05);
      }

      // HP bar (rounded, bordered)
      const barW = Math.max(cs * 0.5, radius * 2.5);
      const barH = 4;
      const barX = cx - barW / 2;
      const barY = cy - radius - (e.isBoss ? cs * 0.28 : 8);
      const pct = Math.max(0, e.hp / e.maxHp);

      // Background
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      this.roundRect(ctx, barX, barY, barW, barH, 2);
      ctx.fill();
      // Fill
      const hpColor = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#fbbf24" : "#ef4444";
      ctx.fillStyle = hpColor;
      if (pct > 0) {
        this.roundRect(ctx, barX, barY, barW * pct, barH, 2);
        ctx.fill();
      }
      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 0.5;
      this.roundRect(ctx, barX, barY, barW, barH, 2);
      ctx.stroke();
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ── projectiles ─────────────────────────────────────── */

  private drawProjectiles(ctx: CanvasRenderingContext2D, cs: number) {
    for (const p of this.projectiles) {
      if (p.dead) continue;
      const px = p.x * cs;
      const py = p.y * cs;
      const radius = p.isCrit ? cs * 0.12 : cs * 0.07;

      // Glow
      const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 2.5);
      glow.addColorStop(0, p.isCrit ? "rgba(251,191,36,0.4)" : `${p.color}66`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(px, py, radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = p.isCrit ? "#fbbf24" : "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = p.isCrit ? "#fff" : p.color;
      ctx.fill();
    }
  }

  /* ── particles ───────────────────────────────────────── */

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
