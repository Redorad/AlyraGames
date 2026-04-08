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
            <h2 className="text-2xl font-black text-yellow-400 mb-2">Roi-Démon !</h2>
            <p className="text-gray-400 text-sm mb-1">
              Tu as vaincu tous les actes et atteint le statut de Roi-Démon !
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">{"\u{1F480}"}</div>
            <h2 className="text-2xl font-black text-red-400 mb-2">Défaite</h2>
            <p className="text-gray-400 text-sm mb-1">
              Rimuru est tombé...
            </p>
          </>
        )}

        <div className="mt-4 space-y-1 text-sm text-gray-500">
          <p>Acte {act} — Étage {floor}</p>
          <p>Deck : {deck.length} cartes</p>
        </div>

        <button
          onClick={() => useGameStore.setState({ screen: "title" })}
          className="mt-6 px-6 py-3 rounded-xl bg-accent/20 text-accent border border-accent/40 font-bold hover:bg-accent/30 transition"
        >
          Nouvelle Partie
        </button>
      </div>
    </div>
  );
}
