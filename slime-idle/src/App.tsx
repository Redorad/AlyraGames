import { useEffect, useState } from "react";
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

type TabId = "home" | "battle" | "explore" | "collection" | "menu";

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "battle", icon: "⚔️", label: "Battle" },
  { id: "explore", icon: "🗺️", label: "Explore" },
  { id: "collection", icon: "📦", label: "Items" },
  { id: "menu", icon: "☰", label: "More" },
];

interface MenuButton {
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
}

function MenuGrid({ buttons }: { buttons: MenuButton[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          className={`glass-dark rounded-lg border border-steel/10 min-h-[44px] px-3 py-2.5 text-left transition-colors hover:border-steel/30 active:scale-[0.97]`}
        >
          <span className="text-sm">{btn.icon}</span>{" "}
          <span className={`text-xs font-medium ${btn.color}`}>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const { offlineData, dismissOffline } = useSaveLoad();
  useGameLoop();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  const soundEnabled = useExtraStore((s) => s.soundEnabled);
  const toggleSound = useExtraStore((s) => s.toggleSound);
  useEffect(() => { setSoundEnabled(soundEnabled); }, [soundEnabled]);

  const close = () => setOpenPanel(null);

  return (
    <>
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

      <div className="w-full max-w-md flex flex-col min-h-screen relative z-10 pb-16">
        {/* Header */}
        <div className="text-center pt-3 pb-1 px-3">
          <h1 className="text-lg font-bold gradient-text tracking-wide">Slime Idle</h1>
          <p className="text-[10px] text-gray-500">That Time I Got Reincarnated as an Idle Game</p>
        </div>

        <ActiveChallengeBanner />
        <MagiculeDisplay />
        <EvolutionBar />
        <SlimeButton />

        {/* Tab content */}
        {activeTab === "home" && (
          <>
            <ShopTabs />
            <EventLog />
          </>
        )}

        {activeTab === "battle" && (
          <div className="px-3 py-3">
            <p className="text-xs text-gray-500 mb-2">Combat & Challenges</p>
            <MenuGrid buttons={[
              { icon: "👹", label: "Boss Fight", color: "text-red-400", onClick: () => setOpenPanel("boss") },
              { icon: "🏰", label: "Dungeon", color: "text-purple-400", onClick: () => setOpenPanel("dungeon") },
              { icon: "⚡", label: "Boss Rush", color: "text-orange-400", onClick: () => setOpenPanel("bossrush") },
              { icon: "🏆", label: "Challenges", color: "text-yellow-400", onClick: () => setOpenPanel("challenges") },
            ]} />
          </div>
        )}

        {activeTab === "explore" && (
          <div className="px-3 py-3">
            <p className="text-xs text-gray-500 mb-2">World & Research</p>
            <MenuGrid buttons={[
              { icon: "🗺️", label: "World Map", color: "text-green-400", onClick: () => setOpenPanel("worldmap") },
              { icon: "🎖️", label: "Army Deploy", color: "text-steel", onClick: () => setOpenPanel("army") },
              { icon: "🔬", label: "Research", color: "text-cyan-400", onClick: () => setOpenPanel("research") },
              { icon: "📜", label: "Quests", color: "text-amber-400", onClick: () => setOpenPanel("quests") },
            ]} />
          </div>
        )}

        {activeTab === "collection" && (
          <div className="px-3 py-3">
            <p className="text-xs text-gray-500 mb-2">Gear & Abilities</p>
            <MenuGrid buttons={[
              { icon: "⚔️", label: "Equipment", color: "text-blue-400", onClick: () => setOpenPanel("equipment") },
              { icon: "🌟", label: "Skill Tree", color: "text-yellow-400", onClick: () => setOpenPanel("skilltree") },
              { icon: "💎", label: "Artifacts", color: "text-purple-400", onClick: () => setOpenPanel("artifacts") },
              { icon: "🔮", label: "Fusion", color: "text-pink-400", onClick: () => setOpenPanel("fusion") },
              { icon: "🔗", label: "Synergies", color: "text-cyan-400", onClick: () => setOpenPanel("synergies") },
            ]} />
          </div>
        )}

        {activeTab === "menu" && (
          <div className="px-3 py-3 space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-2">Stats & Settings</p>
              <MenuGrid buttons={[
                { icon: "📊", label: "Stats", color: "text-cyan-400", onClick: () => setOpenPanel("stats") },
                { icon: "🏅", label: "Achievements", color: "text-yellow-400", onClick: () => setOpenPanel("achievements") },
                { icon: "💾", label: "Save Manager", color: "text-steel", onClick: () => setOpenPanel("save") },
                { icon: soundEnabled ? "🔊" : "🔇", label: soundEnabled ? "Sound On" : "Sound Off", color: "text-gray-400", onClick: () => { toggleSound(); setSoundEnabled(!soundEnabled); } },
              ]} />
            </div>
            <div className="border-t border-steel/10 pt-3">
              <p className="text-xs text-gray-500 mb-2">Progression</p>
              <MenuGrid buttons={[
                { icon: "✦", label: "Prestige", color: "text-purple-400", onClick: () => setOpenPanel("prestige") },
                { icon: "🌌", label: "Ascension", color: "text-cyan-400", onClick: () => setOpenPanel("ascension") },
                { icon: "🔄", label: "Reset", color: "text-red-400", onClick: () => setOpenPanel("reset") },
              ]} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto">
          <div className="glass border-t border-steel/20 flex items-stretch">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors ${
                  activeTab === tab.id
                    ? "text-cyan-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* All modal panels — rendered OUTSIDE the overflow-hidden container */}
    {openPanel === "boss" && <BossPanel onClose={close} />}
    {openPanel === "dungeon" && <DungeonPanel onClose={close} />}
    {openPanel === "bossrush" && <BossRushPanel onClose={close} />}
    {openPanel === "challenges" && <ChallengesPanel onClose={close} />}
    {openPanel === "worldmap" && <WorldMapPanel onClose={close} />}
    {openPanel === "army" && <ArmyDeployPanel onClose={close} />}
    {openPanel === "research" && <ResearchPanel onClose={close} />}
    {openPanel === "quests" && <QuestsPanel onClose={close} />}
    {openPanel === "equipment" && <EquipmentPanel onClose={close} />}
    {openPanel === "skilltree" && <SkillTreePanel onClose={close} />}
    {openPanel === "artifacts" && <ArtifactsPanel onClose={close} />}
    {openPanel === "fusion" && <ArtifactFusionPanel onClose={close} />}
    {openPanel === "synergies" && <SynergiesPanel onClose={close} />}
    {openPanel === "stats" && <StatsDashboard onClose={close} />}
    {openPanel === "achievements" && <AchievementsPanel onClose={close} />}
    {openPanel === "save" && <SaveManager onClose={close} />}
    {openPanel === "prestige" && <PrestigeShop onClose={close} />}
    {openPanel === "ascension" && <AscensionPanel onClose={close} />}
    {openPanel === "reset" && <ResetButton onClose={close} />}
    </>
  );
}
