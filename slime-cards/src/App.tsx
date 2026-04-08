import { useGameStore } from "./store/gameStore";
import TitleScreen from "./components/TitleScreen";
import MapScreen from "./components/MapScreen";
import CombatScreen from "./components/CombatScreen";
import RewardScreen from "./components/RewardScreen";
import EventScreen from "./components/EventScreen";
import RestScreen from "./components/RestScreen";
import ShopScreen from "./components/ShopScreen";
import GameOverScreen from "./components/GameOverScreen";

export default function App() {
  const screen = useGameStore((s) => s.screen);

  switch (screen) {
    case "title":
      return <TitleScreen />;
    case "map":
      return <MapScreen />;
    case "combat":
      return <CombatScreen />;
    case "reward":
      return <RewardScreen />;
    case "event":
      return <EventScreen />;
    case "rest":
      return <RestScreen />;
    case "shop":
      return <ShopScreen />;
    case "game_over":
      return <GameOverScreen won={false} />;
    case "victory":
      return <GameOverScreen won={true} />;
    default:
      return <TitleScreen />;
  }
}
