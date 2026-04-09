import { useEffect, useRef, useState, useCallback } from "react";
import type { GameState } from "../types";
import { LEVELS } from "../data/levels";
import { ENDLESS_LEVEL } from "../data/endless";
import { TOWER_DEFS, getAvailableTowers, getUpgradeCost, getTowerDamage, getTowerRange, getTowerAttackSpeed } from "../data/towers";
import { GameEngine } from "../engine/GameEngine";
import { useProgressStore } from "../store/gameStore";
import { isSoundEnabled, setSoundEnabled } from "../utils/sounds";

const TOWER_EMOJI: Record<string, string> = {
  goblin: "\u{1F3F9}", ranga: "\u{1F43A}", shion: "\u{2694}\u{FE0F}",
  benimaru: "\u{1F525}", souei: "\u{1F578}\u{FE0F}", shuna: "\u{1F338}",
  hakurou: "\u{1F3AF}", geld: "\u{1F6E1}\u{FE0F}", diablo: "\u{1F608}",
  rimuru: "\u{1F9CA}",
};

const SPECIAL_LABELS: Record<string, string> = {
  splash: "Splash AoE",
  slow: "Slow",
  buff: "Ally Buff",
  crit: "Critical Hit",
  aura: "Damage Aura",
  priority: "Targets Strongest",
  predator: "Predator",
};

interface Props {
  levelId: number;
  hardMode?: boolean;
  endless?: boolean;
  onBack: () => void;
  onRestart: () => void;
}

