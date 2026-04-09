import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getUnitDef } from '../data/units';
import { getActiveSynergies } from '../engine/battle';
import { SYNERGIES } from '../data/synergies';
import { ENEMY_ROUNDS } from '../data/enemies';
import { playBuy, playClick, playPlace, playReroll } from '../utils/sounds';

export default function PrepScreen() {
  const {
    round, playerHp, gold, shop, placed, bench,
    rollShop, buyUnit, placeUnit, removeUnit, sellUnit, startBattle,
  } = useGameStore();

  const [dragUid, setDragUid] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const activeSynergies = getActiveSynergies(placed);
  const enemyRound = ENEMY_ROUNDS.find(r => r.round === round);

  function handleDragStart(uid: string) {
    setDragUid(uid);
  }

  function handleGridDrop(x: number, y: number) {
    if (dragUid) {
      placeUnit(dragUid, x, y);
      playPlace();
      setDragUid(null);
    }
  }

  function handleUnitClick(uid: string) {
    if (selectedUid === uid) {
      setSelectedUid(null);
    } else if (selectedUid) {
      // If a unit was selected and we click a grid cell, place it
      setSelectedUid(null);
    } else {
      setSelectedUid(uid);
    }
  }

  function handleGridClick(x: number, y: number) {
    if (selectedUid) {
      placeUnit(selectedUid, x, y);
      playPlace();
      setSelectedUid(null);
    }
  }

  const starColors: Record<number, string> = {
    1: 'text-gray-400',
    2: 'text-blue-400',
    3: 'text-purple-400',
    4: 'text-yellow-400',
  };

  return (
    <div className="h-full flex flex-col text-white p-3 overflow-y-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-accent">Round {round}/10</span>
          <span className="text-red-400">❤️ {playerHp}</span>
          <span className="text-yellow-400">💰 {gold}</span>
        </div>
        <div className="text-sm text-gray-400">
          Enemy: <span className="text-steel">{enemyRound?.name}</span>
          {' '}({enemyRound?.units.length} units)
        </div>
      </div>

      {/* Synergies */}
      <div className="flex gap-2 mb-2 flex-shrink-0 flex-wrap">
        {activeSynergies.map(syn => {
          const def = SYNERGIES.find(s => s.id === syn.id)!;
          return (
            <div
              key={syn.id}
              className={`px-2 py-0.5 rounded text-xs border ${
                syn.active
                  ? 'border-accent bg-accent/20 text-accent'
                  : 'border-gray-600 bg-navy-800 text-gray-500'
              }`}
              title={def.bonus}
            >
              {def.emoji} {def.name} {syn.count}/{def.threshold}
            </div>
          );
        })}
      </div>

      {/* Tutorial hint for round 1 */}
      {round === 1 && placed.length === 0 && (
        <div className="mb-2 p-2.5 rounded-xl bg-accent/10 border border-accent/30 text-sm text-accent flex-shrink-0">
          {"\u{1F4A1}"} <strong>Tip:</strong> Buy units from the shop ({"\u27A1"} right), then click a grid cell to place them. When ready, click <strong>"Fight!"</strong>
        </div>
      )}
      {round === 1 && placed.length > 0 && bench.length === 0 && (
        <div className="mb-2 p-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-400 flex-shrink-0">
          {"\u{2705}"} Units placed! Click <strong>"Fight!"</strong> at the bottom right to start combat.
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Grid */}
        <div className="flex-1 flex flex-col">
          <div className="text-xs text-gray-500 mb-1">Your grid (drag or click to place)</div>
          {[0, 1].map(row => (
            <div key={row} className="mb-1.5">
              <div className="text-[10px] font-bold mb-0.5" style={{ color: row === 0 ? '#facc15' : '#60a5fa' }}>
                {row === 0 ? 'Front' : 'Back (-20% damage)'}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 4 }).map((_, col) => {
                  const x = col;
                  const y = row;
                  const unit = placed.find(u => u.gridX === x && u.gridY === y);
                  const def = unit ? getUnitDef(unit.defId) : null;

                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer
                        transition-all duration-150 relative
                        ${unit ? 'border-accent/50 bg-navy-700' : 'border-gray-700 bg-navy-800/50 hover:border-steel/50'}
                        ${selectedUid && !unit ? 'ring-2 ring-steel/50' : ''}
                      `}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleGridDrop(x, y)}
                      onClick={() => unit ? handleUnitClick(unit.uid) : handleGridClick(x, y)}
                    >
                      {unit && def && (
                        <div
                          draggable
                          onDragStart={() => handleDragStart(unit.uid)}
                          className="flex flex-col items-center select-none"
                        >
                          <span className="text-2xl">{def.emoji}</span>
                          <span className="text-[10px] font-bold truncate max-w-full">{def.name}</span>
                          <span className={`text-[9px] ${starColors[def.stars]}`}>
                            {'⭐'.repeat(def.stars)}
                          </span>
                        </div>
                      )}
                      {unit && selectedUid === unit.uid && (
                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); removeUnit(unit.uid); playClick(); setSelectedUid(null); }}
                            className="w-5 h-5 bg-gray-700 rounded-full text-[10px] hover:bg-gray-600"
                            title="Remove"
                          >↩</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); sellUnit(unit.uid); playClick(); setSelectedUid(null); }}
                            className="w-5 h-5 bg-red-700 rounded-full text-[10px] hover:bg-red-600"
                            title="Sell"
                          >💰</button>
                        </div>
                      )}
                      {!unit && (
                        <span className="text-gray-700 text-xs">{x},{y}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mb-1"></div>

          {/* Bench */}
          <div className="text-xs text-gray-500 mb-1">Bench ({bench.length}/4)</div>
          <div className="flex gap-1.5">
            {bench.map(unit => {
              const def = getUnitDef(unit.defId);
              return (
                <div
                  key={unit.uid}
                  draggable
                  onDragStart={() => handleDragStart(unit.uid)}
                  onClick={() => handleUnitClick(unit.uid)}
                  className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center cursor-grab
                    transition-all select-none relative
                    ${selectedUid === unit.uid ? 'border-steel bg-navy-700' : 'border-gray-600 bg-navy-800 hover:border-accent/50'}
                  `}
                >
                  <span className="text-xl">{def.emoji}</span>
                  <span className="text-[9px] truncate">{def.name}</span>
                  {selectedUid === unit.uid && (
                    <button
                      onClick={(e) => { e.stopPropagation(); sellUnit(unit.uid); playClick(); setSelectedUid(null); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-700 rounded-full text-[10px] hover:bg-red-600"
                      title="Sell"
                    >💰</button>
                  )}
                </div>
              );
            })}
            {bench.length === 0 && (
              <div className="text-xs text-gray-600 py-4">Buy units from the shop</div>
            )}
          </div>
        </div>

        {/* Shop panel */}
        <div className="w-56 flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-steel">Shop</span>
            <button
              onClick={() => { rollShop(); playReroll(); }}
              disabled={gold < 1}
              className="px-2 py-0.5 text-xs bg-navy-700 border border-steel/40 rounded hover:bg-navy-800
                         disabled:opacity-30 disabled:cursor-not-allowed text-steel"
            >
              🔄 Reroll (1💰)
            </button>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            {shop.map(item => {
              const def = getUnitDef(item.defId);
              const canBuy = gold >= def.cost && !item.bought && (placed.length + bench.length < 8);

              return (
                <button
                  key={item.shopSlot}
                  onClick={() => { if (canBuy) { buyUnit(item.shopSlot); playBuy(); } }}
                  disabled={!canBuy}
                  className={`p-2 rounded-lg border text-left transition-all
                    ${item.bought
                      ? 'border-gray-800 bg-navy-900/50 opacity-30'
                      : canBuy
                        ? 'border-gray-600 bg-navy-800 hover:border-accent cursor-pointer'
                        : 'border-gray-700 bg-navy-800 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.bought ? '✅' : def.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{def.name}</span>
                        <span className="text-yellow-400 text-xs">{def.cost}💰</span>
                      </div>
                      <div className={`text-[9px] ${starColors[def.stars]}`}>
                        {'⭐'.repeat(def.stars)}
                      </div>
                      <div className="text-[9px] text-gray-400 flex gap-2 mt-0.5">
                        <span>❤️{def.hp}</span>
                        <span>⚔️{def.atk}</span>
                        <span>🛡️{def.def}</span>
                        <span>💨{def.speed}</span>
                      </div>
                    </div>
                  </div>
                  {!item.bought && (
                    <div className="text-[8px] text-gray-500 mt-1 truncate">{def.special}</div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { startBattle(); playClick(); }}
            disabled={placed.length === 0}
            className="mt-2 w-full py-3 bg-red-600/80 border-2 border-red-500 rounded-xl text-lg font-bold
                       hover:bg-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ⚔️ Fight!
          </button>
        </div>
      </div>
    </div>
  );
}
