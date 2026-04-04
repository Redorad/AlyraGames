import { useEffect } from "react";
import { MagiculeDisplay } from "./components/MagiculeDisplay";
import { SlimeButton } from "./components/SlimeButton";
import { EvolutionBar } from "./components/EvolutionBar";
import { ShopTabs } from "./components/ShopTabs";
import { EventLog } from "./components/EventLog";
import { ResetButton } from "./components/ResetButton";
import { Particles } from "./components/Particles";
import { AchievementsPanel } from "./components/AchievementsPanel";
import { PrestigeShop } from "./components/PrestigeShop";
import { ChallengesPanel } from "./components/ChallengesPanel";
import { ToastNotifications } from "./components/ToastNotifications";
import { SaveManager } from "./components/SaveManager";
import { AscensionPanel } from "./components/AscensionPanel";
import { BossPanel } from "./components/BossPanel";
import { DungeonPanel } from "./components/DungeonPanel";
import { QuestsPanel } from "./components/QuestsPanel";
import { ArtifactsPanel } from "./components/ArtifactsPanel";
import { SynergiesPanel } from "./components/SynergiesPanel";
import { DailyRewardModal } from "./components/DailyRewardModal";
import { EvolutionFlash } from "./components/EvolutionFlash";
import { OfflineReportModal } from "./components/OfflineReportModal";
import { SkillTreePanel } from "./components/SkillTreePanel";
import { WorldMapPanel } from "./components/WorldMapPanel";
import { EquipmentPanel } from "./components/EquipmentPanel";
import { ArmyDeployPanel } from "./components/ArmyDeployPanel";
import { ArtifactFusionPanel } from "./components/ArtifactFusionPanel";
import { BossRushPanel } from "./components/BossRushPanel";
import { ResearchPanel } from "./components/ResearchPanel";
import { StatsDashboard } from "./components/StatsDashboard";
import { useGameLoop } from "./hooks/useGameLoop";
import { useSaveLoad } from "./hooks/useSaveLoad";
import { useGameStore } from "./store/gameStore";
import { useExtraStore } from "./store/extraStore";
import { CHALLENGES } from "./data/challenges";
import { formatNumber } from "./utils/format";
import { setSoundEnabled } from "./utils/sounds";

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
        <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

function SoundToggle() {
  const soundEnabled = useExtraStore((s) => s.soundEnabled);
  const toggleSound = useExtraStore((s) => s.toggleSound);
  return (
    <button
      onClick={() => { toggleSound(); setSoundEnabled(!soundEnabled); }}
      className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1"
    >
      {soundEnabled ? "🔊" : "🔇"}
    </button>
  );
}

export default function App() {
  const { offlineData, dismissOffline } = useSaveLoad();
  useGameLoop();

  const soundEnabled = useExtraStore((s) => s.soundEnabled);
  useEffect(() => { setSoundEnabled(soundEnabled); }, [soundEnabled]);

  return (
    <div className="min-h-screen bg-navy-900 text-white flex justify-center relative overflow-hidden">
      {/* Aurora background */}
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(30,60,140,0.4) 0%, rgba(80,40,160,0.3) 25%, rgba(10,14,39,0) 50%, rgba(60,120,200,0.3) 75%, rgba(40,100,140,0.4) 100%)",
          backgroundSize: "400% 400%",
          animation: "auroraShift 12s ease-in-out infinite",
        }}
      />
      <Particles />
      <ToastNotifications />
      <EvolutionFlash />
      <DailyRewardModal />
      {offlineData && (
        <OfflineReportModal offlineSeconds={offlineData.seconds} earned={offlineData.earned} onClose={dismissOffline} />
      )}
      <div className="w-full max-w-md flex flex-col min-h-screen relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between pt-3 pb-1 px-3">
          <SoundToggle />
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold gradient-text tracking-wide">Slime Idle</h1>
            <p className="text-[10px] text-gray-500">That Time I Got Reincarnated as an Idle Game</p>
          </div>
          <div className="w-8" />
        </div>

        <ActiveChallengeBanner />
        <MagiculeDisplay />
        <EvolutionBar />
        <SlimeButton />
        <ShopTabs />
        <EventLog />

        {/* Footer — row 1: core panels */}
        <div className="flex items-center justify-center gap-0.5 px-1 flex-wrap">
          <StatsDashboard />
          <AchievementsPanel />
          <QuestsPanel />
          <BossPanel />
          <DungeonPanel />
          <ArtifactsPanel />
          <SynergiesPanel />
          <ChallengesPanel />
          <SaveManager />
        </div>
        {/* Footer — row 2: new systems */}
        <div className="flex items-center justify-center gap-0.5 px-1 py-0.5 flex-wrap">
          <SkillTreePanel />
          <WorldMapPanel />
          <EquipmentPanel />
          <ArmyDeployPanel />
          <ArtifactFusionPanel />
          <BossRushPanel />
          <ResearchPanel />
        </div>
        {/* Footer — row 3: prestige + ascension + reset */}
        <div className="flex items-center justify-center gap-1 px-1 py-1 flex-wrap">
          <PrestigeShop />
          <AscensionPanel />
          <ResetButton />
        </div>
      </div>
    </div>
  );
}
