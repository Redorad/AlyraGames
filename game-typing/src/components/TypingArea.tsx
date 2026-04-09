import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

export default function TypingArea() {
  const {
    targetText,
    typedText,
    gameState,
    startGame,
    handleInput,
    handleBackspace,
    tick,
  } = useGameStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Start timer when game begins
  useEffect(() => {
    if (gameState === 'running' && !intervalRef.current) {
      intervalRef.current = window.setInterval(() => {
        tick();
      }, 1000);
    }
    if (gameState !== 'running' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [gameState, tick]);

  // Keep focus on container
  useEffect(() => {
    if (containerRef.current && gameState !== 'finished') {
      containerRef.current.focus();
    }
  }, [gameState]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent default for keys we handle
    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
      return;
    }

    if (e.key === 'Tab' || e.key === 'Escape') {
      e.preventDefault();
      return;
    }

    // Ignore modifier keys, function keys, etc.
    if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return;

    e.preventDefault();

    // Start game on first keypress
    if (gameState === 'idle') {
      startGame();
      // We need to defer the input slightly so the store updates first
      setTimeout(() => {
        useGameStore.getState().handleInput(e.key);
      }, 0);
      return;
    }

    if (gameState === 'running') {
      handleInput(e.key);
    }
  }, [gameState, startGame, handleInput, handleBackspace]);

  // Auto-scroll to keep current character visible
  useEffect(() => {
    if (containerRef.current) {
      const currentCharEl = containerRef.current.querySelector('[data-current="true"]');
      if (currentCharEl) {
        currentCharEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [typedText]);

  const renderText = () => {
    const chars = targetText.split('');
    return chars.map((char, i) => {
      let className = 'text-slate-600'; // upcoming
      let bgClass = '';
      const isCurrent = i === typedText.length;

      if (i < typedText.length) {
        if (typedText[i] === char) {
          className = 'text-emerald-400'; // correct
        } else {
          className = 'text-red-400'; // error
          bgClass = 'bg-red-400/10';
        }
      }

      return (
        <span
          key={i}
          data-current={isCurrent ? 'true' : 'false'}
          className={`${className} ${bgClass} relative`}
        >
          {isCurrent && gameState !== 'finished' && (
            <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent cursor-blink -ml-px" />
          )}
          {char}
        </span>
      );
    });

  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative bg-navy-800 rounded-xl border border-white/5 p-6 mx-auto max-w-3xl
                 focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-text
                 min-h-[200px] max-h-[280px] overflow-y-auto"
      onClick={() => containerRef.current?.focus()}
    >
      {gameState === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy-800/80 rounded-xl z-10 pointer-events-none">
          <p className="text-slate-400 text-lg animate-pulse">Start typing to begin...</p>
        </div>
      )}
      <div className="typing-text select-none leading-relaxed">
        {renderText()}
        {/* Show extra typed chars beyond target */}
        {typedText.length > targetText.length && (
          <span className="text-red-400 bg-red-400/10">
            {typedText.slice(targetText.length)}
          </span>
        )}
      </div>
    </div>
  );
}
