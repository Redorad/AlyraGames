import { useEffect } from 'react';
import { useGameStore, ROWS, COLS, COLOR_MAP } from './store/gameStore';

export default function App() {
  const { trains, stations, score, lives, gameOver, message, switchTrain, reset, tick } = useGameStore();

  useEffect(() => {
    const id = setInterval(() => tick(0.1), 100);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200">
      <div className="max-w-5xl mx-auto p-4 pt-16">
        <header className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-steel">TRAIN</span>{' '}
            <span className="text-accent">DISPATCH</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Click a train to switch lanes. Match the station colors.</p>
        </header>

        <div className="flex justify-between items-center mb-3 bg-navy-800/50 rounded-xl p-3 border border-white/5">
          <div>
            <div className="text-xs text-slate-400">Score</div>
            <div className="text-xl font-bold text-steel">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Lives</div>
            <div className="text-xl font-bold text-red-400">{'❤'.repeat(Math.max(0, lives))}</div>
          </div>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30"
          >
            Reset
          </button>
        </div>

        <div className="bg-navy-800/50 border border-white/5 rounded-xl p-3">
          <div className="relative bg-navy-900 rounded-lg overflow-hidden" style={{ aspectRatio: `${COLS + 1}/${ROWS}` }}>
            {/* Tracks */}
            {Array.from({ length: ROWS }).map((_, row) => (
              <div
                key={row}
                className="absolute left-0 right-0 border-t border-dashed border-white/10"
                style={{ top: `${((row + 0.5) / ROWS) * 100}%` }}
              />
            ))}

            {/* Stations */}
            {stations.map((st) => (
              <div
                key={st.row}
                className="absolute flex items-center justify-center text-xs font-bold"
                style={{
                  right: '1%',
                  top: `${(st.row / ROWS) * 100}%`,
                  height: `${100 / ROWS}%`,
                  width: `${100 / (COLS + 1)}%`,
                  background: COLOR_MAP[st.color],
                  borderLeft: '2px solid white',
                  opacity: 0.85,
                }}
              >
                🚉
              </div>
            ))}

            {/* Trains */}
            {trains.map((t) => (
              <button
                key={t.id}
                onClick={() => switchTrain(t.id)}
                className="absolute flex items-center justify-center rounded cursor-pointer transition-all duration-100 ease-linear text-xl hover:scale-110"
                style={{
                  left: `${(t.col / (COLS + 1)) * 100}%`,
                  top: `${(t.row / ROWS) * 100 + 2}%`,
                  width: `${90 / (COLS + 1)}%`,
                  height: `${85 / ROWS}%`,
                  background: COLOR_MAP[t.color],
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                🚂
              </button>
            ))}

            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-navy-900/80 backdrop-blur">
                <div className="text-center">
                  <div className="text-4xl font-black text-red-400">GAME OVER</div>
                  <div className="text-lg text-slate-300 mt-2">Score: {score}</div>
                  <button
                    onClick={reset}
                    className="mt-4 px-6 py-2 rounded-lg bg-accent/30 border border-accent text-white hover:bg-accent/50"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-center text-sm text-slate-400">{message}</div>
      </div>
    </div>
  );
}
