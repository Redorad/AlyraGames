import { TetrominoType, getShape, TETROMINO_COLORS } from '../store/tetrominos';

interface Props {
  type: TetrominoType | null;
  label: string;
}

const CELL = 18;

export default function PiecePreview({ type, label }: Props) {
  const shape = type ? getShape(type, 0) : null;
  const color = type ? TETROMINO_COLORS[type] : '#333';

  // Calculate grid size for centering
  const gridRows = shape ? shape.length : 2;
  const gridCols = shape ? shape[0].length : 2;

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg p-3 mb-3">
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 text-center">{label}</div>
      <div
        className="flex items-center justify-center"
        style={{ minHeight: gridRows * CELL + 4, minWidth: gridCols * CELL + 4 }}
      >
        {shape ? (
          <div>
            {shape.map((row, y) => (
              <div key={y} className="flex">
                {row.map((cell, x) => (
                  <div
                    key={x}
                    style={{
                      width: CELL,
                      height: CELL,
                      background: cell ? color : 'transparent',
                      border: cell ? `1px solid ${color}` : 'none',
                      boxShadow: cell ? `inset 0 0 4px rgba(255,255,255,0.2)` : 'none',
                      borderRadius: cell ? 2 : 0,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-600 text-xs">Empty</div>
        )}
      </div>
    </div>
  );
}
