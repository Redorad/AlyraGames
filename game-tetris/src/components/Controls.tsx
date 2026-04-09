export default function Controls() {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-lg p-3 hidden md:block">
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 text-center">Controls</div>
      <div className="text-xs text-slate-300 space-y-1">
        <div className="flex justify-between"><span>Move</span><span className="text-accent">&larr; &rarr;</span></div>
        <div className="flex justify-between"><span>Rotate</span><span className="text-accent">&uarr;</span></div>
        <div className="flex justify-between"><span>Soft Drop</span><span className="text-accent">&darr;</span></div>
        <div className="flex justify-between"><span>Hard Drop</span><span className="text-accent">Space</span></div>
        <div className="flex justify-between"><span>Hold</span><span className="text-accent">C</span></div>
        <div className="flex justify-between"><span>Pause</span><span className="text-accent">P / Esc</span></div>
      </div>
    </div>
  );
}
