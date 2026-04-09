import { memo } from 'react'
import { CellData, useGameStore } from './store'

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-400',
  2: 'text-green-400',
  3: 'text-red-400',
  4: 'text-purple-400',
  5: 'text-orange-400',
  6: 'text-cyan-400',
  7: 'text-pink-400',
  8: 'text-yellow-300',
}

interface CellProps {
  cell: CellData
  sizeClass: string
}

const CellComponent = memo(function CellComponent({ cell, sizeClass }: CellProps) {
  const revealCell = useGameStore(s => s.revealCell)
  const toggleFlag = useGameStore(s => s.toggleFlag)
  const status = useGameStore(s => s.status)

  const handleClick = () => {
    revealCell(cell.row, cell.col)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleFlag(cell.row, cell.col)
  }

  if (cell.isRevealed) {
    if (cell.isMine) {
      return (
        <div
          className={`${sizeClass} flex items-center justify-center rounded bg-red-900/60 border border-red-500/30`}
        >
          <span className="text-base">💣</span>
        </div>
      )
    }

    return (
      <div
        className={`${sizeClass} flex items-center justify-center rounded bg-navy-900/80 border border-white/5`}
      >
        {cell.adjacentMines > 0 && (
          <span className={`font-bold ${NUMBER_COLORS[cell.adjacentMines] || 'text-white'}`}>
            {cell.adjacentMines}
          </span>
        )}
      </div>
    )
  }

  // Unrevealed cell
  const isGameOver = status === 'won' || status === 'lost'

  return (
    <button
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={isGameOver}
      className={`${sizeClass} flex items-center justify-center rounded font-bold transition-all
        bg-navy-700 border border-white/10
        ${isGameOver ? 'cursor-default opacity-70' : 'hover:bg-navy-800 hover:border-accent/30 active:scale-95 cursor-pointer'}
      `}
    >
      {cell.isFlagged && <span className="text-base">🚩</span>}
    </button>
  )
})

export default CellComponent
