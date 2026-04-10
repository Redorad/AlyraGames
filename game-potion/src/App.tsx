import { useEffect, useState } from "react";
import { create } from "zustand";

type Ingredient = {
  id: string;
  name: string;
  emoji: string;
  gatherTime: number; // seconds to gather one
  unlockCost: number;
  gathererLevel: number;
};

type Recipe = {
  id: string;
  name: string;
  emoji: string;
  ingredients: Record<string, number>;
  brewTime: number;
  price: number;
  unlockAt: number;
};

const INGREDIENTS: Ingredient[] = [
  { id: "herb", name: "Herb", emoji: "🌿", gatherTime: 2, unlockCost: 0, gathererLevel: 0 },
  { id: "mushroom", name: "Mushroom", emoji: "🍄", gatherTime: 3, unlockCost: 50, gathererLevel: 0 },
  { id: "flower", name: "Flower", emoji: "🌸", gatherTime: 4, unlockCost: 200, gathererLevel: 0 },
  { id: "crystal", name: "Crystal", emoji: "🔮", gatherTime: 6, unlockCost: 800, gathererLevel: 0 },
  { id: "eye", name: "Eye", emoji: "👁️", gatherTime: 8, unlockCost: 3000, gathererLevel: 0 },
  { id: "wing", name: "Wing", emoji: "🦋", gatherTime: 10, unlockCost: 10000, gathererLevel: 0 },
];

const RECIPES: Recipe[] = [
  {
    id: "heal",
    name: "Healing Potion",
    emoji: "❤️",
    ingredients: { herb: 2 },
    brewTime: 4,
    price: 8,
    unlockAt: 0,
  },
  {
    id: "mana",
    name: "Mana Potion",
    emoji: "💙",
    ingredients: { herb: 1, mushroom: 2 },
    brewTime: 6,
    price: 25,
    unlockAt: 40,
  },
  {
    id: "speed",
    name: "Speed Elixir",
    emoji: "💚",
    ingredients: { mushroom: 2, flower: 2 },
    brewTime: 10,
    price: 80,
    unlockAt: 200,
  },
  {
    id: "strength",
    name: "Strength Brew",
    emoji: "🧡",
    ingredients: { flower: 3, crystal: 1 },
    brewTime: 14,
    price: 220,
    unlockAt: 600,
  },
  {
    id: "vision",
    name: "Farsight Potion",
    emoji: "💜",
    ingredients: { crystal: 2, eye: 1 },
    brewTime: 20,
    price: 650,
    unlockAt: 2000,
  },
  {
    id: "fly",
    name: "Flying Draught",
    emoji: "🩵",
    ingredients: { eye: 2, wing: 2 },
    brewTime: 28,
    price: 2000,
    unlockAt: 8000,
  },
];

type Brew = {
  id: number;
  recipeId: string;
  startedAt: number;
  duration: number;
};

type Store = {
  gold: number;
  totalGold: number;
  inventory: Record<string, number>;
  brewSlots: (Brew | null)[];
  gatherers: Record<string, number>; // gatherer count per ingredient
  unlocked: Record<string, boolean>;
  buyGatherer: (id: string) => void;
  gatherManual: (id: string) => void;
  startBrew: (slot: number, recipeId: string) => void;
  collectBrew: (slot: number) => void;
  addSlot: () => void;
  tick: (dt: number) => void;
};

const gathererCost = (id: string, n: number) => {
  const base = id === "herb" ? 10 : id === "mushroom" ? 60 : id === "flower" ? 250 : id === "crystal" ? 1000 : id === "eye" ? 4000 : 15000;
  return Math.floor(base * Math.pow(1.4, n));
};

const brewSlotCost = (n: number) => Math.floor(500 * Math.pow(3, n - 1));

