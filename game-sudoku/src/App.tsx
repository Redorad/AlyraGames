import { useEffect, useCallback } from 'react';
import { useGameStore } from './store';
import Grid from './components/Grid';
import NumberPad from './components/NumberPad';
import Controls from './components/Controls';
import Header from './components/Header';
import WinModal from './components/WinModal';

export default function App() {
  const tick = useGameStore(s => s.tick);
  const placeNumber = useGameStore(s => s.placeNumber);
  const eraseCell = useGameStore(s => s.eraseCell);
  const undo = useGameStore(s => s.undo);
  const toggleNotesMode = useGameStore(s => s.toggleNotesMode);
  const selectedCell = useGameStore(s => s.selectedCell);
  const isComplete = useGameStore(s => s.isComplete);

  // Timer
  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // Keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isComplete) return;

    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      placeNumber(num);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      eraseCell();
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      undo();
    } else if (e.key === 'n' || e.key === 'N') {
      toggleNotesMode();
    }
  }, [placeNumber, eraseCell, undo, toggleNotesMode, isComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200 flex flex-col items-center select-none">
      <Header />
      <div className="flex flex-col items-center gap-4 px-4 pb-8 w-full max-w-lg">
        <Controls />
        <Grid />
        <NumberPad />
      </div>
      {isComplete && <WinModal />}
    </div>
  );
}
