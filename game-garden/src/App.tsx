import { useEffect, useState } from "react";
import { create } from "zustand";

type Seed = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  growTime: number; // seconds
  sellPrice: number;
  unlockAt: number; // gold required to unlock
};

const SEEDS: Seed[] = [
  { id: "carrot", name: "Carrot", emoji: "🥕", cost: 2, growTime: 8, sellPrice: 5, unlockAt: 0 },
  { id: "tomato", name: "Tomato", emoji: "🍅", cost: 5, growTime: 14, sellPrice: 14, unlockAt: 0 },
  { id: "corn", name: "Corn", emoji: "🌽", cost: 12, growTime: 22, sellPrice: 35, unlockAt: 50 },
  { id: "eggplant", name: "Eggplant", emoji: "🍆", cost: 25, growTime: 30, sellPrice: 75, unlockAt: 200 },
  { id: "pumpkin", name: "Pumpkin", emoji: "🎃", cost: 60, growTime: 45, sellPrice: 180, unlockAt: 500 },
  { id: "grape", name: "Grapes", emoji: "🍇", cost: 120, growTime: 60, sellPrice: 400, unlockAt: 1500 },
  { id: "strawberry", name: "Strawberry", emoji: "🍓", cost: 250, growTime: 80, sellPrice: 900, unlockAt: 5000 },
  { id: "melon", name: "Melon", emoji: "🍉", cost: 600, growTime: 110, sellPrice: 2400, unlockAt: 20000 },
  { id: "sunflower", name: "Sunflower", emoji: "🌻", cost: 1500, growTime: 150, sellPrice: 6500, unlockAt: 80000 },
];

type Plot = {
  id: number;
  seedId: string | null;
  plantedAt: number;
};

type Store = {
  gold: number;
  plots: Plot[];
  maxGold: number;
  selectedSeed: string;
  addPlot: () => void;
  plant: (plotId: number) => void;
  harvest: (plotId: number) => void;
  setSeed: (id: string) => void;
  buySeed: () => void;
};

const plotCost = (n: number) => Math.floor(50 * Math.pow(1.8, n - 3));

const useStore = create<Store>((set, get) => {
  const saved = localStorage.getItem("garden_save");
  let init: any = {};
  if (saved) {
    try { init = JSON.parse(saved); } catch {}
  }
  const defaultPlots = Array.from({ length: 3 }, (_, i) => ({
    id: i,
    seedId: null as string | null,
    plantedAt: 0,
  }));
  return {
    gold: init.gold ?? 10,
    plots: init.plots ?? defaultPlots,
    maxGold: init.maxGold ?? 10,
    selectedSeed: init.selectedSeed ?? "carrot",
    addPlot: () =>
      set((s) => {
        const c = plotCost(s.plots.length);
        if (s.gold < c) return s;
        return {
          gold: s.gold - c,
          plots: [...s.plots, { id: s.plots.length, seedId: null, plantedAt: 0 }],
        };
      }),
    plant: (plotId) =>
      set((s) => {
        const plot = s.plots.find((p) => p.id === plotId);
        if (!plot || plot.seedId) return s;
        // auto-plant selected if we have one stored; else buy+plant
        const seed = SEEDS.find((x) => x.id === s.selectedSeed)!;
        if (s.gold < seed.cost) return s;
        return {
          gold: s.gold - seed.cost,
          plots: s.plots.map((p) =>
            p.id === plotId
              ? { ...p, seedId: seed.id, plantedAt: Date.now() }
              : p
          ),
        };
      }),
    harvest: (plotId) =>
      set((s) => {
        const plot = s.plots.find((p) => p.id === plotId);
        if (!plot || !plot.seedId) return s;
        const seed = SEEDS.find((x) => x.id === plot.seedId)!;
        const elapsed = (Date.now() - plot.plantedAt) / 1000;
        if (elapsed < seed.growTime) return s;
        const newGold = s.gold + seed.sellPrice;
        return {
          gold: newGold,
          maxGold: Math.max(s.maxGold, newGold),
          plots: s.plots.map((p) =>
            p.id === plotId ? { ...p, seedId: null, plantedAt: 0 } : p
          ),
        };
      }),
    setSeed: (id) => set({ selectedSeed: id }),
    buySeed: () => set({}),
  };
});

