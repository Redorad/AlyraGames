import { useEffect, useState } from "react";
import { MagiculeDisplay } from "./components/MagiculeDisplay";
import { SlimeButton } from "./components/SlimeButton";
import { EvolutionBar } from "./components/EvolutionBar";
import { ShopTabs } from "./components/ShopTabs";
import { EventLog } from "./components/EventLog";
import { ResetButton } from "./components/ResetButton";
import { Particles } from "./components/Particles";
import { StatsPanel } from "./components/StatsPanel";
import { useGameLoop } from "./hooks/useGameLoop";
import { useSaveLoad } from "./hooks/useSaveLoad";

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
        <div className="flex items-center justify-between px-1">
          <StatsPanel />
          <ResetButton />
        </div>
      </div>
    </div>
  );
}
