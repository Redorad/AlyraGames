import { useEffect, useRef } from 'react';
import { useGameStore, getStars } from './store';
import type { GridSize } from './store';

/* ─── Helpers ─── */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const GRID_LABELS: Record<GridSize, string> = {
  '4x4': '4 x 4  (8 pairs)',
  '5x4': '5 x 4  (10 pairs)',
  '6x5': '6 x 5  (15 pairs)',
};

/* ─── Stars Component ─── */
function Stars({ count, size = 'text-xl' }: { count: number; size?: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`${size} ${i <= count ? 'text-yellow-400' : 'text-navy-700'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/* ─── Card Component ─── */
function MemoryCard({ id, emoji, flipped, matched }: {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}) {
  const flipCard = useGameStore((s) => s.flipCard);
  const flippedCards = useGameStore((s) => s.flippedCards);
  const gameWon = useGameStore((s) => s.gameWon);

  const isClickable = !flipped && !matched && flippedCards.length < 2 && !gameWon;

  return (
    <div
      className={`perspective aspect-square ${isClickable ? 'card-clickable' : ''} ${matched ? 'card-matched' : ''}`}
      onClick={() => isClickable && flipCard(id)}
    >
      <div className={`card-inner ${flipped || matched ? 'flipped' : ''}`}>
        <div className="card-face card-back" />
        <div className="card-face card-front bg-navy-800 border-2 border-steel/30 rounded-xl">
          <span className="text-3xl sm:text-4xl select-none">{emoji}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Grid Component ─── */
function GameGrid() {
  const cards = useGameStore((s) => s.cards);
  const cols = useGameStore((s) => s.cols);

  const gridCols: Record<number, string> = {
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[cols]} gap-2 sm:gap-3 w-full max-w-lg mx-auto`}>
      {cards.map((card) => (
        <MemoryCard
          key={card.id}
          id={card.id}
          emoji={card.emoji}
          flipped={card.flipped}
          matched={card.matched}
        />
      ))}
    </div>
  );
}

/* ─── Stats Bar ─── */
function StatsBar() {
  const moves = useGameStore((s) => s.moves);
  const timer = useGameStore((s) => s.timer);
  const totalPairs = useGameStore((s) => s.totalPairs);
  const matchedPairs = useGameStore((s) => s.matchedPairs);

  const stars = moves > 0 ? getStars(moves, totalPairs) : 3;

  return (
    <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-4 px-1">
      <div className="flex items-center gap-2">
        <span className="text-steel text-sm font-semibold">Moves</span>
        <span className="text-white font-bold text-lg">{moves}</span>
      </div>

      <Stars count={stars} />

      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-lg font-mono">{formatTime(timer)}</span>
        <span className="text-steel text-sm font-semibold">Time</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-accent text-sm font-semibold">{matchedPairs}/{totalPairs}</span>
      </div>
    </div>
  );
}

/* ─── Victory Modal ─── */
function VictoryModal() {
  const gameWon = useGameStore((s) => s.gameWon);
  const moves = useGameStore((s) => s.moves);
  const timer = useGameStore((s) => s.timer);
  const totalPairs = useGameStore((s) => s.totalPairs);
  const gridSize = useGameStore((s) => s.gridSize);
  const bestScores = useGameStore((s) => s.bestScores);
  const resetGame = useGameStore((s) => s.resetGame);

  if (!gameWon) return null;

  const stars = getStars(moves, totalPairs);
  const best = bestScores[gridSize];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm victory-overlay">
      <div className="victory-panel bg-navy-800 border border-accent/30 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-1">You Win!</h2>
        <p className="text-steel text-sm mb-4">All pairs matched!</p>

        <div className="flex justify-center mb-4">
          <Stars count={stars} size="text-3xl" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
          <div className="bg-navy-900/60 rounded-lg p-3">
            <div className="text-steel text-xs">Moves</div>
            <div className="text-white font-bold text-lg">{moves}</div>
          </div>
          <div className="bg-navy-900/60 rounded-lg p-3">
            <div className="text-steel text-xs">Time</div>
            <div className="text-white font-bold text-lg">{formatTime(timer)}</div>
          </div>
        </div>

        {best && (
          <div className="bg-navy-900/40 rounded-lg p-3 mb-5 text-xs text-steel">
            <span className="font-semibold text-accent">Best:</span>{' '}
            {best.moves} moves in {formatTime(best.time)} <Stars count={best.stars} size="text-xs" />
          </div>
        )}

        <button
          onClick={resetGame}
          className="btn-primary text-white font-bold py-3 px-8 rounded-xl w-full"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

/* ─── Grid Size Selector ─── */
function GridSizeSelector() {
  const gridSize = useGameStore((s) => s.gridSize);
  const setGridSize = useGameStore((s) => s.setGridSize);
  const startGame = useGameStore((s) => s.startGame);
  const bestScores = useGameStore((s) => s.bestScores);

  const handleSelect = (size: GridSize) => {
    setGridSize(size);
    setTimeout(() => {
      useGameStore.getState().startGame();
    }, 0);
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-4">
      {(Object.keys(GRID_LABELS) as GridSize[]).map((size) => {
        const isActive = gridSize === size;
        const best = bestScores[size];
        return (
          <button
            key={size}
            onClick={() => handleSelect(size)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              isActive
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'bg-navy-700/50 text-steel/70 border border-transparent hover:border-steel/20 hover:text-steel'
            }`}
          >
            <div>{GRID_LABELS[size]}</div>
            {best && (
              <div className="text-xs mt-0.5 opacity-70">
                Best: {best.moves} moves
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Back Link ─── */
function BackLink() {
  return (
    <a
      href="/AlyraGames/"
      className="inline-flex items-center gap-1 text-steel/60 hover:text-steel text-sm transition-colors mb-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to Hub
    </a>
  );
}

/* ─── App ─── */
export default function App() {
  const timerRunning = useGameStore((s) => s.timerRunning);
  const cards = useGameStore((s) => s.cards);
  const startGame = useGameStore((s) => s.startGame);
  const tick = useGameStore((s) => s.tick);
  const resetGame = useGameStore((s) => s.resetGame);

  const timerRef = useRef<number | null>(null);

  // Initialize game on mount
  useEffect(() => {
    startGame();
  }, []);

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = window.setInterval(tick, 1000);
    }
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerRunning, tick]);

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-6">
      <BackLink />

      <h1 className="text-3xl sm:text-4xl font-black mb-1 tracking-tight">
        <span className="text-steel">Memory</span>{' '}
        <span className="text-accent">Cards</span>
      </h1>
      <p className="text-slate-500 text-sm mb-5">Find all the matching animal pairs!</p>

      <GridSizeSelector />

      {cards.length > 0 && (
        <>
          <StatsBar />
          <GameGrid />
        </>
      )}

      <button
        onClick={resetGame}
        className="mt-5 px-5 py-2 rounded-lg bg-navy-700/60 text-steel/80 hover:text-steel hover:bg-navy-700 text-sm font-semibold transition-all border border-transparent hover:border-steel/20"
      >
        Restart
      </button>

      <VictoryModal />
    </div>
  );
}
