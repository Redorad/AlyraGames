import type {
  Player,
  Camera,
  Particle,
  LevelData,
  Platform,
  Enemy,
  Collectible,
  Projectile,
} from '../types'
import {
  playJump,
  playDoubleJump,
  playCollect,
  playHurt,
  playDie,
  playVictory,
  playEnemyDie,
  playHeal,
} from '../utils/sounds'

const GRAVITY = 0.9
const JUMP_FORCE = -13.5
const GROUND_ACCEL = 1.2
const AIR_ACCEL = 0.7
const MAX_SPEED = 6.5
const GROUND_FRICTION = 0.82
const AIR_FRICTION = 0.94
const PLAYER_SIZE = 28
const INVINCIBLE_DURATION = 90
const PROJECTILE_INTERVAL = 90
const CANVAS_HEIGHT = 480
const COYOTE_FRAMES = 8
const JUMP_BUFFER_FRAMES = 8
const JUMP_CUT_MULT = 0.4

interface Keys {
  left: boolean
  right: boolean
  jump: boolean
}

export class GameEngine {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  player: Player
  camera: Camera
  particles: Particle[]
  level: LevelData
  platforms: Platform[]
  enemies: Enemy[]
  collectibles: Collectible[]
  projectiles: Projectile[]
  keys: Keys
  running: boolean
  animFrame: number
  score: number
  onScore: (pts: number) => void
  onWin: () => void
  onDie: () => void
  tick: number
  projectileTimer: number
  canvasWidth: number

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelData,
    onScore: (pts: number) => void,
    onWin: () => void,
    onDie: () => void
  ) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.level = level
    this.onScore = onScore
    this.onWin = onWin
    this.onDie = onDie
    this.running = false
    this.animFrame = 0
    this.tick = 0
    this.projectileTimer = 0
    this.score = 0
    this.canvasWidth = canvas.width

    this.player = {
      x: 60,
      y: 300,
      vx: 0,
      vy: 0,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      onGround: false,
      jumpsLeft: 2,
      hp: 3,
      maxHp: 3,
      invincible: 0,
      dead: false,
      facingRight: true,
    }

    this.camera = { x: 0, y: 0 }
    this.particles = []
    this.projectiles = []

    // Deep clone level data
    this.platforms = level.platforms.map((p) => ({ ...p }))
    this.enemies = level.enemies.map((e) => ({ ...e }))
    this.collectibles = level.collectibles.map((c) => ({ ...c }))

    this.keys = { left: false, right: false, jump: false }

    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.gameLoop = this.gameLoop.bind(this)
  }

  start() {
    this.running = true
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    this.gameLoop()
  }

  stop() {
    this.running = false
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  }

  setLeft(v: boolean) {
    this.keys.left = v
  }
  setRight(v: boolean) {
    this.keys.right = v
  }
  triggerJump(pressed: boolean) {
    this.keys.jump = pressed
  }

  private jumpPressed = false
  private jumpReleased = true
  private coyoteTimer = 0
  private jumpBufferTimer = 0

  handleKeyDown(e: KeyboardEvent) {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = true
        e.preventDefault()
        break
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = true
        e.preventDefault()
        break
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.keys.jump = true
        e.preventDefault()
        break
    }
  }

  handleKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = false
        break
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = false
        break
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.keys.jump = false
        this.jumpPressed = false
        break
    }
  }

  gameLoop() {
    if (!this.running) return
    this.update()
    this.render()
    requestAnimationFrame(this.gameLoop)
  }

  update() {
    if (this.player.dead) return
    this.tick++

    const onGround = this.player.onGround
    const accel = onGround ? GROUND_ACCEL : AIR_ACCEL
    const friction = onGround ? GROUND_FRICTION : AIR_FRICTION

    // ── Horizontal movement ──
    if (this.keys.left) {
      this.player.vx -= accel
      this.player.facingRight = false
    } else if (this.keys.right) {
      this.player.vx += accel
      this.player.facingRight = true
    } else {
      // Apply friction only when no input (snappy stop)
      this.player.vx *= friction
      if (Math.abs(this.player.vx) < 0.2) this.player.vx = 0
    }
    this.player.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, this.player.vx))

    // ── Coyote time ──
    if (onGround) {
      this.coyoteTimer = COYOTE_FRAMES
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer--
    }

    // ── Jump buffer ──
    if (this.keys.jump && this.jumpReleased) {
      this.jumpBufferTimer = JUMP_BUFFER_FRAMES
      this.jumpReleased = false
    }
    if (!this.keys.jump) {
      this.jumpReleased = true
    }
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--
    }

    // ── Jump execution ──
    const canJump = this.coyoteTimer > 0 || this.player.jumpsLeft > 0
    if (this.jumpBufferTimer > 0 && canJump) {
      this.jumpBufferTimer = 0
      const isDoubleJump = this.coyoteTimer <= 0 && this.player.jumpsLeft > 0
      this.player.vy = JUMP_FORCE
      this.player.onGround = false
      this.coyoteTimer = 0
      if (isDoubleJump) {
        this.player.jumpsLeft--
        playDoubleJump()
        this.spawnParticles(this.player.x + PLAYER_SIZE / 2, this.player.y + PLAYER_SIZE, 4, '#a78bfa')
      } else {
        this.player.jumpsLeft = 1 // 1 jump left (double jump)
        playJump()
        this.spawnParticles(this.player.x + PLAYER_SIZE / 2, this.player.y + PLAYER_SIZE, 3, '#7ec8e3')
      }
    }

    // ── Variable jump height (release = cut velocity) ──
    if (!this.keys.jump && this.player.vy < 0) {
      this.player.vy *= JUMP_CUT_MULT + 0.55
    }

    // ── Gravity ──
    this.player.vy += GRAVITY
    if (this.player.vy > 14) this.player.vy = 14

    // ── Apply velocity ──
    this.player.x += this.player.vx
    this.player.y += this.player.vy

    // Update moving platforms
    for (const p of this.platforms) {
      if (p.moving && p.moveRange && p.moveSpeed) {
        if (p.moveAxis === 'y') {
          p.y =
            (p.originalY ?? p.y) +
            Math.sin(this.tick * 0.02 * p.moveSpeed) * p.moveRange
        } else {
          p.x =
            (p.originalX ?? p.x) +
            Math.sin(this.tick * 0.02 * p.moveSpeed) * p.moveRange
        }
      }
    }

    // Platform collision
    this.player.onGround = false
    for (const p of this.platforms) {
      if (this.rectCollision(this.player, p)) {
        // Determine collision side
        const overlapLeft = this.player.x + this.player.width - p.x
        const overlapRight = p.x + p.width - this.player.x
        const overlapTop = this.player.y + this.player.height - p.y
        const overlapBottom = p.y + p.height - this.player.y

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

        if (minOverlap === overlapTop && this.player.vy >= 0) {
          this.player.y = p.y - this.player.height
          this.player.vy = 0
          this.player.onGround = true
          this.player.jumpsLeft = 2
        } else if (minOverlap === overlapBottom && this.player.vy < 0) {
          this.player.y = p.y + p.height
          this.player.vy = 0
        } else if (minOverlap === overlapLeft) {
          this.player.x = p.x - this.player.width
          this.player.vx = 0
        } else if (minOverlap === overlapRight) {
          this.player.x = p.x + p.width
          this.player.vx = 0
        }
      }
    }

    // Fall off screen
    if (this.player.y > CANVAS_HEIGHT + 50) {
      this.killPlayer()
      return
    }

    // Boundaries
    if (this.player.x < 0) {
      this.player.x = 0
      this.player.vx = 0
    }
    if (this.player.x > this.level.levelWidth - this.player.width) {
      this.player.x = this.level.levelWidth - this.player.width
      this.player.vx = 0
    }

    // Invincibility timer
    if (this.player.invincible > 0) {
      this.player.invincible--
    }

    // Enemy update & collision
    for (const e of this.enemies) {
      if (!e.alive) continue

      // Patrol
      e.x += e.speed * e.direction
      if (Math.abs(e.x - e.originalX) > e.patrolRange) {
        e.direction *= -1
      }

      // Collision with player
      if (this.rectCollision(this.player, e)) {
        const playerBottom = this.player.y + this.player.height
        const enemyTop = e.y
        const isStomp = this.player.vy > 0 && playerBottom - enemyTop < 15

        if (isStomp) {
          // Kill enemy
          e.alive = false
          this.player.vy = JUMP_FORCE * 0.7
          this.score += 50
          this.onScore(50)
          playEnemyDie()
          this.spawnParticles(e.x + e.width / 2, e.y + e.height / 2, 8, '#ff6644')
        } else if (this.player.invincible <= 0) {
          this.hurtPlayer()
        }
      }
    }

    // Collectible collision
    for (const c of this.collectibles) {
      if (c.collected) continue
      if (this.rectCollision(this.player, c)) {
        c.collected = true
        if (c.type === 'crystal') {
          this.score += 10
          this.onScore(10)
          playCollect()
          this.spawnParticles(c.x + c.width / 2, c.y + c.height / 2, 5, '#ffd700')
        } else if (c.type === 'heart') {
          if (this.player.hp < this.player.maxHp) {
            this.player.hp++
          }
          playHeal()
          this.spawnParticles(c.x + c.width / 2, c.y + c.height / 2, 5, '#ff4466')
        }
      }
    }

    // Projectiles (level 5)
    if (this.level.hasProjectiles) {
      this.projectileTimer++
      if (this.projectileTimer >= PROJECTILE_INTERVAL) {
        this.projectileTimer = 0
        // Spawn projectile from right side of screen
        const spawnX = this.camera.x + this.canvasWidth + 20
        const spawnY = 100 + Math.random() * 250
        this.projectiles.push({
          x: spawnX,
          y: spawnY,
          vx: -4 - Math.random() * 2,
          vy: Math.random() * 2 - 1,
          width: 16,
          height: 16,
        })
      }

      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const proj = this.projectiles[i]
        proj.x += proj.vx
        proj.y += proj.vy
        // Off screen
        if (proj.x < this.camera.x - 50 || proj.y < -50 || proj.y > CANVAS_HEIGHT + 50) {
          this.projectiles.splice(i, 1)
          continue
        }
        // Hit player
        if (this.player.invincible <= 0 && this.rectCollision(this.player, proj)) {
          this.projectiles.splice(i, 1)
          this.hurtPlayer()
        }
      }
    }

    // Flag / goal
    const flagRect = { x: this.level.flagX, y: this.level.flagY, width: 32, height: 32 }
    if (this.rectCollision(this.player, flagRect)) {
      this.running = false
      playVictory()
      this.onWin()
      return
    }

    // Camera
    const targetX = this.player.x - this.canvasWidth / 3
    this.camera.x += (targetX - this.camera.x) * 0.1
    this.camera.x = Math.max(0, Math.min(this.level.levelWidth - this.canvasWidth, this.camera.x))

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1
      p.life--
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  hurtPlayer() {
    this.player.hp--
    this.player.invincible = INVINCIBLE_DURATION
    this.player.vy = -6
    this.player.vx = this.player.facingRight ? -3 : 3
    this.spawnParticles(
      this.player.x + PLAYER_SIZE / 2,
      this.player.y + PLAYER_SIZE / 2,
      6,
      '#ff4444'
    )
    if (this.player.hp <= 0) {
      this.killPlayer()
    } else {
      playHurt()
    }
  }

  killPlayer() {
    this.player.dead = true
    playDie()
    this.spawnParticles(
      this.player.x + PLAYER_SIZE / 2,
      this.player.y + PLAYER_SIZE / 2,
      15,
      '#4488ff'
    )
    setTimeout(() => {
      this.running = false
      this.onDie()
    }, 1200)
  }

  spawnParticles(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5 - 2,
        life: 25 + Math.random() * 15,
        maxLife: 40,
        color,
        size: 2 + Math.random() * 3,
      })
    }
  }

  rectCollision(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    )
  }

  render() {
    const ctx = this.ctx
    const w = this.canvasWidth
    const h = CANVAS_HEIGHT
    const cx = this.camera.x

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, this.level.bgGradient[0])
    grad.addColorStop(1, this.level.bgGradient[1])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Parallax stars/dots
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137 + 50) % this.level.levelWidth) - cx * 0.3
      const sy = (i * 73 + 30) % h
      if (sx > -5 && sx < w + 5) {
        ctx.beginPath()
        ctx.arc(sx, sy, 1 + (i % 2), 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.save()
    ctx.translate(-cx, 0)

    // Platforms
    for (const p of this.platforms) {
      if (p.x + p.width < cx - 50 || p.x > cx + w + 50) continue

      // Platform body
      ctx.fillStyle = '#3a7a3a'
      ctx.fillRect(p.x, p.y, p.width, p.height)

      // Grass top
      ctx.fillStyle = '#5ab85a'
      ctx.fillRect(p.x, p.y, p.width, 6)

      // Grass detail
      ctx.fillStyle = '#4a9a4a'
      for (let gx = p.x + 4; gx < p.x + p.width - 4; gx += 12) {
        ctx.fillRect(gx, p.y - 2, 4, 4)
      }

      // Platform border
      ctx.strokeStyle = '#2a5a2a'
      ctx.lineWidth = 1
      ctx.strokeRect(p.x, p.y, p.width, p.height)
    }

    // Collectibles
    ctx.font = '18px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const c of this.collectibles) {
      if (c.collected) continue
      if (c.x < cx - 50 || c.x > cx + w + 50) continue
      const bobY = Math.sin(this.tick * 0.05 + c.x) * 4
      ctx.fillText(c.emoji, c.x + c.width / 2, c.y + c.height / 2 + bobY)
    }

    // Enemies
    ctx.font = '26px serif'
    for (const e of this.enemies) {
      if (!e.alive) continue
      if (e.x < cx - 50 || e.x > cx + w + 50) continue
      ctx.save()
      if (e.direction < 0) {
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2)
        ctx.scale(-1, 1)
        ctx.fillText(e.emoji, 0, 0)
      } else {
        ctx.fillText(e.emoji, e.x + e.width / 2, e.y + e.height / 2)
      }
      ctx.restore()
    }

    // Projectiles
    for (const proj of this.projectiles) {
      ctx.fillStyle = '#ff2244'
      ctx.beginPath()
      ctx.arc(proj.x + proj.width / 2, proj.y + proj.height / 2, proj.width / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffaa22'
      ctx.beginPath()
      ctx.arc(proj.x + proj.width / 2, proj.y + proj.height / 2, proj.width / 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Flag
    const flagBob = Math.sin(this.tick * 0.03) * 2
    ctx.font = '28px serif'
    ctx.fillText('\u{1F3C1}', this.level.flagX + 16, this.level.flagY + 16 + flagBob)

    // Player
    if (!this.player.dead) {
      const show = this.player.invincible <= 0 || Math.floor(this.tick / 4) % 2 === 0
      if (show) {
        const px = this.player.x + PLAYER_SIZE / 2
        const py = this.player.y + PLAYER_SIZE / 2

        // Squash & stretch
        const squash = this.player.onGround ? 1.1 : 0.9
        const stretch = this.player.onGround ? 0.9 : 1.1

        ctx.save()
        ctx.translate(px, py)
        ctx.scale(squash, stretch)

        // Body (slime blob)
        const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, PLAYER_SIZE / 2)
        gradient.addColorStop(0, '#88ccff')
        gradient.addColorStop(0.7, '#4488ff')
        gradient.addColorStop(1, '#2266cc')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.ellipse(0, 2, PLAYER_SIZE / 2, PLAYER_SIZE / 2.2, 0, 0, Math.PI * 2)
        ctx.fill()

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.35)'
        ctx.beginPath()
        ctx.ellipse(-4, -5, 5, 3, -0.4, 0, Math.PI * 2)
        ctx.fill()

        // Eyes
        const eyeOffX = this.player.facingRight ? 3 : -3
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.ellipse(eyeOffX - 4, -2, 4, 4.5, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(eyeOffX + 4, -2, 4, 4.5, 0, 0, Math.PI * 2)
        ctx.fill()

        // Pupils
        const pupilShift = this.player.facingRight ? 1 : -1
        ctx.fillStyle = '#1a1a2e'
        ctx.beginPath()
        ctx.arc(eyeOffX - 4 + pupilShift, -1, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(eyeOffX + 4 + pupilShift, -1, 2, 0, Math.PI * 2)
        ctx.fill()

        // Mouth
        ctx.strokeStyle = '#1a1a4e'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(eyeOffX, 5, 3, 0.1, Math.PI - 0.1)
        ctx.stroke()

        ctx.restore()
      }
    }

    // Particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    ctx.restore()
  }

  getHP() {
    return this.player.hp
  }
  getMaxHP() {
    return this.player.maxHp
  }
  getScore() {
    return this.score
  }
}
