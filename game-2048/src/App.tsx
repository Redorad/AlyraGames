import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import Header from './components/Header';
import Board from './components/Board';

export default function App() {
  const init = useGameStore(s => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[250px] bg-[radial-gradient(ellipse,rgba(167,139,250,0.08),transparent_70%)] pointer-events-none" />

      <Header />
      <Board />

      {/* Controls hint */}
      <p className="mt-4 text-slate-600 text-xs text-center">
        Arrow keys / WASD / Swipe to move tiles
      </p>
    </div>
  );
}
