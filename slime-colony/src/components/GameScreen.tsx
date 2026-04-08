import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { BUILDING_DEFS, getBuildingDef } from '../data/buildings';
import { BuildingInstance, ResourceKey } from '../types';
import { playAssignSound, playClickSound } from '../utils/sounds';

/* ─── Resource Bar ─── */
function ResourceBar() {
  const resources = useGameStore((s) => s.resources);
  const citizens = useGameStore((s) => s.citizens);
  const popCap = useGameStore((s) => s.totalPopulationCap);
  const defense = useGameStore((s) => s.totalDefense);
  const totalStorageCap = useGameStore((s) => s.totalStorageCap);
  const happiness = useGameStore((s) => s.happiness);
  const getProductionRates = useGameStore((s) => s.getProductionRates);

  const rates = getProductionRates();

  const items: { key: ResourceKey; emoji: string; label: string }[] = [
    { key: 'food', emoji: '🌾', label: 'Nourriture' },
    { key: 'wood', emoji: '🪵', label: 'Bois' },
    { key: 'stone', emoji: '🪨', label: 'Pierre' },
    { key: 'magicules', emoji: '✨', label: 'Magicules' },
    { key: 'gold', emoji: '💰', label: 'Or' },
  ];

  const happinessEmoji = happiness > 70 ? '😊' : happiness >= 30 ? '😐' : '😡';
  const happinessColor = happiness > 70 ? 'text-green-400' : happiness >= 30 ? 'text-yellow-400' : 'text-red-400';

  function formatRate(rate: number): string {
    const rounded = Math.round(rate * 10) / 10;
    if (rounded >= 0) return `+${rounded}`;
    return `${rounded}`;
  }

  return (
    <div className="bg-navy-800 border-b border-steel/20 px-4 py-2 flex flex-wrap items-center gap-4 pl-20">
      {items.map((r) => {
        const rate = rates[r.key] || 0;
        const rateColor = rate >= 0 ? 'text-green-400' : 'text-red-400';
        return (
          <div key={r.key} className="flex items-center gap-1 text-sm" title={r.label}>
            <span>{r.emoji}</span>
            <span className="text-steel font-mono">{Math.floor(resources[r.key])}</span>
            <span className={`${rateColor} font-mono text-[10px]`}>({formatRate(rate)}/s)</span>
          </div>
        );
      })}
      <div className="ml-auto flex items-center gap-4 text-sm">
        <span title={`Bonheur: ${happiness}%`} className={happinessColor}>
          {happinessEmoji} <span className="font-mono text-xs">{happiness}%</span>
        </span>
        <span title="Stockage">
          📦 <span className="text-steel font-mono">{totalStorageCap}</span>
        </span>
        <span title="Population">
          👥 <span className="text-steel font-mono">{citizens.length}/{popCap}</span>
        </span>
        <span title="Defense">
          🛡️ <span className="text-steel font-mono">{defense}</span>
        </span>
      </div>
    </div>
  );
}

