import { useGameStore } from "../store/gameStore";
import * as sfx from "../utils/sounds";

const EVENTS = [
  {
    title: "Source Mystérieuse",
    description: "Tu découvres une source d'eau magique dans la forêt. Son énergie semble curative...",
    emoji: "\u{1F4A7}",
    choices: [
      { text: "Boire l'eau (+20 PV)", effect: "heal20" },
      { text: "Ignorer et continuer", effect: "skip" },
    ],
  },
  {
    title: "Marchant Ambulant",
    description: "Un marchant étrange te propose un deal...",
    emoji: "\u{1F9D9}",
    choices: [
      { text: "Payer 50 or (+10 PV max)", effect: "maxhp10" },
      { text: "Payer 30 or (+1 Énergie max)", effect: "energy1" },
      { text: "Décliner", effect: "skip" },
    ],
  },
  {
    title: "Autel Ancien",
    description: "Un autel sombre émane une énergie puissante. Tu sens que tu peux faire un sacrifice...",
    emoji: "\u{1F5FF}",
    choices: [
      { text: "Sacrifier 10 PV (+2 Force)", effect: "str2" },
      { text: "Sacrifier 10 PV (+2 Dextérité)", effect: "dex2" },
      { text: "Passer ton chemin", effect: "skip" },
    ],
  },
  {
    title: "Piège !",
    description: "Tu tombes dans une embuscade ! Des flèches pleuvent du plafond !",
    emoji: "\u{1F4A2}",
    choices: [
      { text: "Esquiver (-8 PV)", effect: "dmg8" },
      { text: "Encaisser (-15 PV, +20 or)", effect: "dmg15gold20" },
    ],
  },
  {
    title: "Cristal de Magicules",
    description: "Un cristal brillant de magicules concentrées. Tu peux absorber son énergie.",
    emoji: "\u{1F48E}",
    choices: [
      { text: "Absorber (+30 or)", effect: "gold30" },
      { text: "Absorber l'énergie (Soigne 30 PV)", effect: "heal30" },
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
