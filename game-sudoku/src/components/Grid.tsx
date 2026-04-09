import { useGameStore } from '../store';
import { getConflicts } from '../sudoku';
import { useMemo } from 'react';

export default function Grid() {
  const board = useGameStore(s => s.board);
  const givenCells = useGameStore(s => s.givenCells);
  const selectedCell = useGameStore(s => s.selectedCell);
  const selectCell = useGameStore(s => s.selectCell);
  const notes = useGameStore(s => s.notes);
  const isComplete = useGameStore(s => s.isComplete);

  // Compute all conflicts
  const conflictSet = useMemo(() => {
    const set = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== 0) {
          const conflicts = getConflicts(board, r, c);
          if (conflicts.length > 0) {
            set.add(`${r},${c}`);
            for (const [cr, cc] of conflicts) {
              set.add(`${cr},${cc}`);
            }
          }
        }
      }
    }
    return set;
  }, [board]);

  // Selected number for highlighting
  const selectedNumber = selectedCell ? board[selectedCell[0]][selectedCell[1]] : 0;

  return (
    <div className="w-full aspect-square max-w-[min(100vw-2rem,28rem)]">
      <div
        className="grid grid-cols-9 grid-rows-9 w-full h-full border-2 border-steel/40 rounded-lg overflow-hidden"
        style={{ gap: 0 }}
      >
        {Array.from({ length: 9 }, (_, r) =>
          Array.from({ length: 9 }, (_, c) => {
            const val = board[r][c];
            const isGiven = givenCells[r][c];
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const isSameRow = selectedCell?.[0] === r;
            const isSameCol = selectedCell?.[1] === c;
            const isSameBox =
              selectedCell &&
              Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
              Math.floor(selectedCell[1] / 3) === Math.floor(c / 3);
            const isHighlightedRegion = !isSelected && (isSameRow || isSameCol || isSameBox);
            const isSameNumber = selectedNumber > 0 && val === selectedNumber && !isSelected;
            const hasConflict = conflictSet.has(`${r},${c}`);

            // Borders for 3x3 boxes
            const borderRight = c % 3 === 2 && c < 8 ? 'border-r-2 border-r-steel/30' : 'border-r border-r-white/[0.06]';
            const borderBottom = r % 3 === 2 && r < 8 ? 'border-b-2 border-b-steel/30' : 'border-b border-b-white/[0.06]';

            // Cell notes
            const cellNotes = notes[r][c];

            // Background
            let bg = 'bg-navy-900';
            if (isComplete) {
              bg = 'bg-accent/10';
            } else if (isSelected) {
              bg = 'bg-accent/25';
            } else if (isSameNumber) {
              bg = 'bg-steel/15';
            } else if (isHighlightedRegion) {
              bg = 'bg-navy-800/80';
            }

            // Text color
            let textColor = 'text-slate-300';
            if (hasConflict && !isComplete) {
              textColor = 'text-red-400';
            } else if (isGiven) {
              textColor = 'text-slate-100 font-bold';
            } else if (val !== 0) {
              textColor = 'text-steel font-semibold';
            }

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => selectCell(r, c)}
                className={`
                  relative flex items-center justify-center
                  ${bg} ${borderRight} ${borderBottom}
                  transition-colors duration-100
                  focus:outline-none
                  ${isSelected ? 'z-10 ring-1 ring-accent/50' : ''}
                `}
                style={{ aspectRatio: '1' }}
              >
                {val !== 0 ? (
                  <span className={`text-[clamp(0.9rem,3.5vw,1.4rem)] leading-none ${textColor}`}>
                    {val}
                  </span>
                ) : cellNotes.size > 0 ? (
                  <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-[1px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                      <span
                        key={n}
                        className={`flex items-center justify-center text-[clamp(0.4rem,1.3vw,0.6rem)] leading-none ${
                          cellNotes.has(n) ? 'text-accent/70' : 'text-transparent'
                        }`}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