const useStore = create<Store>((set, get) => {
  const saved = localStorage.getItem("potion_save");
  let init: any = {};
  if (saved) {
    try { init = JSON.parse(saved); } catch {}
  }
  return {
    gold: init.gold ?? 0,
    totalGold: init.totalGold ?? 0,
    inventory: init.inventory ?? {},
    brewSlots: init.brewSlots ?? [null],
    gatherers: init.gatherers ?? {},
    unlocked: init.unlocked ?? { herb: true },
    buyGatherer: (id) =>
      set((s) => {
        const ing = INGREDIENTS.find((i) => i.id === id)!;
        if (!s.unlocked[id]) {
          if (s.gold < ing.unlockCost) return s;
          return {
            gold: s.gold - ing.unlockCost,
            unlocked: { ...s.unlocked, [id]: true },
          };
        }
        const n = s.gatherers[id] || 0;
        const c = gathererCost(id, n);
        if (s.gold < c) return s;
        return {
          gold: s.gold - c,
          gatherers: { ...s.gatherers, [id]: n + 1 },
        };
      }),
    gatherManual: (id) =>
      set((s) => ({
        inventory: { ...s.inventory, [id]: (s.inventory[id] || 0) + 1 },
      })),
    startBrew: (slot, recipeId) =>
      set((s) => {
        const r = RECIPES.find((x) => x.id === recipeId)!;
        if (s.brewSlots[slot]) return s;
        for (const key in r.ingredients) {
          if ((s.inventory[key] || 0) < r.ingredients[key]) return s;
        }
        const newInv = { ...s.inventory };
        for (const key in r.ingredients) {
          newInv[key] -= r.ingredients[key];
        }
        const newSlots = [...s.brewSlots];
        newSlots[slot] = {
          id: Date.now(),
          recipeId,
          startedAt: Date.now(),
          duration: r.brewTime * 1000,
        };
        return { inventory: newInv, brewSlots: newSlots };
      }),
    collectBrew: (slot) =>
      set((s) => {
        const b = s.brewSlots[slot];
        if (!b) return s;
        const r = RECIPES.find((x) => x.id === b.recipeId)!;
        if (Date.now() - b.startedAt < b.duration) return s;
        const newSlots = [...s.brewSlots];
        newSlots[slot] = null;
        const newGold = s.gold + r.price;
        return {
          brewSlots: newSlots,
          gold: newGold,
          totalGold: s.totalGold + r.price,
        };
      }),
    addSlot: () =>
      set((s) => {
        const c = brewSlotCost(s.brewSlots.length);
        if (s.gold < c) return s;
        return { gold: s.gold - c, brewSlots: [...s.brewSlots, null] };
      }),
    tick: (dt) =>
      set((s) => {
        const newInv = { ...s.inventory };
        // Track fractional gather progress per ingredient
        const newGatherers = { ...s.gatherers };
        // stored in special key _progress_<id>
        for (const id in s.gatherers) {
          const count = s.gatherers[id];
          if (!count) continue;
          const ing = INGREDIENTS.find((i) => i.id === id)!;
          const rate = count / ing.gatherTime; // items per second
          const prevKey = `_p_${id}`;
          const prev = (s as any)[prevKey] || 0;
          const amt = prev + rate * dt;
          const whole = Math.floor(amt);
          (s as any)[prevKey] = amt - whole;
          if (whole > 0) newInv[id] = (newInv[id] || 0) + whole;
        }
        return { inventory: newInv, gatherers: newGatherers };
      }),
  };
});

