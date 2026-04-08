import { useState } from "react";
import LevelSelect from "./components/LevelSelect";
import GameScreen from "./components/GameScreen";

export default function App() {
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);
  const [restartKey, setRestartKey] = useState(0);

  if (activeLevelId !== null) {
    return (
      <GameScreen
        key={`${activeLevelId}-${restartKey}`}
        levelId={activeLevelId}
        onBack={() => setActiveLevelId(null)}
        onRestart={() => setRestartKey((k) => k + 1)}
      />
    );
  }

  return <LevelSelect onSelect={setActiveLevelId} />;
}
