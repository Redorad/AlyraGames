import { useRef, useEffect } from 'react';
import { useGameStore, PUZZLES } from './store/gameStore';

export default function App() {
  const {
    puzzleIdx, values, cursor, solved,
    setValue, setCursor, toggleDir, check, loadPuzzle, reveal, clear,
  } = useGameStore();

  const puzzle = PUZZLES[puzzleIdx];
  const refs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => null))
  );

  useEffect(() => {
    const focused = refs.current[cursor.row]?.[cursor.col];
    if (focused) focused.focus();
  }, [cursor.row, cursor.col]);

  const highlightCells = () => {
    const cells: boolean[][] = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => false)
    );
    if (cursor.dir === 'across') {
      for (let c = 0; c < 5; c++) cells[cursor.row][c] = true;
    } else {
      for (let r = 0; r < 5; r++) cells[r][cursor.col] = true;
    }
    return cells;
  };
  const highlight = highlightCells();

  const handleKey = (e: React.KeyboardEvent, r: number, c: number) => {
    if (e.key === 'Backspace') {
      if (!values[r][c]) {
        e.preventDefault();
        if (cursor.dir === 'across' && c > 0) setCursor(r, c - 1);
        else if (cursor.dir === 'down' && r > 0) setCursor(r - 1, c);
      } else {
        setValue(r, c, '');
      }
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (c < 4) setCursor(r, c + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (c > 0) setCursor(r, c - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (r < 4) setCursor(r + 1, c);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (r > 0) setCursor(r - 1, c);
    } else if (e.key === ' ' || e.key === 'Tab') {
      e.preventDefault();
      toggleDir();
    }
  };

  const acrossClues = puzzle.clues.filter((c) => c.dir === 'across');
  const downClues = puzzle.clues.filter((c) => c.dir === 'down');

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200">
      <div className="max-w-4xl mx-auto p-4 pt-16">
        <header className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-steel">MINI</span>{' '}
            <span className="text-accent">CROSSWORD</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{puzzle.title}</p>
        </header>

        <div className="flex justify-center gap-2 mb-4">
          {PUZZLES.map((_, i) => (
            <button
              key={i}
              onClick={() => loadPuzzle(i)}
              className={`px-3 py-1 rounded text-xs font-bold ${
                i === puzzleIdx
                  ? 'bg-accent text-white'
                  : 'bg-navy-800 text-slate-400 hover:bg-navy-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 flex flex-col items-center">
            <div className="inline-block bg-navy-800 p-2 rounded-xl border border-steel/20">
              {puzzle.grid.map((row, r) => (
                <div key={r} className="flex">
                  {row.map((cell, c) => {
                    const isHl = highlight[r][c];
                    const isCur = cursor.row === r && cursor.col === c;
                    const value = values[r][c] || '';
                    const isWrong = solved ? false : value && value !== cell.letter;
                    return (
                      <div
                        key={c}
                        className={`relative w-12 h-12 border border-steel/30 cw-cell ${
                          isCur
                            ? 'bg-accent/40'
                            : isHl
                            ? 'bg-steel/20'
                            : 'bg-navy-900'
                        }`}
                      >
                        {cell.number && (
                          <div className="absolute top-0 left-0.5 text-[8px] text-steel font-bold leading-none pt-0.5">
                            {cell.number}
                          </div>
                        )}
                        <input
                          ref={(el) => (refs.current[r][c] = el)}
                          type="text"
                          inputMode="text"
                          maxLength={1}
                          value={value}
                          readOnly={solved}
                          onChange={(e) => setValue(r, c, e.target.value)}
                          onFocus={() => setCursor(r, c)}
                          onClick={() => {
                            if (cursor.row === r && cursor.col === c) toggleDir();
                            else setCursor(r, c);
                          }}
                          onKeyDown={(e) => handleKey(e, r, c)}
                          className={`w-full h-full bg-transparent text-center text-xl font-bold outline-none uppercase ${
                            isWrong ? 'text-red-400' : solved ? 'text-green-400' : 'text-white'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={check}
                className="text-xs px-3 py-2 rounded-lg bg-steel/20 border border-steel/40 text-steel hover:bg-steel/30"
              >
                Check
              </button>
              <button
                onClick={reveal}
                className="text-xs px-3 py-2 rounded-lg bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30"
              >
                Reveal
              </button>
              <button
                onClick={clear}
                className="text-xs px-3 py-2 rounded-lg bg-navy-700 border border-white/10 text-slate-300 hover:bg-navy-600"
              >
                Clear
              </button>
            </div>

            {solved && (
              <div className="mt-3 text-sm font-bold text-green-400">✓ Solved!</div>
            )}
          </div>

          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
              <h2 className="text-xs uppercase tracking-wider text-steel mb-2 font-bold">Across</h2>
              <div className="space-y-1.5">
                {acrossClues.map((c) => (
                  <div key={`a-${c.num}`} className="text-xs text-slate-300 flex gap-2">
                    <span className="text-accent font-bold">{c.num}</span>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
              <h2 className="text-xs uppercase tracking-wider text-accent mb-2 font-bold">Down</h2>
              <div className="space-y-1.5">
                {downClues.map((c) => (
                  <div key={`d-${c.num}`} className="text-xs text-slate-300 flex gap-2">
                    <span className="text-steel font-bold">{c.num}</span>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