setInterval(() => {
  const s = useStore.getState();
  localStorage.setItem(
    "potion_save",
    JSON.stringify({
      gold: s.gold,
      totalGold: s.totalGold,
      inventory: s.inventory,
      brewSlots: s.brewSlots,
      gatherers: s.gatherers,
      unlocked: s.unlocked,
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
  const {
    gold, totalGold, inventory, brewSlots, gatherers, unlocked,
    buyGatherer, gatherManual, startBrew, collectBrew, addSlot, tick,
  } = store;
  const [_, setT] = useState(0);
  const [tab, setTab] = useState<"brew" | "ing">("brew");
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);

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

  const availableRecipes = RECIPES.filter((r) => totalGold >= r.unlockAt);

  return (
    <div className="w-full min-h-dvh flex flex-col p-3 gap-3">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
          <span className="text-steel">POTION</span>
          <span className="text-accent"> BREWER</span>
        </h1>
      </div>

      <div className="flex gap-2 justify-center text-xs flex-wrap">
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Gold: <span className="text-accent font-bold">{fmt(gold)}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-white/5">
          Earned: <span className="text-steel font-bold">{fmt(totalGold)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="flex flex-col bg-navy-800/40 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex gap-1 p-2 border-b border-white/5">
            <button
              onClick={() => setTab("brew")}
              className={`flex-1 py-2 rounded text-sm font-bold ${
                tab === "brew" ? "bg-accent text-navy-900" : "text-slate-400"
              }`}
            >
              Cauldrons
            </button>
            <button
              onClick={() => setTab("ing")}
              className={`flex-1 py-2 rounded text-sm font-bold ${
                tab === "ing" ? "bg-accent text-navy-900" : "text-slate-400"
              }`}
            >
              Ingredients
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {tab === "brew" && (
              <>
                {brewSlots.map((b, i) => {
                  if (!b) {
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-xl border-2 border-dashed border-white/20 bg-navy-900/50"
                      >
                        <div className="text-xs text-slate-400 mb-2">Empty Cauldron {i + 1}</div>
                        {selectedRecipe ? (
                          <button
                            onClick={() => {
                              startBrew(i, selectedRecipe);
                              setSelectedRecipe(null);
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-accent text-navy-900 text-sm font-bold"
                          >
                            Brew {RECIPES.find((r) => r.id === selectedRecipe)?.name}
                          </button>
                        ) : (
                          <div className="text-xs text-slate-500 text-center py-2">
                            Select a recipe →
                          </div>
                        )}
                      </div>
                    );
                  }
                  const r = RECIPES.find((x) => x.id === b.recipeId)!;
                  const elapsed = Date.now() - b.startedAt;
                  const progress = Math.min(1, elapsed / b.duration);
                  const ready = progress >= 1;
                  return (
                    <button
                      key={i}
                      disabled={!ready}
                      onClick={() => collectBrew(i)}
                      className={`w-full p-3 rounded-xl border-2 bg-navy-900 relative overflow-hidden ${
                        ready ? "border-accent animate-pulse" : "border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{r.emoji}</div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-bold">{r.name}</div>
                          <div className="text-xs text-slate-400">
                            {ready ? "Ready to collect!" : `${Math.ceil((b.duration - elapsed) / 1000)}s`}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-accent">+{r.price}g</div>
                      </div>
                      <div className="mt-2 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-steel to-accent"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={addSlot}
                  disabled={gold < brewSlotCost(brewSlots.length)}
                  className="w-full py-2 rounded-xl bg-navy-700 border border-white/10 hover:border-accent text-xs disabled:opacity-40"
                >
                  + Add Cauldron ({fmt(brewSlotCost(brewSlots.length))}g)
                </button>
              </>
            )}
            {tab === "ing" && (
              <>
                {INGREDIENTS.map((ing) => {
                  const isUnlocked = unlocked[ing.id];
                  const count = gatherers[ing.id] || 0;
                  const cost = isUnlocked
                    ? gathererCost(ing.id, count)
                    : ing.unlockCost;
                  const amt = inventory[ing.id] || 0;
                  return (
                    <div
                      key={ing.id}
                      className={`p-3 rounded-xl border ${
                        isUnlocked
                          ? "border-white/10 bg-navy-900"
                          : "border-white/5 bg-navy-900/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{ing.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold">{ing.name}</div>
                          <div className="text-xs text-steel">
                            {isUnlocked
                              ? `Have: ${amt} · ${count} gatherers`
                              : `Locked`}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {isUnlocked && (
                            <button
                              onClick={() => gatherManual(ing.id)}
                              className="px-2 py-1 rounded bg-steel text-navy-900 text-xs font-bold"
                            >
                              Pick
                            </button>
                          )}
                          <button
                            onClick={() => buyGatherer(ing.id)}
                            disabled={gold < cost}
                            className="px-2 py-1 rounded bg-accent text-navy-900 text-xs font-bold disabled:opacity-40"
                          >
                            {isUnlocked ? `+1 (${fmt(cost)}g)` : `Unlock (${fmt(cost)}g)`}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col bg-navy-800/40 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-3 border-b border-white/5">
            <h2 className="font-bold text-accent">Recipes</h2>
            <p className="text-xs text-slate-500">Click a recipe, then an empty cauldron.</p>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {RECIPES.map((r) => {
              const unlocked = totalGold >= r.unlockAt;
              const canBrew = Object.entries(r.ingredients).every(
                ([k, v]) => (inventory[k] || 0) >= v
              );
              return (
                <button
                  key={r.id}
                  onClick={() => unlocked && setSelectedRecipe(r.id)}
                  disabled={!unlocked}
                  className={`w-full p-3 rounded-xl border text-left transition ${
                    !unlocked
                      ? "border-white/5 bg-navy-900/50 opacity-40"
                      : selectedRecipe === r.id
                        ? "border-accent bg-accent/10"
                        : canBrew
                          ? "border-white/10 bg-navy-900 hover:border-steel/40"
                          : "border-white/5 bg-navy-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{r.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">
                        {unlocked ? r.name : "???"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {unlocked
                          ? Object.entries(r.ingredients)
                              .map(([k, v]) => {
                                const ing = INGREDIENTS.find((i) => i.id === k)!;
                                return `${v}${ing.emoji}`;
                              })
                              .join(" · ")
                          : `Unlock at ${r.unlockAt}g earned`}
                      </div>
                      {unlocked && (
                        <div className="text-xs text-steel mt-0.5">
                          {r.brewTime}s brew
                        </div>
                      )}
                    </div>
                    {unlocked && (
                      <div className="text-sm font-bold text-accent">
                        {r.price}g
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-2 text-xs text-center text-slate-500 border-t border-white/5">
            {availableRecipes.length}/{RECIPES.length} recipes unlocked
          </div>
        </div>
      </div>
    </div>
  );
}
