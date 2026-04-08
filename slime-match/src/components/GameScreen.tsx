import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { getGemEmoji, getGemColor } from '../data/gems';
import {
  createBoard,
  swapGems,
  areAdjacent,
  findMatches,
  resolveMatches,
  hasValidMoves,
  shuffleBoard,
  getRows,
  getCols,
} from '../engine/board';
import { Gem, Position } from '../types';
import { playSwap, playMatch, playSpecial, playInvalidSwap, playLevelComplete, playGameOver } from '../utils/sounds';

type GamePhase = 'idle' | 'swapping' | 'matching' | 'falling' | 'gameover' | 'levelcomplete';

export default function GameScreen() {
  const { currentLevel, setScreen, completeLevel } = useGameStore();
  const levelConfig = LEVELS[currentLevel - 1];

  const [board, setBoard] = useState<Gem[][]>(() => createBoard());
  const [selected, setSelected] = useState<Position | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(levelConfig.timeSeconds);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [matchedCells, setMatchedCells] = useState<Set<string>>(new Set());
  const [fallingCells, setFallingCells] = useState<Set<string>>(new Set());
  const [comboDisplay, setComboDisplay] = useState<{ combo: number; key: number } | null>(null);
  const [invalidSwap, setInvalidSwap] = useState<Position | null>(null);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const comboKeyRef = useRef(0);

  useEffect(() => {
    if (phase === 'gameover' || phase === 'levelcomplete') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (scoreRef.current >= levelConfig.targetScore) {
            setPhase('levelcomplete');
            completeLevel(currentLevel, scoreRef.current);
            playLevelComplete();
          } else {
            setPhase('gameover');
            playGameOver();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, levelConfig.targetScore, currentLevel, completeLevel]);

  useEffect(() => {
    if (phase === 'idle' && score >= levelConfig.targetScore && timeLeft > 0) {
      setPhase('levelcomplete');
      completeLevel(currentLevel, score);
      playLevelComplete();
    }
  }, [score, phase, levelConfig.targetScore, timeLeft, currentLevel, completeLevel]);

  const processCascade = useCallback((currentBoard: Gem[][], currentCombo: number) => {
    const result = resolveMatches(currentBoard);
    if (!result.hadMatch) {
      if (!hasValidMoves(currentBoard)) setBoard(shuffleBoard(currentBoard));
      setCombo(0);
      setPhase('idle');
      return;
    }

    const newCombo = currentCombo + 1;
    setCombo(newCombo);
    if (newCombo > 1) {
      comboKeyRef.current++;
      setComboDisplay({ combo: newCombo, key: comboKeyRef.current });
      playSpecial();
    } else {
      playMatch(newCombo);
    }

    setMatchedCells(result.matchedPositions);
    setPhase('matching');

    const earnedScore = result.score * Math.min(newCombo, 5);

    setTimeout(() => {
      setScore(prev => prev + earnedScore);
      setMatchedCells(new Set());
      const allFalling = new Set<string>();
      for (let r = 0; r < getRows(); r++)
        for (let c = 0; c < getCols(); c++)
          allFalling.add(`${r},${c}`);
      setFallingCells(allFalling);
      setBoard(result.board);
      setPhase('falling');

      setTimeout(() => {
        setFallingCells(new Set());
        processCascade(result.board, newCombo);
      }, 400);
    }, 350);
  }, []);

  const handleGemClick = useCallback((row: number, col: number) => {
    if (phase !== 'idle') return;
    const pos: Position = { row, col };
    if (!selected) { setSelected(pos); return; }
    if (selected.row === row && selected.col === col) { setSelected(null); return; }
    if (!areAdjacent(selected, pos)) { setSelected(pos); return; }

    setPhase('swapping');
    const swapped = swapGems(board, selected, pos);
    setBoard(swapped);
    playSwap();
    const swapSel = selected;
    setSelected(null);

    setTimeout(() => {
      if (findMatches(swapped).length === 0) {
        playInvalidSwap();
        setInvalidSwap(swapSel);
        setTimeout(() => {
          setBoard(swapGems(swapped, swapSel, pos));
          setInvalidSwap(null);
          setPhase('idle');
        }, 350);
        return;
      }
      processCascade(swapped, 0);
    }, 200);
  }, [phase, selected, board, processCascade]);

  const handleBack = () => setScreen('title');
  const handleRestart = () => {
    setBoard(createBoard()); setScore(0); setCombo(0);
    setTimeLeft(levelConfig.timeSeconds); setSelected(null);
    setMatchedCells(new Set()); setFallingCells(new Set()); setPhase('idle');
  };

  const progressPercent = Math.min(100, (score / levelConfig.targetScore) * 100);
  const timePercent = (timeLeft / levelConfig.timeSeconds) * 100;
  const isTimeLow = timeLeft <= 10;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-navy-900">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button onClick={handleBack} className="text-gray-400 hover:text-white text-base px-3 py-1.5 rounded-lg transition">
            {"\u2190"} Retour
          </button>
          <span className="text-white font-bold text-lg">Niveau {currentLevel}</span>
          <button onClick={handleRestart} className="text-gray-400 hover:text-white text-base px-3 py-1.5 rounded-lg transition">
            {"\u21BB"} Restart
          </button>
        </div>

        {/* Score */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Score</span>
            <span className="text-accent font-bold text-base">{score.toLocaleString()} / {levelConfig.targetScore.toLocaleString()}</span>
          </div>
          <div className="w-full h-3.5 bg-navy-800 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-accent/80 to-purple-400 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Timer */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Temps</span>
            <span className={`font-bold text-base ${isTimeLow ? 'animate-timer-warning' : 'text-steel'}`}>{timeLeft}s</span>
          </div>
          <div className="w-full h-3 bg-navy-800 rounded-full overflow-hidden border border-white/5">
            <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${isTimeLow ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-steel/70 to-steel'}`} style={{ width: `${timePercent}%` }} />
          </div>
        </div>
      </div>

      {/* Combo */}
      {comboDisplay && (
        <div key={comboDisplay.key} className="absolute top-32 left-1/2 -translate-x-1/2 animate-combo-popup pointer-events-none z-20">
          <span className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.7)]">
            {comboDisplay.combo}x COMBO!
          </span>
        </div>
      )}

      {/* Game Board — fills all remaining space */}
      <div className="flex-1 flex items-center justify-center px-2 pb-3 overflow-hidden">
        <div
          className="rounded-2xl p-1"
          style={{
            background: 'linear-gradient(135deg, rgba(30,35,80,0.9), rgba(15,18,50,0.95))',
            border: '2px solid rgba(126,200,227,0.15)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
            width: '100%',
            maxWidth: 'min(95vw, 95vh - 180px)',
            aspectRatio: '1',
          }}
        >
          <div
            className="grid h-full w-full"
            style={{
              gridTemplateColumns: `repeat(${getCols()}, 1fr)`,
              gridTemplateRows: `repeat(${getRows()}, 1fr)`,
              gap: '3px',
            }}
          >
            {board.map((row, r) =>
              row.map((gem, c) => {
                const isSelected = selected?.row === r && selected?.col === c;
                const isMatched = matchedCells.has(`${r},${c}`);
                const isFalling = fallingCells.has(`${r},${c}`);
                const isInvalid = invalidSwap?.row === r && invalidSwap?.col === c;
                const isSpecial = gem.special !== 'none';
                const gemColor = getGemColor(gem.type);

                return (
                  <button
                    key={gem.id}
                    onClick={() => handleGemClick(r, c)}
                    className={`
                      gem-cell relative flex items-center justify-center
                      leading-none select-none
                      ${isSelected ? 'animate-gem-selected z-10' : ''}
                      ${isMatched ? 'animate-gem-match' : ''}
                      ${isFalling ? 'animate-gem-fall' : ''}
                      ${isInvalid ? 'animate-swap-invalid' : ''}
                      ${isSpecial ? 'animate-special-pulse' : ''}
                      ${gem.special === 'line_h' ? 'gem-special-line-h' : ''}
                      ${gem.special === 'line_v' ? 'gem-special-line-v' : ''}
                      ${gem.special === 'bomb' ? 'gem-special-bomb' : ''}
                    `}
                    style={{
                      backgroundColor: `${gemColor}20`,
                      border: isSelected
                        ? `2.5px solid ${gemColor}AA`
                        : `2px solid ${gemColor}35`,
                      borderRadius: '12px',
                      boxShadow: isSelected
                        ? `0 0 16px ${gemColor}50, inset 0 0 10px ${gemColor}20`
                        : `inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.25)`,
                      fontSize: 'clamp(20px, 4.5vw, 36px)',
                    }}
                    disabled={phase !== 'idle'}
                  >
                    <span className={isSpecial ? 'drop-shadow-lg' : 'drop-shadow-sm'}>
                      {getGemEmoji(gem.type)}
                    </span>
                    {isSpecial && (
                      <span className="absolute bottom-0 right-0.5" style={{ fontSize: 'clamp(8px, 1.5vw, 12px)' }}>
                        {gem.special === 'bomb' ? '\u{1F4A5}' : '\u{2728}'}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Game Over */}
      {phase === 'gameover' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-navy-800 border border-red-500/20 rounded-2xl p-8 text-center animate-fade-in max-w-sm mx-4 shadow-2xl">
            <div className="text-5xl mb-3">{"\u{23F0}"}</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Temps écoulé !</h2>
            <p className="text-gray-300 text-lg mb-1">Score : {score.toLocaleString()}</p>
            <p className="text-gray-500 mb-6">Objectif : {levelConfig.targetScore.toLocaleString()}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleRestart} className="px-6 py-3 bg-accent/20 hover:bg-accent/30 text-accent rounded-xl text-lg font-bold transition border border-accent/30">Réessayer</button>
              <button onClick={handleBack} className="px-6 py-3 bg-navy-700 hover:bg-navy-700/80 text-gray-300 rounded-xl text-lg font-medium transition border border-white/10">Menu</button>
            </div>
          </div>
        </div>
      )}

      {/* Level Complete */}
      {phase === 'levelcomplete' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-navy-800 border border-accent/20 rounded-2xl p-8 text-center animate-fade-in max-w-sm mx-4 shadow-2xl">
            <div className="text-5xl mb-2">{"\u{1F389}"}</div>
            <h2 className="text-2xl font-bold text-accent mb-1">Niveau réussi !</h2>
            <p className="text-yellow-400 text-2xl mb-2">{"\u{2B50}"} {"\u{2B50}"} {"\u{2B50}"}</p>
            <p className="text-gray-300 text-lg mb-1">Score : {score.toLocaleString()}</p>
            {timeLeft > 0 && <p className="text-gray-500 mb-6">Temps restant : {timeLeft}s</p>}
            <div className="flex gap-3 justify-center">
              {currentLevel < LEVELS.length && (
                <button
                  onClick={() => {
                    const nl = currentLevel + 1;
                    useGameStore.getState().setCurrentLevel(nl);
                    setBoard(createBoard()); setScore(0); setCombo(0);
                    setTimeLeft(LEVELS[nl - 1].timeSeconds);
                    setSelected(null); setMatchedCells(new Set()); setFallingCells(new Set()); setPhase('idle');
                  }}
                  className="px-6 py-3 bg-accent/20 hover:bg-accent/30 text-accent rounded-xl text-lg font-bold transition border border-accent/30"
                >Suivant</button>
              )}
              <button onClick={handleBack} className="px-6 py-3 bg-navy-700 hover:bg-navy-700/80 text-gray-300 rounded-xl text-lg font-medium transition border border-white/10">Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
