import { Gem, GemType, Position, SpecialType, MatchResult } from '../types';
import { GEM_TYPES } from '../data/gems';

const ROWS = 8;
const COLS = 8;

let nextId = 1;

export function getRows() { return ROWS; }
export function getCols() { return COLS; }

function randomGemType(): GemType {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

function createGem(row: number, col: number, type?: GemType): Gem {
  return {
    id: nextId++,
    type: type ?? randomGemType(),
    special: 'none',
    row,
    col,
  };
}

export function createBoard(): Gem[][] {
  const board: Gem[][] = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      let gem = createGem(r, c);
      while (hasInitialMatch(board, r, c, gem.type)) {
        gem = createGem(r, c);
      }
      board[r][c] = gem;
    }
  }
  return board;
}

function hasInitialMatch(board: Gem[][], row: number, col: number, type: GemType): boolean {
  if (col >= 2) {
    if (board[row][col - 1]?.type === type && board[row][col - 2]?.type === type) {
      return true;
    }
  }
  if (row >= 2) {
    if (board[row - 1]?.[col]?.type === type && board[row - 2]?.[col]?.type === type) {
      return true;
    }
  }
  return false;
}

export function cloneBoard(board: Gem[][]): Gem[][] {
  return board.map(row => row.map(gem => ({ ...gem })));
}

export function swapGems(board: Gem[][], pos1: Position, pos2: Position): Gem[][] {
  const newBoard = cloneBoard(board);
  const gem1 = newBoard[pos1.row][pos1.col];
  const gem2 = newBoard[pos2.row][pos2.col];

  gem1.row = pos2.row;
  gem1.col = pos2.col;
  gem2.row = pos1.row;
  gem2.col = pos1.col;

  newBoard[pos1.row][pos1.col] = gem2;
  newBoard[pos2.row][pos2.col] = gem1;

  return newBoard;
}

export function areAdjacent(pos1: Position, pos2: Position): boolean {
  const dr = Math.abs(pos1.row - pos2.row);
  const dc = Math.abs(pos1.col - pos2.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

export function findMatches(board: Gem[][]): MatchResult[] {
  const matches: MatchResult[] = [];

  // Horizontal matches
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const type = board[r][c].type;
      let end = c + 1;
      while (end < COLS && board[r][end].type === type) {
        end++;
      }
      const length = end - c;
      if (length >= 3) {
        const positions: Position[] = [];
        for (let i = c; i < end; i++) {
          positions.push({ row: r, col: i });
        }
        matches.push({ positions, isHorizontal: true, length });
      }
      c = end;
    }
  }

  // Vertical matches
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const type = board[r][c].type;
      let end = r + 1;
      while (end < ROWS && board[end][c].type === type) {
        end++;
      }
      const length = end - r;
      if (length >= 3) {
        const positions: Position[] = [];
        for (let i = r; i < end; i++) {
          positions.push({ row: i, col: c });
        }
        matches.push({ positions, isHorizontal: false, length });
      }
      r = end;
    }
  }

  return matches;
}

export function hasAnyMatch(board: Gem[][]): boolean {
  return findMatches(board).length > 0;
}

function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

export interface MatchInfo {
  matchedPositions: Set<string>;
  specialsToCreate: { pos: Position; special: SpecialType; type: GemType }[];
  score: number;
}

export function processMatches(board: Gem[][]): MatchInfo {
  const matches = findMatches(board);
  const matchedPositions = new Set<string>();
  const specialsToCreate: { pos: Position; special: SpecialType; type: GemType }[] = [];
  let score = 0;

  for (const match of matches) {
    for (const pos of match.positions) {
      matchedPositions.add(posKey(pos.row, pos.col));
    }

    score += match.length * 10;

    if (match.length === 4) {
      score += 20;
      const specialPos = match.positions[Math.floor(match.positions.length / 2)];
      specialsToCreate.push({
        pos: specialPos,
        special: match.isHorizontal ? 'line_h' : 'line_v',
        type: board[match.positions[0].row][match.positions[0].col].type,
      });
    } else if (match.length >= 5) {
      score += 50;
      const specialPos = match.positions[Math.floor(match.positions.length / 2)];
      specialsToCreate.push({
        pos: specialPos,
        special: 'bomb',
        type: board[match.positions[0].row][match.positions[0].col].type,
      });
    }
  }

  return { matchedPositions, specialsToCreate, score };
}

