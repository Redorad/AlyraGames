import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { getGemEmoji, getGemColor } from '../data/gems';
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

    const matchInfo = processMatches(currentBoard);
    setMatchedCells(matchInfo.matchedPositions);
    setPhase('matching');

    if (newCombo > 1) {
      playSpecial();
    } else {
      playMatch(newCombo);
    }

    setTimeout(() => {
      const { totalScore, extraDestroyed } = removeMatchedAndActivateSpecials(currentBoard, matchInfo);
      const comboMultiplier = Math.min(newCombo, 5);
      const earnedScore = totalScore * comboMultiplier;

      setScore(prev => prev + earnedScore);

      let afterRemoval = removeGems(currentBoard, extraDestroyed);

      const validSpecials = matchInfo.specialsToCreate.filter(
        s => !extraDestroyed.has(`${s.pos.row},${s.pos.col}`) || matchInfo.matchedPositions.has(`${s.pos.row},${s.pos.col}`)
      );

      setMatchedCells(new Set());
      setPhase('falling');

      const { board: afterGravity } = applyGravity(afterRemoval);

      let finalBoard = afterGravity;
      if (validSpecials.length > 0) {
        finalBoard = placeSpecials(afterGravity, validSpecials.map(s => ({
          ...s,
          pos: s.pos,
        })));
      }

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
        processCascade(finalBoard, newCombo);
      }, 400);
    }, 350);
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

    setPhase('swapping');
    const swapped = swapGems(boardRef.current, selected, pos);
    setBoard(swapped);
    playSwap();

    const swapSel = selected;
    setSelected(null);

    setTimeout(() => {
      const matches = findMatches(swapped);
      if (matches.length === 0) {
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
  }, [phase, selected, processCascade]);

  const handleBack = () => setScreen('title');

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
    <div className="h-full flex flex-col items-center p-3 sm:p-4 overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-sm mb-3 animate-slide-down">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg transition-colors"
          >
            {"\u2190"} Retour
          </button>
          <span className="text-white font-bold text-sm">Niveau {currentLevel}</span>
          <button
            onClick={handleRestart}
            className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg transition-colors"
          >
            {"\u21BB"}
          </button>
        </div>

        {/* Score bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Score</span>
            <span className="text-accent font-bold animate-score-glow">
              {score.toLocaleString()} / {levelConfig.targetScore.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2.5 bg-navy-800 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-accent/80 to-purple-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Timer bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Temps</span>
            <span className={`font-bold ${isTimeLow ? 'animate-timer-warning' : 'text-steel'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                isTimeLow ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-steel/70 to-steel'
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
          className="absolute top-28 left-1/2 -translate-x-1/2 animate-combo-popup pointer-events-none z-20"
        >
          <span className="text-2xl font-black text-yellow-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
            {comboDisplay.combo}x COMBO!
          </span>
        </div>
      )}

      {/* Game Board */}
      <div className="relative flex-1 flex items-center justify-center w-full max-w-sm">
        <div
          className="game-board grid gap-[3px] p-2 rounded-2xl"
          style={{
            gridTemplateColumns: `repeat(${getCols()}, 1fr)`,
            aspectRatio: '1',
            width: '100%',
            maxWidth: '380px',
            maxHeight: 'calc(100vh - 220px)',
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
                    text-xl sm:text-2xl leading-none select-none
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
                    aspectRatio: '1',
                    backgroundColor: isSelected ? `${gemColor}25` : `${gemColor}10`,
                    border: isSelected ? `2px solid ${gemColor}60` : '1px solid rgba(255,255,255,0.04)',
                  }}
                  disabled={phase !== 'idle'}
                >
                  <span className={isSpecial ? 'drop-shadow-lg' : 'drop-shadow-sm'}>
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-navy-800 border border-red-500/20 rounded-2xl p-6 text-center animate-fade-in max-w-xs mx-4 shadow-2xl">
            <div className="text-4xl mb-3">{"\u{23F0}"}</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Temps écoulé !</h2>
            <p className="text-gray-300 mb-1">Score : {score.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mb-5">
              Objectif : {levelConfig.targetScore.toLocaleString()}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 bg-accent/20 hover:bg-accent/30 text-accent rounded-xl font-bold transition border border-accent/30"
              >
                Réessayer
              </button>
              <button
                onClick={handleBack}
                className="px-5 py-2.5 bg-navy-700 hover:bg-navy-700/80 text-gray-300 rounded-xl font-medium transition border border-white/10"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Complete Overlay */}
      {phase === 'levelcomplete' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-navy-800 border border-accent/20 rounded-2xl p-6 text-center animate-fade-in max-w-xs mx-4 shadow-2xl">
            <div className="text-4xl mb-2">{"\u{1F389}"}</div>
            <h2 className="text-xl font-bold text-accent mb-1">Niveau réussi !</h2>
            <p className="text-yellow-400 text-lg mb-2">{"\u{2B50}"} {"\u{2B50}"} {"\u{2B50}"}</p>
            <p className="text-gray-300 mb-1">Score : {score.toLocaleString()}</p>
            {timeLeft > 0 && (
              <p className="text-gray-500 text-sm mb-5">Temps restant : {timeLeft}s</p>
            )}
            <div className="flex gap-3 justify-center">
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
                  className="px-5 py-2.5 bg-accent/20 hover:bg-accent/30 text-accent rounded-xl font-bold transition border border-accent/30"
                >
                  Suivant
                </button>
              )}
              <button
                onClick={handleBack}
                className="px-5 py-2.5 bg-navy-700 hover:bg-navy-700/80 text-gray-300 rounded-xl font-medium transition border border-white/10"
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
