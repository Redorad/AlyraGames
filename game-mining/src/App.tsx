import { useEffect, useRef, useState } from "react";
import { create } from "zustand";

type Ore = {
  id: string;
  name: string;
  emoji: string;
  value: number;
  minMine: number;
  color: string;
};

const ORES: Ore[] = [
  { id: "stone", name: "Stone", emoji: "🪨", value: 1, minMine: 1, color: "#94a3b8" },
  { id: "coal", name: "Coal", emoji: "⬛", value: 3, minMine: 1, color: "#64748b" },
  { id: "copper", name: "Copper", emoji: "🟠", value: 8, minMine: 2, color: "#f97316" },
  { id: "iron", name: "Iron", emoji: "⚙️", value: 18, minMine: 2, color: "#7ec8e3" },
  { id: "silver", name: "Silver", emoji: "🥈", value: 45, minMine: 3, color: "#cbd5e1" },
  { id: "gold", name: "Gold", emoji: "🥇", value: 110, minMine: 3, color: "#f59e0b" },
  { id: "ruby", name: "Ruby", emoji: "🔴", value: 260, minMine: 4, color: "#ef4444" },
  { id: "diamond", name: "Diamond", emoji: "💎", value: 650, minMine: 4, color: "#7ec8e3" },
  { id: "emerald", name: "Emerald", emoji: "🟢", value: 1500, minMine: 5, color: "#22c55e" },
  { id: "mythril", name: "Mythril", emoji: "🔷", value: 3800, minMine: 5, color: "#a78bfa" },
];

const MINES = [
  { level: 1, name: "Surface Quarry", unlockCost: 0 },
  { level: 2, name: "Shallow Cave", unlockCost: 200 },
  { level: 3, name: "Deep Mine", unlockCost: 2000 },
  { level: 4, name: "Dark Tunnel", unlockCost: 20000 },
  { level: 5, name: "Ancient Vault", unlockCost: 200000 },
];

const PICKAXES = [
  { level: 1, name: "Wooden Pick", cost: 0, power: 1 },
  { level: 2, name: "Stone Pick", cost: 40, power: 2 },
  { level: 3, name: "Iron Pick", cost: 250, power: 5 },
  { level: 4, name: "Steel Pick", cost: 1500, power: 12 },
  { level: 5, name: "Gold Pick", cost: 8000, power: 30 },
  { level: 6, name: "Diamond Pick", cost: 40000, power: 80 },
  { level: 7, name: "Mythril Pick", cost: 200000, power: 200 },
];

type Store = {
  gold: number;
  ore: Record<string, number>;
  pickLevel: number;
  mineLevel: number;
  autoMiners: number;
  mineRock: (orePossible: Ore[]) => { ore: Ore; amt: number } | null;
  buyPickaxe: () => void;
  unlockMine: () => void;
  buyAutoMiner: () => void;
  sellOre: (id: string) => void;
  sellAll: () => void;
  tick: (dt: number) => void;
};

const autoMinerCost = (n: number) => Math.floor(100 * Math.pow(1.3, n));

const useStore = create<Store>((set, get) => {
  const saved = localStorage.getItem("mining_save");
  let init: any = {};
  if (saved) {
    try { init = JSON.parse(saved); } catch {}
  }
  return {
    gold: init.gold ?? 0,
    ore: init.ore ?? {},
    pickLevel: init.pickLevel ?? 1,
    mineLevel: init.mineLevel ?? 1,
    autoMiners: init.autoMiners ?? 0,
    mineRock: (orePossible) => {
      const s = get();
      const pick = PICKAXES[s.pickLevel - 1];
      const ore = orePossible[Math.floor(Math.random() * orePossible.length)];
      const amt = Math.max(1, Math.floor(pick.power / 2 + Math.random() * pick.power));
      set((s) => ({
        ore: { ...s.ore, [ore.id]: (s.ore[ore.id] || 0) + amt },
      }));
      return { ore, amt };
    },
    buyPickaxe: () =>
      set((s) => {
        const next = PICKAXES[s.pickLevel];
        if (!next || s.gold < next.cost) return s;
        return { gold: s.gold - next.cost, pickLevel: s.pickLevel + 1 };
      }),
    unlockMine: () =>
      set((s) => {
        const next = MINES[s.mineLevel];
        if (!next || s.gold < next.unlockCost) return s;
        return { gold: s.gold - next.unlockCost, mineLevel: s.mineLevel + 1 };
      }),
    buyAutoMiner: () =>
      set((s) => {
        const c = autoMinerCost(s.autoMiners);
        if (s.gold < c) return s;
        return { gold: s.gold - c, autoMiners: s.autoMiners + 1 };
      }),
    sellOre: (id) =>
      set((s) => {
        const amt = s.ore[id] || 0;
        const o = ORES.find((x) => x.id === id)!;
        return {
          ore: { ...s.ore, [id]: 0 },
          gold: s.gold + amt * o.value,
        };
      }),
    sellAll: () =>
      set((s) => {
        let g = s.gold;
        for (const id in s.ore) {
          const o = ORES.find((x) => x.id === id);
          if (o) g += (s.ore[id] || 0) * o.value;
        }
        const cleared: Record<string, number> = {};
        return { gold: g, ore: cleared };
      }),
    tick: (dt) =>
      set((s) => {
        if (s.autoMiners === 0) return s;
        const pool = ORES.filter((o) => o.minMine <= s.mineLevel);
        const newOre = { ...s.ore };
        // each auto miner mines dt * 0.3 times per second
        const total = s.autoMiners * dt * 0.3;
        const whole = Math.floor(total);
        const frac = total - whole;
        const rolls = whole + (Math.random() < frac ? 1 : 0);
        for (let i = 0; i < rolls; i++) {
          const o = pool[Math.floor(Math.random() * pool.length)];
          newOre[o.id] = (newOre[o.id] || 0) + 1;
        }
        return { ore: newOre };
      }),
  };
});

