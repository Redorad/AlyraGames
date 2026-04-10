import React, { useState } from 'react';

type Scene = 'beach' | 'cave' | 'jungle' | 'cliff' | 'treasure';

type Hotspot = { x: number; y: number; w: number; h: number; label: string; action: string };

const SCENES: Record<Scene, { emoji: string; title: string; desc: string; hotspots: Hotspot[] }> = {
  beach: {
    emoji: '🏖️',
    title: 'The Beach',
    desc: "You wash up on a sandy shore. A worn map sticks out from the sand. A cave yawns to the east. Jungle vines cover the north path.",
    hotspots: [
      { x: 15, y: 60, w: 15, h: 15, label: 'Map', action: 'map' },
      { x: 75, y: 40, w: 18, h: 30, label: 'Cave', action: 'scene:cave' },
      { x: 40, y: 15, w: 18, h: 25, label: 'Jungle', action: 'scene:jungle' },
      { x: 5, y: 80, w: 10, h: 10, label: 'Bottle', action: 'bottle' },
    ],
  },
  cave: {
    emoji: '🕳️',
    title: 'Dark Cave',
    desc: "The cave is damp and dark. A glowing crystal illuminates a rusted key on the wet ground. Bats hang from the ceiling.",
    hotspots: [
      { x: 40, y: 60, w: 15, h: 15, label: 'Key', action: 'key' },
      { x: 70, y: 30, w: 15, h: 15, label: 'Crystal', action: 'crystal' },
      { x: 5, y: 75, w: 15, h: 15, label: 'Exit', action: 'scene:beach' },
    ],
  },
  jungle: {
    emoji: '🌴',
    title: 'Dense Jungle',
    desc: "Thick foliage blocks most of the light. A parrot perches on a crumbling stone statue. A cliff rises to the north.",
    hotspots: [
      { x: 50, y: 40, w: 18, h: 20, label: 'Statue', action: 'statue' },
      { x: 70, y: 20, w: 15, h: 15, label: 'Parrot', action: 'parrot' },
      { x: 30, y: 10, w: 20, h: 18, label: 'Cliff', action: 'scene:cliff' },
      { x: 5, y: 80, w: 15, h: 15, label: 'Beach', action: 'scene:beach' },
    ],
  },
  cliff: {
    emoji: '🗻',
    title: 'Windy Cliff',
    desc: "High above the island, a locked wooden chest sits at the edge. The wind howls.",
    hotspots: [
      { x: 45, y: 50, w: 20, h: 25, label: 'Chest', action: 'chest' },
      { x: 5, y: 80, w: 15, h: 15, label: 'Jungle', action: 'scene:jungle' },
    ],
  },
  treasure: {
    emoji: '💰',
    title: 'Treasure!',
    desc: "Inside the chest, a pile of gold coins sparkles. You have found the pirate treasure!",
    hotspots: [],
  },
};

const CLUE_SEQUENCE = ['map', 'bottle', 'key', 'crystal', 'statue', 'parrot', 'chest'];

export default function App() {
  const [scene, setScene] = useState<Scene>('beach');
  const [inventory, setInventory] = useState<string[]>([]);
  const [mood, setMood] = useState('Tap objects to investigate. Follow the clues to the treasure.');
  const [clueStep, setClueStep] = useState(0);

  function has(item: string) {
    return inventory.includes(item);
  }

  function addItem(item: string, msg: string) {
    if (!has(item)) {
      setInventory([...inventory, item]);
      setMood(msg);
      setClueStep(s => s + 1);
    }
  }

  function handle(action: string) {
    if (action.startsWith('scene:')) {
      setScene(action.split(':')[1] as Scene);
      return;
    }
    switch (action) {
      case 'map':
        addItem('Map', "An old pirate map. It shows an X at the cliffs.");
        break;
      case 'bottle':
        addItem('Bottle', "A bottle with a note: 'Seek the crystal's light'.");
        break;
      case 'key':
        if (has('Bottle')) {
          addItem('Key', 'A rusty key. Maybe for a chest?');
        } else {
          setMood('You need a clue first. Check the beach carefully.');
        }
        break;
      case 'crystal':
        if (has('Key')) {
          addItem('Crystal Light', "The crystal reveals engravings: 'The statue points the way'.");
        } else {
          setMood('The crystal glows, but you need a tool to take any light.');
        }
        break;
      case 'statue':
        if (has('Crystal Light')) {
          addItem('Statue Hint', "The statue points toward the cliff. A parrot watches nearby.");
        } else {
          setMood("The statue is mysterious. You'll need more light to read its carvings.");
        }
        break;
      case 'parrot':
        if (has('Statue Hint')) {
          addItem('Parrot Feather', "The parrot drops a feather. Cliff ahead!");
        } else {
          setMood("The parrot squawks and flies away.");
        }
        break;
      case 'chest':
        if (has('Key') && has('Parrot Feather')) {
          setScene('treasure');
          setMood('You unlock the chest with the rusty key! Gold!');
        } else {
          setMood('The chest is locked. You need the right tools.');
        }
        break;
    }
  }

  const s = SCENES[scene];

  function restart() {
    setScene('beach');
    setInventory([]);
    setClueStep(0);
    setMood('Tap objects to investigate. Follow the clues to the treasure.');
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col gap-3">
        <div className="text-center">
          <div className="text-steel font-bold text-xl">Pirate Treasure Hunt</div>
          <div className="text-xs text-slate-500">Clues found: {clueStep}/{CLUE_SEQUENCE.length}</div>
        </div>

        <div className="relative aspect-[16/10] rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-b from-navy-700 to-navy-900">
          <div className="absolute inset-0 flex items-center justify-center text-9xl opacity-30">{s.emoji}</div>
          <div className="absolute top-3 left-3 text-lg font-bold text-steel">{s.title}</div>
          {s.hotspots.map((h, i) => (
            <button
              key={i}
              onClick={() => handle(h.action)}
              className="absolute rounded-lg border-2 border-steel/40 hover:border-accent hover:bg-accent/20 transition-all"
              style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
            >
              <span className="absolute -top-5 left-0 text-[10px] text-steel font-bold whitespace-nowrap">{h.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-navy-800/70 border border-white/10 rounded-xl p-3 text-sm text-slate-200">{s.desc}</div>
        <div className="bg-navy-900/70 border border-accent/30 rounded-xl p-3 text-sm text-accent">{mood}</div>

        <div className="bg-navy-800/70 border border-white/10 rounded-xl p-3">
          <div className="text-xs text-slate-500 mb-1">Inventory</div>
          <div className="flex flex-wrap gap-2">
            {inventory.length === 0 && <span className="text-xs text-slate-600">empty</span>}
            {inventory.map(i => (
              <span key={i} className="px-2 py-1 rounded bg-navy-700 text-xs text-steel">{i}</span>
            ))}
          </div>
        </div>

        {scene === 'treasure' && (
          <button onClick={restart} className="py-3 rounded-xl bg-accent text-navy-900 font-bold">Play Again</button>
        )}
      </div>
    </div>
  );
}
