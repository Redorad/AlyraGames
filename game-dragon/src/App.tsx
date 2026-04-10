import { useEffect, useState } from 'react';
import { useGameStore, DRAGON_INFO } from './store/gameStore';

export default function App() {
  const { gold, eggs, dragons, log, buyEgg, feedDragon, breed, sellDragon, tick } = useGameStore();
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [tick]);

  const toggleSelect = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else if (selected.length < 2) {
      setSelected([...selected, id]);
    }
  };

  const doBreed = () => {
    if (selected.length === 2) {
      breed(selected[0], selected[1]);
      setSelected([]);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200">
      <div className="max-w-6xl mx-auto p-4 pt-16">
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-steel">DRAGON</span>{' '}
            <span className="text-accent">BREEDER</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Hatch, feed, and breed legendary dragons</p>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-4 text-center">
            <div className="text-xs text-slate-400 uppercase">Gold</div>
            <div className="text-2xl font-bold text-yellow-400">{Math.floor(gold)} 🪙</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-4 text-center">
            <div className="text-xs text-slate-400 uppercase">Dragons</div>
            <div className="text-2xl font-bold text-steel">{dragons.length}</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-4 text-center">
            <div className="text-xs text-slate-400 uppercase">Eggs</div>
            <div className="text-2xl font-bold text-accent">{eggs.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm uppercase tracking-wider text-slate-400">Nest</h2>
                <div className="flex gap-2">
                  <button
                    onClick={buyEgg}
                    disabled={gold < 20}
                    className="text-xs px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 disabled:opacity-40"
                  >
                    Buy Egg (20g)
                  </button>
                  <button
                    onClick={doBreed}
                    disabled={selected.length !== 2 || gold < 100}
                    className="text-xs px-3 py-1.5 rounded-lg bg-pink-500/20 border border-pink-400/40 text-pink-300 hover:bg-pink-500/30 disabled:opacity-40"
                  >
                    Breed (100g)
                  </button>
                </div>
              </div>

              {eggs.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-slate-400 mb-2">Incubating...</div>
                  <div className="flex flex-wrap gap-2">
                    {eggs.map((e) => (
                      <div key={e.id} className="bg-navy-700/60 rounded-lg p-2 w-20 text-center">
                        <div className="text-3xl animate-crack">🥚</div>
                        <div className="w-full h-1.5 bg-navy-900 rounded mt-1">
                          <div className="h-full bg-accent rounded" style={{ width: `${e.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dragons.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No dragons yet. Buy an egg!</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dragons.map((d) => {
                    const info = DRAGON_INFO[d.type];
                    const isSel = selected.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        className={`p-3 rounded-lg border transition cursor-pointer ${
                          isSel
                            ? 'bg-pink-500/20 border-pink-400/60'
                            : 'bg-navy-700/60 border-white/5 hover:border-steel/40'
                        }`}
                        onClick={() => toggleSelect(d.id)}
                      >
                        <div className="text-center">
                          <div className={`text-4xl ${d.hunger < 70 ? 'animate-wiggle' : ''}`}>
                            {info.emoji}
                          </div>
                          <div className="text-xs font-bold text-white mt-1 truncate">{info.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {'⭐'.repeat(info.rarity)}
                          </div>
                          <div className="w-full h-1 bg-navy-900 rounded mt-1 overflow-hidden">
                            <div
                              className={`h-full ${d.hunger > 70 ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${100 - d.hunger}%` }}
                            />
                          </div>
                          <div className="flex gap-1 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                feedDragon(d.id);
                              }}
                              className="flex-1 text-[10px] py-1 rounded bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30"
                            >
                              Feed
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sellDragon(d.id);
                              }}
                              className="flex-1 text-[10px] py-1 rounded bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/30"
                            >
                              Sell
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-5">
              <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Log</h2>
              <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                {log.map((l, i) => (
                  <div key={i} className="text-slate-400">&gt; {l}</div>
                ))}
              </div>
            </div>

            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-5">
              <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Dragon Types</h2>
              <div className="space-y-1 text-xs">
                {Object.values(DRAGON_INFO).map((d) => (
                  <div key={d.type} className="flex items-center gap-2">
                    <div className="text-lg">{d.emoji}</div>
                    <div className="flex-1 text-slate-300">{d.name}</div>
                    <div className="text-yellow-500">{'⭐'.repeat(d.rarity)}</div>
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
