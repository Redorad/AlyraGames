import { useRef, useEffect, useCallback } from 'react'
import { useStore } from './store'
import { LEVELS } from './levels'
import {
  CANVAS_W,
  CANVAS_H,
  createPaddle,
  createBall,
  createBricks,
  movePaddle,
  updateBalls,
  updatePowerUps,
  maybeSpawnPowerUp,
  render,
  renderOverlay,
} from './engine'
import { Ball, Brick, Paddle, PowerUp, PowerUpType } from './types'

const MAX_DT = 1 / 30 // cap delta time at ~33ms
const WIDE_DURATION = 8000
const SLOW_DURATION = 6000

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Game objects stored in refs to avoid re-render overhead
  const paddleRef = useRef<Paddle>(createPaddle())
  const ballsRef = useRef<Ball[]>([createBall(paddleRef.current)])
  const bricksRef = useRef<Brick[]>([])
  const powerUpsRef = useRef<PowerUp[]>([])
  const mouseXRef = useRef(CANVAS_W / 2)
  const launchedRef = useRef(false)
  const wideTimerRef = useRef(0)
  const slowTimerRef = useRef(0)
  const animFrameRef = useRef(0)
  const lastTimeRef = useRef(0)

  const status = useStore((s) => s.status)
  const level = useStore((s) => s.level)
  const score = useStore((s) => s.score)
  const lives = useStore((s) => s.lives)
  const highScore = useStore((s) => s.highScore)
  const setStatus = useStore((s) => s.setStatus)
  const addScore = useStore((s) => s.addScore)
  const loseLife = useStore((s) => s.loseLife)
  const nextLevel = useStore((s) => s.nextLevel)
  const resetGame = useStore((s) => s.resetGame)
  const updateHighScore = useStore((s) => s.updateHighScore)

  // Initialize / reset level
  const initLevel = useCallback(
    (lvl: number) => {
      paddleRef.current = createPaddle()
      ballsRef.current = [createBall(paddleRef.current)]
      bricksRef.current = createBricks(lvl)
      powerUpsRef.current = []
      launchedRef.current = false
      wideTimerRef.current = 0
      slowTimerRef.current = 0
    },
    [],
  )

  // Respawn ball after losing a life
  const respawnBall = useCallback(() => {
    paddleRef.current = createPaddle()
    ballsRef.current = [createBall(paddleRef.current)]
    powerUpsRef.current = []
    launchedRef.current = false
    wideTimerRef.current = 0
    slowTimerRef.current = 0
    // Reset paddle width
    paddleRef.current.width = paddleRef.current.baseWidth
  }, [])

  // Handle power-up collection
  const collectPowerUp = useCallback(
    (type: PowerUpType) => {
      const paddle = paddleRef.current
      if (type === 'wide') {
        paddle.width = Math.min(paddle.baseWidth * 1.8, CANVAS_W * 0.4)
        wideTimerRef.current = performance.now() + WIDE_DURATION
      } else if (type === 'multi') {
        // Spawn 2 extra balls from the first active ball
        const activeBall = ballsRef.current.find((b) => b.active)
        if (activeBall) {
          for (let i = 0; i < 2; i++) {
            const angle = ((i === 0 ? -1 : 1) * Math.PI) / 6
            const cos = Math.cos(angle)
            const sin = Math.sin(angle)
            ballsRef.current.push({
              x: activeBall.x,
              y: activeBall.y,
              vx: activeBall.vx * cos - activeBall.vy * sin,
              vy: activeBall.vx * sin + activeBall.vy * cos,
              radius: activeBall.radius,
              speed: activeBall.speed,
              active: true,
            })
          }
        }
      } else if (type === 'slow') {
        slowTimerRef.current = performance.now() + SLOW_DURATION
        for (const ball of ballsRef.current) {
          if (ball.active) {
            ball.speed *= 0.6
            const mag = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
            if (mag > 0) {
              ball.vx = (ball.vx / mag) * ball.speed
              ball.vy = (ball.vy / mag) * ball.speed
            }
          }
        }
      }
    },
    [],
  )

  // Get canvas-local coordinates from a mouse/touch event
  const getCanvasX = useCallback((clientX: number) => {
    const canvas = canvasRef.current
    if (!canvas) return CANVAS_W / 2
    const rect = canvas.getBoundingClientRect()
    return ((clientX - rect.left) / rect.width) * CANVAS_W
  }, [])

  // ---- Game loop ----
  useEffect(() => {
    if (status !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loop = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time
      let dt = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time
      if (dt > MAX_DT) dt = MAX_DT

      const storeState = useStore.getState()
      if (storeState.status !== 'playing') return

      const paddle = paddleRef.current
      const balls = ballsRef.current
      const bricks = bricksRef.current
      const pus = powerUpsRef.current
      const now = performance.now()

      // Paddle follow mouse
      movePaddle(paddle, mouseXRef.current)

      // Wide timer expiry
      if (wideTimerRef.current > 0 && now > wideTimerRef.current) {
        paddle.width = paddle.baseWidth
        wideTimerRef.current = 0
      }

      // Slow timer expiry — restore speed
      if (slowTimerRef.current > 0 && now > slowTimerRef.current) {
        for (const ball of balls) {
          if (ball.active) {
            const baseSp = 360
            const mag = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
            if (mag > 0) {
              ball.vx = (ball.vx / mag) * baseSp
              ball.vy = (ball.vy / mag) * baseSp
            }
            ball.speed = baseSp
          }
        }
        slowTimerRef.current = 0
      }

      if (!launchedRef.current) {
        // Ball stuck to paddle
        balls[0].x = paddle.x + paddle.width / 2
        balls[0].y = paddle.y - balls[0].radius
      } else {
        // Update balls
        updateBalls(balls, paddle, bricks, dt, (brick: Brick) => {
          const points = (brick.maxHits - Math.max(brick.hits, 0)) * 10
          if (!brick.alive) {
            const earned = brick.maxHits * 10
            addScore(earned)
            const pu = maybeSpawnPowerUp(brick)
            if (pu) pus.push(pu)
          }
        })

        // Update power-ups
        updatePowerUps(pus, paddle, dt, collectPowerUp)

        // Check if all balls lost
        const anyActive = balls.some((b) => b.active)
        if (!anyActive) {
          loseLife()
          const nextState = useStore.getState()
          if (nextState.status === 'playing') {
            respawnBall()
          }
          // If gameover, the loop will stop because status changed
        }

        // Check level clear
        const anyBrickAlive = bricks.some((b) => b.alive)
        if (!anyBrickAlive) {
          const currentLevel = useStore.getState().level
          if (currentLevel >= LEVELS.length - 1) {
            updateHighScore()
            setStatus('win')
          } else {
            setStatus('levelcomplete')
          }
          return
        }
      }

      // Render
      render(ctx, paddle, balls, bricks, pus, storeState.score, storeState.lives, storeState.level, storeState.highScore)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    lastTimeRef.current = 0
    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [status, addScore, loseLife, respawnBall, setStatus, updateHighScore, collectPowerUp])

  // Render static screens when not playing
  useEffect(() => {
    if (status === 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (status === 'menu') {
      render(ctx, paddleRef.current, ballsRef.current, bricksRef.current, powerUpsRef.current, 0, 3, 0, highScore)
      renderOverlay(ctx, 'BRICK BREAKER', 'Click or press Space to start')
    } else if (status === 'gameover') {
      render(ctx, paddleRef.current, ballsRef.current, bricksRef.current, powerUpsRef.current, score, 0, level, highScore)
      renderOverlay(ctx, 'GAME OVER', `Score: ${score} | Click to restart`)
    } else if (status === 'levelcomplete') {
      render(ctx, paddleRef.current, ballsRef.current, bricksRef.current, powerUpsRef.current, score, lives, level, highScore)
      renderOverlay(ctx, `LEVEL ${level + 1} CLEAR!`, 'Click to continue')
    } else if (status === 'win') {
      render(ctx, paddleRef.current, ballsRef.current, bricksRef.current, powerUpsRef.current, score, lives, level, highScore)
      renderOverlay(ctx, 'YOU WIN!', `Final Score: ${score} | Click to play again`)
    }
  }, [status, score, lives, level, highScore])

  // Draw initial menu screen on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Show some bricks in background
    bricksRef.current = createBricks(0)
    render(ctx, paddleRef.current, ballsRef.current, bricksRef.current, powerUpsRef.current, 0, 3, 0, highScore)
    renderOverlay(ctx, 'BRICK BREAKER', 'Click or press Space to start')
  }, [])

  // Mouse/touch handlers
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onMouseMove = (e: MouseEvent) => {
      mouseXRef.current = getCanvasX(e.clientX)
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        mouseXRef.current = getCanvasX(e.touches[0].clientX)
      }
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('touchmove', onTouchMove)
    }
  }, [getCanvasX])

  // Click / Space / keyboard
  const handleAction = useCallback(() => {
    const st = useStore.getState()
    if (st.status === 'menu') {
      resetGame()
      initLevel(0)
    } else if (st.status === 'playing' && !launchedRef.current) {
      launchedRef.current = true
    } else if (st.status === 'gameover' || st.status === 'win') {
      resetGame()
      initLevel(0)
    } else if (st.status === 'levelcomplete') {
      nextLevel()
      const newLevel = useStore.getState().level
      initLevel(newLevel)
      setStatus('playing')
    }
  }, [resetGame, initLevel, nextLevel, setStatus])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        handleAction()
      }
      // Arrow keys for paddle
      const st = useStore.getState()
      if (st.status === 'playing') {
        if (e.code === 'ArrowLeft') {
          mouseXRef.current = Math.max(0, mouseXRef.current - 30)
        } else if (e.code === 'ArrowRight') {
          mouseXRef.current = Math.min(CANVAS_W, mouseXRef.current + 30)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleAction])

  const handleCanvasClick = useCallback(() => {
    handleAction()
  }, [handleAction])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        mouseXRef.current = getCanvasX(e.touches[0].clientX)
      }
      handleAction()
    },
    [handleAction, getCanvasX],
  )

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-screen bg-navy-900"
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="block max-w-full max-h-full border border-navy-700 rounded-xl cursor-none"
        style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
      />
    </div>
  )
}
