import { useRef, useEffect, useState, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { levels } from '../data/levels'
import { GameEngine } from '../engine/GameEngine'

export default function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const { currentLevel, addScore, unlockLevel, setScreen } = useGameStore()
  const [hp, setHp] = useState(3)
  const [maxHp] = useState(3)
  const [score, setScore] = useState(0)
  const [overlay, setOverlay] = useState<'none' | 'victory' | 'gameover'>('none')

  const level = levels[currentLevel]

  const onWin = useCallback(() => {
    setOverlay('victory')
    unlockLevel(currentLevel + 2) // unlock next (1-indexed)
  }, [currentLevel, unlockLevel])

  const onDie = useCallback(() => {
    setOverlay('gameover')
  }, [])

  const onScore = useCallback(
    (pts: number) => {
      addScore(pts)
    },
    [addScore]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const container = canvas.parentElement
      if (!container) return
      canvas.width = container.clientWidth
      canvas.height = 480
    }
    resize()

    const eng = new GameEngine(canvas, level, onScore, onWin, onDie)
    engineRef.current = eng
    eng.start()

    // HUD updater
    const hudInterval = setInterval(() => {
      if (eng) {
        setHp(eng.getHP())
        setScore(eng.getScore())
      }
    }, 100)

    const handleResize = () => {
      resize()
      if (eng) eng.canvasWidth = canvas.width
    }
    window.addEventListener('resize', handleResize)

    return () => {
      eng.stop()
      clearInterval(hudInterval)
      window.removeEventListener('resize', handleResize)
    }
  }, [level, onScore, onWin, onDie])

  const handleBack = () => {
    engineRef.current?.stop()
    setScreen('title')
  }

  const handleRetry = () => {
    setOverlay('none')
    const canvas = canvasRef.current
    if (!canvas) return
    engineRef.current?.stop()
    const eng = new GameEngine(canvas, level, onScore, onWin, onDie)
    engineRef.current = eng
    eng.start()
    setHp(3)
    setScore(0)
  }

  const handleNext = () => {
    setOverlay('none')
    const nextIdx = currentLevel + 1
    if (nextIdx < levels.length) {
      useGameStore.getState().setCurrentLevel(nextIdx)
      setScreen('game')
      // Force re-mount
      setTimeout(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const nextLevel = levels[nextIdx]
        engineRef.current?.stop()
        const eng = new GameEngine(canvas, nextLevel, onScore, onWin, onDie)
        engineRef.current = eng
        eng.start()
        setHp(3)
        setScore(0)
      }, 50)
    } else {
      setScreen('title')
    }
  }

  // Touch controls
  const touchStart = (action: 'left' | 'right' | 'jump') => {
    if (!engineRef.current) return
    if (action === 'left') engineRef.current.setLeft(true)
    if (action === 'right') engineRef.current.setRight(true)
    if (action === 'jump') engineRef.current.triggerJump(true)
  }
  const touchEnd = (action: 'left' | 'right' | 'jump') => {
    if (!engineRef.current) return
    if (action === 'left') engineRef.current.setLeft(false)
    if (action === 'right') engineRef.current.setRight(false)
    if (action === 'jump') engineRef.current.triggerJump(false)
  }

  return (
    <div className="h-full flex flex-col bg-navy-900 select-none">
      {/* HUD */}
      <div className="flex items-center justify-between px-3 py-2 bg-navy-800 text-white text-sm">
        <button
          onClick={handleBack}
          className="text-steel hover:text-accent transition-colors font-semibold"
        >
          &larr; Retour
        </button>
        <span className="font-bold text-accent">{level.name}</span>
        <div className="flex items-center gap-3">
          <span>
            {Array.from({ length: maxHp }, (_, i) => (
              <span key={i} className={i < hp ? 'text-red-500' : 'text-gray-600'}>
                &#x2764;&#xFE0F;
              </span>
            ))}
          </span>
          <span className="text-yellow-400">&#x2728; {score}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full block" style={{ height: 480 }} />

        {/* Overlays */}
        {overlay === 'victory' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-10">
            <div className="text-5xl mb-4">&#x1F389;</div>
            <h2 className="text-3xl font-bold text-accent mb-2">Niveau Termin&eacute; !</h2>
            <p className="text-steel mb-6">Score: {score}</p>
            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="px-6 py-2 bg-navy-700 hover:bg-navy-800 rounded-lg font-semibold transition-colors"
              >
                Menu
              </button>
              {currentLevel < levels.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-accent hover:bg-purple-500 rounded-lg font-semibold transition-colors text-navy-900"
                >
                  Suivant &rarr;
                </button>
              ) : (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 bg-accent hover:bg-purple-500 rounded-lg font-semibold transition-colors text-navy-900"
                >
                  Victoire Finale !
                </button>
              )}
            </div>
          </div>
        )}

        {overlay === 'gameover' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-10">
            <div className="text-5xl mb-4">&#x1F480;</div>
            <h2 className="text-3xl font-bold text-red-500 mb-2">Game Over</h2>
            <p className="text-gray-400 mb-6">Score: {score}</p>
            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="px-6 py-2 bg-navy-700 hover:bg-navy-800 rounded-lg font-semibold transition-colors"
              >
                Menu
              </button>
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-steel hover:bg-blue-400 rounded-lg font-semibold transition-colors text-navy-900"
              >
                R&eacute;essayer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-navy-800 sm:hidden">
        <div className="flex gap-2">
          <button
            onTouchStart={() => touchStart('left')}
            onTouchEnd={() => touchEnd('left')}
            onMouseDown={() => touchStart('left')}
            onMouseUp={() => touchEnd('left')}
            className="w-14 h-14 bg-navy-700 active:bg-navy-900 rounded-xl flex items-center justify-center text-2xl text-steel font-bold"
          >
            &larr;
          </button>
          <button
            onTouchStart={() => touchStart('right')}
            onTouchEnd={() => touchEnd('right')}
            onMouseDown={() => touchStart('right')}
            onMouseUp={() => touchEnd('right')}
            className="w-14 h-14 bg-navy-700 active:bg-navy-900 rounded-xl flex items-center justify-center text-2xl text-steel font-bold"
          >
            &rarr;
          </button>
        </div>
        <button
          onTouchStart={() => touchStart('jump')}
          onTouchEnd={() => touchEnd('jump')}
          onMouseDown={() => touchStart('jump')}
          onMouseUp={() => touchEnd('jump')}
          className="w-20 h-14 bg-accent active:bg-purple-500 rounded-xl flex items-center justify-center text-lg text-navy-900 font-bold"
        >
          SAUT
        </button>
      </div>
    </div>
  )
}
