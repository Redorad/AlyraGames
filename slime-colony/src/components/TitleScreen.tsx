import React, { useMemo } from 'react';
import { useGameStore, hasSaveData } from '../store/gameStore';
import { playClickSound } from '../utils/sounds';

export default function TitleScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const loadSave = useGameStore((s) => s.loadSave);
  const clearSave = useGameStore((s) => s.clearSave);
  const saveExists = useMemo(() => hasSaveData(), []);

  const handleNewGame = () => {
    playClickSound();
    clearSave();
    startGame();
  };

  const handleContinue = () => {
    playClickSound();
    loadSave();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-navy-900 text-white relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-accent/20"
            style={{
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `pulse-glow ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="text-center z-10">
        <div className="text-8xl mb-6">🏘️</div>
        <h1 className="text-6xl font-bold mb-2 bg-gradient-to-r from-steel to-accent bg-clip-text text-transparent">
          Slime Colony
        </h1>
        <p className="text-steel/70 text-lg mb-2">Colony Simulation</p>
        <p className="text-accent/60 text-sm mb-10 italic">
          Inspired by &quot;That Time I Got Reincarnated as a Slime&quot;
        </p>

        <div className="flex flex-col items-center gap-3">
          {saveExists && (
            <button
              onClick={handleContinue}
              className="px-10 py-4 bg-gradient-to-r from-navy-700 to-navy-800 border border-accent/60 rounded-xl
                         text-accent text-xl font-semibold hover:border-accent hover:shadow-lg hover:shadow-accent/20
                         transition-all duration-300 animate-pulse-glow"
            >
              Continue
            </button>
          )}
          <button
            onClick={handleNewGame}
            className={`px-10 py-4 bg-gradient-to-r from-navy-700 to-navy-800 border border-steel/40 rounded-xl
                       text-steel font-semibold hover:border-steel hover:shadow-lg hover:shadow-steel/20
                       transition-all duration-300 ${saveExists ? 'text-lg' : 'text-xl animate-pulse-glow'}`}
          >
            New Game
          </button>
        </div>

        <div className="mt-12 text-sm text-steel/40 max-w-md mx-auto space-y-1">
          <p>Manage resources, construct buildings,</p>
          <p>and grow the city of Tempest!</p>
        </div>
      </div>
    </div>
  );
}