export default function GameScreen({ levelId, hardMode = false, endless = false, onBack, onRestart }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const completeLevel = useProgressStore((s) => s.completeLevel);
  const addEndlessScore = useProgressStore((s) => s.addEndlessScore);
  const completed = useProgressStore((s) => s.completed);
  const completedNoHit = useProgressStore((s) => s.completedNoHit);

  const level = endless ? ENDLESS_LEVEL : LEVELS.find((l) => l.id === levelId)!;
  const allCompleted = LEVELS.every((l) => completed.includes(l.id));
  const rimuruUnlocked = allCompleted;
  const towers = (hardMode || endless)
    ? getAvailableTowers(99, rimuruUnlocked)
    : getAvailableTowers(levelId, rimuruUnlocked);

  // Hard mode: same gold, fewer lives
  const startGold = level.startGold;
  const startLives = hardMode ? Math.max(3, Math.floor(level.lives * 0.6)) : level.lives;

  const [state, setState] = useState<GameState>({
    gold: startGold,
    lives: startLives,
    maxLives: startLives,
    currentWave: 0,
    totalWaves: endless ? Infinity : level.waves.length,
    waveActive: false,
    gameStatus: "playing",
    selectedTowerDef: null,
    selectedTower: null,
    canUpgrade: false,
    upgradeCost: 0,
    sellValue: 0,
    towersPlaced: 0,
    score: 0,
    killCount: 0,
  });

  const [speed, setSpeedUI] = useState(1);
  const [sound, setSound] = useState(isSoundEnabled());
  const [scoreSaved, setScoreSaved] = useState(false);

  const handleStateUpdate = useCallback((s: GameState) => {
    setState(s);
    if (s.gameStatus === "won" && !endless) {
      completeLevel(levelId, hardMode);
    }
  }, [levelId, hardMode, endless, completeLevel]);

  // Save endless score on loss or retreat
  useEffect(() => {
    if (endless && !scoreSaved && (state.gameStatus === "lost" || state.gameStatus === "retreat")) {
      addEndlessScore(state.currentWave, state.killCount);
      setScoreSaved(true);
    }
  }, [endless, state.gameStatus, state.currentWave, state.killCount, scoreSaved, addEndlessScore]);

  // Track no-hit completion
  useEffect(() => {
    if (!endless && state.gameStatus === "won" && state.lives === state.maxLives) {
      completeLevel(levelId, hardMode, true);
    }
  }, [state.gameStatus, state.lives, state.maxLives, endless, levelId, hardMode, completeLevel]);

  /* ── init engine ──────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const towerIds = towers.map((t) => t.id);
    const engine = new GameEngine(canvas, level, towerIds, handleStateUpdate, hardMode, endless);
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
  const retreat = () => engineRef.current?.retreat();

  const toggleSpeed = () => {
    const next = speed === 1 ? 2 : speed === 2 ? 3 : 1;
    setSpeedUI(next);
    engineRef.current?.setSpeed(next);
  };

  const upgrade = () => engineRef.current?.upgradeTower();
  const sell = () => engineRef.current?.sellTower();

  const isEndlessOver = endless && (state.gameStatus === "lost" || state.gameStatus === "retreat");
  const isNormalOver = !endless && state.gameStatus !== "playing";
  const noHit = state.lives === state.maxLives;

  /* ── render ───────────────────────────── */
  return (
    <div className="h-full bg-navy-900 flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 bg-navy-800 border-b border-white/5 text-sm shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white px-2">
          {"\u2190"} Back
        </button>
        <div className="flex items-center gap-4">
          {hardMode && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
              HARD
            </span>
          )}
          {endless && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold">
              ENDLESS
            </span>
          )}
          <span className="text-yellow-400 font-bold">{state.gold} G</span>
          <span className="text-red-400">
            {"\u2665".repeat(Math.min(state.lives, 10))}{" "}
            {state.lives > 10 && `\u00D7${state.lives}`}
          </span>
          {endless && (
            <span className="text-purple-300 text-xs font-bold">
              Kills: {state.killCount}
            </span>
          )}
        </div>
        <div className="text-gray-400 text-xs">
          {endless
            ? `Wave ${state.currentWave + (state.waveActive ? 1 : 0)}`
            : `Wave ${Math.min(state.currentWave + 1, state.totalWaves)}/${state.totalWaves}`
          }
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

      {/* ── Info panel (selected tower def OR placed tower) ── */}
      {(state.selectedTowerDef || state.selectedTower) && (() => {
        const placedTower = state.selectedTower;
        const def = placedTower
          ? TOWER_DEFS[placedTower.defId]
          : state.selectedTowerDef!;
        const lvl = placedTower ? placedTower.level : 1;
        const dmg = getTowerDamage(def, lvl);
        const range = getTowerRange(def, lvl).toFixed(1);
        const spd = def.attackSpeed > 0 ? getTowerAttackSpeed(def, lvl).toFixed(1) : "\u2014";
        const emoji = TOWER_EMOJI[def.id] ?? "";

        return (
          <div className="px-3 py-2 bg-navy-800 border-t border-white/10 shrink-0">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: def.color + "30", borderColor: def.color, borderWidth: 1 }}
              >
                {emoji}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: def.color }}>
                    {def.name}
                  </span>
                  {placedTower && (
                    <span className="text-xs text-gray-400">Lv.{lvl}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-snug mt-0.5">{def.description}</p>
                {/* Stats row */}
                <div className="flex gap-3 mt-1.5 text-xs">
                  {def.special !== "buff" && (
                    <span className="text-red-300" title="Damage">
                      {def.special === "aura" ? `${dmg}/s` : dmg} DMG
                    </span>
                  )}
                  <span className="text-blue-300" title="Range">{range} RNG</span>
                  {def.attackSpeed > 0 && (
                    <span className="text-green-300" title="Attack Speed">{spd}/s SPD</span>
                  )}
                </div>
                {/* Special ability */}
                {def.special && (
                  <div className="mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
                      {SPECIAL_LABELS[def.special] ?? def.special}
                      {def.special === "slow" && ` ${((def.specialValue ?? 0) * 100).toFixed(0)}%`}
                      {def.special === "buff" && ` +${((def.specialValue ?? 0) * 100).toFixed(0)}%`}
                      {def.special === "crit" && ` ${((def.specialValue ?? 0) * 100).toFixed(0)}% \u00D73`}
                      {def.special === "splash" && ` r=${def.specialValue}`}
                      {def.special === "predator" && ` Splash+Slow`}
                    </span>
                  </div>
                )}
              </div>
              {/* Actions for placed tower */}
              {placedTower && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  {placedTower.level < 3 && (
                    <button
                      onClick={upgrade}
                      disabled={!state.canUpgrade}
                      className={`text-xs px-3 py-1 rounded-lg font-medium
                        ${state.canUpgrade ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : "bg-gray-700/30 text-gray-500 border border-gray-600/20"}`}
                    >
                      Lv.{lvl + 1} ({state.upgradeCost}G)
                    </button>
                  )}
                  <button
                    onClick={sell}
                    className="text-xs px-3 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40"
                  >
                    Sell ({state.sellValue}G)
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Tower selection + controls ──── */}
      <div className="bg-navy-800 border-t border-white/10 px-2 py-2 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          {/* Start wave */}
          {!state.waveActive && state.gameStatus === "playing" && (endless || state.currentWave < state.totalWaves) && (
            <button
              onClick={startWave}
              className="pulse-btn px-4 py-1.5 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 text-sm font-bold"
            >
              Wave {state.currentWave + 1} {"\u25B6"}
            </button>
          )}
          {state.waveActive && (
            <span className="text-xs text-gray-400 px-2">In progress...</span>
          )}

          <div className="flex-1" />

          {/* Retreat (endless only) */}
          {endless && state.gameStatus === "playing" && !state.waveActive && state.currentWave > 0 && (
            <button
              onClick={retreat}
              className="text-sm px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-300 border border-yellow-500/30"
            >
              {"\u{1F3F3}\u{FE0F}"} Retreat
            </button>
          )}

          {/* Restart */}
          <button
            onClick={onRestart}
            className="text-sm px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30"
          >
            {"\u21BB"} Restart
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => {
              const next = !sound;
              setSound(next);
              setSoundEnabled(next);
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-navy-700 text-steel border border-steel/20"
          >
            {sound ? "Sound" : "Mute"}
          </button>

          {/* Speed */}
          <button
            onClick={toggleSpeed}
            className="text-xs px-3 py-1.5 rounded-lg bg-navy-700 text-steel border border-steel/20"
          >
            {"\u00D7"}{speed}
          </button>
        </div>

        {/* Tower buttons */}
        <div className="tower-scroll flex gap-2 overflow-x-auto pb-1">
          {towers.map((t) => {
            const selected = state.selectedTowerDef?.id === t.id;
            const affordable = state.gold >= t.cost;
            const emoji = TOWER_EMOJI[t.id] ?? "";
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
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base mb-0.5"
                  style={{ backgroundColor: t.color + "30" }}
                >
                  {emoji}
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
      {(isNormalOver || isEndlessOver) && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="result-overlay bg-navy-800 border border-white/10 rounded-2xl p-6 text-center max-w-xs mx-4">
            {endless ? (
              <>
                <div className="text-4xl mb-2">{state.gameStatus === "retreat" ? "\u{1F3F3}\u{FE0F}" : "\u{1F480}"}</div>
                <h2 className="text-xl font-bold text-purple-400">
                  {state.gameStatus === "retreat" ? "Retreat" : "Defeat"}
                </h2>
                <div className="mt-3 space-y-1">
                  <p className="text-lg font-bold text-white">Wave {state.currentWave}</p>
                  <p className="text-sm text-purple-300">{state.killCount} enemies defeated</p>
                </div>
              </>
            ) : state.gameStatus === "won" ? (
              <>
                <div className="text-4xl mb-2">
                  {"\u{1F389}"}{noHit && "\u{2B50}"}
                </div>
                <h2 className="text-xl font-bold text-green-400">Victory!</h2>
                <p className="text-gray-400 text-sm mt-2">{level.name} completed</p>
                {noHit && (
                  <p className="text-yellow-400 text-sm mt-1 font-bold">
                    {"\u{2B50}"} No Hit ! Parfait !
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">{"\u{1F480}"}</div>
                <h2 className="text-xl font-bold text-red-400">Defeat</h2>
                <p className="text-gray-400 text-sm mt-2">Tempest has fallen...</p>
              </>
            )}
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-lg bg-navy-700 text-gray-300 border border-white/10 text-sm"
              >
                Levels
              </button>
              <button
                onClick={onRestart}
                className="px-4 py-2 rounded-lg bg-steel/20 text-steel border border-steel/30 text-sm font-medium"
              >
                Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