setInterval(() => {
  const s = useStore.getState();
  localStorage.setItem(
    "mining_save",
    JSON.stringify({
      gold: s.gold,
      ore: s.ore,
      pickLevel: s.pickLevel,
      mineLevel: s.mineLevel,
      autoMiners: s.autoMiners,
    })
  );
}, 3000);

function fmt(n: number) {
  if (n < 1000) return n.toFixed(0);
  if (n < 1e6) return (n / 1000).toFixed(1) + "K";
  if (n < 1e9) return (n / 1e6).toFixed(1) + "M";
  return (n / 1e9).toFixed(1) + "B";
}

export default function App() {
  const store = useStore();
  const { gold, ore, pickLevel, mineLevel, autoMiners, mineRock, buyPickaxe, unlockMine, buyAutoMiner, sellAll, tick } = store;
  const [hp, setHp] = useState(100);
  const [rockMax, setRockMax] = useState(100);
  const [floaters, setFloaters] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const floaterIdRef = useRef(0);
  const [tab, setTab] = useState<"pick" | "mine" | "auto" | "inv">("pick");

  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      tick((now - last) / 1000);
      last = now;
    }, 200);
    return () => clearInterval(id);
  }, [tick]);

  const pool = ORES.filter((o) => o.minMine <= mineLevel);
  const pick = PICKAXES[pickLevel - 1];

  const swing = () => {
    setHp((h) => {
      const newHp = h - pick.power;
      if (newHp <= 0) {
        // rock broken, spawn new one, drop ore
        const res = mineRock(pool);
        if (res) {
          const fid = ++floaterIdRef.current;
          setFloaters((fs) => [
            ...fs,
            { id: fid, text: `+${res.amt} ${res.ore.emoji}`, x: 50 + (Math.random() - 0.5) * 30, y: 50 },
          ]);
          setTimeout(() => {
            setFloaters((fs) => fs.filter((f) => f.id !== fid));
          }, 1200);
        }
        const newMax = Math.floor(80 + Math.random() * 60 + mineLevel * 20);
        setRockMax(newMax);
        return newMax;
      }
      return newHp;
    });
  };

  const currentMine = MINES[mineLevel - 1];
  const nextMine = MINES[mineLevel];
  const nextPick = PICKAXES[pickLevel];

  return (
    <div className="w-full min-h-dvh flex flex-col p-3 gap-3">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
          <span className="text-steel">DEEP</span>
          <span className="text-accent"> MINER</span>
        </h1>
        <p className="text-xs text-slate-500">{currentMine.name}</p>
      </div>

      <div className="flex gap-2 justify-center text-xs flex-wrap">
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Gold: <span className="text-accent font-bold">{fmt(gold)}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Pick: <span className="text-steel font-bold">{pick.name}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Auto: <span className="text-accent font-bold">{autoMiners}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-3 flex-1 min-h-0">
        <div className="flex flex-col items-center justify-center gap-4 bg-navy-800/50 rounded-2xl border border-white/5 p-6 relative overflow-hidden">
          <button onClick={swing} className="relative active:scale-95 transition-transform">
            <div className="text-[8rem] md:text-[10rem] select-none" style={{ filter: "drop-shadow(0 0 20px rgba(126,200,227,0.4))" }}>
              🪨
            </div>
          </button>
          <div className="w-64">
            <div className="h-3 bg-navy-900 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-steel to-accent transition-all"
                style={{ width: `${(hp / rockMax) * 100}%` }}
              />
            </div>
            <div className="text-xs text-center mt-1 text-slate-500">
              {hp}/{rockMax} HP
            </div>
          </div>
          <button
            onClick={sellAll}
            className="px-4 py-2 rounded-lg bg-accent text-navy-900 font-bold text-sm hover:scale-105 transition"
          >
            Sell All Ore
          </button>
          {floaters.map((f) => (
            <div
              key={f.id}
              className="absolute text-lg font-bold text-accent pointer-events-none"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                animation: "floatUp 1.2s ease-out forwards",
              }}
            >
              {f.text}
            </div>
          ))}
          <style>{`@keyframes floatUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-60px)}}`}</style>
        </div>

        <div className="flex flex-col bg-navy-800/50 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex p-1 gap-1 border-b border-white/5">
            {(["pick", "mine", "auto", "inv"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded text-xs font-bold ${
                  tab === t ? "bg-accent text-navy-900" : "text-slate-400"
                }`}
              >
                {t === "pick" ? "Pick" : t === "mine" ? "Mines" : t === "auto" ? "Auto" : "Ore"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {tab === "pick" && (
              <>
                <div className="p-3 rounded-xl bg-navy-900 border border-green-500/30">
                  <div className="text-xs text-slate-400">Current</div>
                  <div className="font-bold">{pick.name}</div>
                  <div className="text-xs text-steel">Power: {pick.power}</div>
                </div>
                {nextPick ? (
                  <button
                    onClick={buyPickaxe}
                    disabled={gold < nextPick.cost}
                    className="w-full p-3 rounded-xl border border-accent/30 bg-navy-900 hover:border-accent disabled:opacity-40 text-left"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold">⛏️ {nextPick.name}</div>
                        <div className="text-xs text-steel">Power: {nextPick.power}</div>
                      </div>
                      <div className="text-accent font-bold">{fmt(nextPick.cost)}g</div>
                    </div>
                  </button>
                ) : (
                  <div className="text-center text-xs text-slate-500 p-4">MAX TIER</div>
                )}
              </>
            )}
            {tab === "mine" && (
              <>
                {MINES.map((m, i) => {
                  const unlocked = i + 1 <= mineLevel;
                  const canUnlock = i + 1 === mineLevel + 1 && gold >= m.unlockCost;
                  return (
                    <div
                      key={m.level}
                      className={`p-3 rounded-xl border ${
                        unlocked ? "border-green-500/40 bg-green-500/10" : "border-white/5 bg-navy-900"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">{m.name}</div>
                          <div className="text-xs text-slate-400">Tier {m.level}</div>
                        </div>
                        {unlocked ? (
                          <div className="text-xs text-green-400">Unlocked</div>
                        ) : i + 1 === mineLevel + 1 ? (
                          <button
                            onClick={unlockMine}
                            disabled={!canUnlock}
                            className="px-3 py-1.5 rounded-lg bg-accent text-navy-900 text-xs font-bold disabled:opacity-40"
                          >
                            {fmt(m.unlockCost)}g
                          </button>
                        ) : (
                          <div className="text-xs text-slate-500">{fmt(m.unlockCost)}g</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            {tab === "auto" && (
              <>
                <div className="p-3 rounded-xl bg-navy-900 border border-white/10 text-center">
                  <div className="text-xs text-slate-400">Owned</div>
                  <div className="text-2xl font-bold text-accent">{autoMiners}</div>
                  <div className="text-xs text-steel">
                    ~{(autoMiners * 0.3).toFixed(1)} ore/sec
                  </div>
                </div>
                <button
                  onClick={buyAutoMiner}
                  disabled={gold < autoMinerCost(autoMiners)}
                  className="w-full p-3 rounded-xl border border-accent/30 bg-navy-900 hover:border-accent disabled:opacity-40 text-left"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">🤖 Auto Miner</div>
                      <div className="text-xs text-steel">+1 passive miner</div>
                    </div>
                    <div className="text-accent font-bold">{fmt(autoMinerCost(autoMiners))}g</div>
                  </div>
                </button>
              </>
            )}
            {tab === "inv" && (
              <>
                {ORES.map((o) => {
                  const amt = ore[o.id] || 0;
                  return (
                    <div
                      key={o.id}
                      className="p-2 rounded-xl bg-navy-900 border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-xl">{o.emoji}</div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: o.color }}>
                            {o.name}
                          </div>
                          <div className="text-xs text-slate-500">{o.value}g each</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-accent">{amt}</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
