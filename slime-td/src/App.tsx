import { useState } from "react";
import LevelSelect from "./components/LevelSelect";
import GameScreen from "./components/GameScreen";

export default function App() {
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);
  const [hardMode, setHardMode] = useState(false);
  const [endless, setEndless] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

  if (activeLevelId !== null) {
    return (
      <GameScreen
        key={`${activeLevelId}-${restartKey}-${hardMode}-${endless}`}
        levelId={activeLevelId}
        hardMode={hardMode}
        endless={endless}
        onBack={() => { setActiveLevelId(null); setHardMode(false); setEndless(false); }}
        onRestart={() => setRestartKey((k) => k + 1)}
      />
    );
  }

  return (
    <LevelSelect
      onSelect={(id, hard) => { setActiveLevelId(id); setHardMode(hard); setEndless(false); }}
      onEndless={() => { setActiveLevelId(0); setEndless(true); setHardMode(false); }}
    />
  );
}
