import { useEffect, useCallback, useRef } from 'react';
import { useGameStore, getTileConfig } from '../store/gameStore';

export default function Board() {
  const grid = useGameStore(s => s.grid);
  const move = useGameStore(s => s.move);
  const gameOver = useGameStore(s => s.gameOver);
  const won = useGameStore(s => s.won);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Keyboard ──────────────────────────────
  const handleKey = useCallback((e: KeyboardEvent) => {
    const map: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };
    const dir = map[e.key];
    if (dir) {
      e.preventDefault();
      move(dir);
    }
  }, [move]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // ── Touch / swipe ─────────────────────────
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = 30;

    if (Math.max(absDx, absDy) < threshold) return;

    if (absDx > absDy) {
      move(dx > 0 ? 'right' : 'left');
    } else {
      move(dy > 0 ? 'down' : 'up');
    }
    touchStart.current = null;
  }, [move]);

  // Collect all tiles for rendering
  const tiles: { id: number; value: number; row: number; col: number; isNew: boolean; isMerged: boolean }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const t = grid[r][c];
      if (t) tiles.push(t);
    }
  }

  const cellSize = 'calc((100% - 5 * 8px) / 4)'; // gap = 8px, 5 gaps (4 inner + 1 per side is accounted by padding)

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[360px] aspect-square select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background grid cells */}
      <div className="grid grid-cols-4 gap-2 p-2 rounded-xl bg-navy-800/80 border border-white/5 w-full h-full">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-navy-900/60" />
        ))}
      </div>

      {/* Tiles layer */}
      <div className="absolute inset-0 p-2">
        {tiles.map(t => {
          const cfg = getTileConfig(t.value);
          const x = t.col * (25); // percentage
          const y = t.row * (25);
          // Calculate position within the padded area
          // Each cell = 25% of inner area, with gap considered
          return (
            <div
              key={t.id}
              className={`tile absolute flex flex-col items-center justify-center rounded-lg font-bold ${
                t.isNew ? 'animate-tile-appear' : ''
              } ${t.isMerged ? 'animate-tile-merge' : ''}`}
              style={{
                width: 'calc((100% - 8px * 2 - 8px * 3) / 4)',
                height: 'calc((100% - 8px * 2 - 8px * 3) / 4)',
                left: `calc(8px + ${t.col} * ((100% - 8px * 2 - 8px * 3) / 4 + 8px))`,
                top: `calc(8px + ${t.row} * ((100% - 8px * 2 - 8px * 3) / 4 + 8px))`,
                backgroundColor: cfg.bg,
                color: cfg.text,
                zIndex: t.isMerged ? 2 : 1,
              }}
            >
              <span className="text-2xl sm:text-3xl leading-none">{cfg.emoji}</span>
              <span className="text-xs sm:text-sm font-extrabold mt-0.5">{t.value}</span>
            </div>
          );
        })}
      </div>

      {/* Game Over overlay */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-navy-900/80 backdrop-blur-sm z-10">
          <div className="text-center animate-fade-in">
            <p className="text-3xl font-black text-red-400 mb-2">Game Over</p>
            <p className="text-steel/70 text-sm">No moves left!</p>
          </div>
        </div>
      )}

      {/* Win overlay */}
      {won && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-navy-900/80 backdrop-blur-sm z-10">
          <div className="text-center animate-fade-in">
            <p className="text-5xl mb-2">{'\uD83C\uDFC6'}</p>
            <p className="text-3xl font-black text-accent mb-3">You Win!</p>
            <button
              onClick={() => useGameStore.getState().continueGame()}
              className="px-4 py-2 rounded-lg bg-accent/20 border border-accent/40 text-accent font-bold hover:bg-accent/30 transition-colors"
            >
              Keep Playing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
