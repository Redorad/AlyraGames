import { useEffect, useState } from "react";
import { create } from "zustand";

type Crop = {
  id: number;
  name: string;
  emoji: string;
  ready: boolean;
  readyAt: number;
};

type AnimalType = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  gps: number; // gold per second
};

const ANIMALS: AnimalType[] = [
  { id: "chicken", name: "Chicken", emoji: "🐔", cost: 30, gps: 0.3 },
  { id: "cow", name: "Cow", emoji: "🐄", cost: 150, gps: 1.5 },
  { id: "sheep", name: "Sheep", emoji: "🐑", cost: 500, gps: 4.5 },
  { id: "pig", name: "Pig", emoji: "🐖", cost: 1800, gps: 14 },
  { id: "horse", name: "Horse", emoji: "🐎", cost: 6000, gps: 42 },
  { id: "goat", name: "Goat", emoji: "🐐", cost: 20000, gps: 130 },
  { id: "dragon", name: "Dragon", emoji: "🐲", cost: 80000, gps: 450 },
];

const CROP_TYPES = [
  { id: "wheat", emoji: "🌾", name: "Wheat", time: 4, value: 3 },
  { id: "potato", emoji: "🥔", name: "Potato", time: 6, value: 6 },
  { id: "carrot", emoji: "🥕", name: "Carrot", time: 3, value: 4 },
];

type Store = {
  gold: number;
  crops: Crop[];
  animals: Record<string, number>;
  clickPower: number;
  clickPowerLevel: number;
  totalGold: number;
  plant: (id: number, cropType: string) => void;
  harvest: (id: number) => void;
  buyAnimal: (id: string) => void;
  upgradeClick: () => void;
  tick: (dt: number) => void;
};

const clickPowerCost = (lvl: number) => Math.floor(50 * Math.pow(2, lvl - 1));

const useStore = create<Store>((set, get) => {
  const saved = localStorage.getItem("farm_save");
  let init: any = {};
  if (saved) {
    try { init = JSON.parse(saved); } catch {}
  }
  const defaultCrops: Crop[] = Array.from({ length: 9 }, (_, i) => ({
    id: i,
    name: "wheat",
    emoji: "🌾",
    ready: true,
    readyAt: 0,
  }));
  return {
    gold: init.gold ?? 10,
    crops: init.crops ?? defaultCrops,
    animals: init.animals ?? {},
    clickPower: init.clickPower ?? 1,
    clickPowerLevel: init.clickPowerLevel ?? 1,
    totalGold: init.totalGold ?? 0,
    plant: (id, cropType) =>
      set((s) => {
        const ct = CROP_TYPES.find((c) => c.id === cropType)!;
        return {
          crops: s.crops.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: ct.id,
                  emoji: ct.emoji,
                  ready: false,
                  readyAt: Date.now() + ct.time * 1000,
                }
              : c
          ),
        };
      }),
    harvest: (id) =>
      set((s) => {
        const crop = s.crops.find((c) => c.id === id);
        if (!crop || !crop.ready) return s;
        const ct = CROP_TYPES.find((c) => c.id === crop.name)!;
        const value = ct.value * s.clickPower;
        return {
          gold: s.gold + value,
          totalGold: s.totalGold + value,
          crops: s.crops.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ready: false,
                  readyAt: Date.now() + ct.time * 1000,
                }
              : c
          ),
        };
      }),
    buyAnimal: (id) =>
      set((s) => {
        const a = ANIMALS.find((x) => x.id === id)!;
        if (s.gold < a.cost) return s;
        return {
          gold: s.gold - a.cost,
          animals: { ...s.animals, [id]: (s.animals[id] || 0) + 1 },
        };
      }),
    upgradeClick: () =>
      set((s) => {
        const c = clickPowerCost(s.clickPowerLevel);
        if (s.gold < c) return s;
        return {
          gold: s.gold - c,
          clickPower: s.clickPower + 1,
          clickPowerLevel: s.clickPowerLevel + 1,
        };
      }),
    tick: (dt) =>
      set((s) => {
        // crop readiness
        const now = Date.now();
        const newCrops = s.crops.map((c) =>
          !c.ready && now >= c.readyAt ? { ...c, ready: true } : c
        );
        // animals passive income
        let gps = 0;
        for (const a of ANIMALS) {
          gps += (s.animals[a.id] || 0) * a.gps;
        }
        const earned = gps * dt;
        return {
          crops: newCrops,
          gold: s.gold + earned,
          totalGold: s.totalGold + earned,
        };
      }),
  };
});

