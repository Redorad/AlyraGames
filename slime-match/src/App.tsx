import { useGameStore } from './store/gameStore';
import TitleScreen from './components/TitleScreen';
import GameScreen from './components/GameScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="h-full bg-navy-900 text-white font-sans">
      {screen === 'title' && <TitleScreen />}
      {screen === 'game' && <GameScreen />}
    </div>
  );
}
