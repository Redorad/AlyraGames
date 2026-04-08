import { LEVELS } from "../data/levels";
import { getAvailableTowers } from "../data/towers";
import { useProgressStore } from "../store/gameStore";

const TOWER_EMOJI: Record<string, string> = {
  goblin: "\u{1F3F9}", ranga: "\u{1F43A}", shion: "\u{2694}\u{FE0F}",
  benimaru: "\u{1F525}", souei: "\u{1F578}\u{FE0F}", shuna: "\u{1F338}",
  hakurou: "\u{1F3AF}", geld: "\u{1F6E1}\u{FE0F}", diablo: "\u{1F608}",
  rimuru: "\u{1F9CA}",
};

const LEVEL_ICONS = [
  "\u{1F332}", "\u{2694}\u{FE0F}", "\u{1F479}", "\u{1F525}", "\u{1F47B}",
  "\u{1F91D}", "\u{1F3AD}", "\u{1F6E1}\u{FE0F}", "\u{1F47F}", "\u{1F30A}",
];

interface Props {
  onSelect: (levelId: number, hard: boolean) => void;
}

export default function LevelSelect({ onSelect }: Props) {
  const { completed, completedHard, highestUnlocked } = useProgressStore();
  const totalDone = completed.length;
  const totalHard = completedHard.length;
  const allCompleted = LEVELS.every((l) => completed.includes(l.id));

  return (
    <div className="h-full bg-navy-900 flex flex-col">
      {/* Hero header */}
      <div className="relative text-center pt-8 pb-6 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-navy-900 to-navy-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
          {/* Slime icon */}
          <div className="text-5xl mb-3">{"\u{1F9CA}"}</div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-steel">SLIME</span>{" "}
            <span className="text-accent">TD</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1.5">
            Tower Defense — Tensei Shitara Slime Datta Ken
          </p>

          {/* Progress bar */}
          <div className="mt-4 max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progression</span>
              <span>{totalDone}/{LEVELS.length}</span>
            </div>
            <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-steel to-accent rounded-full transition-all duration-500"
                style={{ width: `${(totalDone / LEVELS.length) * 100}%` }}
              />
            </div>
            {totalHard > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="text-red-400">Difficile</span>
                  <span className="text-red-400">{totalHard}/{LEVELS.length}</span>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${(totalHard / LEVELS.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rimuru unlock banner */}
          {allCompleted && (
            <div className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 inline-block">
              {"\u{1F9CA}"} Rimuru d&eacute;bloqu&eacute; ! Mode Difficile disponible !
            </div>
          )}
        </div>
      </div>

      {/* Level list */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
        {LEVELS.map((lvl) => {
          const unlocked = lvl.id <= highestUnlocked;
          const done = completed.includes(lvl.id);
          const doneHard = completedHard.includes(lvl.id);
          const newTowers = getAvailableTowers(lvl.id).filter(
            (t) => t.unlockLevel === lvl.id,
          );
          const icon = LEVEL_ICONS[lvl.id - 1] ?? "\u{2B50}";

          return (
            <div key={lvl.id} className="space-y-1.5">
              <button
                disabled={!unlocked}
                onClick={() => unlocked && onSelect(lvl.id, false)}
                className={`level-card w-full text-left rounded-xl p-4 border transition-all
                  ${
                    unlocked
                      ? done
                        ? "bg-gradient-to-r from-navy-700/80 to-navy-800/60 border-green-500/40 shadow-lg shadow-green-500/5"
                        : "bg-gradient-to-r from-navy-800 to-navy-700/50 border-steel/20 shadow-lg shadow-steel/5"
                      : "bg-navy-900/50 border-gray-700/20 opacity-30 cursor-not-allowed"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Level icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
                    ${done ? "bg-green-500/10" : unlocked ? "bg-steel/10" : "bg-gray-800/50"}`}>
                    {unlocked ? icon : "\u{1F512}"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        {lvl.id}. {lvl.name}
                      </span>
                      {done && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                          {"\u{2713}"}
                        </span>
                      )}
                      {doneHard && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                          {"\u{2620}\u{FE0F}"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{lvl.subtitle}</p>

                    {/* New towers */}
                    {newTowers.length > 0 && unlocked && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {newTowers.map((t) => (
                          <span
                            key={t.id}
                            className="text-xs px-2 py-0.5 rounded-full border flex items-center gap-1"
                            style={{
                              borderColor: t.color + "60",
                              color: t.color,
                              backgroundColor: `${t.color}15`,
                            }}
                          >
                            {TOWER_EMOJI[t.id] ?? ""} {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <div className="text-xs text-gray-500">{lvl.waves.length} vagues</div>
                    <div className="text-xs text-red-400/70 mt-0.5">
                      {"\u{2764}\u{FE0F}"} {lvl.lives}
                    </div>
                    <div className="text-xs text-yellow-400/70 mt-0.5">
                      {lvl.startGold}G
                    </div>
                  </div>
                </div>
              </button>

              {/* Hard mode button — shown only when level is completed normally */}
              {done && (
                <button
                  onClick={() => onSelect(lvl.id, true)}
                  className={`w-full text-left rounded-lg px-4 py-2 border transition-all text-sm
                    ${doneHard
                      ? "bg-gradient-to-r from-red-900/30 to-navy-800/60 border-red-500/40"
                      : "bg-gradient-to-r from-navy-800 to-navy-900/80 border-red-500/20 hover:border-red-500/40"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">{"\u{2620}\u{FE0F}"} Difficile</span>
                    <span className="text-gray-500 text-xs">
                      1.8x PV, +armure, +vitesse, -vies, toutes les tours
                    </span>
                    {doneHard && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                        {"\u{2713}"}
                      </span>
                    )}
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
