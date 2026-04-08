import { useState } from "react";
import LevelSelect from "./components/LevelSelect";
import GameScreen from "./components/GameScreen";

export default function App() {
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);
  const [hardMode, setHardMode] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

  if (activeLevelId !== null) {
    return (
      <GameScreen
        key={`${activeLevelId}-${restartKey}-${hardMode}`}
        levelId={activeLevelId}
        hardMode={hardMode}
        onBack={() => { setActiveLevelId(null); setHardMode(false); }}
        onRestart={() => setRestartKey((k) => k + 1)}
      />
    );
  }

  return (
    <LevelSelect
      onSelect={(id, hard) => { setActiveLevelId(id); setHardMode(hard); }}
    />
  );
}
