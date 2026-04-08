import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { playClick } from '../utils/sounds';

export default function TitleScreen() {
  const startGame = useGameStore(s => s.startGame);
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="h-full flex flex-col items-center justify-center text-white overflow-y-auto p-4">
      <div className="text-center mb-8">
        <div className="text-7xl mb-4">{"\u{2694}\u{FE0F}"}</div>
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-steel to-accent bg-clip-text text-transparent">
          Slime Arena
        </h1>
        <p className="text-lg text-steel/70 mb-2">Auto-Battler — Tensei Shitara Slime</p>
      </div>

      <button
        onClick={() => { playClick(); startGame(); }}
        className="px-10 py-3 bg-accent/20 border-2 border-accent text-accent rounded-xl text-xl font-bold
                   hover:bg-accent/30 hover:scale-105 transition-all duration-200 animate-pulse-glow mb-4"
      >
        Commencer
      </button>

      <button
        onClick={() => setShowRules(!showRules)}
        className="text-sm px-4 py-1.5 rounded-lg bg-navy-700 text-steel border border-steel/20 hover:bg-navy-700/80 transition mb-4"
      >
        {showRules ? 'Masquer les règles' : 'Comment jouer ?'}
      </button>

      {showRules && (
        <div className="max-w-lg w-full p-5 rounded-2xl bg-navy-800 border border-white/10 text-sm text-gray-300 space-y-3 animate-fade-in">
          <h3 className="text-accent font-bold text-lg">{"\u{1F3AE}"} Comment jouer</h3>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-navy-700/50 border border-white/5">
              <p className="font-bold text-white mb-1">{"\u{1F6D2}"} Phase d'achat</p>
              <p>Chaque round commence par la <strong>boutique</strong>. Tu as de l'or pour acheter des unités.</p>
              <ul className="mt-1 ml-4 list-disc text-gray-400 space-y-0.5">
                <li>5 unités aléatoires sont proposées</li>
                <li><strong>Relancer</strong> la boutique coûte 1 or</li>
                <li>Les unités coûtent 1 à 4 or selon leur puissance</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-navy-700/50 border border-white/5">
              <p className="font-bold text-white mb-1">{"\u{1F9E9}"} Placement</p>
              <p>Place tes unités sur la <strong>grille 4x2</strong> (ton côté du terrain).</p>
              <ul className="mt-1 ml-4 list-disc text-gray-400 space-y-0.5">
                <li><strong>Cliquer</strong> une unité du banc/boutique, puis cliquer une case vide</li>
                <li>Ou <strong>glisser-déposer</strong> (drag & drop)</li>
                <li>Cliquer une unité placée pour la <strong>retirer</strong> ou <strong>vendre</strong></li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-navy-700/50 border border-white/5">
              <p className="font-bold text-white mb-1">{"\u{2694}\u{FE0F}"} Combat</p>
              <p>Clique <strong>"Combattre !"</strong> quand tu es prêt. Le combat est <strong>automatique</strong>.</p>
              <ul className="mt-1 ml-4 list-disc text-gray-400 space-y-0.5">
                <li>Les unités attaquent par ordre de <strong>vitesse</strong></li>
                <li>Si tu gagnes, tu passes au round suivant</li>
                <li>Si tu perds, tu perds des PV (selon les ennemis restants)</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-navy-700/50 border border-white/5">
              <p className="font-bold text-white mb-1">{"\u{1F4B0}"} Économie</p>
              <ul className="ml-4 list-disc text-gray-400 space-y-0.5">
                <li><strong>+5 or</strong> de base chaque round</li>
                <li><strong>+1 or</strong> par victoire consécutive</li>
                <li>Vendre une unité rembourse <strong>la moitié</strong> de son coût</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-navy-700/50 border border-white/5">
              <p className="font-bold text-white mb-1">{"\u{2728}"} Synergies</p>
              <p>Certaines unités partagent des <strong>tags</strong> (Ogre, Kijin, Monstre).</p>
              <ul className="mt-1 ml-4 list-disc text-gray-400 space-y-0.5">
                <li><strong>Ogre</strong> (2+) : +15 ATK</li>
                <li><strong>Kijin</strong> (3+) : +25% Critique</li>
                <li><strong>Monstre</strong> (4+) : +50 PV</li>
                <li><strong>Rapide</strong> (2+) : +3 Vitesse</li>
                <li><strong>D{"\u00e9"}mon</strong> (2+) : +20 ATK</li>
                <li><strong>Gu{"\u00e9"}risseur</strong> (2+) : +30 PV</li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
            <p className="font-bold text-accent mb-1">{"\u{1F3C6}"} Objectif</p>
            <p>Survis aux <strong>10 rounds</strong> avec tes 100 PV pour devenir <strong>Roi-Démon</strong> !</p>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-xs mt-2">
              {"\u{1F4A1}"} Astuce : combine des unités avec les mêmes synergies pour des bonus puissants !
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-4 gap-3 text-2xl">
        <span title="Goblin">{"\u{1F47A}"}</span>
        <span title="Benimaru">{"\u{1F525}"}</span>
        <span title="Rimuru">{"\u{1F7E6}"}</span>
        <span title="Diablo">{"\u{1F608}"}</span>
      </div>
    </div>
  );
}
