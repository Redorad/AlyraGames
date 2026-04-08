import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { CARDS } from "../data/cards";
import { ENEMY_DEFS } from "../data/enemies";
import type { EnemyInstance, CardInstance } from "../types";

const INTENT_EMOJI = {
  attack: "\u{2694}\u{FE0F}",
  defend: "\u{1F6E1}\u{FE0F}",
  buff: "\u{2B06}\u{FE0F}",
  debuff: "\u{2B07}\u{FE0F}",
  attack_defend: "\u{2694}\u{FE0F}\u{1F6E1}\u{FE0F}",
};

function StatusBadges({ weak, vulnerable, strength, block }: { weak: number; vulnerable: number; strength: number; block: number }) {
  return (
    <div className="flex gap-1 flex-wrap justify-center mt-1">
      {block > 0 && <span className="text-xs px-1 rounded bg-blue-500/20 text-blue-300">{"\u{1F6E1}\u{FE0F}"}{block}</span>}
      {strength > 0 && <span className="text-xs px-1 rounded bg-red-500/20 text-red-300">{"\u{1F4AA}"}{strength}</span>}
      {weak > 0 && <span className="text-xs px-1 rounded bg-purple-500/20 text-purple-300">Faible {weak}</span>}
      {vulnerable > 0 && <span className="text-xs px-1 rounded bg-yellow-500/20 text-yellow-300">Vuln {vulnerable}</span>}
    </div>
  );
}

function EnemyCard({ enemy, idx, selected, onSelect }: { enemy: EnemyInstance; idx: number; selected: boolean; onSelect: () => void }) {
  const def = ENEMY_DEFS[enemy.defId];
  const hpPct = (enemy.hp / enemy.maxHp) * 100;
  const intent = enemy.intent;

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all w-24 ${
        selected ? "border-yellow-400 bg-yellow-400/10 scale-105" : "border-white/10 bg-navy-800/50"
      }`}
    >
      {/* Intent */}
      <div className="text-xs text-gray-400 mb-1 h-5 flex items-center gap-1">
        <span>{INTENT_EMOJI[intent.type]}</span>
        {(intent.type === "attack" || intent.type === "attack_defend") && (
          <span className="text-red-400 font-bold">{intent.value}</span>
        )}
        {intent.type === "attack_defend" && intent.value2 && (
          <span className="text-blue-400">+{intent.value2}</span>
        )}
        {intent.type === "defend" && <span className="text-blue-400">{intent.value}</span>}
        {intent.type === "buff" && <span className="text-green-400">+{intent.value}</span>}
        {intent.type === "debuff" && <span className="text-purple-400">{intent.value}</span>}
      </div>

      {/* Emoji */}
      <div className="text-3xl mb-1">{def.emoji}</div>
      <div className="text-xs font-bold text-white truncate w-full text-center">{def.name}</div>

      {/* HP */}
      <div className="w-full mt-1">
        <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${hpPct}%` }} />
        </div>
        <div className="text-xs text-center text-gray-400 mt-0.5">{enemy.hp}/{enemy.maxHp}</div>
      </div>

      <StatusBadges weak={enemy.weak} vulnerable={enemy.vulnerable} strength={enemy.strength} block={enemy.block} />
    </button>
  );
}

function CardComponent({ card, playable, onClick }: { card: CardInstance; playable: boolean; onClick: () => void }) {
  const def = CARDS[card.defId];
  if (!def) return null;

  const rarityBorder = def.rarity === "rare" ? "border-yellow-500/60" : def.rarity === "uncommon" ? "border-blue-400/60" : "border-white/20";

  return (
    <button
      onClick={playable ? onClick : undefined}
      className={`shrink-0 w-[100px] rounded-xl border-2 p-2 transition-all flex flex-col items-center text-center
        ${playable
          ? `${rarityBorder} bg-navy-700/80 hover:scale-105 hover:-translate-y-2 cursor-pointer`
          : "border-gray-600/30 bg-navy-900/60 opacity-40 cursor-not-allowed"
        }`}
    >
      {/* Cost */}
      <div className="w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center mb-1 self-start">
        {def.cost}
      </div>
      <div className="text-2xl mb-1">{def.emoji}</div>
      <div className="text-xs font-bold leading-tight" style={{ color: def.color }}>{def.name}</div>
      <div className="text-[10px] text-gray-400 leading-snug mt-1">{def.description}</div>
    </button>
  );
}