/* ─── Build Menu ─── */
function BuildMenu() {
  const resources = useGameStore((s) => s.resources);
  const buildBuilding = useGameStore((s) => s.buildBuilding);

  function canAfford(cost: Partial<Record<ResourceKey, number>>): boolean {
    for (const [key, value] of Object.entries(cost)) {
      if ((resources[key as ResourceKey] || 0) < (value || 0)) return false;
    }
    return true;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-accent font-bold text-sm uppercase tracking-wider mb-2">Construire</h2>
      <div className="space-y-1">
        {BUILDING_DEFS.map((def) => {
          const affordable = canAfford(def.cost);
          return (
            <button
              key={def.id}
              onClick={() => {
                if (affordable) buildBuilding(def.id);
              }}
              disabled={!affordable}
              className={`w-full text-left p-2 rounded-lg border text-sm transition-all duration-200
                ${affordable
                  ? 'border-steel/30 bg-navy-700/50 hover:bg-navy-700 hover:border-steel/60 cursor-pointer'
                  : 'border-navy-700/30 bg-navy-900/50 opacity-40 cursor-not-allowed'
                }`}
              title={def.description}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{def.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-steel font-medium text-xs">{def.name}</div>
                  <div className="text-steel/40 text-[10px] truncate">
                    {Object.entries(def.cost)
                      .map(([k, v]) => {
                        const icons: Record<string, string> = {
                          food: '🌾',
                          wood: '🪵',
                          stone: '🪨',
                          magicules: '✨',
                          gold: '💰',
                        };
                        return `${icons[k] || k}${v}`;
                      })
                      .join(' ')}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Built Buildings ─── */
function BuiltBuildings({ onSelectBuilding }: { onSelectBuilding: (b: BuildingInstance) => void }) {
  const buildings = useGameStore((s) => s.buildings);
  const happiness = useGameStore((s) => s.happiness);

  if (buildings.length === 0) {
    return (
      <div className="text-steel/30 text-sm italic text-center py-8">
        Aucun batiment construit
      </div>
    );
  }

  // Group buildings by type
  const grouped: Record<string, BuildingInstance[]> = {};
  for (const b of buildings) {
    if (!grouped[b.defId]) grouped[b.defId] = [];
    grouped[b.defId].push(b);
  }

  // Happiness multiplier for display
  const happinessMult = happiness < 30 ? 0.5 : happiness > 70 ? 1.2 : 1;

  return (
    <div className="space-y-2">
      <h2 className="text-accent font-bold text-sm uppercase tracking-wider mb-2">
        Batiments ({buildings.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.entries(grouped).map(([defId, instances]) => {
          const def = getBuildingDef(defId);
          if (!def) return null;
          return instances.map((b) => {
            const stars = '⭐'.repeat(b.level);
            const workerCount = b.assignedWorkers.length;

            // Build production info string
            let prodInfo = '';
            if (def.production && workerCount > 0) {
              const icons: Record<string, string> = {
                food: '🌾', wood: '🪵', stone: '🪨', magicules: '✨', gold: '💰',
              };
              prodInfo = Object.entries(def.production)
                .map(([res, amount]) => {
                  const total = Math.round((amount || 0) * workerCount * b.level * happinessMult * 10) / 10;
                  return `${icons[res] || res} +${total}/s`;
                })
                .join(' ');
            }
            if (def.converts && workerCount > 0) {
              const icons: Record<string, string> = {
                food: '🌾', wood: '🪵', stone: '🪨', magicules: '✨', gold: '💰',
              };
              const total = Math.round(def.converts.rate * workerCount * b.level * happinessMult * 10) / 10;
              prodInfo = `${icons[def.converts.from]} -${total} → ${icons[def.converts.to]} +${total}/s`;
            }

            return (
              <button
                key={b.id}
                onClick={() => {
                  playClickSound();
                  onSelectBuilding(b);
                }}
                className="p-2 rounded-lg border border-steel/20 bg-navy-700/30 hover:bg-navy-700/60
                           hover:border-steel/40 transition-all text-left"
              >
                <div className="text-xl text-center">{def.emoji}</div>
                <div className="text-steel text-[10px] text-center font-medium mt-1">{def.name}</div>
                {b.level > 1 && (
                  <div className="text-[10px] text-center">{stars}</div>
                )}
                <div className="text-accent/60 text-[10px] text-center">
                  👷 {workerCount}/{def.maxWorkers}
                </div>
                {prodInfo && (
                  <div className="text-green-400/70 text-[9px] text-center mt-0.5">{prodInfo}</div>
                )}
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}

/* ─── Worker Assignment Panel ─── */
function WorkerPanel({
  selectedBuilding,
  onClose,
}: {
  selectedBuilding: BuildingInstance | null;
  onClose: () => void;
}) {
  const citizens = useGameStore((s) => s.citizens);
  const assignWorker = useGameStore((s) => s.assignWorker);
  const unassignWorker = useGameStore((s) => s.unassignWorker);
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding);
  const buildings = useGameStore((s) => s.buildings);
  const resources = useGameStore((s) => s.resources);

  if (!selectedBuilding) return null;

  const def = getBuildingDef(selectedBuilding.defId);
  if (!def) return null;

  // Re-fetch the building from store to get latest state
  const currentBuilding = buildings.find((b) => b.id === selectedBuilding.id);
  if (!currentBuilding) return null;

  const assigned = citizens.filter((c) => currentBuilding.assignedWorkers.includes(c.id));
  const unassigned = citizens.filter((c) => !c.assignedTo);
  const isFull = currentBuilding.assignedWorkers.length >= def.maxWorkers;

  // Upgrade logic
  const hasForge = buildings.some((b) => b.defId === 'forge');
  const canUpgrade = currentBuilding.level < 3 && hasForge;
  const upgradeCost: Partial<Record<ResourceKey, number>> = {};
  if (canUpgrade) {
    for (const [key, value] of Object.entries(def.cost)) {
      upgradeCost[key as ResourceKey] = (value || 0) * (currentBuilding.level + 1);
    }
  }
  const canAffordUpgrade = canUpgrade && Object.entries(upgradeCost).every(
    ([key, value]) => (resources[key as ResourceKey] || 0) >= (value || 0)
  );

  const stars = '⭐'.repeat(currentBuilding.level);

  return (
    <div className="bg-navy-800/95 border border-steel/30 rounded-xl p-3 animate-slide-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{def.emoji}</span>
          <div>
            <div className="text-steel font-bold text-sm">
              {def.name} {stars}
            </div>
            <div className="text-steel/50 text-[10px]">{def.description}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-steel/40 hover:text-steel text-lg transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Upgrade button */}
      {hasForge && currentBuilding.level < 3 && (
        <div className="mb-3">
          <button
            onClick={() => {
              if (canAffordUpgrade) {
                playClickSound();
                upgradeBuilding(currentBuilding.id);
              }
            }}
            disabled={!canAffordUpgrade}
            className={`w-full p-2 rounded-lg border text-sm transition-all duration-200
              ${canAffordUpgrade
                ? 'border-accent/40 bg-accent/10 hover:bg-accent/20 hover:border-accent/60 cursor-pointer text-accent'
                : 'border-navy-700/30 bg-navy-900/50 opacity-40 cursor-not-allowed text-steel/40'
              }`}
          >
            <span className="font-medium">⬆️ Ameliorer</span>
            <span className="text-[10px] ml-2">
              (Niv. {currentBuilding.level} → {currentBuilding.level + 1})
              {' — '}
              {Object.entries(upgradeCost)
                .map(([k, v]) => {
                  const icons: Record<string, string> = {
                    food: '🌾', wood: '🪵', stone: '🪨', magicules: '✨', gold: '💰',
                  };
                  return `${icons[k] || k}${v}`;
                })
                .join(' ')}
            </span>
          </button>
        </div>
      )}

      {!hasForge && currentBuilding.level < 3 && (
        <div className="mb-3 text-steel/30 text-[10px] italic">
          Construisez une Forge pour ameliorer ce batiment.
        </div>
      )}

      {def.maxWorkers > 0 && (
        <>
          <div className="text-accent/60 text-[10px] uppercase tracking-wider mb-1">
            Assignes ({assigned.length}/{def.maxWorkers})
          </div>
          <div className="space-y-1 mb-3">
            {assigned.length === 0 ? (
              <div className="text-steel/30 text-xs italic">Aucun travailleur</div>
            ) : (
              assigned.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-navy-700/50 rounded px-2 py-1"
                >
                  <span className="text-steel text-xs">🧑 {c.name}</span>
                  <button
                    onClick={() => {
                      playClickSound();
                      unassignWorker(c.id);
                    }}
                    className="text-red-400/60 hover:text-red-400 text-[10px] transition-colors"
                  >
                    Retirer
                  </button>
                </div>
              ))
            )}
          </div>

          {!isFull && unassigned.length > 0 && (
            <>
              <div className="text-accent/60 text-[10px] uppercase tracking-wider mb-1">
                Disponibles
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scroll">
                {unassigned.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      playAssignSound();
                      assignWorker(c.id, currentBuilding.id);
                    }}
                    className="w-full flex items-center gap-2 bg-navy-900/50 hover:bg-navy-700/50
                               rounded px-2 py-1 text-left transition-colors"
                  >
                    <span className="text-steel/60 text-xs">🧑 {c.name}</span>
                    <span className="text-accent/40 text-[10px] ml-auto">+ Assigner</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {def.maxWorkers === 0 && (
        <div className="text-steel/40 text-xs italic">Ce batiment ne necessite pas de travailleurs.</div>
      )}
    </div>
  );
}

/* ─── Population List ─── */
function PopulationPanel() {
  const citizens = useGameStore((s) => s.citizens);
  const buildings = useGameStore((s) => s.buildings);

  return (
    <div className="space-y-2">
      <h2 className="text-accent font-bold text-sm uppercase tracking-wider mb-2">
        Population ({citizens.length})
      </h2>
      <div className="space-y-1 max-h-48 overflow-y-auto custom-scroll">
        {citizens.map((c) => {
          const building = c.assignedTo
            ? buildings.find((b) => b.id === c.assignedTo)
            : null;
          const def = building ? getBuildingDef(building.defId) : null;
          return (
            <div
              key={c.id}
              className="flex items-center justify-between bg-navy-700/30 rounded px-2 py-1"
            >
              <span className="text-steel text-xs">🧑 {c.name}</span>
              <span className="text-steel/40 text-[10px]">
                {def ? `${def.emoji} ${def.name}` : '💤 Libre'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Event Log ─── */
function EventLog() {
  const eventLog = useGameStore((s) => s.eventLog);

  return (
    <div className="space-y-2">
      <h2 className="text-accent font-bold text-sm uppercase tracking-wider mb-2">Evenements</h2>
      <div className="space-y-1 max-h-40 overflow-y-auto custom-scroll">
        {eventLog.length === 0 ? (
          <div className="text-steel/30 text-xs italic">En attente d&apos;evenements...</div>
        ) : (
          eventLog.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 text-xs animate-slide-in">
              <span>{entry.emoji}</span>
              <span className="text-steel/70">{entry.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Idle Citizens Banner ─── */
function IdleBanner() {
  const citizens = useGameStore((s) => s.citizens);
  const autoAssignWorkers = useGameStore((s) => s.autoAssignWorkers);
  const idleCount = citizens.filter((c) => !c.assignedTo).length;

  if (idleCount === 0) return null;

  return (
    <div className="bg-yellow-900/40 border border-yellow-500/40 rounded-lg px-3 py-2 mb-3 text-center animate-slide-in flex items-center justify-center gap-3">
      <span className="text-yellow-300 text-sm font-medium">
        ⚠️ {idleCount} citoyen{idleCount > 1 ? 's' : ''} inactif{idleCount > 1 ? 's' : ''} — Assignez-les !
      </span>
      <button
        onClick={() => {
          playClickSound();
          autoAssignWorkers();
        }}
        className="px-3 py-1 rounded-lg border border-yellow-500/50 bg-yellow-900/60 hover:bg-yellow-800/60
                   text-yellow-200 text-xs font-medium transition-colors"
      >
        Auto-assigner
      </button>
    </div>
  );
}

/* ─── Save Indicator ─── */
function SaveIndicator() {
  const saveIndicator = useGameStore((s) => s.saveIndicator);

  if (!saveIndicator) return null;

  return (
    <span className="text-accent/60 text-[10px] ml-2 animate-save-flash">
      💾 Sauvegarde
    </span>
  );
}

/* ─── Main Game Screen ─── */
export default function GameScreen() {
  const tick = useGameStore((s) => s.tick);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInstance | null>(null);
  const tickRef = useRef(tick);
  tickRef.current = tick;

  // Game loop: tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-navy-900 text-white">
      <ResourceBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: Build menu */}
        <div className="w-44 lg:w-52 border-r border-steel/10 p-3 overflow-y-auto custom-scroll flex-shrink-0">
          <BuildMenu />
        </div>

        {/* Center: Buildings grid + worker panel */}
        <div className="flex-1 p-4 overflow-y-auto custom-scroll">
          <IdleBanner />
          <BuiltBuildings onSelectBuilding={setSelectedBuilding} />

          {selectedBuilding && (
            <div className="mt-4">
              <WorkerPanel
                selectedBuilding={selectedBuilding}
                onClose={() => setSelectedBuilding(null)}
              />
            </div>
          )}
        </div>

        {/* Right sidebar: Population + Events */}
        <div className="w-48 lg:w-56 border-l border-steel/10 p-3 overflow-y-auto custom-scroll flex-shrink-0 space-y-6">
          <PopulationPanel />
          <EventLog />
        </div>
      </div>

      {/* Footer status */}
      <div className="bg-navy-800 border-t border-steel/10 px-4 py-1 text-center">
        <span className="text-steel/30 text-[10px]">
          Tempest - Slime Colony Simulator
        </span>
        <SaveIndicator />
      </div>
    </div>
  );
}
