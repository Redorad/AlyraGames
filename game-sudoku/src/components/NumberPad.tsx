import { useGameStore } from '../store';

export default function NumberPad() {
  const placeNumber = useGameStore(s => s.placeNumber);
  const board = useGameStore(s => s.board);
  const isComplete = useGameStore(s => s.isComplete);

  // Count how many of each number are placed
  const counts: Record<number, number> = {};
  for (let n = 1; n <= 9; n++) counts[n] = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v > 0) counts[v]++;
    }
  }

  return (
    <div className="grid grid-cols-9 gap-1.5 w-full max-w-[min(100vw-2rem,28rem)]">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
        const allPlaced = counts[num] >= 9;
        return (
          <button
            key={num}
            onClick={() => !isComplete && placeNumber(num)}
            disabled={isComplete}
            className={`
              aspect-square rounded-lg text-lg font-bold
              transition-all duration-100
              ${allPlaced
                ? 'bg-navy-800/40 text-slate-600 cursor-default'
                : 'bg-navy-800 text-steel border border-white/[0.06] hover:border-accent/30 hover:bg-navy-700 active:scale-95'
              }
            `}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
}
