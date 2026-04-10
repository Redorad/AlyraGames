import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';

export default function App() {
  const { credits, totalRobots, lines, upgradeMult, log, buyLine, upgradeLine, buyGlobalUpgrade, tick } = useGameStore();

  useEffect(() => {
    const id = setInterval(() => tick(0.1), 100);
    return () => clearInterval(id);
  }, [tick]);

  const globalUpgradeCost = Math.floor(500 * Math.pow(5, upgradeMult - 1));

  const totalIncome = lines.reduce((sum, l) => {
    if (l.owned <= 0) return sum;
    return sum + (l.owned / l.speed) * l.level * upgradeMult * l.baseIncome;
  }, 0);

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200">
      <div className="max-w-6xl mx-auto p-4 pt-16">
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-steel">ROBOT</span>{' '}
            <span className="text-accent">FACTORY</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Assembly lines. Automation. Profit.</p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Credits</div>
            <div className="text-xl font-bold text-yellow-400">${Math.floor(credits).toLocaleString()}</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Robots Made</div>
            <div className="text-xl font-bold text-steel">{Math.floor(totalRobots).toLocaleString()}</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Income/sec</div>
            <div className="text-xl font-bold text-green-400">${Math.floor(totalIncome).toLocaleString()}</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Multiplier</div>
            <div className="text-xl font-bold text-accent">x{upgradeMult.toFixed(1)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            {lines.map((l) => {
              const cost = Math.floor(l.baseCost * Math.pow(1.15, l.owned));
              const upCost = Math.floor(l.baseCost * 10 * Math.pow(3, l.level));
              const canBuy = credits >= cost;
              const canUp = credits >= upCost && l.owned > 0;
              return (
                <div key={l.id} className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl animate-spin-slow">{l.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-white">{l.name}</div>
                        <div className="text-xs px-2 py-0.5 rounded bg-navy-900 text-steel">Lvl {l.level}</div>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Owned: {l.owned} · ${l.baseIncome}/robot · {l.speed}s/robot
                      </div>
                      {l.owned > 0 && (
                        <div className="relative w-full h-1.5 bg-navy-900 rounded mt-2 overflow-hidden">
                          <div className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-steel to-transparent animate-conveyor" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        disabled={!canBuy}
                        onClick={() => buyLine(l.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border ${
                          canBuy
                            ? 'bg-steel/20 border-steel/40 text-steel hover:bg-steel/30'
                            : 'bg-navy-900/40 border-white/5 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        Buy ${cost.toLocaleString()}
                      </button>
                      <button
                        disabled={!canUp}
                        onClick={() => upgradeLine(l.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border ${
                          canUp
                            ? 'bg-accent/20 border-accent/40 text-accent hover:bg-accent/30'
                            : 'bg-navy-900/40 border-white/5 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        Up ${upCost.toLocaleString()}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-5">
              <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Global</h2>
              <button
                onClick={buyGlobalUpgrade}
                disabled={credits < globalUpgradeCost}
                className="w-full p-3 rounded-lg bg-gradient-to-r from-accent/30 to-pink-500/30 border border-accent/40 hover:from-accent/40 hover:to-pink-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="text-sm font-bold text-white">Factory Boost</div>
                <div className="text-xs text-slate-300">+50% all production</div>
                <div className="text-xs text-accent mt-1">${globalUpgradeCost.toLocaleString()}</div>
              </button>
            </div>

            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-5">
              <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Activity</h2>
              <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                {log.map((l, i) => (
                  <div key={i} className="text-slate-400 flex items-start gap-1">
                    <span className="text-steel animate-spark">●</span>
                    <span>{l}</span>
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
