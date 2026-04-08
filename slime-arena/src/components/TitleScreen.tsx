import { useGameStore } from '../store/gameStore';
import { playClick } from '../utils/sounds';

export default function TitleScreen() {
  const startGame = useGameStore(s => s.startGame);

  return (
    <div className="h-full flex flex-col items-center justify-center text-white">
      <div className="text-center mb-12">
        <div className="text-8xl mb-6 animate-bounce">🟦</div>
        <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-steel to-accent bg-clip-text text-transparent">
          Slime Arena
        </h1>
        <p className="text-xl text-steel/70 mb-2">Auto-Battler inspiré de Tensei Shitara Slime</p>
        <p className="text-sm text-gray-500">Achetez des unités, placez-les et combattez !</p>
      </div>

      <button
        onClick={() => { playClick(); startGame(); }}
        className="px-12 py-4 bg-accent/20 border-2 border-accent text-accent rounded-xl text-2xl font-bold
                   hover:bg-accent/30 hover:scale-105 transition-all duration-200 animate-pulse-glow"
      >
        Commencer
      </button>

      <div className="mt-16 text-center text-gray-500 text-sm max-w-md">
        <p className="mb-2">10 rounds de combats automatiques</p>
        <p>Survivez avec vos unités pour devenir le Seigneur Démon !</p>
      </div>

      <div className="mt-8 grid grid-cols-4 gap-3 text-2xl">
        <span title="Goblin">👺</span>
        <span title="Benimaru">🔥</span>
        <span title="Rimuru">🟦</span>
        <span title="Diablo">😈</span>
      </div>
    </div>
  );
}
