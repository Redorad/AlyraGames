import { Ball, Brick, Paddle, PowerUp, PowerUpType } from './types'
import { LEVELS } from './levels'

// Canvas logical size
export const CANVAS_W = 800
export const CANVAS_H = 600

// Brick grid
const BRICK_COLS = 10
const BRICK_PADDING = 4
const BRICK_OFFSET_TOP = 60
const BRICK_OFFSET_LEFT = 20

// Colors per hit count
const BRICK_COLORS: Record<number, { fill: string; glow: string }> = {
  1: { fill: '#4ade80', glow: '#22c55e' },
  2: { fill: '#facc15', glow: '#eab308' },
  3: { fill: '#f87171', glow: '#ef4444' },
}

const POWERUP_COLORS: Record<PowerUpType, string> = {
  wide: '#4ade80',
  multi: '#60a5fa',
  slow: '#c084fc',
}

const POWERUP_LABELS: Record<PowerUpType, string> = {
  wide: 'W',
  multi: 'M',
  slow: 'S',
}

export function createPaddle(): Paddle {
  const w = 120
  return { x: CANVAS_W / 2 - w / 2, y: CANVAS_H - 40, width: w, height: 14, baseWidth: w }
}

export function createBall(paddle: Paddle): Ball {
  return {
    x: paddle.x + paddle.width / 2,
    y: paddle.y - 10,
    vx: 200,
    vy: -300,
    radius: 8,
    speed: 360,
    active: true,
  }
}

export function createBricks(levelIndex: number): Brick[] {
  const level = LEVELS[levelIndex]
  if (!level) return []
  const layout = level.layout
  const rows = layout.length
  const brickW = (CANVAS_W - BRICK_OFFSET_LEFT * 2 - BRICK_PADDING * (BRICK_COLS - 1)) / BRICK_COLS
  const brickH = 22

  const bricks: Brick[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const hits = layout[r][c]
      if (hits === 0) continue
      const colors = BRICK_COLORS[hits] || BRICK_COLORS[1]
      bricks.push({
        x: BRICK_OFFSET_LEFT + c * (brickW + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + r * (brickH + BRICK_PADDING),
        width: brickW,
        height: brickH,
        hits,
        maxHits: hits,
        color: colors.fill,
        glowColor: colors.glow,
        alive: true,
      })
    }
  }
  return bricks
}

export function movePaddle(paddle: Paddle, targetX: number) {
  paddle.x = Math.max(0, Math.min(CANVAS_W - paddle.width, targetX - paddle.width / 2))
}

export function updateBalls(
  balls: Ball[],
  paddle: Paddle,
  bricks: Brick[],
  dt: number,
  onBrickHit: (brick: Brick) => void,
): void {
  for (const ball of balls) {
    if (!ball.active) continue

    ball.x += ball.vx * dt
    ball.y += ball.vy * dt

    // Wall collisions
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius
      ball.vx = Math.abs(ball.vx)
    }
    if (ball.x + ball.radius > CANVAS_W) {
      ball.x = CANVAS_W - ball.radius
      ball.vx = -Math.abs(ball.vx)
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius
      ball.vy = Math.abs(ball.vy)
    }

    // Paddle collision
    if (
      ball.vy > 0 &&
      ball.y + ball.radius >= paddle.y &&
      ball.y + ball.radius <= paddle.y + paddle.height + 6 &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width
    ) {
      // Reflect angle based on where it hits the paddle
      const hitPos = (ball.x - paddle.x) / paddle.width // 0..1
      const angle = (hitPos - 0.5) * Math.PI * 0.7 // -63..+63 degrees
      ball.vx = ball.speed * Math.sin(angle)
      ball.vy = -ball.speed * Math.cos(angle)
      ball.y = paddle.y - ball.radius
    }

    // Brick collisions
    for (const brick of bricks) {
      if (!brick.alive) continue

      // AABB vs circle
      const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width))
      const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height))
      const distX = ball.x - closestX
      const distY = ball.y - closestY

      if (distX * distX + distY * distY < ball.radius * ball.radius) {
        // Determine bounce direction
        const overlapLeft = ball.x + ball.radius - brick.x
        const overlapRight = brick.x + brick.width - (ball.x - ball.radius)
        const overlapTop = ball.y + ball.radius - brick.y
        const overlapBottom = brick.y + brick.height - (ball.y - ball.radius)

        const minOverlapX = Math.min(overlapLeft, overlapRight)
        const minOverlapY = Math.min(overlapTop, overlapBottom)

        if (minOverlapX < minOverlapY) {
          ball.vx = -ball.vx
        } else {
          ball.vy = -ball.vy
        }

        brick.hits--
        if (brick.hits <= 0) {
          brick.alive = false
        } else {
          const colors = BRICK_COLORS[brick.hits] || BRICK_COLORS[1]
          brick.color = colors.fill
          brick.glowColor = colors.glow
        }
        onBrickHit(brick)
        break // One brick per frame per ball
      }
    }

    // Ball lost (below screen)
    if (ball.y - ball.radius > CANVAS_H) {
      ball.active = false
    }
  }
}

