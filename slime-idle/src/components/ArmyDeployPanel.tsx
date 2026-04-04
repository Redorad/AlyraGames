import { useState, useEffect } from "react";
import { WORLD_MAP } from "../data/worldMap";
import { useGameStore } from "../store/gameStore";
import { formatTime } from "../utils/format";
import { formatNumber } from "../utils/format";

const STORAGE_KEY = "slime-idle-army";
const WORLDMAP_KEY = "slime-idle-worldmap";
const MAX_DEPLOYMENTS = 3;

interface Deployment {
  locationId: string;
  startTime: number;
  endTime: number;
}

interface ArmyState {
  deployments: Deployment[];
}

function loadState(): ArmyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { deployments: [] };
}

function saveState(state: ArmyState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getDiscoveredIds(): string[] {
  try {
    const raw = localStorage.getItem(WORLDMAP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.discovered)) return parsed.discovered;
    }
  } catch { /* ignore */ }
  return [];
}

export function ArmyDeployPanel({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ArmyState>(loadState);
  const [now, setNow] = useState(Date.now());

  const evolutionIndex = useGameStore((s) => s.evolutionIndex);
  const passivePower = useGameStore((s) => s.getPassivePower());

  // Tick for progress bars and time display
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const discoveredIds = getDiscoveredIds();

  const discoveredLocations = WORLD_MAP.filter(
    (loc) => discoveredIds.includes(loc.id) || loc.unlockEvolution <= evolutionIndex
  );

  const activeDeployments = state.deployments.filter((d) => now < d.endTime);
  const completedDeployments = state.deployments.filter((d) => now >= d.endTime);
  const deployedLocationIds = state.deployments.map((d) => d.locationId);

  const canDeploy = activeDeployments.length < MAX_DEPLOYMENTS;

  const deploy = (locationId: string) => {
    const loc = WORLD_MAP.find((l) => l.id === locationId);
    if (!loc || !canDeploy) return;
    if (deployedLocationIds.includes(locationId)) return;
    const startTime = Date.now();
    const endTime = startTime + loc.missionDuration * 1000;
    setState((prev) => ({
      deployments: [...prev.deployments, { locationId, startTime, endTime }],
    }));
  };

  const collect = (locationId: string) => {
    const loc = WORLD_MAP.find((l) => l.id === locationId);
    if (!loc) return;
    const reward = Math.floor(passivePower * loc.missionRewardMult);
    useGameStore.setState((st) => ({
      magicules: st.magicules + reward,
      lifetimeMagicules: st.lifetimeMagicules + reward,
    }));
    useGameStore
      .getState()
      .addEvent(
        `\uD83C\uDF96\uFE0F Army returned from ${loc.name}! +${reward.toLocaleString()} magicules!`
      );
    setState((prev) => ({
      deployments: prev.deployments.filter((d) => d.locationId !== locationId),
    }));
  };

  if (!onClose && !open) {
    const hasComplete = completedDeployments.length > 0;
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1"
      >
        {"\uD83C\uDF96\uFE0F"} Army
        {hasComplete && (
          <span className="ml-1 text-accent animate-pulse">!</span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass border border-steel/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-steel font-bold mb-1">{"\uD83C\uDF96\uFE0F"} Army Deployments</h2>
        <p className="text-xs text-gray-400 mb-3">
          Deploy subordinates on missions. Max {MAX_DEPLOYMENTS} concurrent.
          Active: {state.deployments.length}/{MAX_DEPLOYMENTS}
        </p>

        {/* Active and completed deployments */}
        {state.deployments.length > 0 && (
          <div className="mb-3 space-y-2">
            {state.deployments.map((dep) => {
              const loc = WORLD_MAP.find((l) => l.id === dep.locationId);
              if (!loc) return null;
              const timeLeft = Math.max(0, (dep.endTime - now) / 1000);
              const done = timeLeft <= 0;
              const totalDuration = (dep.endTime - dep.startTime) / 1000;
              const progress = done ? 1 : 1 - timeLeft / totalDuration;
              const reward = Math.floor(passivePower * loc.missionRewardMult);

              return (
                <div
                  key={dep.locationId}
                  className={`p-3 rounded-lg border ${
                    done
                      ? "border-accent/40 bg-accent/10"
                      : "border-steel/20 bg-navy-900/30"
                  }`}
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`font-semibold ${done ? "text-accent" : "text-white"}`}>
                      {loc.emoji} {loc.name}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {done ? "Complete!" : formatTime(timeLeft)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-navy-700 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        done ? "bg-accent" : "bg-steel"
                      }`}
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  {done ? (
                    <button
                      onClick={() => collect(dep.locationId)}
                      className="w-full py-1.5 bg-accent/20 text-accent rounded border border-accent/40 text-sm font-bold hover:bg-accent/30 transition-colors"
                    >
                      Collect +{formatNumber(reward)} magicules
                    </button>
                  ) : (
                    <div className="text-[10px] text-gray-500">
                      Reward: ~{formatNumber(reward)} magicules
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Available locations */}
        <div className="text-xs text-gray-400 mb-1 font-semibold">Available Locations</div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {discoveredLocations.length === 0 && (
            <p className="text-xs text-gray-600 text-center py-4">
              No locations discovered yet. Evolve and explore the world map!
            </p>
          )}
          {discoveredLocations.map((loc) => {
            const isDeployed = deployedLocationIds.includes(loc.id);
            const reward = Math.floor(passivePower * loc.missionRewardMult);
            const canSend = canDeploy && !isDeployed;

            return (
              <div
                key={loc.id}
                className={`p-2.5 rounded-lg border ${
                  isDeployed
                    ? "border-gray-700/20 bg-navy-900/20 opacity-40"
                    : "border-steel/20 bg-navy-900/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white text-sm">
                    {loc.emoji} {loc.name}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {formatTime(loc.missionDuration)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mb-1.5">{loc.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    Reward: ~{formatNumber(reward)} magicules
                  </span>
                  <button
                    onClick={() => deploy(loc.id)}
                    disabled={!canSend}
                    className={`text-xs px-3 py-1 rounded transition-colors ${
                      canSend
                        ? "bg-steel/20 text-steel border border-steel/40 hover:bg-steel/30"
                        : "bg-gray-700/20 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {isDeployed ? "Deployed" : !canDeploy ? "Full" : "Deploy"}
                  </button>
                </div>
              </div>
            );
          })}
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
