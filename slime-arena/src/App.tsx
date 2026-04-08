import { useGameStore } from './store/gameStore';
import TitleScreen from './components/TitleScreen';
import PrepScreen from './components/PrepScreen';
import BattleScreen from './components/BattleScreen';
import GameOverScreen from './components/GameOverScreen';

export default function App() {
  const phase = useGameStore(s => s.phase);

  return (
    <div className="h-full bg-navy-900 text-white font-sans">
      {phase === 'title' && <TitleScreen />}
      {phase === 'prep' && <PrepScreen />}
      {phase === 'battle' && <BattleScreen />}
      {phase === 'gameOver' && <GameOverScreen />}
    </div>
  );
}
