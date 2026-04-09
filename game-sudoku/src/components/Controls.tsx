import { useGameStore } from '../store';

export default function Controls() {
  const undo = useGameStore(s => s.undo);
  const eraseCell = useGameStore(s => s.eraseCell);
  const toggleNotesMode = useGameStore(s => s.toggleNotesMode);
  const useHint = useGameStore(s => s.useHint);
  const notesMode = useGameStore(s => s.notesMode);
  const newGame = useGameStore(s => s.newGame);
  const difficulty = useGameStore(s => s.difficulty);
  const history = useGameStore(s => s.history);
  const isComplete = useGameStore(s => s.isComplete);

  const btnBase =
    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border';

  const btnNormal = `${btnBase} bg-navy-800 text-slate-300 border-white/[0.06] hover:border-accent/20 hover:text-white`;
  const btnActive = `${btnBase} bg-accent/20 text-accent border-accent/40`;

  return (
    <div className="flex flex-wrap justify-center gap-2 w-full">
      <button
        onClick={undo}
        disabled={history.length === 0 || isComplete}
        className={`${btnNormal} ${history.length === 0 || isComplete ? 'opacity-40 cursor-default' : ''}`}
        title="Undo (Ctrl+Z)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
        </svg>
        Undo
      </button>

      <button
        onClick={eraseCell}
        disabled={isComplete}
        className={`${btnNormal} ${isComplete ? 'opacity-40 cursor-default' : ''}`}
        title="Erase (Backspace)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414a2 2 0 011.414-.586H19a2 2 0 012 2v10a2 2 0 01-2 2h-8.172a2 2 0 01-1.414-.586L3 12z" />
        </svg>
        Erase
      </button>

      <button
        onClick={toggleNotesMode}
        disabled={isComplete}
        className={`${notesMode ? btnActive : btnNormal} ${isComplete ? 'opacity-40 cursor-default' : ''}`}
        title="Notes mode (N)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Notes{notesMode ? ' ON' : ''}
      </button>

      <button
        onClick={useHint}
        disabled={isComplete}
        className={`${btnNormal} ${isComplete ? 'opacity-40 cursor-default' : ''}`}
        title="Hint"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Hint
      </button>

      <button
        onClick={() => newGame(difficulty)}
        className={btnNormal}
        title="New Game"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        New
      </button>
    </div>
  );
}