export function updatePowerUps(
  powerUps: PowerUp[],
  paddle: Paddle,
  dt: number,
  onCollect: (type: PowerUpType) => void,
): void {
  for (const pu of powerUps) {
    if (!pu.active) continue
    pu.y += pu.vy * dt

    // Paddle collision
    if (
      pu.y + pu.height >= paddle.y &&
      pu.y <= paddle.y + paddle.height &&
      pu.x + pu.width >= paddle.x &&
      pu.x <= paddle.x + paddle.width
    ) {
      pu.active = false
      onCollect(pu.type)
    }

    // Below screen
    if (pu.y > CANVAS_H + 20) {
      pu.active = false
    }
  }
}

export function maybeSpawnPowerUp(brick: Brick): PowerUp | null {
  if (brick.alive) return null // Only when destroyed
  if (Math.random() > 0.25) return null // 25% chance

  const types: PowerUpType[] = ['wide', 'multi', 'slow']
  const type = types[Math.floor(Math.random() * types.length)]

  return {
    x: brick.x + brick.width / 2 - 12,
    y: brick.y + brick.height,
    width: 24,
    height: 24,
    vy: 120,
    type,
    active: true,
  }
}

// ---- Rendering ----

export function render(
  ctx: CanvasRenderingContext2D,
  paddle: Paddle,
  balls: Ball[],
  bricks: Brick[],
  powerUps: PowerUp[],
  score: number,
  lives: number,
  level: number,
  highScore: number,
) {
  // Clear
  ctx.fillStyle = '#0a0e27'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // Draw grid lines for atmosphere
  ctx.strokeStyle = 'rgba(126, 200, 227, 0.04)'
  ctx.lineWidth = 1
  for (let x = 0; x < CANVAS_W; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, CANVAS_H)
    ctx.stroke()
  }
  for (let y = 0; y < CANVAS_H; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CANVAS_W, y)
    ctx.stroke()
  }

  // Bricks
  for (const brick of bricks) {
    if (!brick.alive) continue
    ctx.save()
    ctx.shadowColor = brick.glowColor
    ctx.shadowBlur = 12
    ctx.fillStyle = brick.color
    ctx.beginPath()
    roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 4)
    ctx.fill()
    ctx.shadowBlur = 0

    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    roundRect(ctx, brick.x + 2, brick.y + 2, brick.width - 4, brick.height / 2 - 2, 3)
    ctx.fill()
    ctx.restore()
  }

  // Power-ups
  for (const pu of powerUps) {
    if (!pu.active) continue
    ctx.save()
    ctx.shadowColor = POWERUP_COLORS[pu.type]
    ctx.shadowBlur = 14
    ctx.fillStyle = POWERUP_COLORS[pu.type]
    ctx.beginPath()
    roundRect(ctx, pu.x, pu.y, pu.width, pu.height, 6)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#0a0e27'
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(POWERUP_LABELS[pu.type], pu.x + pu.width / 2, pu.y + pu.height / 2)
    ctx.restore()
  }

  // Paddle
  ctx.save()
  ctx.shadowColor = '#7ec8e3'
  ctx.shadowBlur = 18
  const paddleGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height)
  paddleGrad.addColorStop(0, '#7ec8e3')
  paddleGrad.addColorStop(1, '#4a90b0')
  ctx.fillStyle = paddleGrad
  ctx.beginPath()
  roundRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 7)
  ctx.fill()
  ctx.restore()

  // Balls
  for (const ball of balls) {
    if (!ball.active) continue
    ctx.save()
    ctx.shadowColor = '#a78bfa'
    ctx.shadowBlur = 20
    ctx.fillStyle = '#a78bfa'
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
    ctx.fill()

    // Inner bright spot
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.beginPath()
    ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // HUD
  ctx.save()
  ctx.fillStyle = 'rgba(10, 14, 39, 0.7)'
  ctx.fillRect(0, 0, CANVAS_W, 40)
  ctx.fillStyle = '#7ec8e3'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(`Score: ${score}`, 16, 22)
  ctx.fillText(`Lives: ${lives}`, 200, 22)
  ctx.fillStyle = '#a78bfa'
  ctx.textAlign = 'center'
  ctx.fillText(`Level ${level + 1}`, CANVAS_W / 2, 22)
  ctx.fillStyle = '#64748b'
  ctx.textAlign = 'right'
  ctx.fillText(`Best: ${highScore}`, CANVAS_W - 16, 22)
  ctx.restore()
}

export function renderOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
) {
  ctx.save()
  ctx.fillStyle = 'rgba(10, 14, 39, 0.85)'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  ctx.fillStyle = '#a78bfa'
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#a78bfa'
  ctx.shadowBlur = 30
  ctx.fillText(title, CANVAS_W / 2, CANVAS_H / 2 - 30)

  ctx.shadowBlur = 0
  ctx.fillStyle = '#7ec8e3'
  ctx.font = '20px monospace'
  ctx.fillText(subtitle, CANVAS_W / 2, CANVAS_H / 2 + 30)
  ctx.restore()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