setInterval(() => {
  const s = useStore.getState();
  localStorage.setItem(
    "farm_save",
    JSON.stringify({
      gold: s.gold,
      crops: s.crops,
      animals: s.animals,
      clickPower: s.clickPower,
      clickPowerLevel: s.clickPowerLevel,
      totalGold: s.totalGold,
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
    gold, crops, animals, clickPower, clickPowerLevel,
    harvest, plant, buyAnimal, upgradeClick, tick,
  } = useStore();
  const [_, setT] = useState(0);
  const [selectedCrop, setSelectedCrop] = useState("wheat");
  const [tab, setTab] = useState<"animals" | "upgrades">("animals");

  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      tick((now - last) / 1000);
      last = now;
      setT((t) => t + 1);
    }, 200);
    return () => clearInterval(id);
  }, [tick]);

  const totalGps = ANIMALS.reduce(
    (sum, a) => sum + (animals[a.id] || 0) * a.gps,
    0
  );

  return (
    <div className="w-full min-h-dvh flex flex-col p-3 gap-3">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
          <span className="text-steel">FARM</span>
          <span className="text-accent"> CLICKER</span>
        </h1>
      </div>

      <div className="flex gap-2 justify-center text-xs flex-wrap">
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Gold: <span className="text-accent font-bold">{fmt(gold)}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Click: <span className="text-steel font-bold">x{clickPower}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Idle: <span className="text-accent font-bold">{totalGps.toFixed(1)}/s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-3 flex-1 min-h-0">
        <div className="flex flex-col bg-navy-800/40 rounded-2xl border border-white/5 p-4">
          <div className="flex gap-2 mb-3 justify-center">
            {CROP_TYPES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCrop(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs border ${
                  selectedCrop === c.id
                    ? "border-accent bg-accent/20"
                    : "border-white/10 bg-navy-900"
                }`}
              >
                {c.emoji} {c.name} ({c.time}s)
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 flex-1 place-content-center">
            {crops.map((crop) => {
              const ready = crop.ready;
              const ct = CROP_TYPES.find((c) => c.id === crop.name)!;
              const progress = ready
                ? 1
                : Math.max(0, 1 - (crop.readyAt - Date.now()) / (ct.time * 1000));
              return (
                <button
                  key={crop.id}
                  onClick={() => {
                    if (ready) {
                      harvest(crop.id);
                      // replant same crop
                      setTimeout(() => plant(crop.id, selectedCrop), 0);
                    }
                  }}
                  className={`aspect-square rounded-2xl border-2 bg-[#1a2e1e] relative overflow-hidden transition ${
                    ready
                      ? "border-accent animate-pulse cursor-pointer"
                      : "border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-center h-full text-5xl">
                    {ready ? crop.emoji : progress < 0.4 ? "🌱" : progress < 0.8 ? "🌿" : crop.emoji}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-accent"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="text-center text-xs text-slate-500 mt-3">
            Click ripe crops to harvest · Each click earns {clickPower}x
          </div>
        </div>

        <div className="flex flex-col bg-navy-800/40 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex gap-1 p-2 border-b border-white/5">
            <button
              onClick={() => setTab("animals")}
              className={`flex-1 py-2 rounded text-sm font-bold ${
                tab === "animals" ? "bg-accent text-navy-900" : "text-slate-400"
              }`}
            >
              Animals
            </button>
            <button
              onClick={() => setTab("upgrades")}
              className={`flex-1 py-2 rounded text-sm font-bold ${
                tab === "upgrades" ? "bg-accent text-navy-900" : "text-slate-400"
              }`}
            >
              Upgrades
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {tab === "animals" && ANIMALS.map((a) => {
              const owned = animals[a.id] || 0;
              const can = gold >= a.cost;
              return (
                <button
                  key={a.id}
                  onClick={() => buyAnimal(a.id)}
                  disabled={!can}
                  className={`w-full p-3 rounded-xl border text-left transition ${
                    can
                      ? "border-accent/30 bg-navy-900 hover:border-accent"
                      : "border-white/5 bg-navy-900/50 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{a.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">{a.name}</div>
                      <div className="text-xs text-steel">
                        +{a.gps}/s · Owned: {owned}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-accent">{fmt(a.cost)}g</div>
                  </div>
                </button>
              );
            })}
            {tab === "upgrades" && (
              <button
                onClick={upgradeClick}
                disabled={gold < clickPowerCost(clickPowerLevel)}
                className="w-full p-3 rounded-xl border border-accent/30 bg-navy-900 hover:border-accent disabled:opacity-40 text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">🖱️ Click Power</div>
                    <div className="text-xs text-steel">
                      Level {clickPowerLevel} → {clickPowerLevel + 1}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-accent">
                    {fmt(clickPowerCost(clickPowerLevel))}g
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
