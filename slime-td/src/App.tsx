import { useState } from "react";
import LevelSelect from "./components/LevelSelect";
import GameScreen from "./components/GameScreen";

export default function App() {
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);

  if (activeLevelId !== null) {
    return (
      <GameScreen
        key={activeLevelId}
        levelId={activeLevelId}
        onBack={() => setActiveLevelId(null)}
      />
    );
  }

  return <LevelSelect onSelect={setActiveLevelId} />;
}