export default function CombatScreen() {
  const { player, enemies, hand, drawPile, discardPile, exhaustPile, turn } = useGameStore();
  const playCard = useGameStore((s) => s.playCard);
  const endTurn = useGameStore((s) => s.endTurn);
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const handleCardClick = (cardUid: number) => {
    const card = hand.find((c) => c.uid === cardUid);
    if (!card) return;
    const def = CARDS[card.defId];
    if (!def || def.cost > player.energy) return;

    if (def.target === "enemy" && enemies.length > 1) {
      // Need to select target
      if (selectedCard === cardUid) {
        // Play on selected target
        playCard(cardUid, selectedTarget);
        setSelectedCard(null);
      } else {
        setSelectedCard(cardUid);
      }
    } else {
      playCard(cardUid, selectedTarget);
      setSelectedCard(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-navy-900 overflow-hidden">
      {/* ── Player info bar ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-navy-800 border-b border-white/5 text-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{"\u{1F9CA}"}</span>
          <span className="text-red-400">{"\u{2764}\u{FE0F}"} {player.hp}/{player.maxHp}</span>
          {player.block > 0 && <span className="text-blue-300">{"\u{1F6E1}\u{FE0F}"}{player.block}</span>}
        </div>
        <div className="flex items-center gap-3">
          {/* Energy */}
          <div className="flex items-center gap-1">
            {Array.from({ length: player.maxEnergy }).map((_, i) => (
              <div key={i} className={`w-5 h-5 rounded-full border-2 ${i < player.energy ? "bg-blue-500 border-blue-400" : "bg-navy-700 border-gray-600"}`} />
            ))}
          </div>
          <span className="text-gray-500 text-xs">Tour {turn}</span>
        </div>
      </div>

      {/* Player status */}
      <div className="px-3 py-1 shrink-0">
        <StatusBadges weak={player.weak} vulnerable={player.vulnerable} strength={player.strength} block={0} />
        {(player.dexterity > 0) && <span className="text-xs px-1 rounded bg-green-500/20 text-green-300 ml-1">Dex +{player.dexterity}</span>}
      </div>

      {/* ── Enemies ── */}
      <div className="flex-1 flex items-center justify-center gap-3 px-4 py-2">
        {enemies.map((e, i) => (
          <EnemyCard
            key={e.id}
            enemy={e}
            idx={i}
            selected={selectedTarget === i}
            onSelect={() => setSelectedTarget(i)}
          />
        ))}
      </div>

      {/* ── Pile info + End Turn ── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5 shrink-0">
        <div className="flex gap-3 text-xs text-gray-500">
          <span>Pioche: {drawPile.length}</span>
          <span>Défausse: {discardPile.length}</span>
          {exhaustPile.length > 0 && <span>Épuisé: {exhaustPile.length}</span>}
        </div>
        <button
          onClick={endTurn}
          className="px-4 py-1.5 rounded-lg bg-accent/20 text-accent border border-accent/40 text-sm font-bold hover:bg-accent/30 transition"
        >
          Fin de tour
        </button>
      </div>

      {/* ── Hand ── */}
      <div className="bg-navy-800 border-t border-white/10 px-2 py-2 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
          {hand.map((card) => {
            const def = CARDS[card.defId];
            const playable = !!def && def.cost <= player.energy;
            return (
              <CardComponent
                key={card.uid}
                card={card}
                playable={playable}
                onClick={() => handleCardClick(card.uid)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
