import { useGameStore } from '../store/gameStore'
import { levels } from '../data/levels'

export default function TitleScreen() {
  const { levelsUnlocked, setCurrentLevel, setScreen, resetScore } = useGameStore()

  const startLevel = (idx: number) => {
    resetScore()
    setCurrentLevel(idx)
    setScreen('game')
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-white select-none px-4">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-2">
          <span className="text-steel">Slime</span>{' '}
          <span className="text-accent">Run</span>
        </h1>
        <p className="text-lg text-gray-400 italic">
          Rimuru&apos;s Platformer Adventure
        </p>
        <div className="text-4xl mt-3 animate-bounce">
          <span role="img" aria-label="slime">&#x1F535;</span>
        </div>
      </div>

      {/* Level Select */}
      <div className="w-full max-w-md space-y-3">
        <h2 className="text-xl font-semibold text-center text-steel mb-2">
          Level Select
        </h2>
        {levels.map((lv, idx) => {
          const unlocked = idx < levelsUnlocked
          return (
            <button
              key={lv.id}
              onClick={() => unlocked && startLevel(idx)}
              disabled={!unlocked}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-left transition-all flex items-center gap-3 ${
                unlocked
                  ? 'bg-navy-700 hover:bg-navy-800 hover:ring-2 hover:ring-accent cursor-pointer'
                  : 'bg-navy-900 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-2xl w-8 text-center">
                {unlocked ? '\u2B50' : '\u{1F512}'}
              </span>
              <span className="flex-1">
                <span className="text-white">{lv.id}. {lv.name}</span>
              </span>
              {unlocked && (
                <span className="text-accent text-sm">PLAY &rarr;</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Controls help */}
      <div className="mt-8 text-center text-gray-500 text-sm space-y-1">
        <p>Arrow keys / WASD to move &bull; Space to jump</p>
        <p>Double jump available &bull; Jump on enemies to defeat them</p>
      </div>
    </div>
  )
}
