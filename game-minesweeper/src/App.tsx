import { useGameStore, DIFFICULTIES, Difficulty } from './store'
import Board from './Board'
import { useEffect } from 'react'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function SmileyButton() {
  const status = useGameStore(s => s.status)
  const newGame = useGameStore(s => s.newGame)

  let face = '🙂'
  if (status === 'won') face = '😎'
  if (status === 'lost') face = '💀'

  return (
    <button
      onClick={() => newGame()}
      className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg bg-navy-700 border border-white/10 hover:bg-navy-800 hover:border-accent/40 transition-all active:scale-95"
      title="New Game"
    >
      {face}
    </button>
  )
}

function DifficultySelector() {
  const difficulty = useGameStore(s => s.difficulty)
  const setDifficulty = useGameStore(s => s.setDifficulty)

  return (
    <div className="flex gap-2">
      {(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => (
        <button
          key={d}
          onClick={() => setDifficulty(d)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            difficulty === d
              ? 'bg-accent text-white shadow-lg shadow-accent/20'
              : 'bg-navy-700 text-slate-400 border border-white/10 hover:bg-navy-800 hover:text-white'
          }`}
        >
          {DIFFICULTIES[d].label}
        </button>
      ))}
    </div>
  )
}

function Header() {
  const minesRemaining = useGameStore(s => s.minesRemaining)
  const timer = useGameStore(s => s.timer)

  return (
    <div className="flex items-center justify-between w-full max-w-fit gap-6 mb-4">
      <div className="flex items-center gap-2 bg-navy-700 rounded-lg px-4 py-2 border border-white/10 min-w-[90px] justify-center">
        <span className="text-lg">💣</span>
        <span className="font-mono text-xl font-bold text-steel tabular-nums">
          {minesRemaining.toString().padStart(3, '0')}
        </span>
      </div>
      <SmileyButton />
      <div className="flex items-center gap-2 bg-navy-700 rounded-lg px-4 py-2 border border-white/10 min-w-[90px] justify-center">
        <span className="text-lg">⏱️</span>
        <span className="font-mono text-xl font-bold text-steel tabular-nums">
          {formatTime(timer)}
        </span>
      </div>
    </div>
  )
}

function BestTimes() {
  const bestTimes = useGameStore(s => s.bestTimes)

  const hasTimes = bestTimes.easy !== null || bestTimes.medium !== null || bestTimes.hard !== null
  if (!hasTimes) return null

  return (
    <div className="mt-6 bg-navy-800 rounded-xl border border-white/10 p-4 w-full max-w-xs">
      <h3 className="text-center text-sm font-bold text-accent mb-3 uppercase tracking-wider">
        Best Times
      </h3>
      <div className="space-y-2">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => (
          <div key={d} className="flex justify-between text-sm">
            <span className="text-slate-400">{DIFFICULTIES[d].label}</span>
            <span className="font-mono text-steel">
              {bestTimes[d] !== null ? formatTime(bestTimes[d]!) : '--:--'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusMessage() {
  const status = useGameStore(s => s.status)
  const timer = useGameStore(s => s.timer)

  if (status === 'won') {
    return (
      <div className="mt-4 text-center">
        <p className="text-lg font-bold text-green-400">You Win!</p>
        <p className="text-sm text-slate-400">Completed in {formatTime(timer)}</p>
      </div>
    )
  }

  if (status === 'lost') {
    return (
      <div className="mt-4 text-center">
        <p className="text-lg font-bold text-red-400">Game Over!</p>
        <p className="text-sm text-slate-400">Click the smiley to try again</p>
      </div>
    )
  }

  return null
}

export default function App() {
  const loadBestTimes = useGameStore(s => s.loadBestTimes)

  useEffect(() => {
    loadBestTimes()
  }, [loadBestTimes])

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col items-center py-6 px-4">
      <h1 className="text-3xl font-black mb-1 tracking-tight">
        <span className="text-steel">MINE</span>
        <span className="text-accent">SWEEPER</span>
      </h1>
      <p className="text-slate-500 text-sm mb-5">Classic puzzle game</p>

      <DifficultySelector />

      <div className="mt-5 flex flex-col items-center">
        <Header />
        <Board />
        <StatusMessage />
      </div>

      <BestTimes />

      <a
        href="/AlyraGames/"
        className="mt-8 text-slate-500 hover:text-accent text-sm transition-colors"
      >
        &larr; Back to Hub
      </a>
    </div>
  )
}
