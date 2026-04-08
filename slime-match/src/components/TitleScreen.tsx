import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { playSelect } from '../utils/sounds';

export default function TitleScreen() {
  const { unlockedLevel, highScores, setScreen, setCurrentLevel } = useGameStore();
  const [showRules, setShowRules] = useState(false);

  const handleLevelSelect = (level: number) => {
    if (level > unlockedLevel) return;
    playSelect();
    setCurrentLevel(level);
    setScreen('game');
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="animate-fade-in text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-accent mb-2 drop-shadow-lg">
          Slime Match
        </h1>
        <p className="text-steel/70 text-sm sm:text-base">
          Match 3 slimes to score!
        </p>
        <div className="flex justify-center gap-1 mt-2 text-2xl">
          <span>🔵</span><span>🔴</span><span>🟢</span><span>🟡</span><span>🟣</span><span>⚪</span>
        </div>
        <button
          onClick={() => setShowRules(!showRules)}
          className="mt-3 text-xs px-3 py-1 rounded-lg bg-navy-700 text-steel border border-steel/20 hover:bg-navy-700/80 transition"
        >
          {showRules ? 'Masquer les règles' : 'Règles du jeu'}
        </button>
      </div>

      {showRules && (
        <div className="w-full max-w-sm mb-4 p-4 rounded-xl bg-navy-800 border border-white/10 text-sm text-gray-300 space-y-2 animate-fade-in">
          <h3 className="text-accent font-bold text-base mb-1">Comment jouer</h3>
          <p>🔹 <strong>Échange</strong> deux slimes adjacents en cliquant dessus l'un après l'autre.</p>
          <p>🔹 <strong>Aligne 3+</strong> slimes identiques en ligne ou en colonne pour les faire disparaître et marquer des points.</p>
          <p>🔹 <strong>Gravité</strong> : les slimes tombent pour remplir les cases vides, de nouveaux apparaissent en haut.</p>
          <p>🔹 <strong>Cascades</strong> : les matchs en chaîne augmentent le multiplicateur de combo (×2, ×3... jusqu'à ×5).</p>
          <h3 className="text-accent font-bold text-base mt-3 mb-1">Gemmes spéciales</h3>
          <p>✨ <strong>Match de 4</strong> → crée une gemme <span className="text-yellow-400">Ligne</span> qui détruit toute une ligne ou colonne.</p>
          <p>💎 <strong>Match de 5+</strong> → crée une <span className="text-purple-400">Bombe</span> qui détruit toutes les gemmes de la même couleur.</p>
          <h3 className="text-accent font-bold text-base mt-3 mb-1">Objectif</h3>
          <p>🎯 Atteins le <strong>score cible</strong> avant la fin du <strong>temps</strong> (60 secondes par niveau).</p>
          <p>⭐ 10 niveaux de difficulté croissante !</p>
        </div>
      )}

      <div className="w-full max-w-sm space-y-2">
        <h2 className="text-steel text-center text-lg font-semibold mb-3">Select Level</h2>
        <div className="grid grid-cols-2 gap-2">
          {LEVELS.map((lvl) => {
            const unlocked = lvl.level <= unlockedLevel;
            const best = highScores[lvl.level];
            const completed = best !== undefined && best >= lvl.targetScore;

            return (
              <button
                key={lvl.level}
                onClick={() => handleLevelSelect(lvl.level)}
                disabled={!unlocked}
                className={`
                  relative p-3 rounded-lg border text-left transition-all
                  ${unlocked
                    ? completed
                      ? 'bg-accent/20 border-accent/50 hover:bg-accent/30 cursor-pointer'
                      : 'bg-navy-800 border-steel/30 hover:bg-navy-700 hover:border-steel/50 cursor-pointer'
                    : 'bg-navy-900/50 border-navy-700/30 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-white/40'}`}>
                    Level {lvl.level}
                  </span>
                  {completed && <span className="text-sm">⭐</span>}
                  {!unlocked && <span className="text-sm">🔒</span>}
                </div>
                <div className={`text-xs mt-1 ${unlocked ? 'text-steel/70' : 'text-white/30'}`}>
                  Target: {lvl.targetScore.toLocaleString()}
                </div>
                {best !== undefined && (
                  <div className="text-xs text-accent/80 mt-0.5">
                    Best: {best.toLocaleString()}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
