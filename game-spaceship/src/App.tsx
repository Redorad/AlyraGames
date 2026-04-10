import { useEffect, useMemo } from 'react';
import { useGameStore } from './store/gameStore';

export default function App() {
  const {
    energy, perClick, perSecond, totalPower, parts, planets, log,
    click, buyPart, explore, tick,
  } = useGameStore();

  useEffect(() => {
    const id = setInterval(() => tick(), 100);
    return () => clearInterval(id);
  }, [tick]);

  const stars = useMemo(
    () =>
      Array.from({ length: 50 }).map((_, i) => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 2,
      })),
    []
  );

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200 relative overflow-hidden">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-steel rounded-full animate-twinkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      <div className="relative max-w-6xl mx-auto p-4 pt-16">
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-steel">SPACESHIP</span>{' '}
            <span className="text-accent">BUILDER</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Build your fleet. Explore the galaxy.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-4 text-center">
            <div className="text-xs text-slate-400 uppercase">Energy</div>
            <div className="text-2xl font-bold text-steel">{Math.floor(energy)}</div>
            <div className="text-xs text-slate-500">+{perSecond.toFixed(1)}/s</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-4 text-center">
            <div className="text-xs text-slate-400 uppercase">Ship Power</div>
            <div className="text-2xl font-bold text-accent">{totalPower}</div>
            <div className="text-xs text-slate-500">parts built</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-4 text-center">
            <div className="text-xs text-slate-400 uppercase">Per Click</div>
            <div className="text-2xl font-bold text-white">+{perClick}</div>
            <div className="text-xs text-slate-500">energy</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-navy-800/50 border border-white/5 rounded-xl p-5">
            <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Command Deck</h2>
            <button
              onClick={click}
              className="w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center rounded-2xl bg-gradient-to-br from-navy-700 to-navy-800 border-2 border-steel/30 text-8xl animate-float active:scale-95 transition hover:border-steel/60 animate-pulse-glow"
            >
              🚀
            </button>
            <div className="mt-4 bg-navy-900/60 rounded-lg p-3 text-xs space-y-1 max-h-28 overflow-y-auto">
              {log.map((l, i) => (
                <div key={i} className="text-slate-400">&gt; {l}</div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-5">
              <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Parts</h2>
              <div className="space-y-2">
                {parts.map((p) => {
                  const cost = Math.floor(p.cost * Math.pow(p.costMult, p.owned));
                  const can = energy >= cost;
                  return (
                    <button
                      key={p.id}
                      disabled={!can}
                      onClick={() => buyPart(p.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg border transition text-left ${
                        can
                          ? 'bg-navy-700/60 border-steel/20 hover:border-steel/60 hover:bg-navy-700'
                          : 'bg-navy-900/40 border-white/5 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-2xl">{p.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{p.name}</div>
                        <div className="text-xs text-slate-400">+{p.power} power · owned {p.owned}</div>
                      </div>
                      <div className="text-xs font-bold text-accent">{cost}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-5">
              <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Planets</h2>
              <div className="grid grid-cols-2 gap-2">
                {planets.map((pl) => {
                  const can = totalPower >= pl.requiredPower && !pl.explored;
                  return (
                    <button
                      key={pl.id}
                      disabled={!can}
                      onClick={() => explore(pl.id)}
                      className={`p-2 rounded-lg border text-left transition ${
                        pl.explored
                          ? 'bg-green-950/30 border-green-500/30 opacity-60'
                          : can
                          ? 'bg-navy-700/60 border-accent/30 hover:border-accent/60'
                          : 'bg-navy-900/40 border-white/5 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{pl.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">{pl.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {pl.explored ? 'Explored' : `Need ${pl.requiredPower}`}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
