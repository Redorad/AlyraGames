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

  /* ── rendering ───────────────────── */
  private cellSize = 0;
  private cols = 0;
  private rows = 0;
  private animFrame = 0;
  private lastTime = 0;
  private running = false;

  /* ── callback ────────────────────── */
  private onUpdate: (s: GameState) => void;

  /* ══════════════════════════════════════════════════════ */
  constructor(
    canvas: HTMLCanvasElement,
    level: LevelDef,
    availableTowerIds: string[],
    onUpdate: (s: GameState) => void,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.level = level;
    this.availableTowerIds = availableTowerIds;
    this.onUpdate = onUpdate;

    this.rows = level.grid.length;
    this.cols = level.grid[0].length;
    this.gold = level.startGold;
    this.lives = level.lives;
    this.maxLives = level.lives;

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
    const w = parent.clientWidth;
    this.cellSize = Math.floor(w / this.cols);
    const canvasW = this.cellSize * this.cols;
    const canvasH = this.cellSize * this.rows;
    this.canvas.width = canvasW * devicePixelRatio;
    this.canvas.height = canvasH * devicePixelRatio;
    this.canvas.style.width = `${canvasW}px`;
    this.canvas.style.height = `${canvasH}px`;
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
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

    // Place tower
    if (this.selectedTowerDef && this.level.grid[row][col] === 0) {
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
    this.emitState();
  }

  sellTower() {
    if (!this.selectedTower) return;
    const def = TOWER_DEFS[this.selectedTower.defId];
    this.gold += getSellValue(def, this.selectedTower.level);
    this.towers = this.towers.filter((t) => t.id !== this.selectedTower!.id);
    this.selectedTower = null;
    this.recalcBuffs();
    this.emitState();
  }

  setSpeed(s: number) {
    this.speed = s;
  }

  getCanvasHeight(): number {
    return this.cellSize * this.rows;
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
      this.checkWaveEnd();
    }

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
    const enemy: EnemyInstance = {
      id: this.nextId++,
      defId,
      hp: def.hp,
      maxHp: def.hp,
      x: start.col + 0.5,
      y: start.row + 0.5,
      speed: def.speed,
      pathIndex: 1,
      reward: def.reward,
      armor: def.armor,
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
        this.emitState();
        if (this.lives <= 0) {
          this.gameStatus = "lost";
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
        splashRadius: def.special === "splash" ? def.specialValue : undefined,
        slowAmount: def.special === "slow" ? def.specialValue : undefined,
        isCrit,
        dead: false,
      });
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
    dmg = Math.max(1, dmg - target.armor);
    target.hp -= dmg;

    if (target.hp <= 0 && !target.dead) {
      target.dead = true;
      this.gold += target.reward;
      this.emitState();
    }

    // Splash
    if (p.splashRadius) {
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
  }

  /* ── grid ────────────────────────────────────────────── */

  private drawGrid(ctx: CanvasRenderingContext2D, cs: number) {
    const grid = this.level.grid;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * cs;
        const y = r * cs;
        const tile = grid[r][c];

        // Base color
        if (tile === 0) {
          ctx.fillStyle = (c + r) % 2 === 0 ? "#2d6e1e" : "#2a6a1b";
        } else if (tile === 1) {
          ctx.fillStyle = "#8a7b5e";
        } else if (tile === 2) {
          ctx.fillStyle = "#1a4a0a";
        } else if (tile === 3) {
          ctx.fillStyle = "#6b3030";
        } else if (tile === 4) {
          ctx.fillStyle = "#2a4a8a";
        }
        ctx.fillRect(x, y, cs, cs);

        // Highlight buildable when placing
        if (tile === 0 && this.selectedTowerDef) {
          const occupied = this.towers.some((t) => t.col === c && t.row === r);
          if (!occupied) {
            ctx.fillStyle = "rgba(74, 222, 128, 0.15)";
            ctx.fillRect(x, y, cs, cs);
          }
        }

        // Decoration: draw a small tree
        if (tile === 2) {
          ctx.fillStyle = "#0f3a08";
          ctx.beginPath();
          ctx.arc(x + cs / 2, y + cs / 2, cs * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        // Spawn marker
        if (tile === 3) {
          ctx.fillStyle = "#ef4444";
          ctx.font = `bold ${cs * 0.4}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("▼", x + cs / 2, y + cs / 2);
        }

        // Base marker (Rimuru)
        if (tile === 4) {
          ctx.fillStyle = "#60a5fa";
          ctx.font = `bold ${cs * 0.5}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("★", x + cs / 2, y + cs / 2);
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cs);
      ctx.lineTo(this.cols * cs, r * cs);
      ctx.stroke();
    }
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cs, 0);
      ctx.lineTo(c * cs, this.rows * cs);
      ctx.stroke();
    }
  }

  /* ── range circle ────────────────────────────────────── */

  private drawRangeCircle(ctx: CanvasRenderingContext2D, cs: number) {
    // For selected placed tower
    if (this.selectedTower) {
      const def = TOWER_DEFS[this.selectedTower.defId];
      const range = getTowerRange(def, this.selectedTower.level) * cs;
      const cx = (this.selectedTower.col + 0.5) * cs;
      const cy = (this.selectedTower.row + 0.5) * cs;
      ctx.beginPath();
      ctx.arc(cx, cy, range, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(126, 200, 227, 0.1)";
      ctx.fill();
      ctx.strokeStyle = "rgba(126, 200, 227, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* ── towers ──────────────────────────────────────────── */

  private drawTowers(ctx: CanvasRenderingContext2D, cs: number) {
    for (const tower of this.towers) {
      const def = TOWER_DEFS[tower.defId];
      const cx = (tower.col + 0.5) * cs;
      const cy = (tower.row + 0.5) * cs;
      const radius = cs * 0.38;

      // Tower body
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();

      // Border (selected = white, buffed = gold, default = dark)
      ctx.lineWidth = this.selectedTower?.id === tower.id ? 2.5 : 1.5;
      ctx.strokeStyle =
        this.selectedTower?.id === tower.id
          ? "#ffffff"
          : tower.buffMultiplier > 1
            ? "#fbbf24"
            : "rgba(0,0,0,0.4)";
      ctx.stroke();

      // Symbol
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${cs * 0.3}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(def.symbol, cx, cy);

      // Level pips
      if (tower.level >= 2) {
        const pipY = cy + radius + 3;
        for (let i = 0; i < tower.level - 1; i++) {
          ctx.beginPath();
          ctx.arc(cx - 3 + i * 6, pipY, 2, 0, Math.PI * 2);
          ctx.fillStyle = "#fbbf24";
          ctx.fill();
        }
      }

      // Aura ring for Geld
      if (def.special === "aura") {
        const range = getTowerRange(def, tower.level) * cs;
        ctx.beginPath();
        ctx.arc(cx, cy, range, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(161, 98, 7, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Buff ring for Shuna
      if (def.special === "buff") {
        const range = getTowerRange(def, tower.level) * cs;
        ctx.beginPath();
        ctx.arc(cx, cy, range, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(249, 168, 212, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  /* ── enemies ─────────────────────────────────────────── */

  private drawEnemies(ctx: CanvasRenderingContext2D, cs: number) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      const def = ENEMY_DEFS[e.defId];
      const cx = e.x * cs;
      const cy = e.y * cs;
      const radius = cs * 0.3 * def.size;

      // Shadow
      ctx.beginPath();
      ctx.ellipse(cx, cy + radius * 0.8, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();

      // Boss glow
      if (e.isBoss) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fbbf24";
        ctx.stroke();
      }

      // Slow tint
      if (e.slowTimer > 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(96, 165, 250, 0.3)";
        ctx.fill();
      }

      // HP bar
      const barW = cs * 0.7;
      const barH = 3;
      const barX = cx - barW / 2;
      const barY = cy - radius - 6;
      const pct = Math.max(0, e.hp / e.maxHp);

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#fbbf24" : "#ef4444";
      ctx.fillRect(barX, barY, barW * pct, barH);
    }
  }

  /* ── projectiles ─────────────────────────────────────── */

  private drawProjectiles(ctx: CanvasRenderingContext2D, cs: number) {
    for (const p of this.projectiles) {
      if (p.dead) continue;
      ctx.beginPath();
      const radius = p.isCrit ? cs * 0.12 : cs * 0.06;
      ctx.arc(p.x * cs, p.y * cs, radius, 0, Math.PI * 2);
      ctx.fillStyle = p.isCrit ? "#fbbf24" : p.color;
      ctx.fill();
    }
  }
}