function activateSpecial(board: Gem[][], gem: Gem): Set<string> {
  const destroyed = new Set<string>();

  if (gem.special === 'line_h') {
    for (let c = 0; c < COLS; c++) {
      destroyed.add(posKey(gem.row, c));
    }
  } else if (gem.special === 'line_v') {
    for (let r = 0; r < ROWS; r++) {
      destroyed.add(posKey(r, gem.col));
    }
  } else if (gem.special === 'bomb') {
    const targetType = gem.type;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c].type === targetType) {
          destroyed.add(posKey(r, c));
        }
      }
    }
  }

  return destroyed;
}

/**
 * Resolves a full match cycle: remove matched, activate specials, create new specials,
 * apply gravity. Returns the new board and score earned.
 */
export function resolveMatches(board: Gem[][]): { board: Gem[][]; score: number; hadMatch: boolean; matchedPositions: Set<string> } {
  const matchInfo = processMatches(board);
  if (matchInfo.matchedPositions.size === 0) {
    return { board, score: 0, hadMatch: false, matchedPositions: new Set() };
  }

  const newBoard = cloneBoard(board);
  let totalScore = matchInfo.score;

  // Collect all positions to destroy
  const allDestroyed = new Set(matchInfo.matchedPositions);

  // Activate specials that are being matched
  for (const key of matchInfo.matchedPositions) {
    const [r, c] = key.split(',').map(Number);
    const gem = newBoard[r][c];
    if (gem.special !== 'none') {
      const specialDestroyed = activateSpecial(newBoard, gem);
      for (const sk of specialDestroyed) {
        allDestroyed.add(sk);
      }
      totalScore += 30;
    }
  }

  // Determine positions where specials will be spawned — exclude from destruction
  const specialPositions = new Set<string>();
  for (const s of matchInfo.specialsToCreate) {
    specialPositions.add(posKey(s.pos.row, s.pos.col));
  }

  // Remove destroyed gems EXCEPT where specials will be placed
  for (const key of allDestroyed) {
    if (specialPositions.has(key)) continue;
    const [r, c] = key.split(',').map(Number);
    newBoard[r][c] = { ...newBoard[r][c], id: -1 };
  }

  // Place specials at their positions (they survive the destruction)
  for (const s of matchInfo.specialsToCreate) {
    const gem = newBoard[s.pos.row][s.pos.col];
    gem.special = s.special;
    gem.type = s.type;
    gem.id = nextId++; // new id so React re-renders it
  }

  // Apply gravity
  for (let c = 0; c < COLS; c++) {
    const remaining: Gem[] = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][c].id !== -1) {
        remaining.push(newBoard[r][c]);
      }
    }

    let writeRow = ROWS - 1;
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].row = writeRow;
      remaining[i].col = c;
      newBoard[writeRow][c] = remaining[i];
      writeRow--;
    }

    while (writeRow >= 0) {
      newBoard[writeRow][c] = createGem(writeRow, c);
      writeRow--;
    }
  }

  return { board: newBoard, score: totalScore, hadMatch: true, matchedPositions: allDestroyed };
}

export function hasValidMoves(board: Gem[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c < COLS - 1) {
        const swapped = swapGems(board, { row: r, col: c }, { row: r, col: c + 1 });
        if (hasAnyMatch(swapped)) return true;
      }
      if (r < ROWS - 1) {
        const swapped = swapGems(board, { row: r, col: c }, { row: r + 1, col: c });
        if (hasAnyMatch(swapped)) return true;
      }
    }
  }
  return false;
}

export function shuffleBoard(board: Gem[][]): Gem[][] {
  const flat = board.flat().map(g => g.type);
  for (let i = flat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flat[i], flat[j]] = [flat[j], flat[i]];
  }

  const newBoard: Gem[][] = [];
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    newBoard[r] = [];
    for (let c = 0; c < COLS; c++) {
      newBoard[r][c] = createGem(r, c, flat[idx]);
      idx++;
    }
  }

  if (hasAnyMatch(newBoard) || !hasValidMoves(newBoard)) {
    return createBoard();
  }
  return newBoard;
}
