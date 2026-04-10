import { useEffect, useState } from "react";
import { create } from "zustand";

type Kiln = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  pps: number; // pots per second
  owned: number;
};

type Upgrade = {
  id: string;
  name: string;
  cost: number;
  clickMult?: number;
  ppsMult?: number;
  purchased: boolean;
};

type Store = {
  pots: number;
  gold: number;
  clickValue: number;
  clickMult: number;
  ppsMult: number;
  totalPots: number;
  kilns: Kiln[];
  upgrades: Upgrade[];
  click: () => void;
  buyKiln: (id: string) => void;
  buyUpgrade: (id: string) => void;
  sellAll: () => void;
  tick: (dt: number) => void;
};

const initialKilns: Kiln[] = [
  { id: "k1", name: "Hand Wheel", emoji: "🪑", cost: 15, pps: 0.2, owned: 0 },
  { id: "k2", name: "Clay Kiln", emoji: "🔥", cost: 80, pps: 1, owned: 0 },
  { id: "k3", name: "Stone Kiln", emoji: "🧱", cost: 400, pps: 5, owned: 0 },
  { id: "k4", name: "Iron Kiln", emoji: "⚙️", cost: 2000, pps: 20, owned: 0 },
  { id: "k5", name: "Master Kiln", emoji: "🏛️", cost: 10000, pps: 80, owned: 0 },
  { id: "k6", name: "Dragon Kiln", emoji: "🐲", cost: 60000, pps: 400, owned: 0 },
  { id: "k7", name: "Cosmic Kiln", emoji: "🌌", cost: 400000, pps: 2000, owned: 0 },
];

const initialUpgrades: Upgrade[] = [
  { id: "u1", name: "Better Clay", cost: 100, clickMult: 2, purchased: false },
  { id: "u2", name: "Golden Glaze", cost: 1000, clickMult: 3, purchased: false },
  { id: "u3", name: "Master Touch", cost: 10000, clickMult: 5, purchased: false },
  { id: "u4", name: "Efficient Ovens", cost: 500, ppsMult: 2, purchased: false },
  { id: "u5", name: "Assembly Line", cost: 5000, ppsMult: 2, purchased: false },
  { id: "u6", name: "Magic Runes", cost: 50000, ppsMult: 3, purchased: false },
];

const SELL_PRICE = 1.5;

function kilnCost(k: Kiln) {
  return Math.ceil(k.cost * Math.pow(1.15, k.owned));
}

const useStore = create<Store>((set, get) => {
  const saved = localStorage.getItem("pottery_save");
  let init: any = {};
  if (saved) {
    try { init = JSON.parse(saved); } catch {}
  }
  return {
    pots: init.pots ?? 0,
    gold: init.gold ?? 0,
    clickValue: 1,
    clickMult: init.clickMult ?? 1,
    ppsMult: init.ppsMult ?? 1,
    totalPots: init.totalPots ?? 0,
    kilns: init.kilns ?? initialKilns,
    upgrades: init.upgrades ?? initialUpgrades,
    click: () =>
      set((s) => {
        const val = s.clickValue * s.clickMult;
        const p = s.pots + val;
        const tp = s.totalPots + val;
        return { pots: p, totalPots: tp };
      }),
    buyKiln: (id) =>
      set((s) => {
        const k = s.kilns.find((x) => x.id === id)!;
        const c = kilnCost(k);
        if (s.gold < c) return s;
        return {
          gold: s.gold - c,
          kilns: s.kilns.map((x) =>
            x.id === id ? { ...x, owned: x.owned + 1 } : x
          ),
        };
      }),
    buyUpgrade: (id) =>
      set((s) => {
        const u = s.upgrades.find((x) => x.id === id)!;
        if (u.purchased || s.gold < u.cost) return s;
        return {
          gold: s.gold - u.cost,
          clickMult: u.clickMult ? s.clickMult * u.clickMult : s.clickMult,
          ppsMult: u.ppsMult ? s.ppsMult * u.ppsMult : s.ppsMult,
          upgrades: s.upgrades.map((x) =>
            x.id === id ? { ...x, purchased: true } : x
          ),
        };
      }),
    sellAll: () =>
      set((s) => ({
        gold: s.gold + Math.floor(s.pots * SELL_PRICE),
        pots: 0,
      })),
    tick: (dt) =>
      set((s) => {
        const pps =
          s.kilns.reduce((a, k) => a + k.owned * k.pps, 0) * s.ppsMult;
        const produced = pps * dt;
        return {
          pots: s.pots + produced,
          totalPots: s.totalPots + produced,
        };
      }),
  };
});

