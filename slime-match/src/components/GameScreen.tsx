import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { getGemEmoji } from '../data/gems';
import {
  createBoard,
  swapGems,
  areAdjacent,
  findMatches,
  processMatches,
  removeMatchedAndActivateSpecials,
  removeGems,
  applyGravity,
  placeSpecials,
  hasValidMoves,
  shuffleBoard,
  cloneBoard,
  getRows,
  getCols,
} from '../engine/board';
import { Gem, Position } from '../types';
import { playSwap, playMatch, playSpecial, playInvalidSwap, playLevelComplete, playGameOver } from '../utils/sounds';

type GamePhase = 'idle' | 'swapping' | 'matching' | 'falling' | 'cascading' | 'gameover' | 'levelcomplete';

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

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const boardRef = useRef(board);
  boardRef.current = board;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const comboRef = useRef(combo);
  comboRef.current = combo;
  const comboKeyRef = useRef(0);

  // Timer
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

  // Check for level complete when score target is reached
  useEffect(() => {
    if (phase === 'idle' && score >= levelConfig.targetScore && timeLeft > 0) {
      setPhase('levelcomplete');
      completeLevel(currentLevel, score);
      playLevelComplete();
    }
  }, [score, phase, levelConfig.targetScore, timeLeft, currentLevel, completeLevel]);

  const processCascade = useCallback((currentBoard: Gem[][], currentCombo: number) => {
    const matches = findMatches(currentBoard);
    if (matches.length === 0) {
      // No more matches -- check for valid moves
      if (!hasValidMoves(currentBoard)) {
        const shuffled = shuffleBoard(currentBoard);
        setBoard(shuffled);
      }
      setCombo(0);
      setPhase('idle');
      return;
    }

    const newCombo = currentCombo + 1;
    setCombo(newCombo);

    if (newCombo > 1) {
      comboKeyRef.current++;
      setComboDisplay({ combo: newCombo, key: comboKeyRef.current });
    }

    // Show matched gems
    const matchInfo = processMatches(currentBoard);
    setMatchedCells(matchInfo.matchedPositions);
    setPhase('matching');

    if (newCombo > 1) {
      playSpecial();
    } else {
      playMatch(newCombo);
    }

    setTimeout(() => {
      // Remove matched gems, activate specials
      const { totalScore, extraDestroyed } = removeMatchedAndActivateSpecials(currentBoard, matchInfo);
      const comboMultiplier = Math.min(newCombo, 5);
      const earnedScore = totalScore * comboMultiplier;

      setScore(prev => prev + earnedScore);

      // Remove gems
      let afterRemoval = removeGems(currentBoard, extraDestroyed);

      // Place any specials that were earned from 4+ matches
      // Filter specials to only those whose positions weren't destroyed
      const validSpecials = matchInfo.specialsToCreate.filter(
        s => !extraDestroyed.has(`${s.pos.row},${s.pos.col}`) || matchInfo.matchedPositions.has(`${s.pos.row},${s.pos.col}`)
      );

      setMatchedCells(new Set());
      setPhase('falling');

      // Apply gravity
      const { board: afterGravity } = applyGravity(afterRemoval);

      // Place specials after gravity
      let finalBoard = afterGravity;
      if (validSpecials.length > 0) {
        // Find new positions for specials -- they should appear where new gems are
        // For simplicity, place them at the matched center positions if available
        finalBoard = placeSpecials(afterGravity, validSpecials.map(s => ({
          ...s,
          pos: s.pos,
        })));
      }

      // Mark all cells as falling briefly
      const allFalling = new Set<string>();
      for (let r = 0; r < getRows(); r++) {
        for (let c = 0; c < getCols(); c++) {
          allFalling.add(`${r},${c}`);
        }
      }
      setFallingCells(allFalling);
      setBoard(finalBoard);

      setTimeout(() => {
        setFallingCells(new Set());
        // Check for cascade matches
        processCascade(finalBoard, newCombo);
      }, 350);
    }, 300);
  }, []);

  const handleGemClick = useCallback((row: number, col: number) => {
    if (phase !== 'idle') return;

    const pos: Position = { row, col };

    if (!selected) {
      setSelected(pos);
      return;
    }

    if (selected.row === row && selected.col === col) {
      setSelected(null);
      return;
    }

    if (!areAdjacent(selected, pos)) {
      setSelected(pos);
      return;
    }

    // Try swap
    setPhase('swapping');
    const swapped = swapGems(boardRef.current, selected, pos);
    setBoard(swapped);
    playSwap();

    const swapSel = selected;
    setSelected(null);

    setTimeout(() => {
      const matches = findMatches(swapped);
      if (matches.length === 0) {
        // Invalid swap - swap back
        playInvalidSwap();
        setInvalidSwap(swapSel);
        setTimeout(() => {
          setBoard(swapGems(swapped, swapSel, pos));
          setInvalidSwap(null);
          setPhase('idle');
        }, 300);
        return;
      }

      // Valid swap - process matches
      processCascade(swapped, 0);
    }, 200);
  }, [phase, selected, processCascade]);

  const handleBack = () => {
    setScreen('title');
  };

  const handleRestart = () => {
    setBoard(createBoard());
    setScore(0);
    setCombo(0);
    setTimeLeft(levelConfig.timeSeconds);
    setSelected(null);
    setMatchedCells(new Set());
    setFallingCells(new Set());
    setPhase('idle');
  };

  const progressPercent = Math.min(100, (score / levelConfig.targetScore) * 100);
  const timePercent = (timeLeft / levelConfig.timeSeconds) * 100;
  const isTimeLow = timeLeft <= 10;

  return (
    <div className="h-full flex flex-col items-center p-2 sm:p-4 overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-sm mb-2 animate-slide-down">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={handleBack}
            className="text-steel/70 hover:text-steel text-sm px-2 py-1 rounded transition-colors"
          >
            &larr; Back
          </button>
          <span className="text-white font-bold text-sm">Level {currentLevel}</span>
          <button
            onClick={handleRestart}
            className="text-steel/70 hover:text-steel text-sm px-2 py-1 rounded transition-colors"
          >
            Restart
          </button>
        </div>

        {/* Score bar */}
        <div className="mb-1">
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-steel/70">Score</span>
            <span className="text-accent font-bold">{score.toLocaleString()} / {levelConfig.targetScore.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-purple-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Timer bar */}
        <div>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-steel/70">Time</span>
            <span className={`font-bold ${isTimeLow ? 'animate-timer-warning' : 'text-steel'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isTimeLow ? 'bg-red-500' : 'bg-steel'
              }`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Combo display */}
      {comboDisplay && (
        <div
          key={comboDisplay.key}
          className="absolute top-24 left-1/2 -translate-x-1/2 animate-combo-popup pointer-events-none z-20"
        >
          <span className="text-2xl font-black text-yellow-400 drop-shadow-lg">
            {comboDisplay.combo}x COMBO!
          </span>
        </div>
      )}

      {/* Game Board */}
      <div className="relative flex-1 flex items-center justify-center w-full max-w-sm">
        <div
          className="grid gap-0.5 p-1 bg-navy-800/50 rounded-lg border border-steel/10"
          style={{
            gridTemplateColumns: `repeat(${getCols()}, 1fr)`,
            aspectRatio: '1',
            width: '100%',
            maxWidth: '360px',
            maxHeight: 'calc(100vh - 200px)',
          }}
        >
          {board.map((row, r) =>
            row.map((gem, c) => {
              const isSelected = selected?.row === r && selected?.col === c;
              const isMatched = matchedCells.has(`${r},${c}`);
              const isFalling = fallingCells.has(`${r},${c}`);
              const isInvalid = invalidSwap?.row === r && invalidSwap?.col === c;
              const isSpecial = gem.special !== 'none';

              return (
                <button
                  key={gem.id}
                  onClick={() => handleGemClick(r, c)}
                  className={`
                    relative flex items-center justify-center rounded
                    text-xl sm:text-2xl leading-none select-none
                    transition-transform duration-150
                    ${isSelected ? 'animate-gem-selected bg-accent/20 z-10' : 'bg-navy-700/40 hover:bg-navy-700/70'}
                    ${isMatched ? 'animate-gem-match' : ''}
                    ${isFalling ? 'animate-gem-fall' : ''}
                    ${isInvalid ? 'animate-swap-invalid' : ''}
                    ${isSpecial ? 'animate-special-pulse' : ''}
                    ${gem.special === 'line_h' ? 'gem-special-line-h' : ''}
                    ${gem.special === 'line_v' ? 'gem-special-line-v' : ''}
                    ${gem.special === 'bomb' ? 'gem-special-bomb' : ''}
                  `}
                  style={{ aspectRatio: '1' }}
                  disabled={phase !== 'idle'}
                >
                  <span className={isSpecial ? 'drop-shadow-lg' : ''}>
                    {getGemEmoji(gem.type)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Game Over Overlay */}
      {phase === 'gameover' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
          <div className="bg-navy-800 border border-red-500/30 rounded-xl p-6 text-center animate-fade-in max-w-xs mx-4">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Time's Up!</h2>
            <p className="text-steel/70 mb-1">Score: {score.toLocaleString()}</p>
            <p className="text-steel/50 text-sm mb-4">
              Target: {levelConfig.targetScore.toLocaleString()}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleRestart}
                className="px-4 py-2 bg-accent/80 hover:bg-accent text-white rounded-lg font-semibold transition-colors"
              >
                Retry
              </button>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-steel rounded-lg font-semibold transition-colors border border-steel/20"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Complete Overlay */}
      {phase === 'levelcomplete' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
          <div className="bg-navy-800 border border-accent/30 rounded-xl p-6 text-center animate-fade-in max-w-xs mx-4">
            <h2 className="text-2xl font-bold text-accent mb-1">Level Complete!</h2>
            <p className="text-yellow-400 text-lg mb-2">⭐ ⭐ ⭐</p>
            <p className="text-steel mb-1">Score: {score.toLocaleString()}</p>
            {timeLeft > 0 && (
              <p className="text-steel/50 text-sm mb-4">Time remaining: {timeLeft}s</p>
            )}
            <div className="flex gap-2 justify-center">
              {currentLevel < LEVELS.length && (
                <button
                  onClick={() => {
                    const nextLevel = currentLevel + 1;
                    useGameStore.getState().setCurrentLevel(nextLevel);
                    setBoard(createBoard());
                    setScore(0);
                    setCombo(0);
                    setTimeLeft(LEVELS[nextLevel - 1].timeSeconds);
                    setSelected(null);
                    setMatchedCells(new Set());
                    setFallingCells(new Set());
                    setPhase('idle');
                  }}
                  className="px-4 py-2 bg-accent/80 hover:bg-accent text-white rounded-lg font-semibold transition-colors"
                >
                  Next Level
                </button>
              )}
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-steel rounded-lg font-semibold transition-colors border border-steel/20"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
