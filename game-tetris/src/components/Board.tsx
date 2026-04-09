import { useGameStore, COLS, ROWS } from '../store/gameStore';
import { getShape, TETROMINO_COLORS } from '../store/tetrominos';

const CELL_SIZE = 28;

export default function Board() {
  const board = useGameStore(s => s.board);
  const currentPiece = useGameStore(s => s.currentPiece);
  const getGhostY = useGameStore(s => s.getGhostY);

  // Build display grid: board + current piece + ghost
  const display: (string | null)[][] = board.map(row => [...row]);
  const ghost: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

  if (currentPiece) {
    const shape = getShape(currentPiece.type, currentPiece.rotation);
    const color = TETROMINO_COLORS[currentPiece.type];
    const ghostY = getGhostY();

    // Draw ghost
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const gx = currentPiece.x + c;
          const gy = ghostY + r;
          if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
            ghost[gy][gx] = true;
          }
        }
      }
    }

    // Draw current piece (overwrites ghost)
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const px = currentPiece.x + c;
          const py = currentPiece.y + r;
          if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
            display[py][px] = color;
            ghost[py][px] = false; // Don't show ghost where piece is
          }
        }
      }
    }
  }

  return (
    <div
      className="border-2 border-navy-700 rounded-lg overflow-hidden"
      style={{
        width: COLS * CELL_SIZE + 2,
        height: ROWS * CELL_SIZE + 2,
        background: '#0d1117',
      }}
    >
      {display.map((row, y) => (
        <div key={y} className="flex">
          {row.map((cell, x) => {
            const isGhost = ghost[y][x];
            let bg = 'transparent';
            let border = '1px solid rgba(255,255,255,0.03)';
            let opacity = 1;

            if (cell) {
              bg = cell;
              border = `1px solid ${cell}`;
            } else if (isGhost) {
              bg = currentPiece ? TETROMINO_COLORS[currentPiece.type] : 'transparent';
              opacity = 0.2;
              border = `1px solid ${bg}`;
            }

            return (
              <div
                key={x}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  background: bg,
                  border,
                  opacity: cell ? 1 : opacity,
                  boxShadow: cell ? `inset 0 0 6px rgba(255,255,255,0.2), 0 0 3px ${cell}` : 'none',
                  borderRadius: cell ? 2 : 0,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