setInterval(() => {
  const s = useStore.getState();
  localStorage.setItem(
    "garden_save",
    JSON.stringify({
      gold: s.gold,
      plots: s.plots,
      maxGold: s.maxGold,
      selectedSeed: s.selectedSeed,
    })
  );
}, 2000);

export default function App() {
  const { gold, plots, maxGold, selectedSeed, addPlot, plant, harvest, setSeed } =
    useStore();
  const [_, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, []);

  const selected = SEEDS.find((s) => s.id === selectedSeed)!;
  const unlockedSeeds = SEEDS.filter((s) => maxGold >= s.unlockAt);

  return (
    <div className="w-full min-h-dvh flex flex-col p-3 gap-3">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
          <span className="text-steel">ZEN</span>
          <span className="text-accent"> GARDEN</span>
        </h1>
        <p className="text-xs text-slate-500">Plant. Wait. Harvest.</p>
      </div>

      <div className="flex gap-2 justify-center text-xs flex-wrap">
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Gold: <span className="text-accent font-bold">{gold}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Plots: <span className="text-steel font-bold">{plots.length}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Selected: <span className="text-accent font-bold">{selected.emoji} {selected.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-3 flex-1 min-h-0">
        <div className="flex flex-col bg-navy-800/40 rounded-2xl border border-white/5 p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 flex-1">
            {plots.map((plot) => {
              if (!plot.seedId) {
                return (
                  <button
                    key={plot.id}
                    onClick={() => plant(plot.id)}
                    disabled={gold < selected.cost}
                    className="aspect-square rounded-2xl border-2 border-dashed border-white/20 bg-[#1a2e1e] hover:border-steel/60 hover:bg-[#1e3322] transition flex items-center justify-center disabled:opacity-50"
                  >
                    <div className="text-slate-600 text-3xl">+</div>
                  </button>
                );
              }
              const seed = SEEDS.find((s) => s.id === plot.seedId)!;
              const elapsed = (Date.now() - plot.plantedAt) / 1000;
              const progress = Math.min(1, elapsed / seed.growTime);
              const ready = progress >= 1;
              const stage = progress < 0.33 ? "🌱" : progress < 0.66 ? "🌿" : ready ? seed.emoji : "🌾";
              return (
                <button
                  key={plot.id}
                  onClick={() => ready && harvest(plot.id)}
                  className={`aspect-square rounded-2xl border-2 bg-[#1a2e1e] relative overflow-hidden ${
                    ready ? "border-accent animate-pulse" : "border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-center h-full text-5xl">
                    {stage}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-accent"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  {ready && (
                    <div className="absolute top-1 right-1 text-xs font-bold text-accent">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={addPlot}
            disabled={gold < plotCost(plots.length)}
            className="mt-3 px-4 py-2 rounded-xl bg-navy-700 border border-white/10 hover:border-accent text-sm disabled:opacity-40"
          >
            + Add Plot ({plotCost(plots.length)}g)
          </button>
        </div>

        <div className="flex flex-col bg-navy-800/40 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-3 border-b border-white/5">
            <h2 className="font-bold text-accent">Seed Shop</h2>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {SEEDS.map((s) => {
              const unlocked = maxGold >= s.unlockAt;
              const isSelected = selectedSeed === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => unlocked && setSeed(s.id)}
                  disabled={!unlocked}
                  className={`w-full p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? "border-accent bg-accent/10"
                      : unlocked
                        ? "border-white/10 bg-navy-900 hover:border-steel/40"
                        : "border-white/5 bg-navy-900/50 opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{s.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">{s.name}</div>
                      <div className="text-xs text-slate-400">
                        {unlocked
                          ? `${s.cost}g · ${s.growTime}s · +${s.sellPrice}g`
                          : `Unlock at ${s.unlockAt}g earned`}
                      </div>
                    </div>
                    {unlocked && (
                      <div className="text-xs font-bold text-green-400">
                        +{s.sellPrice - s.cost}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-2 text-xs text-center text-slate-500 border-t border-white/5">
            {unlockedSeeds.length}/{SEEDS.length} seeds unlocked
          </div>
        </div>
      </div>
    </div>
  );
}
