import { useGameStore, DIFFICULTIES } from './store'
import Cell from './Cell'

export default function Board() {
  const board = useGameStore(s => s.board)
  const difficulty = useGameStore(s => s.difficulty)
  const config = DIFFICULTIES[difficulty]

  // Compute cell size based on difficulty
  const cellSize = difficulty === 'hard' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'

  return (
    <div
      className="no-select inline-block bg-navy-800 rounded-xl border border-white/10 p-2 shadow-2xl"
      onContextMenu={e => e.preventDefault()}
    >
      <div
        className="grid gap-[1px]"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <Cell key={`${r}-${c}`} cell={cell} sizeClass={cellSize} />
          ))
        )}
      </div>
    </div>
  )
}
