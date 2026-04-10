import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';

const stageEmoji = {
  egg: '🥚',
  baby: '🐣',
  teen: '🐥',
  adult: '🐤',
};

export default function App() {
  const {
    hunger, happiness, hygiene, energy, age, stage, alive, hearts,
    feed, clean, play, sleep, reset, tick,
  } = useGameStore();

  useEffect(() => {
    const id = setInterval(() => tick(0.5), 500);
    return () => clearInterval(id);
  }, [tick]);

  const sick = hunger > 70 || hygiene < 20;
  const petEmoji = stageEmoji[stage];

  let mood = 'Happy!';
  if (!alive) mood = 'Run away...';
  else if (hunger > 70) mood = 'So hungry...';
  else if (hygiene < 30) mood = 'Need a bath!';
  else if (energy < 20) mood = 'Sleepy...';
  else if (happiness < 30) mood = 'Bored...';

  const isSad = !alive || mood !== 'Happy!';

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 pt-16">
        <header className="text-center mb-4">
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-steel">POCKET</span>{' '}
            <span className="text-accent">PET</span>
          </h1>
          <div className="text-xs text-slate-400 mt-1">Stage: {stage.toUpperCase()} · Age: {Math.floor(age)}s</div>
        </header>

        <div className="bg-gradient-to-br from-navy-700 to-navy-800 border-4 border-accent/30 rounded-3xl p-6 shadow-2xl">
          <div className="relative aspect-square bg-navy-900/60 rounded-2xl border-2 border-steel/20 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-20" style={{
              background: 'radial-gradient(circle at 50% 40%, #7ec8e3 0%, transparent 60%)'
            }} />

            <div className="text-center relative">
              <div className={`text-9xl ${!alive ? 'grayscale opacity-60' : isSad ? 'animate-sad' : 'animate-hop'}`}>
                {petEmoji}
              </div>
              <div className={`text-sm font-bold mt-2 ${sick ? 'text-red-400' : 'text-steel'}`}>
                {mood}
              </div>
            </div>

            {hearts.map((h) => (
              <div
                key={h}
                className="absolute left-1/2 bottom-1/3 text-2xl pointer-events-none animate-heart"
              >
                ❤️
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <StatBar label="Hunger" value={100 - hunger} color="bg-orange-500" icon="🍖" />
            <StatBar label="Happy" value={happiness} color="bg-pink-500" icon="😊" />
            <StatBar label="Hygiene" value={hygiene} color="bg-sky-500" icon="🫧" />
            <StatBar label="Energy" value={energy} color="bg-yellow-500" icon="⚡" />
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            <ActionBtn emoji="🍎" label="Feed" onClick={feed} disabled={!alive} />
            <ActionBtn emoji="🫧" label="Clean" onClick={clean} disabled={!alive} />
            <ActionBtn emoji="🎾" label="Play" onClick={play} disabled={!alive} />
            <ActionBtn emoji="💤" label="Sleep" onClick={sleep} disabled={!alive} />
          </div>

          {!alive && (
            <button
              onClick={reset}
              className="w-full mt-4 py-2 rounded-lg bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30"
            >
              Get a new pet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm w-6">{icon}</div>
      <div className="text-[10px] text-slate-400 w-14">{label}</div>
      <div className="flex-1 h-3 bg-navy-900 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <div className="text-[10px] text-slate-500 w-8 text-right">{Math.floor(value)}</div>
    </div>
  );
}

function ActionBtn({ emoji, label, onClick, disabled }: { emoji: string; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="py-2 rounded-lg bg-navy-700/60 border border-steel/20 hover:border-steel/60 hover:bg-navy-700 active:scale-95 transition disabled:opacity-40"
    >
      <div className="text-2xl">{emoji}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
    </button>
  );
}
