import { useGameStore } from '../store/gameStore';
import { playClick } from '../utils/sounds';

export default function GameOverScreen() {
  const { playerHp, round, goToTitle, startGame } = useGameStore();
  const won = playerHp > 0 && round >= 10;

  return (
    <div className="h-full flex flex-col items-center justify-center text-white">
      <div className="text-center mb-8">
        <div className="text-7xl mb-4">{won ? '👑' : '💀'}</div>
        <h1 className={`text-5xl font-bold mb-3 ${won ? 'text-yellow-400' : 'text-red-400'}`}>
          {won ? 'Victory!' : 'Defeat'}
        </h1>
        <p className="text-xl text-gray-400 mb-2">
          {won
            ? 'You survived all 10 rounds! You are the new Demon Lord!'
            : 'Your army has been defeated...'}
        </p>
        <div className="flex gap-6 justify-center mt-4 text-lg">
          <div className="text-steel">
            Round reached: <span className="font-bold text-white">{round}/10</span>
          </div>
          <div className="text-red-400">
            HP remaining: <span className="font-bold text-white">{playerHp}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => { playClick(); startGame(); }}
          className="px-8 py-3 bg-accent/20 border-2 border-accent text-accent rounded-xl text-xl font-bold
                     hover:bg-accent/30 transition-all"
        >
          Replay
        </button>
        <button
          onClick={() => { playClick(); goToTitle(); }}
          className="px-8 py-3 bg-navy-700 border-2 border-gray-600 text-gray-300 rounded-xl text-xl font-bold
                     hover:bg-navy-800 transition-all"
        >
          Menu
        </button>
      </div>

      {won && (
        <div className="mt-12 text-center">
          <div className="text-4xl mb-2">🟦 ⚔️ 🔥 😈 🐉</div>
          <p className="text-sm text-gray-500">The nation of Tempest is in good hands.</p>
        </div>
      )}
    </div>
  );
}
