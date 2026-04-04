import { useEffect, useState } from "react";
import { MagiculeDisplay } from "./components/MagiculeDisplay";
import { SlimeButton } from "./components/SlimeButton";
import { EvolutionBar } from "./components/EvolutionBar";
import { ShopTabs } from "./components/ShopTabs";
import { EventLog } from "./components/EventLog";
import { ResetButton } from "./components/ResetButton";
import { Particles } from "./components/Particles";
import { StatsPanel } from "./components/StatsPanel";
import { AchievementsPanel } from "./components/AchievementsPanel";
import { PrestigeShop } from "./components/PrestigeShop";
import { ChallengesPanel } from "./components/ChallengesPanel";
import { ToastNotifications } from "./components/ToastNotifications";
import { SaveManager } from "./components/SaveManager";
import { useGameLoop } from "./hooks/useGameLoop";
import { useSaveLoad } from "./hooks/useSaveLoad";
import { useGameStore } from "./store/gameStore";
import { CHALLENGES } from "./data/challenges";
import { formatNumber } from "./utils/format";

function ActiveChallengeBanner() {
  const activeChallenge = useGameStore((s) => s.activeChallenge);
  const challengeMagicules = useGameStore((s) => s.challengeMagicules);
  if (!activeChallenge) return null;
  const ch = CHALLENGES.find((c) => c.id === activeChallenge);
  if (!ch) return null;
  const progress = Math.min(1, challengeMagicules / ch.goal);
  return (
    <div className="mx-3 mb-1 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-yellow-400 font-semibold">{ch.emoji} {ch.name}</span>
        <span className="text-gray-400">{formatNumber(challengeMagicules)}/{formatNumber(ch.goal)}</span>
      </div>
      <div className="w-full h-1.5 bg-navy-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-500 rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const { offlineMessage } = useSaveLoad();
  useGameLoop();

  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (offlineMessage) {
      setShowWelcome(true);
      const t = setTimeout(() => setShowWelcome(false), 5000);
      return () => clearTimeout(t);
    }
  }, [offlineMessage]);

  return (
    <div className="min-h-screen bg-navy-900 text-white flex justify-center">
      <Particles />
      <ToastNotifications />
      <div className="w-full max-w-md flex flex-col min-h-screen relative z-10">
        {/* Header */}
        <div className="text-center pt-3 pb-1">
          <h1 className="text-lg font-bold text-steel tracking-wide">
            Slime Idle
          </h1>
          <p className="text-[10px] text-gray-500">
            That Time I Got Reincarnated as an Idle Game
          </p>
        </div>

        {/* Offline earnings banner */}
        {showWelcome && offlineMessage && (
          <div className="mx-3 mb-2 p-2 bg-accent/20 border border-accent/40 rounded-lg text-xs text-center text-accent animate-pulse">
            {offlineMessage}
          </div>
        )}

        {/* Active challenge banner */}
        <ActiveChallengeBanner />

        {/* Magicule display */}
        <MagiculeDisplay />

        {/* Evolution bar */}
        <EvolutionBar />

        {/* Slime button */}
        <SlimeButton />

        {/* Shop */}
        <ShopTabs />

        {/* Event log */}
        <EventLog />

        {/* Footer controls */}
        <div className="flex items-center justify-between px-1 py-1 flex-wrap gap-1">
          <div className="flex items-center gap-0.5 flex-wrap">
            <StatsPanel />
            <AchievementsPanel />
            <ChallengesPanel />
            <SaveManager />
          </div>
          <div className="flex items-center gap-1">
            <PrestigeShop />
            <ResetButton />
          </div>
        </div>
      </div>
    </div>
  );
}
