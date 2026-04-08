import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { BUILDING_DEFS, getBuildingDef } from '../data/buildings';
import { BuildingInstance, ResourceKey } from '../types';
import { playAssignSound, playBuildSound, playClickSound } from '../utils/sounds';

const GRID_COLS = 10;
const GRID_ROWS = 8;

/* ─── Resource Bar (slim top HUD) ─── */
function ResourceBar() {
  const resources = useGameStore((s) => s.resources);
  const citizens = useGameStore((s) => s.citizens);
  const popCap = useGameStore((s) => s.totalPopulationCap);
  const defense = useGameStore((s) => s.totalDefense);
  const happiness = useGameStore((s) => s.happiness);
  const getProductionRates = useGameStore((s) => s.getProductionRates);
  const saveIndicator = useGameStore((s) => s.saveIndicator);

  const rates = getProductionRates();

  const items: { key: ResourceKey; emoji: string }[] = [
    { key: 'food', emoji: '🌾' },
    { key: 'wood', emoji: '🪵' },
    { key: 'stone', emoji: '🪨' },
    { key: 'magicules', emoji: '✨' },
    { key: 'gold', emoji: '💰' },
  ];

  const happinessEmoji = happiness > 70 ? '😊' : happiness >= 30 ? '😐' : '😡';

  function formatRate(rate: number): string {
    const rounded = Math.round(rate * 10) / 10;
    return rounded >= 0 ? `+${rounded}` : `${rounded}`;
  }

  return (
    <div className="hud-bar">
      <div className="hud-resources">
        {items.map((r) => {
          const rate = rates[r.key] || 0;
          return (
            <div key={r.key} className="hud-resource-item">
              <span className="hud-emoji">{r.emoji}</span>
              <span className="hud-value">{Math.floor(resources[r.key])}</span>
              <span className={`hud-rate ${rate >= 0 ? 'positive' : 'negative'}`}>
                {formatRate(rate)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="hud-stats">
        {saveIndicator && <span className="hud-save">💾</span>}
        <span className="hud-stat" title={`Bonheur: ${happiness}%`}>
          {happinessEmoji} {happiness}%
        </span>
        <span className="hud-stat">
          👥 {citizens.length}/{popCap}
        </span>
        <span className="hud-stat">
          🛡️ {defense}
        </span>
      </div>
    </div>
  );
}

/* ─── Toast Notifications for Events ─── */
function EventToasts() {
  const eventLog = useGameStore((s) => s.eventLog);
  const [visibleToasts, setVisibleToasts] = useState<Array<{id: number; text: string; emoji: string}>>([]);
  const lastSeenRef = useRef(0);

  useEffect(() => {
    if (eventLog.length > 0 && eventLog[0].id > lastSeenRef.current) {
      const newEntry = eventLog[0];
      lastSeenRef.current = newEntry.id;
      const toast = { id: newEntry.id, text: newEntry.text, emoji: newEntry.emoji };
      setVisibleToasts((prev) => [toast, ...prev].slice(0, 3));
      setTimeout(() => {
        setVisibleToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    }
  }, [eventLog]);

  if (visibleToasts.length === 0) return null;

  return (
    <div className="toast-container">
      {visibleToasts.map((t) => (
        <div key={t.id} className="toast-item">
          <span>{t.emoji}</span> {t.text}
        </div>
      ))}
    </div>
  );
}

/* ─── Building Info Popup/Modal ─── */
function BuildingInfoPopup({
  building,
  onClose,
}: {
  building: BuildingInstance;
  onClose: () => void;
}) {
  const citizens = useGameStore((s) => s.citizens);
  const assignWorker = useGameStore((s) => s.assignWorker);
  const unassignWorker = useGameStore((s) => s.unassignWorker);
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding);
  const buildings = useGameStore((s) => s.buildings);
  const resources = useGameStore((s) => s.resources);
  const happiness = useGameStore((s) => s.happiness);

  const def = getBuildingDef(building.defId);
  if (!def) return null;

  const currentBuilding = buildings.find((b) => b.id === building.id);
  if (!currentBuilding) return null;

  if (currentBuilding.constructing) {
    const remaining = Math.max(0, Math.ceil((currentBuilding.constructionEnd - Date.now()) / 1000));
    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-card" onClick={(e) => e.stopPropagation()}>
          <div className="popup-header">
            <span className="popup-emoji">{def.emoji}</span>
            <div>
              <div className="popup-title">{def.name}</div>
              <div className="popup-subtitle">En construction...</div>
            </div>
            <button onClick={onClose} className="popup-close">✕</button>
          </div>
          <div className="popup-construction">
            <div className="construction-text">⏳ {remaining}s restantes</div>
            <div className="construction-bar-bg">
              <div
                className="construction-bar-fill"
                style={{ width: `${Math.max(0, (1 - remaining / 5) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const assigned = citizens.filter((c) => currentBuilding.assignedWorkers.includes(c.id));
  const unassigned = citizens.filter((c) => !c.assignedTo);
  const isFull = currentBuilding.assignedWorkers.length >= def.maxWorkers;

  const hasForge = buildings.some((b) => b.defId === 'forge' && !b.constructing);
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
  const happinessMult = happiness < 30 ? 0.5 : happiness > 70 ? 1.2 : 1;

  const icons: Record<string, string> = {
    food: '🌾', wood: '🪵', stone: '🪨', magicules: '✨', gold: '💰',
  };

  let prodInfo = '';
  const workerCount = currentBuilding.assignedWorkers.length;
  if (def.production && workerCount > 0) {
    prodInfo = Object.entries(def.production)
      .map(([res, amount]) => {
        const total = Math.round((amount || 0) * workerCount * currentBuilding.level * happinessMult * 10) / 10;
        return `${icons[res] || res} +${total}/s`;
      })
      .join(' ');
  }
  if (def.converts && workerCount > 0) {
    const total = Math.round(def.converts.rate * workerCount * currentBuilding.level * happinessMult * 10) / 10;
    prodInfo = `${icons[def.converts.from]} -${total} → ${icons[def.converts.to]} +${total}/s`;
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <span className="popup-emoji">{def.emoji}</span>
          <div>
            <div className="popup-title">{def.name} {stars}</div>
            <div className="popup-subtitle">{def.description}</div>
          </div>
          <button onClick={onClose} className="popup-close">✕</button>
        </div>

        {prodInfo && (
          <div className="popup-production">
            <span className="prod-label">Production:</span> {prodInfo}
          </div>
        )}

        {def.populationCap && (
          <div className="popup-production">
            <span className="prod-label">Capacite:</span> +{def.populationCap * currentBuilding.level} pop
          </div>
        )}

        {def.defense && (
          <div className="popup-production">
            <span className="prod-label">Defense:</span> +{def.defense * currentBuilding.level}
          </div>
        )}

        {/* Upgrade */}
        {hasForge && currentBuilding.level < 3 && (
          <button
            onClick={() => {
              if (canAffordUpgrade) {
                playClickSound();
                upgradeBuilding(currentBuilding.id);
              }
            }}
            disabled={!canAffordUpgrade}
            className={`popup-upgrade-btn ${canAffordUpgrade ? 'affordable' : 'unaffordable'}`}
          >
            <span>⬆️ Ameliorer Niv.{currentBuilding.level} → {currentBuilding.level + 1}</span>
            <span className="upgrade-cost">
              {Object.entries(upgradeCost).map(([k, v]) => `${icons[k] || k}${v}`).join(' ')}
            </span>
          </button>
        )}

        {!hasForge && currentBuilding.level < 3 && (
          <div className="popup-hint">Construisez une Forge pour ameliorer.</div>
        )}

        {/* Workers */}
        {def.maxWorkers > 0 && (
          <div className="popup-workers">
            <div className="workers-title">
              👷 Travailleurs ({assigned.length}/{def.maxWorkers})
            </div>
            {assigned.map((c) => (
              <div key={c.id} className="worker-row">
                <span>🧑 {c.name}</span>
                <button
                  onClick={() => { playClickSound(); unassignWorker(c.id); }}
                  className="worker-remove"
                >
                  Retirer
                </button>
              </div>
            ))}
            {!isFull && unassigned.length > 0 && (
              <div className="worker-available">
                <div className="workers-subtitle">Disponibles</div>
                <div className="worker-list-scroll">
                  {unassigned.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { playAssignSound(); assignWorker(c.id, currentBuilding.id); }}
                      className="worker-assign-btn"
                    >
                      🧑 {c.name} <span className="assign-plus">+</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isFull && <div className="popup-hint">Batiment complet.</div>}
          </div>
        )}

        {def.maxWorkers === 0 && (
          <div className="popup-hint">Ce batiment ne necessite pas de travailleurs.</div>
        )}
      </div>
    </div>
  );
}

/* ─── Village Grid ─── */
function VillageGrid({
  selectedDef,
  onCellClick,
  onBuildingClick,
}: {
  selectedDef: string | null;
  onCellClick: (x: number, y: number) => void;
  onBuildingClick: (b: BuildingInstance) => void;
}) {
  const buildings = useGameStore((s) => s.buildings);
  const [now, setNow] = useState(Date.now());

  // Re-render for construction progress
  useEffect(() => {
    const hasConstructing = buildings.some((b) => b.constructing);
    if (!hasConstructing) return;
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [buildings]);

  const buildingMap = new Map<string, BuildingInstance>();
  for (const b of buildings) {
    buildingMap.set(`${b.gridX},${b.gridY}`, b);
  }

  const cells: React.ReactNode[] = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const key = `${x},${y}`;
      const building = buildingMap.get(key);
      const isOccupied = !!building;
      const isPlacing = selectedDef !== null;
      const canPlace = isPlacing && !isOccupied;

      cells.push(
        <div
          key={key}
          className={`grid-cell ${canPlace ? 'placeable' : ''} ${isPlacing && isOccupied ? 'occupied' : ''} ${!isPlacing && !isOccupied ? 'empty' : ''}`}
          onClick={() => {
            if (building && !isPlacing) {
              playClickSound();
              onBuildingClick(building);
            } else if (canPlace) {
              onCellClick(x, y);
            }
          }}
        >
          {building ? (
            <BuildingCell building={building} now={now} />
          ) : (
            <div className="grass-tile" />
          )}
        </div>
      );
    }
  }

  return (
    <div className="village-area">
      <div className="village-grid">
        {cells}
      </div>
    </div>
  );
}

/* ─── Single Building on Grid ─── */
function BuildingCell({ building, now }: { building: BuildingInstance; now: number }) {
  const def = getBuildingDef(building.defId);
  if (!def) return null;

  const isConstructing = building.constructing && now < building.constructionEnd;
  const progress = isConstructing
    ? Math.min(1, Math.max(0, 1 - (building.constructionEnd - now) / 5000))
    : 1;

  const workerCount = building.assignedWorkers.length;

  return (
    <div className={`building-cell ${isConstructing ? 'constructing' : 'active'}`}>
      <div className={`building-emoji ${isConstructing ? 'grayscale' : ''}`}>
        {def.emoji}
      </div>
      {building.level > 1 && !isConstructing && (
        <div className="building-stars">
          {'⭐'.repeat(building.level)}
        </div>
      )}
      {!isConstructing && def.maxWorkers > 0 && (
        <div className={`building-workers ${workerCount > 0 ? 'has-workers' : 'no-workers'}`}>
          {workerCount}
        </div>
      )}
      {isConstructing && (
        <div className="building-progress-bar">
          <div className="building-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}

/* ─── Bottom Build Bar ─── */
function BottomBuildBar({
  selectedDef,
  onSelect,
  onCancel,
}: {
  selectedDef: string | null;
  onSelect: (defId: string) => void;
  onCancel: () => void;
}) {
  const resources = useGameStore((s) => s.resources);
  const autoAssignWorkers = useGameStore((s) => s.autoAssignWorkers);
  const autoUpgradeEnabled = useGameStore((s) => s.autoUpgradeEnabled);
  const toggleAutoUpgrade = useGameStore((s) => s.toggleAutoUpgrade);
  const citizens = useGameStore((s) => s.citizens);

  const idleCount = citizens.filter((c) => !c.assignedTo).length;

  function canAfford(cost: Partial<Record<ResourceKey, number>>): boolean {
    for (const [key, value] of Object.entries(cost)) {
      if ((resources[key as ResourceKey] || 0) < (value || 0)) return false;
    }
    return true;
  }

  const icons: Record<string, string> = {
    food: '🌾', wood: '🪵', stone: '🪨', magicules: '✨', gold: '💰',
  };

  return (
    <div className="bottom-bar">
      {selectedDef && (
        <div className="placing-indicator">
          <span>Placez le batiment sur la grille</span>
          <button onClick={onCancel} className="cancel-btn">✕ Annuler</button>
        </div>
      )}
      <div className="build-scroll-area">
        <div className="build-scroll">
          {BUILDING_DEFS.map((def) => {
            const affordable = canAfford(def.cost);
            const isSelected = selectedDef === def.id;
            return (
              <button
                key={def.id}
                onClick={() => {
                  if (affordable) {
                    playClickSound();
                    onSelect(def.id);
                  }
                }}
                disabled={!affordable}
                className={`build-card ${affordable ? 'can-afford' : 'cant-afford'} ${isSelected ? 'selected' : ''}`}
              >
                <span className="build-card-emoji">{def.emoji}</span>
                <span className="build-card-name">{def.name}</span>
                <span className="build-card-cost">
                  {Object.entries(def.cost).map(([k, v]) => `${icons[k] || k}${v}`).join(' ')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="bottom-controls">
        {idleCount > 0 && (
          <button
            onClick={() => { playClickSound(); autoAssignWorkers(); }}
            className="auto-btn idle-btn"
          >
            ⚠️ {idleCount} inactif{idleCount > 1 ? 's' : ''} — Auto-assigner
          </button>
        )}
        <button
          onClick={() => { playClickSound(); toggleAutoUpgrade(); }}
          className={`auto-btn ${autoUpgradeEnabled ? 'auto-on' : 'auto-off'}`}
        >
          ⬆️ Auto-UP {autoUpgradeEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}

/* ─── Side Panels Toggle ─── */
function SidePanel({
  show,
  onClose,
}: {
  show: 'population' | 'events' | null;
  onClose: () => void;
}) {
  const citizens = useGameStore((s) => s.citizens);
  const buildings = useGameStore((s) => s.buildings);
  const eventLog = useGameStore((s) => s.eventLog);

  if (!show) return null;

  return (
    <div className="side-panel-overlay" onClick={onClose}>
      <div className="side-panel" onClick={(e) => e.stopPropagation()}>
        <div className="side-panel-header">
          <h2>{show === 'population' ? '👥 Population' : '📜 Evenements'}</h2>
          <button onClick={onClose} className="popup-close">✕</button>
        </div>
        {show === 'population' && (
          <div className="side-panel-content">
            {citizens.map((c) => {
              const building = c.assignedTo ? buildings.find((b) => b.id === c.assignedTo) : null;
              const def = building ? getBuildingDef(building.defId) : null;
              return (
                <div key={c.id} className="citizen-row">
                  <span>🧑 {c.name}</span>
                  <span className="citizen-status">
                    {def ? `${def.emoji} ${def.name}` : '💤 Libre'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {show === 'events' && (
          <div className="side-panel-content">
            {eventLog.length === 0 ? (
              <div className="empty-text">En attente...</div>
            ) : (
              eventLog.map((entry) => (
                <div key={entry.id} className="event-row">
                  <span>{entry.emoji}</span>
                  <span>{entry.text}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Help Panel ─── */
function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card help-card" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <span className="popup-emoji">❓</span>
          <div><div className="popup-title">Comment jouer</div></div>
          <button onClick={onClose} className="popup-close">✕</button>
        </div>
        <div className="help-content">
          <div className="help-item">
            <strong>🏗️ Construire:</strong> Selectionnez un batiment en bas, puis cliquez sur une case verte de la grille.
          </div>
          <div className="help-item">
            <strong>👷 Travailleurs:</strong> Cliquez sur un batiment place pour assigner des citoyens. Sans travailleurs, pas de production !
          </div>
          <div className="help-item">
            <strong>🌾 Nourriture:</strong> Chaque citoyen consomme 0.3/s. Construisez des Fermes en priorite !
          </div>
          <div className="help-item">
            <strong>👥 Population:</strong> De nouveaux citoyens arrivent si vous avez assez de nourriture et de Huttes.
          </div>
          <div className="help-item">
            <strong>⬆️ Ameliorations:</strong> Construisez une Forge pour debloquer les ameliorations (Niv.1 a 3).
          </div>
          <div className="help-item">
            <strong>😊 Bonheur:</strong> Tavernes (+10), nourriture (&gt;50: +10), inactifs (-5). Bonheur &gt;70% = +20% production !
          </div>
          <div className="help-item">
            <strong>⏳ Construction:</strong> Les batiments mettent 5 secondes a construire. Ils ne produisent rien pendant ce temps.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Game Screen ─── */
export default function GameScreen() {
  const tick = useGameStore((s) => s.tick);
  const buildBuilding = useGameStore((s) => s.buildBuilding);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInstance | null>(null);
  const [sidePanel, setSidePanel] = useState<'population' | 'events' | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (selectedDef) {
        buildBuilding(selectedDef, x, y);
        setSelectedDef(null);
      }
    },
    [selectedDef, buildBuilding]
  );

  const handleBuildingClick = useCallback((b: BuildingInstance) => {
    setSelectedBuilding(b);
  }, []);

  const handleSelectDef = useCallback((defId: string) => {
    // Auto-place: build immediately at next free cell
    buildBuilding(defId);
    setSelectedDef(null);
  }, [buildBuilding]);

  return (
    <div className="game-screen">
      <ResourceBar />

      <div className="game-middle">
        <div className="game-side-buttons">
          <button onClick={() => setSidePanel('population')} className="side-toggle-btn" title="Population">👥</button>
          <button onClick={() => setSidePanel('events')} className="side-toggle-btn" title="Evenements">📜</button>
          <button onClick={() => setShowHelp(true)} className="side-toggle-btn" title="Aide">❓</button>
        </div>

        <VillageGrid
          selectedDef={selectedDef}
          onCellClick={handleCellClick}
          onBuildingClick={handleBuildingClick}
        />
      </div>

      <BottomBuildBar
        selectedDef={selectedDef}
        onSelect={handleSelectDef}
        onCancel={() => setSelectedDef(null)}
      />

      <EventToasts />

      {selectedBuilding && (
        <BuildingInfoPopup
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
        />
      )}

      <SidePanel show={sidePanel} onClose={() => setSidePanel(null)} />

      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
    </div>
  );
}
