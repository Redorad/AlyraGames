import { useEffect, useRef, useState } from "react";
import { create } from "zustand";

type Fish = {
  id: string;
  name: string;
  emoji: string;
  minValue: number;
  maxValue: number;
  minRod: number; // min rod level needed
  rarity: string;
  rarityColor: string;
};

const FISH: Fish[] = [
  { id: "minnow", name: "Minnow", emoji: "🐟", minValue: 1, maxValue: 3, minRod: 1, rarity: "Common", rarityColor: "#94a3b8" },
  { id: "sardine", name: "Sardine", emoji: "🐠", minValue: 2, maxValue: 5, minRod: 1, rarity: "Common", rarityColor: "#94a3b8" },
  { id: "trout", name: "Trout", emoji: "🐟", minValue: 5, maxValue: 12, minRod: 2, rarity: "Uncommon", rarityColor: "#7ec8e3" },
  { id: "tuna", name: "Tuna", emoji: "🐠", minValue: 10, maxValue: 25, minRod: 2, rarity: "Uncommon", rarityColor: "#7ec8e3" },
  { id: "salmon", name: "Salmon", emoji: "🐟", minValue: 20, maxValue: 40, minRod: 3, rarity: "Rare", rarityColor: "#a78bfa" },
  { id: "swordfish", name: "Swordfish", emoji: "🗡️", minValue: 40, maxValue: 80, minRod: 4, rarity: "Rare", rarityColor: "#a78bfa" },
  { id: "shark", name: "Shark", emoji: "🦈", minValue: 80, maxValue: 150, minRod: 5, rarity: "Epic", rarityColor: "#f59e0b" },
  { id: "whale", name: "Whale", emoji: "🐋", minValue: 150, maxValue: 300, minRod: 6, rarity: "Epic", rarityColor: "#f59e0b" },
  { id: "kraken", name: "Kraken", emoji: "🦑", minValue: 300, maxValue: 600, minRod: 7, rarity: "Legendary", rarityColor: "#ef4444" },
  { id: "dragon", name: "Sea Dragon", emoji: "🐉", minValue: 600, maxValue: 1200, minRod: 8, rarity: "Mythic", rarityColor: "#ec4899" },
];

const RODS = [
  { level: 1, name: "Wooden Rod", cost: 0, desc: "Starter" },
  { level: 2, name: "Bamboo Rod", cost: 50 },
  { level: 3, name: "Iron Rod", cost: 200 },
  { level: 4, name: "Steel Rod", cost: 800 },
  { level: 5, name: "Silver Rod", cost: 3000 },
  { level: 6, name: "Gold Rod", cost: 10000 },
  { level: 7, name: "Crystal Rod", cost: 30000 },
  { level: 8, name: "Mythic Rod", cost: 100000 },
];

type State = "idle" | "waiting" | "biting" | "reeling";

type Store = {
  gold: number;
  rodLevel: number;
  totalCaught: number;
  log: string[];
  addGold: (n: number) => void;
  upgradeRod: () => void;
  caught: (f: Fish, v: number) => void;
};

const useStore = create<Store>((set) => {
  const saved = localStorage.getItem("fish_save");
  const init = saved ? JSON.parse(saved) : { gold: 0, rodLevel: 1, totalCaught: 0 };
  return {
    gold: init.gold,
    rodLevel: init.rodLevel,
    totalCaught: init.totalCaught,
    log: [],
    addGold: (n) =>
      set((s) => {
        const g = s.gold + n;
        localStorage.setItem(
          "fish_save",
          JSON.stringify({ gold: g, rodLevel: s.rodLevel, totalCaught: s.totalCaught })
        );
        return { gold: g };
      }),
    upgradeRod: () =>
      set((s) => {
        const next = RODS[s.rodLevel];
        if (!next || s.gold < next.cost) return s;
        const g = s.gold - next.cost;
        const lvl = s.rodLevel + 1;
        localStorage.setItem(
          "fish_save",
          JSON.stringify({ gold: g, rodLevel: lvl, totalCaught: s.totalCaught })
        );
        return { gold: g, rodLevel: lvl };
      }),
    caught: (f, v) =>
      set((s) => {
        const g = s.gold + v;
        const tc = s.totalCaught + 1;
        localStorage.setItem(
          "fish_save",
          JSON.stringify({ gold: g, rodLevel: s.rodLevel, totalCaught: tc })
        );
        return {
          gold: g,
          totalCaught: tc,
          log: [`Caught ${f.name} +${v}g`, ...s.log].slice(0, 6),
        };
      }),
  };
});

