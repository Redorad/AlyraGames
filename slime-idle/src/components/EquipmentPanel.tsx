import { useState, useEffect, useCallback } from "react";
import {
  EQUIPMENT,
  EQUIP_SLOTS,
  RARITY_COLORS,
  RARITY_BORDERS,
  EquipItem,
  EquipSlot,
} from "../data/equipment";

const STORAGE_KEY = "slime-idle-equipment";

interface EquipmentState {
  inventory: string[];
  equipped: Record<EquipSlot, string | null>;
}

const DEFAULT_STATE: EquipmentState = {
  inventory: [],
  equipped: { weapon: null, armor: null, accessory: null, rune: null },
};

function loadState(): EquipmentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_STATE };
}

function saveState(state: EquipmentState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const EFFECT_LABELS: Record<string, string> = {
  click_mult: "Click Power",
  passive_mult: "Passive Power",
  all_mult: "All Power",
  crit_chance: "Crit Chance",
  crit_mult: "Crit Multiplier",
  cost_reduction: "Cost Reduction",
};

function formatEffect(item: EquipItem): string {
  const pct = item.effect.type === "crit_chance" || item.effect.type === "cost_reduction";
  const val = pct ? `${Math.round(item.effect.value * 100)}%` : `+${(item.effect.value * 100).toFixed(0)}%`;
  return `${EFFECT_LABELS[item.effect.type] ?? item.effect.type}: ${val}`;
}

export function EquipmentPanel({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<EquipmentState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const getItem = useCallback((id: string) => EQUIPMENT.find((e) => e.id === id), []);

  const equip = (itemId: string) => {
    const item = getItem(itemId);
    if (!item) return;
    setState((prev) => {
      const inv = prev.inventory.filter((i) => i !== itemId);
      const currentlyEquipped = prev.equipped[item.slot];
      if (currentlyEquipped) inv.push(currentlyEquipped);
      return {
        inventory: inv,
        equipped: { ...prev.equipped, [item.slot]: itemId },
      };
    });
  };

  const unequip = (slot: EquipSlot) => {
    setState((prev) => {
      const itemId = prev.equipped[slot];
      if (!itemId) return prev;
      return {
        inventory: [...prev.inventory, itemId],
        equipped: { ...prev.equipped, [slot]: null },
      };
    });
  };

  // Compute total bonuses from equipped items
  const equippedItems = Object.values(state.equipped)
    .filter((id): id is string => id !== null)
    .map((id) => getItem(id))
    .filter((item): item is EquipItem => item !== undefined);

  const bonusSummary: Record<string, number> = {};
  for (const item of equippedItems) {
    bonusSummary[item.effect.type] = (bonusSummary[item.effect.type] ?? 0) + item.effect.value;
  }

  const unequippedItems = state.inventory
    .map((id) => getItem(id))
    .filter((item): item is EquipItem => item !== undefined);

  if (!onClose && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1"
      >
        {"\u2694\uFE0F"} Gear
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass border border-steel/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-steel font-bold mb-1">{"\u2694\uFE0F"} Equipment</h2>
        <p className="text-xs text-gray-400 mb-3">
          Equip gear to boost your power. Tap to equip or unequip.
        </p>

        {/* Equipped slots */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {EQUIP_SLOTS.map(({ slot, label, emoji }) => {
            const itemId = state.equipped[slot];
            const item = itemId ? getItem(itemId) : null;
            return (
              <button
                key={slot}
                onClick={() => itemId && unequip(slot)}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  item
                    ? `${RARITY_BORDERS[item.rarity]} bg-navy-900/50 hover:bg-navy-800/50`
                    : "border-gray-700/30 bg-navy-900/30"
                }`}
              >
                <div className="text-lg">{item ? item.emoji : emoji}</div>
                <div
                  className={`text-[10px] truncate ${
                    item ? RARITY_COLORS[item.rarity] : "text-gray-600"
                  }`}
                >
                  {item ? item.name : label}
                </div>
                {item && (
                  <div className="text-[9px] text-gray-500 truncate">
                    {formatEffect(item)}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bonus summary */}
        {Object.keys(bonusSummary).length > 0 && (
          <div className="mb-3 p-2 rounded-lg border border-accent/20 bg-accent/5">
            <div className="text-[10px] text-gray-400 mb-1 font-semibold">Total Bonuses</div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {Object.entries(bonusSummary).map(([type, value]) => {
                const pct = type === "crit_chance" || type === "cost_reduction";
                const display = pct
                  ? `${Math.round(value * 100)}%`
                  : `+${(value * 100).toFixed(0)}%`;
                return (
                  <span key={type} className="text-[10px] text-accent">
                    {EFFECT_LABELS[type] ?? type}: {display}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Inventory */}
        <div className="text-xs text-gray-400 mb-1 font-semibold">
          Inventory ({unequippedItems.length})
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {unequippedItems.length === 0 && (
            <p className="text-xs text-gray-600 text-center py-4">
              No unequipped items. Defeat bosses and complete dungeons to find gear!
            </p>
          )}
          {unequippedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => equip(item.id)}
              className={`w-full p-2 rounded-lg border text-left transition-colors hover:bg-navy-800/50 ${RARITY_BORDERS[item.rarity]} bg-navy-900/30`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${RARITY_COLORS[item.rarity]}`}>
                    {item.name}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatEffect(item)} &middot;{" "}
                    <span className="capitalize">{item.slot}</span>
                  </div>
                </div>
                <span className={`text-[9px] capitalize ${RARITY_COLORS[item.rarity]}`}>
                  {item.rarity}
                </span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => onClose ? onClose() : setOpen(false)}
          className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm border border-steel/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
