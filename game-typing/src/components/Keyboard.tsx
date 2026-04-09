import { useState, useEffect } from 'react';

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

export default function Keyboard() {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setActiveKey(key);
    };
    const handleUp = () => {
      setActiveKey(null);
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  return (
    <div className="mt-4 select-none">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1 mb-1" style={{ paddingLeft: ri * 16 }}>
          {row.map((key) => (
            <div
              key={key}
              className={`w-9 h-9 flex items-center justify-center rounded-md text-xs font-semibold uppercase transition-all duration-75 ${
                activeKey === key
                  ? 'bg-accent text-white scale-95 shadow-lg shadow-accent/30'
                  : 'bg-navy-700 text-slate-400 border border-white/5'
              }`}
            >
              {key}
            </div>
          ))}
        </div>
      ))}
      {/* Space bar */}
      <div className="flex justify-center mt-1">
        <div
          className={`h-9 rounded-md flex items-center justify-center text-xs font-semibold transition-all duration-75 ${
            activeKey === ' '
              ? 'bg-accent text-white scale-[0.98] shadow-lg shadow-accent/30'
              : 'bg-navy-700 text-slate-400 border border-white/5'
          }`}
          style={{ width: 240 }}
        >
          space
        </div>
      </div>
    </div>
  );
}
