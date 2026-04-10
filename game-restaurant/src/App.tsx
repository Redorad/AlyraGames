import { useEffect } from 'react';
import { useGameStore, DISHES } from './store/gameStore';

export default function App() {
  const {
    cash, level, xp, customers, stations, ready, log,
    startCook, serve, upgradeKitchen, tick,
  } = useGameStore();

  useEffect(() => {
    const id = setInterval(() => tick(0.1), 100);
    return () => clearInterval(id);
  }, [tick]);

  const unlockedDishes = DISHES.filter((d) => d.unlockLevel <= level);
  const upCost = 200 * stations.length;

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200">
      <div className="max-w-6xl mx-auto p-4 pt-16">
        <header className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-steel">RESTAURANT</span>{' '}
            <span className="text-accent">MANAGER</span>
          </h1>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Cash</div>
            <div className="text-xl font-bold text-yellow-400">${Math.floor(cash)}</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Level</div>
            <div className="text-xl font-bold text-accent">{level}</div>
            <div className="text-[10px] text-slate-500">{xp}/{level * 50} xp</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Customers</div>
            <div className="text-xl font-bold text-steel">{customers.length}</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <button
              onClick={upgradeKitchen}
              disabled={cash < upCost}
              className="w-full text-xs py-1 rounded bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 disabled:opacity-40"
            >
              + Station (${upCost})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customers */}
          <div className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
            <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Customers</h2>
            {customers.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No one ordering yet</div>
            ) : (
              <div className="space-y-2">
                {customers.map((c) => {
                  const dish = DISHES.find((d) => d.id === c.order)!;
                  const readyItem = ready.find((r) => r.dishId === c.order);
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-2 bg-navy-700/60 rounded-lg border border-white/5">
                      <div className="text-3xl">👤</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white">
                          Wants: <span className="font-bold">{dish.emoji} {dish.name}</span>
                        </div>
                        <div className="w-full h-1.5 bg-navy-900 rounded mt-1 overflow-hidden">
                          <div
                            className={`h-full ${c.patience > 50 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${c.patience}%` }}
                          />
                        </div>
                      </div>
                      <button
                        disabled={!readyItem}
                        onClick={() => serve(c.id, c.order)}
                        className="text-xs px-3 py-1.5 rounded bg-green-500/20 border border-green-400/40 text-green-300 hover:bg-green-500/30 disabled:opacity-30"
                      >
                        Serve
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Kitchen */}
          <div className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
            <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Kitchen</h2>
            <div className="space-y-2 mb-4">
              {stations.map((st) => (
                <div key={st.id} className="p-2 bg-navy-700/60 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl relative">
                      🍳
                      {st.cooking && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs animate-steam">💨</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {st.cooking ? (
                        <>
                          <div className="text-xs text-white">Cooking {DISHES.find((d) => d.id === st.cooking)?.emoji}</div>
                          <div className="w-full h-1.5 bg-navy-900 rounded mt-1 overflow-hidden">
                            <div className="h-full bg-orange-500" style={{ width: `${st.progress}%` }} />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {unlockedDishes.map((d) => (
                            <button
                              key={d.id}
                              onClick={() => startCook(st.id, d.id)}
                              className="text-lg p-1 rounded bg-navy-900/60 hover:bg-navy-900 border border-white/5"
                              title={d.name}
                            >
                              {d.emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xs uppercase text-slate-400 mb-2">Ready</h3>
            <div className="flex flex-wrap gap-1 min-h-[2rem]">
              {ready.length === 0 ? (
                <div className="text-xs text-slate-500">No food ready</div>
              ) : (
                ready.map((r) => {
                  const d = DISHES.find((x) => x.id === r.dishId)!;
                  return (
                    <div key={r.id} className="text-2xl p-1 bg-green-950/40 rounded border border-green-500/30">
                      {d.emoji}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 bg-navy-800/50 border border-white/5 rounded-xl p-3">
          <div className="text-xs space-y-1">
            {log.map((l, i) => (
              <div key={i} className="text-slate-400">&gt; {l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