// Save periodically
setInterval(() => {
  const s = useStore.getState();
  localStorage.setItem(
    "pottery_save",
    JSON.stringify({
      pots: s.pots,
      gold: s.gold,
      clickMult: s.clickMult,
      ppsMult: s.ppsMult,
      totalPots: s.totalPots,
      kilns: s.kilns,
      upgrades: s.upgrades,
    })
  );
}, 3000);

function fmt(n: number) {
  if (n < 1000) return n.toFixed(n < 10 ? 1 : 0);
  if (n < 1e6) return (n / 1000).toFixed(1) + "K";
  if (n < 1e9) return (n / 1e6).toFixed(1) + "M";
  return (n / 1e9).toFixed(1) + "B";
}

export default function App() {
  const {
    pots, gold, clickMult, ppsMult, kilns, upgrades,
    click, buyKiln, buyUpgrade, sellAll, tick,
  } = useStore();
  const [bump, setBump] = useState(0);
  const [tab, setTab] = useState<"kilns" | "upgrades">("kilns");

  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      tick(dt);
    }, 100);
    return () => clearInterval(id);
  }, [tick]);

  const pps = kilns.reduce((a, k) => a + k.owned * k.pps, 0) * ppsMult;

  return (
    <div className="w-full h-full flex flex-col p-4 gap-3 overflow-hidden">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
          <span className="text-steel">POTTERY</span>
          <span className="text-accent"> WORKSHOP</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-4 flex-1 min-h-0">
        <div className="flex flex-col items-center justify-center gap-4 bg-navy-800/50 rounded-2xl border border-white/5 p-6">
          <div className="text-center">
            <div className="text-xs text-slate-500">Pots</div>
            <div className="text-4xl font-black text-accent">{fmt(pots)}</div>
            <div className="text-xs text-steel mt-1">
              {pps.toFixed(1)}/s · click +{clickMult}
            </div>
          </div>
          <button
            onClick={() => {
              click();
              setBump((b) => b + 1);
            }}
            className="relative group"
          >
            <div
              key={bump}
              className="text-[8rem] md:text-[10rem] select-none active:scale-95 transition-transform"
              style={{
                animation: "bump 0.15s ease-out",
                filter: "drop-shadow(0 0 24px rgba(167,139,250,0.5))",
              }}
            >
              🏺
            </div>
          </button>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-navy-900 border border-white/5 text-sm">
              Gold: <span className="text-accent font-bold">{fmt(gold)}</span>
            </div>
            <button
              onClick={sellAll}
              disabled={pots < 1}
              className="px-4 py-1.5 rounded-lg bg-accent text-navy-900 font-bold text-sm disabled:opacity-40"
            >
              Sell All ({fmt(Math.floor(pots * SELL_PRICE))}g)
            </button>
          </div>
          <style>{`@keyframes bump{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}`}</style>
        </div>

        <div className="flex flex-col bg-navy-800/50 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex gap-1 p-2 border-b border-white/5">
            <button
              onClick={() => setTab("kilns")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                tab === "kilns" ? "bg-accent text-navy-900" : "text-slate-400 hover:text-white"
              }`}
            >
              Kilns
            </button>
            <button
              onClick={() => setTab("upgrades")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                tab === "upgrades" ? "bg-accent text-navy-900" : "text-slate-400 hover:text-white"
              }`}
            >
              Upgrades
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {tab === "kilns" && kilns.map((k) => {
              const cost = kilnCost(k);
              const can = gold >= cost;
              return (
                <button
                  key={k.id}
                  onClick={() => buyKiln(k.id)}
                  disabled={!can}
                  className={`w-full p-3 rounded-xl border text-left transition ${
                    can
                      ? "border-accent/30 bg-navy-900 hover:border-accent"
                      : "border-white/5 bg-navy-900/50 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{k.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">{k.name}</div>
                      <div className="text-xs text-steel">
                        +{k.pps}/s · Owned: {k.owned}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-accent whitespace-nowrap">
                      {fmt(cost)}g
                    </div>
                  </div>
                </button>
              );
            })}
            {tab === "upgrades" && upgrades.map((u) => (
              <button
                key={u.id}
                onClick={() => buyUpgrade(u.id)}
                disabled={u.purchased || gold < u.cost}
                className={`w-full p-3 rounded-xl border text-left transition ${
                  u.purchased
                    ? "border-green-500/40 bg-green-500/10 opacity-60"
                    : gold >= u.cost
                      ? "border-accent/30 bg-navy-900 hover:border-accent"
                      : "border-white/5 bg-navy-900/50 opacity-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">{u.name}</div>
                    <div className="text-xs text-steel">
                      {u.clickMult ? `Click x${u.clickMult}` : ""}
                      {u.ppsMult ? `Idle x${u.ppsMult}` : ""}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-accent whitespace-nowrap">
                    {u.purchased ? "✓" : `${fmt(u.cost)}g`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
