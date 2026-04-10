import { useEffect, useMemo } from 'react';
import { useGameStore, SPECIES } from './store/gameStore';

export default function App() {
  const { coins, fishes, log, buyFish, feedAll, tick } = useGameStore();

  useEffect(() => {
    const id = setInterval(() => tick(0.1), 100);
    return () => clearInterval(id);
  }, [tick]);

  const bubbles = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 6,
        size: 0.5 + Math.random() * 0.7,
      })),
    []
  );

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200">
      <div className="max-w-6xl mx-auto p-4 pt-16">
        <header className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-steel">MINI</span>{' '}
            <span className="text-accent">AQUARIUM</span>
          </h1>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Coins</div>
            <div className="text-xl font-bold text-yellow-400">{Math.floor(coins)} 🪙</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Fish</div>
            <div className="text-xl font-bold text-steel">{fishes.length}</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <button
              onClick={feedAll}
              disabled={coins < 5 || fishes.length === 0}
              className="w-full text-xs py-1 rounded bg-green-500/20 border border-green-400/40 text-green-300 hover:bg-green-500/30 disabled:opacity-40"
            >
              Feed All (5)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-steel/30 bg-gradient-to-b from-sky-900 via-blue-950 to-navy-900">
              {/* Water caustics overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-steel/5 to-transparent pointer-events-none" />

              {/* Sand floor */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-amber-900/60 to-transparent" />

              {/* Plants */}
              <div className="absolute bottom-4 left-8 text-3xl animate-sway" style={{ animationDelay: '0s' }}>🌿</div>
              <div className="absolute bottom-4 right-16 text-3xl animate-sway" style={{ animationDelay: '1s' }}>🌿</div>
              <div className="absolute bottom-4 left-1/2 text-2xl animate-sway" style={{ animationDelay: '0.5s' }}>🪸</div>

              {/* Bubbles */}
              {bubbles.map((b, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 rounded-full bg-white/20"
                  style={{
                    left: `${b.left}%`,
                    width: `${b.size * 8}px`,
                    height: `${b.size * 8}px`,
                    animation: `bubble-up ${4 + b.delay}s linear infinite`,
                    animationDelay: `${b.delay}s`,
                  }}
                />
              ))}

              {/* Fish */}
              {fishes.map((f) => {
                const sp = SPECIES.find((s) => s.id === f.speciesId)!;
                return (
                  <div
                    key={f.id}
                    className="absolute text-3xl transition-[left,top] duration-100 ease-linear pointer-events-none"
                    style={{
                      left: `${f.x}%`,
                      top: `${f.y}%`,
                      transform: f.vx < 0 ? 'scaleX(-1)' : 'scaleX(1)',
                    }}
                  >
                    {sp.emoji}
                  </div>
                );
              })}

              {fishes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                  Buy a fish to begin!
                </div>
              )}
            </div>

            <div className="mt-3 bg-navy-800/50 border border-white/5 rounded-xl p-3">
              <div className="text-xs space-y-1">
                {log.map((l, i) => (
                  <div key={i} className="text-slate-400">&gt; {l}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
            <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Shop</h2>
            <div className="space-y-2">
              {SPECIES.map((sp) => {
                const can = coins >= sp.cost;
                return (
                  <button
                    key={sp.id}
                    onClick={() => buyFish(sp.id)}
                    disabled={!can}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition ${
                      can
                        ? 'bg-navy-700/60 border-steel/20 hover:border-steel/60'
                        : 'bg-navy-900/40 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="text-2xl">{sp.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{sp.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {'⭐'.repeat(sp.rarity)} · {sp.income}/s
                      </div>
                    </div>
                    <div className="text-xs font-bold text-accent">{sp.cost}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
