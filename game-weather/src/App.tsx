import { useGameStore, PUZZLES, WEATHER_INFO, Weather } from './store/gameStore';

export default function App() {
  const {
    current, score, lives, message, lastFact, answered, correct,
    guess, next, reset,
  } = useGameStore();

  const puzzle = PUZZLES[current];
  const gameOver = lives <= 0 || (current >= PUZZLES.length - 1 && answered);

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200">
      <div className="max-w-2xl mx-auto p-4 pt-16">
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-steel">WEATHER</span>{' '}
            <span className="text-accent">ORACLE</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Read the clues. Predict tomorrow's weather.</p>
        </header>

        <div className="bg-navy-800/50 border border-white/5 rounded-xl p-3 mb-4 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-slate-400">Puzzle</div>
            <div className="text-lg font-bold text-steel">{current + 1}/{PUZZLES.length}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400">Score</div>
            <div className="text-lg font-bold text-accent">{score}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400">Lives</div>
            <div className="text-lg">{'❤'.repeat(Math.max(0, lives))}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-navy-700 to-navy-800 border border-steel/20 rounded-2xl p-6 mb-4">
          <h2 className="text-xs uppercase tracking-wider text-steel mb-3">Clues</h2>
          <div className="space-y-2 mb-4">
            {puzzle.clues.map((c, i) => (
              <div key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="text-accent font-bold">{i + 1}.</span>
                <span>{c}</span>
              </div>
            ))}
          </div>

          {answered && (
            <div className={`mt-4 p-3 rounded-lg border ${correct ? 'bg-green-950/40 border-green-500/30' : 'bg-red-950/40 border-red-500/30'}`}>
              <div className={`font-bold ${correct ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </div>
              {lastFact && (
                <div className="text-xs text-slate-300 mt-2 italic">🔬 {lastFact}</div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {(Object.keys(WEATHER_INFO) as Weather[]).map((w) => {
            const info = WEATHER_INFO[w];
            const isAnswer = answered && puzzle.answer === w;
            return (
              <button
                key={w}
                onClick={() => guess(w)}
                disabled={answered}
                className={`p-3 rounded-lg border text-center transition ${
                  isAnswer
                    ? 'bg-green-500/30 border-green-400'
                    : answered
                    ? 'bg-navy-800/50 border-white/5 opacity-40'
                    : 'bg-navy-800/60 border-steel/20 hover:border-steel/60 hover:bg-navy-700'
                }`}
              >
                <div className="text-3xl">{info.emoji}</div>
                <div className="text-[10px] text-slate-300 mt-1">{info.name}</div>
              </button>
            );
          })}
        </div>

        {answered && !gameOver && (
          <button
            onClick={next}
            className="w-full py-3 rounded-xl bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 font-bold"
          >
            Next puzzle →
          </button>
        )}

        {gameOver && (
          <div className="text-center">
            <div className="text-2xl font-black text-accent mb-2">Final Score: {score}</div>
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl bg-steel/20 border border-steel/40 text-steel hover:bg-steel/30 font-bold"
            >
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
