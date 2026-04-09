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
        Start
      </button>

      <button
        onClick={() => setShowRules(!showRules)}
        className="text-sm px-4 py-1.5 rounded-lg bg-navy-700 text-steel border border-steel/20 hover:bg-navy-700/80 transition mb-4"
      >
        {showRules ? 'Hide rules' : 'How to play?'}
      </button>

      {showRules && (
        <div className="max-w-lg w-full p-5 rounded-2xl bg-navy-800 border border-white/10 text-sm text-gray-300 space-y-3 animate-fade-in">
          <h3 className="text-accent font-bold text-lg">{"\u{1F3AE}"} How to Play</h3>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-navy-700/50 border border-white/5">
              <p className="font-bold text-white mb-1">{"\u{1F6D2}"} Shopping Phase</p>
              <p>Each round starts with the <strong>shop</strong>. You have gold to buy units.</p>
              <ul className="mt-1 ml-4 list-disc text-gray-400 space-y-0.5">
                <li>5 random units are offered</li>
                <li><strong>Reroll</strong> the shop costs 1 gold</li>
                <li>Units cost 1 to 4 gold based on their power</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-navy-700/50 border border-white/5">
              <p className="font-bold text-white mb-1">{"\u{1F9E9}"} Placement</p>
              <p>Place your units on the <strong>4x2 grid</strong> (your side of the field).</p>
              <ul className="mt-1 ml-4 list-disc text-gray-400 space-y-0.5">
                <li><strong>Click</strong> a unit from bench/shop, then click an empty cell</li>
                <li>Or <strong>drag & drop</strong></li>
                <li>Click a placed unit to <strong>remove</strong> or <strong>sell</strong> it</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-navy-700/50 border border-white/5">
              <p className="font-bold text-white mb-1">{"\u{2694}\u{FE0F}"} Combat</p>
              <p>Click <strong>"Fight!"</strong> when you are ready. Combat is <strong>automatic</strong>.</p>
              <ul className="mt-1 ml-4 list-disc text-gray-400 space-y-0.5">
                <li>Units attack in order of <strong>speed</strong></li>
                <li>If you win, you advance to the next round</li>
                <li>If you lose, you lose HP (based on remaining enemies)</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-navy-700/50 border border-white/5">
              <p className="font-bold text-white mb-1">{"\u{1F4B0}"} Economy</p>
              <ul className="ml-4 list-disc text-gray-400 space-y-0.5">
                <li><strong>+5 gold</strong> base each round</li>
                <li><strong>+1 gold</strong> per consecutive win</li>
                <li>Selling a unit refunds <strong>half</strong> its cost</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-navy-700/50 border border-white/5">
              <p className="font-bold text-white mb-1">{"\u{2728}"} Synergies</p>
              <p>Some units share <strong>tags</strong> (Ogre, Kijin, Monster).</p>
              <ul className="mt-1 ml-4 list-disc text-gray-400 space-y-0.5">
                <li><strong>Ogre</strong> (2+): +15 ATK</li>
                <li><strong>Kijin</strong> (3+): +25% Crit</li>
                <li><strong>Monster</strong> (4+): +50 HP</li>
                <li><strong>Swift</strong> (2+): +3 Speed</li>
                <li><strong>Demon</strong> (2+): +20 ATK</li>
                <li><strong>Healer</strong> (2+): +30 HP</li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
            <p className="font-bold text-accent mb-1">{"\u{1F3C6}"} Objective</p>
            <p>Survive <strong>10 rounds</strong> with your 100 HP to become <strong>Demon Lord</strong>!</p>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-xs mt-2">
              {"\u{1F4A1}"} Tip: combine units with the same synergies for powerful bonuses!
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
