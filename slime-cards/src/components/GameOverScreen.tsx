import { useGameStore } from "../store/gameStore";

export default function GameOverScreen({ won }: { won: boolean }) {
  const startRun = useGameStore((s) => s.startRun);
  const floor = useGameStore((s) => s.floor);
  const act = useGameStore((s) => s.act);
  const deck = useGameStore((s) => s.deck);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-navy-900 px-4">
      <div className="text-center slide-up max-w-sm">
        {won ? (
          <>
            <div className="text-6xl mb-4">{"\u{1F451}"}</div>
            <h2 className="text-2xl font-black text-yellow-400 mb-2">Demon Lord!</h2>
            <p className="text-gray-400 text-sm mb-1">
              You defeated all acts and achieved Demon Lord status!
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">{"\u{1F480}"}</div>
            <h2 className="text-2xl font-black text-red-400 mb-2">Defeat</h2>
            <p className="text-gray-400 text-sm mb-1">
              Rimuru has fallen...
            </p>
          </>
        )}

        <div className="mt-4 space-y-1 text-sm text-gray-500">
          <p>Act {act} — Floor {floor}</p>
          <p>Deck: {deck.length} cards</p>
        </div>

        <button
          onClick={() => useGameStore.setState({ screen: "title" })}
          className="mt-6 px-6 py-3 rounded-xl bg-accent/20 text-accent border border-accent/40 font-bold hover:bg-accent/30 transition"
        >
          New Game
        </button>
      </div>
    </div>
  );
}
