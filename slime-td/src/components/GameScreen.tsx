import { useEffect, useRef, useState, useCallback } from "react";
import type { GameState } from "../types";
import { LEVELS } from "../data/levels";
import { TOWER_DEFS, getAvailableTowers, getUpgradeCost } from "../data/towers";
import { GameEngine } from "../engine/GameEngine";
import { useProgressStore } from "../store/gameStore";
import { isSoundEnabled, setSoundEnabled } from "../utils/sounds";

interface Props {
  levelId: number;
  onBack: () => void;
}

export default function GameScreen({ levelId, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const completeLevel = useProgressStore((s) => s.completeLevel);

  const level = LEVELS.find((l) => l.id === levelId)!;
  const towers = getAvailableTowers(levelId);

  const [state, setState] = useState<GameState>({
    gold: level.startGold,
    lives: level.lives,
    maxLives: level.lives,
    currentWave: 0,
    totalWaves: level.waves.length,
    waveActive: false,
    gameStatus: "playing",
    selectedTowerDef: null,
    selectedTower: null,
    canUpgrade: false,
    upgradeCost: 0,
    sellValue: 0,
    towersPlaced: 0,
  });

  const [speed, setSpeedUI] = useState(1);
  const [sound, setSound] = useState(isSoundEnabled());

  const handleStateUpdate = useCallback((s: GameState) => {
    setState(s);
    if (s.gameStatus === "won") {
      completeLevel(levelId);
    }
  }, [levelId, completeLevel]);

  /* ── init engine ──────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const towerIds = towers.map((t) => t.id);
    const engine = new GameEngine(canvas, level, towerIds, handleStateUpdate);
    engineRef.current = engine;
    engine.start();

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      engine.stop();
      window.removeEventListener("resize", onResize);
      engineRef.current = null;
    };
  }, [levelId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── handlers ─────────────────────────── */
  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    const engine = engineRef.current;
    if (!engine) return;

    let clientX: number, clientY: number;
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    engine.handleClick(clientX, clientY);
  };

  const selectTower = (id: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    const def = TOWER_DEFS[id];
    engine.selectTowerDef(state.selectedTowerDef?.id === id ? null : def);
  };

  const startWave = () => engineRef.current?.startWave();

  const toggleSpeed = () => {
    const next = speed === 1 ? 2 : speed === 2 ? 3 : 1;
    setSpeedUI(next);
    engineRef.current?.setSpeed(next);
  };

  const upgrade = () => engineRef.current?.upgradeTower();
  const sell = () => engineRef.current?.sellTower();

  /* ── render ───────────────────────────── */
  return (
    <div className="h-full bg-navy-900 flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 bg-navy-800 border-b border-white/5 text-sm shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white px-2">
          ← Retour
        </button>
        <div className="flex items-center gap-4">
          <span className="text-yellow-400 font-bold">{state.gold} G</span>
          <span className="text-red-400">
            {"♥".repeat(Math.min(state.lives, 10))}{" "}
            {state.lives > 10 && `×${state.lives}`}
          </span>
        </div>
        <div className="text-gray-400 text-xs">
          Vague {Math.min(state.currentWave + 1, state.totalWaves)}/{state.totalWaves}
        </div>
      </div>

      {/* ── Canvas ──────────────────────── */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-navy-900/50">
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasClick}
          onTouchStart={handleCanvasClick}
          className="cursor-pointer"
        />
      </div>

      {/* ── Selected tower info ─────────── */}
      {state.selectedTower && (
        <div className="px-3 py-2 bg-navy-800 border-t border-white/5 flex items-center justify-between shrink-0">
          <div className="text-sm">
            <span
              className="font-bold"
              style={{ color: TOWER_DEFS[state.selectedTower.defId]?.color }}
            >
              {TOWER_DEFS[state.selectedTower.defId]?.name}
            </span>
            <span className="text-gray-400 ml-2">Nv.{state.selectedTower.level}</span>
          </div>
          <div className="flex gap-2">
            {state.selectedTower.level < 3 && (
              <button
                onClick={upgrade}
                disabled={!state.canUpgrade}
                className={`text-xs px-3 py-1 rounded-lg font-medium
                  ${state.canUpgrade ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : "bg-gray-700/30 text-gray-500 border border-gray-600/20"}`}
              >
                Upgrade ({state.upgradeCost}G)
              </button>
            )}
            <button
              onClick={sell}
              className="text-xs px-3 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40"
            >
              Vendre ({state.sellValue}G)
            </button>
          </div>
        </div>
      )}

      {/* ── Tower selection + controls ──── */}
      <div className="bg-navy-800 border-t border-white/10 px-2 py-2 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          {/* Start wave */}
          {!state.waveActive && state.gameStatus === "playing" && state.currentWave < state.totalWaves && (
            <button
              onClick={startWave}
              className="pulse-btn px-4 py-1.5 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 text-sm font-bold"
            >
              Vague {state.currentWave + 1} ▶
            </button>
          )}
          {state.waveActive && (
            <span className="text-xs text-gray-400 px-2">En cours...</span>
          )}

          <div className="flex-1" />

          {/* Sound toggle */}
          <button
            onClick={() => {
              const next = !sound;
              setSound(next);
              setSoundEnabled(next);
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-navy-700 text-steel border border-steel/20"
          >
            {sound ? "Son" : "Muet"}
          </button>

          {/* Speed */}
          <button
            onClick={toggleSpeed}
            className="text-xs px-3 py-1.5 rounded-lg bg-navy-700 text-steel border border-steel/20"
          >
            ×{speed}
          </button>
        </div>

        {/* Tower buttons */}
        <div className="tower-scroll flex gap-2 overflow-x-auto pb-1">
          {towers.map((t) => {
            const selected = state.selectedTowerDef?.id === t.id;
            const affordable = state.gold >= t.cost;
            return (
              <button
                key={t.id}
                onClick={() => selectTower(t.id)}
                className={`shrink-0 flex flex-col items-center w-16 py-1.5 rounded-lg border text-xs transition
                  ${
                    selected
                      ? "border-white/60 bg-white/10"
                      : affordable
                        ? "border-white/10 bg-navy-700/60"
                        : "border-white/5 bg-navy-900/40 opacity-40"
                  }`}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs mb-0.5"
                  style={{ backgroundColor: t.color }}
                >
                  {t.symbol}
                </div>
                <span className="text-gray-300 truncate w-full text-center leading-tight">
                  {t.name.split(" ")[0]}
                </span>
                <span className="text-yellow-400">{t.cost}G</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Result overlay ──────────────── */}
      {state.gameStatus !== "playing" && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="result-overlay bg-navy-800 border border-white/10 rounded-2xl p-6 text-center max-w-xs mx-4">
            {state.gameStatus === "won" ? (
              <>
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-xl font-bold text-green-400">Victoire !</h2>
                <p className="text-gray-400 text-sm mt-2">{level.name} terminé</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">💀</div>
                <h2 className="text-xl font-bold text-red-400">Défaite</h2>
                <p className="text-gray-400 text-sm mt-2">Tempest est tombé...</p>
              </>
            )}
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-lg bg-navy-700 text-gray-300 border border-white/10 text-sm"
              >
                Niveaux
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-steel/20 text-steel border border-steel/30 text-sm font-medium"
              >
                Rejouer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
