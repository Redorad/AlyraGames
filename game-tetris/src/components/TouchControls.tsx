import { useGameStore } from '../store/gameStore';

export default function TouchControls() {
  const moveLeft = useGameStore(s => s.moveLeft);
  const moveRight = useGameStore(s => s.moveRight);
  const moveDown = useGameStore(s => s.moveDown);
  const rotate = useGameStore(s => s.rotate);
  const hardDrop = useGameStore(s => s.hardDrop);
  const hold = useGameStore(s => s.hold);

  const btn = (label: string, action: () => void, className?: string) => (
    <button
      onTouchStart={(e) => { e.preventDefault(); action(); }}
      onMouseDown={action}
      className={`select-none active:scale-95 transition-transform
        bg-navy-700 border border-navy-700 hover:border-accent/50 text-white
        rounded-xl font-bold text-lg flex items-center justify-center
        ${className || ''}`}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-4 md:hidden select-none">
      {/* Top row: Hold, Rotate, Hard Drop */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {btn('Hold', hold, 'h-12 text-sm')}
        {btn('Rotate', rotate, 'h-12 text-sm')}
        {btn('Drop', hardDrop, 'h-12 text-sm')}
      </div>
      {/* D-pad style: Left, Down, Right */}
      <div className="grid grid-cols-3 gap-2">
        {btn('\u25C0', moveLeft, 'h-14')}
        {btn('\u25BC', moveDown, 'h-14')}
        {btn('\u25B6', moveRight, 'h-14')}
      </div>
    </div>
  );
}
