import { useEffect } from 'react';
import { useGameStore, ILLNESS_INFO } from './store/gameStore';

export default function App() {
  const {
    cash, reputation, patients, doctors, equipmentLevel, treated, log,
    assignPatient, hireDoctor, upgradeEquipment, tick,
  } = useGameStore();

  useEffect(() => {
    const id = setInterval(() => tick(0.1), 100);
    return () => clearInterval(id);
  }, [tick]);

  const hireCost = 150 + doctors.length * 200;
  const upCost = 500 * Math.pow(3, equipmentLevel - 1);
  const freeDoctors = doctors.filter((d) => !d.busy).length;

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200">
      <div className="max-w-6xl mx-auto p-4 pt-16">
        <header className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-steel">HOSPITAL</span>{' '}
            <span className="text-accent">MANAGER</span>
          </h1>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Cash</div>
            <div className="text-xl font-bold text-yellow-400">${Math.floor(cash)}</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Reputation</div>
            <div className="text-xl font-bold text-pink-400">{Math.floor(reputation)}/100</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Treated</div>
            <div className="text-xl font-bold text-green-400">{treated}</div>
          </div>
          <div className="bg-navy-800/70 border border-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Doctors Free</div>
            <div className="text-xl font-bold text-steel">{freeDoctors}/{doctors.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
              <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Waiting Room</h2>
              {patients.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No patients currently</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {patients.map((p) => {
                    const info = ILLNESS_INFO[p.illness];
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-lg border ${
                          p.inTreatment
                            ? 'bg-green-950/30 border-green-500/30'
                            : 'bg-navy-700/60 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-3xl">{info.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{info.name}</div>
                            <div className="text-[10px] text-slate-400">${info.reward}</div>
                          </div>
                        </div>
                        {p.inTreatment ? (
                          <div className="mt-2">
                            <div className="text-[10px] text-green-400">Treating...</div>
                            <div className="w-full h-1 bg-navy-900 rounded mt-1 overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${p.treatProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="w-full h-1 bg-navy-900 rounded overflow-hidden">
                              <div
                                className={`h-full ${p.patience > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${p.patience}%` }}
                              />
                            </div>
                            <button
                              onClick={() => assignPatient(p.id)}
                              disabled={freeDoctors === 0}
                              className="w-full mt-1 text-[10px] py-1 rounded bg-steel/20 border border-steel/40 text-steel hover:bg-steel/30 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Treat
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
              <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Staff</h2>
              <div className="flex flex-wrap gap-2">
                {doctors.map((d) => (
                  <div
                    key={d.id}
                    className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
                      d.busy
                        ? 'bg-yellow-950/40 border border-yellow-500/30 text-yellow-300'
                        : 'bg-green-950/40 border border-green-500/30 text-green-300'
                    }`}
                  >
                    <span>👨‍⚕️</span>
                    <span className="font-bold">{d.name}</span>
                    <span className="opacity-60">{d.busy ? 'busy' : 'idle'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
              <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Upgrades</h2>
              <div className="space-y-2">
                <button
                  onClick={hireDoctor}
                  disabled={cash < hireCost}
                  className="w-full p-3 rounded-lg bg-steel/20 border border-steel/40 text-left hover:bg-steel/30 disabled:opacity-40"
                >
                  <div className="text-sm font-bold text-steel">Hire Doctor</div>
                  <div className="text-xs text-slate-400">Treat more patients at once</div>
                  <div className="text-xs text-accent mt-1">${hireCost}</div>
                </button>
                <button
                  onClick={upgradeEquipment}
                  disabled={cash < upCost}
                  className="w-full p-3 rounded-lg bg-accent/20 border border-accent/40 text-left hover:bg-accent/30 disabled:opacity-40"
                >
                  <div className="text-sm font-bold text-accent">Equipment Lvl {equipmentLevel}</div>
                  <div className="text-xs text-slate-400">Faster treatment speed</div>
                  <div className="text-xs text-accent mt-1">${Math.floor(upCost)}</div>
                </button>
              </div>
            </div>

            <div className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
              <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-2">Log</h2>
              <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                {log.map((l, i) => (
                  <div key={i} className="text-slate-400">&gt; {l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
