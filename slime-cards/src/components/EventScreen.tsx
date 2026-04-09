import { useGameStore } from "../store/gameStore";
import * as sfx from "../utils/sounds";

const EVENTS = [
  {
    title: "Mysterious Spring",
    description: "You discover a magical spring in the forest. Its energy seems curative...",
    emoji: "\u{1F4A7}",
    choices: [
      { text: "Drink the water (+20 HP)", effect: "heal20" },
      { text: "Ignore and continue", effect: "skip" },
    ],
  },
  {
    title: "Traveling Merchant",
    description: "A strange merchant offers you a deal...",
    emoji: "\u{1F9D9}",
    choices: [
      { text: "Pay 50 gold (+10 Max HP)", effect: "maxhp10" },
      { text: "Pay 30 gold (+1 Max Energy)", effect: "energy1" },
      { text: "Decline", effect: "skip" },
    ],
  },
  {
    title: "Ancient Altar",
    description: "A dark altar emanates powerful energy. You feel you can make a sacrifice...",
    emoji: "\u{1F5FF}",
    choices: [
      { text: "Sacrifice 10 HP (+2 Strength)", effect: "str2" },
      { text: "Sacrifice 10 HP (+2 Dexterity)", effect: "dex2" },
      { text: "Walk away", effect: "skip" },
    ],
  },
  {
    title: "Trap!",
    description: "You fall into an ambush! Arrows rain from the ceiling!",
    emoji: "\u{1F4A2}",
    choices: [
      { text: "Dodge (-8 HP)", effect: "dmg8" },
      { text: "Endure (-15 HP, +20 gold)", effect: "dmg15gold20" },
    ],
  },
  {
    title: "Magicule Crystal",
    description: "A brilliant crystal of concentrated magicules. You can absorb its energy.",
    emoji: "\u{1F48E}",
    choices: [
      { text: "Absorb (+30 gold)", effect: "gold30" },
      { text: "Absorb the energy (Heal 30 HP)", effect: "heal30" },
    ],
  },
];

export default function EventScreen() {
  const player = useGameStore((s) => s.player);
  const goToMap = useGameStore((s) => s.goToMap);

  const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];

  const applyEffect = (effect: string) => {
    const p = { ...player };
    switch (effect) {
      case "heal20": p.hp = Math.min(p.maxHp, p.hp + 20); sfx.playHeal(); break;
      case "heal30": p.hp = Math.min(p.maxHp, p.hp + 30); sfx.playHeal(); break;
      case "maxhp10":
        if (p.gold >= 50) { p.gold -= 50; p.maxHp += 10; p.hp += 10; sfx.playBuff(); }
        break;
      case "energy1":
        if (p.gold >= 30) { p.gold -= 30; p.maxEnergy += 1; sfx.playBuff(); }
        break;
      case "str2": p.hp = Math.max(1, p.hp - 10); p.strength += 2; sfx.playBuff(); break;
      case "dex2": p.hp = Math.max(1, p.hp - 10); p.dexterity += 2; sfx.playBuff(); break;
      case "dmg8": p.hp = Math.max(1, p.hp - 8); sfx.playHit(); break;
      case "dmg15gold20": p.hp = Math.max(1, p.hp - 15); p.gold += 20; sfx.playHit(); break;
      case "gold30": p.gold += 30; sfx.playGold(); break;
      case "skip": sfx.playClick(); break;
    }
    useGameStore.setState({ player: p });
    goToMap();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-navy-900 px-4">
      <div className="max-w-sm text-center slide-up">
        <div className="text-5xl mb-4">{event.emoji}</div>
        <h2 className="text-xl font-bold text-accent mb-2">{event.title}</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">{event.description}</p>

        <div className="space-y-2">
          {event.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => applyEffect(choice.effect)}
              className="w-full px-4 py-2.5 rounded-xl bg-navy-700 border border-white/10 text-sm text-gray-200 hover:bg-navy-700/80 hover:border-white/20 transition text-left"
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
