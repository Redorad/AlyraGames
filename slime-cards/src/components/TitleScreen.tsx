import { useGameStore } from "../store/gameStore";

export default function TitleScreen() {
  const startRun = useGameStore((s) => s.startRun);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-navy-900 px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-navy-900 to-navy-900" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative text-center">
        <div className="text-7xl mb-4 float">{"\u{1F0CF}"}</div>
        <h1 className="text-4xl font-black tracking-tight mb-2">
          <span className="text-steel">SLIME</span>{" "}
          <span className="text-accent">CARDS</span>
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Roguelike Deckbuilder — Tensei Shitara Slime Datta Ken
        </p>

        <button
          onClick={startRun}
          className="pulse-glow px-8 py-3 rounded-xl bg-accent/20 text-accent border border-accent/40 text-lg font-bold hover:bg-accent/30 transition"
        >
          Nouvelle Partie
        </button>

        <div className="mt-8 text-xs text-gray-600 max-w-xs mx-auto">
          <p>3 actes, 3 boss. Construis ton deck,</p>
          <p>bats tes ennemis, deviens Roi-Démon.</p>
        </div>
      </div>
    </div>
  );
}