export default function App() {
  const { gold, rodLevel, totalCaught, log, upgradeRod, caught, addGold } =
    useStore();
  const [state, setState] = useState<State>("idle");
  const [lastCatch, setLastCatch] = useState<{ fish: Fish; value: number } | null>(
    null
  );
  const [showShop, setShowShop] = useState(false);
  const biteTimerRef = useRef<number | null>(null);
  const biteTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (biteTimerRef.current) clearTimeout(biteTimerRef.current);
      if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
    };
  }, []);

  const cast = () => {
    if (state !== "idle") return;
    setLastCatch(null);
    setState("waiting");
    const wait = 1500 + Math.random() * 3500;
    biteTimerRef.current = window.setTimeout(() => {
      setState("biting");
      biteTimeoutRef.current = window.setTimeout(() => {
        // escaped
        setState("idle");
      }, 1500);
    }, wait);
  };

  const reel = () => {
    if (state === "biting") {
      if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
      setState("reeling");
      setTimeout(() => {
        // pick a random fish up to current rod level
        const pool = FISH.filter((f) => f.minRod <= rodLevel);
        const weighted: Fish[] = [];
        for (const f of pool) {
          // rarer fish less likely
          const rarityWeight =
            f.rarity === "Common" ? 40 :
            f.rarity === "Uncommon" ? 22 :
            f.rarity === "Rare" ? 12 :
            f.rarity === "Epic" ? 5 :
            f.rarity === "Legendary" ? 2 : 1;
          for (let i = 0; i < rarityWeight; i++) weighted.push(f);
        }
        const f = weighted[Math.floor(Math.random() * weighted.length)];
        const v = Math.floor(f.minValue + Math.random() * (f.maxValue - f.minValue + 1));
        caught(f, v);
        setLastCatch({ fish: f, value: v });
        setState("idle");
      }, 500);
    } else if (state === "waiting") {
      // reeled too early
      if (biteTimerRef.current) clearTimeout(biteTimerRef.current);
      setState("idle");
    }
  };

  const currentRod = RODS[rodLevel - 1];
  const nextRod = RODS[rodLevel];

  return (
    <div className="w-full h-full flex flex-col items-center gap-4 p-4 overflow-auto">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-steel">FISHING</span>
          <span className="text-accent"> IDLE</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Cast your line. Click reel the moment you see a bite!
        </p>
      </div>

      <div className="flex gap-3 text-sm">
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Gold: <span className="text-accent font-bold">{gold}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Rod: <span className="text-steel font-bold">{currentRod.name}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Caught: <span className="text-accent font-bold">{totalCaught}</span>
        </div>
      </div>

      <div className="relative w-[min(600px,95vw)] h-[340px] rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-b from-navy-800 to-navy-900 shadow-2xl">
        {/* water */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-[#0f2a4a] to-[#061428]" />
        <div className="absolute inset-x-0 top-[calc(100%-10rem)] h-1 bg-steel/30" />
        {/* sun */}
        <div className="absolute top-6 right-10 w-16 h-16 rounded-full bg-yellow-300/30 blur-xl" />
        {/* fisher stick figure */}
        <div className="absolute left-10 top-20 text-5xl">🧑‍🎣</div>
        {/* line */}
        <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 600 340">
          <line
            x1="100"
            y1="135"
            x2={state === "idle" ? 140 : 260}
            y2={state === "idle" ? 170 : 260}
            stroke="#7ec8e3"
            strokeWidth="1"
          />
        </svg>
        {/* bobber */}
        {state !== "idle" && (
          <div
            className={`absolute text-3xl transition-transform ${
              state === "biting" ? "animate-bounce" : ""
            }`}
            style={{ left: 248, top: 240 }}
          >
            🎣
          </div>
        )}
        {state === "biting" && (
          <div
            className="absolute text-4xl animate-pulse font-black text-red-400"
            style={{ left: 300, top: 200 }}
          >
            !
          </div>
        )}
        {/* ripples */}
        {state === "waiting" && (
          <div
            className="absolute w-10 h-10 rounded-full border-2 border-steel/40 animate-ping"
            style={{ left: 248, top: 250 }}
          />
        )}
        {/* catch popup */}
        {lastCatch && state === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="px-5 py-3 rounded-xl bg-navy-900/90 border text-center"
              style={{ borderColor: lastCatch.fish.rarityColor }}
            >
              <div className="text-4xl">{lastCatch.fish.emoji}</div>
              <div className="font-bold mt-1">{lastCatch.fish.name}</div>
              <div
                className="text-xs"
                style={{ color: lastCatch.fish.rarityColor }}
              >
                {lastCatch.fish.rarity}
              </div>
              <div className="text-accent font-bold mt-1">
                +{lastCatch.value}g
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {state === "idle" && (
          <button
            onClick={cast}
            className="px-6 py-3 rounded-xl bg-accent text-navy-900 font-bold hover:scale-105 transition"
          >
            Cast Line
          </button>
        )}
        {(state === "waiting" || state === "biting") && (
          <button
            onClick={reel}
            className={`px-6 py-3 rounded-xl font-bold transition ${
              state === "biting"
                ? "bg-red-500 text-white animate-pulse scale-110"
                : "bg-steel text-navy-900"
            }`}
          >
            {state === "biting" ? "REEL IT IN!" : "Waiting..."}
          </button>
        )}
        {state === "reeling" && (
          <button disabled className="px-6 py-3 rounded-xl bg-navy-700 font-bold">
            Reeling...
          </button>
        )}
        <button
          onClick={() => setShowShop(true)}
          className="px-6 py-3 rounded-xl bg-navy-800 border border-white/10 font-bold hover:border-accent transition"
        >
          🛒 Shop
        </button>
      </div>

      {log.length > 0 && (
        <div className="w-[min(500px,92vw)] text-xs text-slate-400 text-center space-y-1">
          {log.map((l, i) => (
            <div key={i} className="opacity-80">{l}</div>
          ))}
        </div>
      )}

      {showShop && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setShowShop(false)}
        >
          <div
            className="w-[min(520px,95vw)] max-h-[85dvh] overflow-auto rounded-2xl bg-navy-800 border border-white/10 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-accent">Shop</h2>
              <button
                onClick={() => setShowShop(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-slate-400 mb-3">
              Gold: <span className="text-accent font-bold">{gold}</span>
            </div>
            <div className="space-y-2">
              {RODS.map((r, i) => {
                const owned = i + 1 <= rodLevel;
                const available = i + 1 === rodLevel + 1;
                return (
                  <div
                    key={r.level}
                    className={`p-3 rounded-xl border ${
                      owned
                        ? "border-green-500/40 bg-green-500/10"
                        : available
                          ? "border-accent/40"
                          : "border-white/5 opacity-40"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold">🎣 {r.name}</div>
                        <div className="text-xs text-slate-400">
                          Lv {r.level}
                        </div>
                      </div>
                      {owned ? (
                        <div className="text-xs text-green-400 font-bold">Owned</div>
                      ) : available ? (
                        <button
                          disabled={gold < r.cost}
                          onClick={upgradeRod}
                          className="px-3 py-1.5 rounded-lg bg-accent text-navy-900 text-xs font-bold disabled:opacity-40"
                        >
                          {r.cost}g
                        </button>
                      ) : (
                        <div className="text-xs text-slate-500">{r.cost}g</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {gold < 1 && (
              <button
                onClick={() => addGold(5)}
                className="mt-3 w-full px-3 py-2 rounded-lg bg-navy-700 text-xs text-slate-400 hover:text-white"
              >
                Beggar bonus: +5g
              </button>
            )}
            {nextRod && (
              <div className="mt-4 text-xs text-slate-500 text-center">
                Next: {nextRod.name} unlocks more fish!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
