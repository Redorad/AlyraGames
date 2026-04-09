import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import Board from './Board';
import PiecePreview from './PiecePreview';
import ScorePanel from './ScorePanel';
import Controls from './Controls';
import TouchControls from './TouchControls';

export default function App() {
  const started = useGameStore(s => s.started);
  const gameOver = useGameStore(s => s.gameOver);
  const paused = useGameStore(s => s.paused);
  const nextPieces = useGameStore(s => s.nextPieces);
  const holdPiece = useGameStore(s => s.holdPiece);
  const score = useGameStore(s => s.score);

  const startGame = useGameStore(s => s.startGame);
  const moveLeft = useGameStore(s => s.moveLeft);
  const moveRight = useGameStore(s => s.moveRight);
  const moveDown = useGameStore(s => s.moveDown);
  const rotate = useGameStore(s => s.rotate);
  const hardDrop = useGameStore(s => s.hardDrop);
  const hold = useGameStore(s => s.hold);
  const togglePause = useGameStore(s => s.togglePause);
  const tick = useGameStore(s => s.tick);
  const getDropInterval = useGameStore(s => s.getDropInterval);

  const intervalRef = useRef<number | null>(null);

  // Game loop
  const startLoop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    const interval = getDropInterval();
    intervalRef.current = window.setInterval(() => {
      tick();
    }, interval);
  }, [getDropInterval, tick]);

  useEffect(() => {
    if (started && !gameOver && !paused) {
      startLoop();
    } else if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [started, gameOver, paused, startLoop]);

  // Update interval when level changes
  const level = useGameStore(s => s.level);
  useEffect(() => {
    if (started && !gameOver && !paused) {
      startLoop();
    }
  }, [level, started, gameOver, paused, startLoop]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          if (!started || gameOver) {
            startGame();
          } else {
            hardDrop();
          }
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          hold();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          if (started && !gameOver) {
            togglePause();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [moveLeft, moveRight, moveDown, rotate, hardDrop, hold, togglePause, startGame, started, gameOver]);

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-3 py-4 select-none">
      {/* Header */}
      <h1 className="text-2xl md:text-3xl font-black mb-4 tracking-tight">
        <span className="text-steel">FALLING</span>{' '}
        <span className="text-accent">BLOCKS</span>
      </h1>

      <div className="flex gap-3 items-start">
        {/* Left panel: Hold */}
        <div className="hidden md:block w-24 flex-shrink-0">
          <PiecePreview type={holdPiece} label="Hold" />
          <Controls />
        </div>

        {/* Center: Board */}
        <div className="relative">
          <Board />

          {/* Overlays */}
          {!started && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
              <div className="text-2xl font-bold text-white mb-2">Falling Blocks</div>
              <button
                onClick={startGame}
                className="px-6 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg font-bold transition-colors"
              >
                Start Game
              </button>
              <div className="text-xs text-slate-400 mt-2 md:hidden">Tap Start or press Space</div>
              <div className="text-xs text-slate-400 mt-2 hidden md:block">Press Space to start</div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
              <div className="text-2xl font-bold text-red-400 mb-1">Game Over</div>
              <div className="text-lg text-white mb-3">Score: {score.toLocaleString()}</div>
              <button
                onClick={startGame}
                className="px-6 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg font-bold transition-colors"
              >
                Play Again
              </button>
            </div>
          )}

          {paused && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
              <div className="text-2xl font-bold text-accent mb-2">Paused</div>
              <div className="text-sm text-slate-300">Press P or Esc to resume</div>
            </div>
          )}
        </div>

        {/* Right panel: Next + Score */}
        <div className="hidden md:block w-24 flex-shrink-0">
          <PiecePreview type={nextPieces[0] || null} label="Next" />
          {nextPieces[1] && <PiecePreview type={nextPieces[1]} label="" />}
          {nextPieces[2] && <PiecePreview type={nextPieces[2]} label="" />}
          <ScorePanel />
        </div>
      </div>

      {/* Mobile panels below board */}
      <div className="md:hidden w-full mt-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <PiecePreview type={holdPiece} label="Hold" />
          </div>
          <div className="flex-1">
            <PiecePreview type={nextPieces[0] || null} label="Next" />
          </div>
          <div className="flex-1">
            <ScorePanel />
          </div>
        </div>
      </div>

      {/* Touch controls */}
      <TouchControls />
    </div>
  );
}
