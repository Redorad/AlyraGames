import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import Header from './Header';
import StatsBar from './StatsBar';
import TypingArea from './TypingArea';
import Keyboard from './Keyboard';
import Results from './Results';

export default function App() {
  const { resetGame, loadPersonalBest, gameState } = useGameStore();

  useEffect(() => {
    loadPersonalBest();
  }, [loadPersonalBest]);

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center px-4">
      <Header />
      <div className="w-full max-w-3xl">
        <StatsBar />
        <TypingArea />
        <Keyboard />
        {gameState !== 'finished' && (
          <div className="flex justify-center mt-4">
            <button
              onClick={resetGame}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-300
                         bg-navy-700/50 hover:bg-navy-700 rounded-lg transition-all
                         border border-white/5"
            >
              Reset (new text)
            </button>
          </div>
        )}
      </div>
      <Results />
      <footer className="mt-auto py-4 text-center text-slate-700 text-xs">
        AlyraGames — Typing Speed
      </footer>
    </div>
  );
}
