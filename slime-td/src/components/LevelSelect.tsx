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
  onEndless: () => void;
}

export default function LevelSelect({ onSelect, onEndless }: Props) {
  const { completed, completedHard, completedNoHit, highestUnlocked, endlessScores } = useProgressStore();
  const totalDone = completed.length;
  const totalHard = completedHard.length;
  const allCompleted = LEVELS.every((l) => completed.includes(l.id));
  const bestEndless = endlessScores.length > 0 ? endlessScores[0] : null;

  return (
    <div className="h-full bg-navy-900 flex flex-col">
      {/* Hero header */}
      <div className="relative text-center pt-8 pb-6 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-navy-900 to-navy-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
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
              <span>Progress</span>
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
                  <span className="text-red-400">Hard</span>
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

          {allCompleted && (
            <div className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 inline-block">
              {"\u{1F9CA}"} Rimuru unlocked! Hard Mode available!
            </div>
          )}
        </div>
      </div>

      {/* Level list */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
        {/* ── Endless mode card ── */}
        <button
          onClick={onEndless}
          className="level-card w-full text-left rounded-xl p-4 border transition-all
            bg-gradient-to-r from-purple-900/40 to-navy-800/60 border-purple-500/40 shadow-lg shadow-purple-500/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-purple-500/10">
              {"\u{267E}\u{FE0F}"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-purple-300">Endless Mode</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Infinite waves of increasing difficulty. All towers available.
              </p>
              {bestEndless && (
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {"\u{1F3C6}"} Record: Wave {bestEndless.wave} ({bestEndless.kills} kills)
                  </span>
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-purple-400">{"\u221E"} waves</div>
              <div className="text-xs text-red-400/70 mt-0.5">
                {"\u{2764}\u{FE0F}"} 20
              </div>
              <div className="text-xs text-yellow-400/70 mt-0.5">
                300G
              </div>
            </div>
          </div>
        </button>

        {/* ── Leaderboard (if scores exist) ── */}
        {endlessScores.length > 0 && (
          <div className="rounded-xl border border-purple-500/20 bg-navy-800/50 p-3">
            <h3 className="text-sm font-bold text-purple-300 mb-2">{"\u{1F3C6}"} Endless Leaderboard</h3>
            <div className="space-y-1">
              {endlessScores.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-5 text-center font-bold ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-gray-500"}`}>
                    {i + 1}.
                  </span>
                  <span className="text-white font-medium">Wave {s.wave}</span>
                  <span className="text-gray-500">{s.kills} kills</span>
                  <span className="ml-auto text-gray-600">{s.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Level cards ── */}
        {LEVELS.map((lvl) => {
          const unlocked = lvl.id <= highestUnlocked;
          const done = completed.includes(lvl.id);
          const doneHard = completedHard.includes(lvl.id);
          const doneNoHit = completedNoHit.includes(lvl.id);
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
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
                    ${done ? "bg-green-500/10" : unlocked ? "bg-steel/10" : "bg-gray-800/50"}`}>
                    {unlocked ? icon : "\u{1F512}"}
                  </div>

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
                      {doneNoHit && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">
                          {"\u{2B50}"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{lvl.subtitle}</p>

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

                  <div className="text-right shrink-0">
                    <div className="text-xs text-gray-500">{lvl.waves.length} waves</div>
                    <div className="text-xs text-red-400/70 mt-0.5">
                      {"\u{2764}\u{FE0F}"} {lvl.lives}
                    </div>
                    <div className="text-xs text-yellow-400/70 mt-0.5">
                      {lvl.startGold}G
                    </div>
                  </div>
                </div>
              </button>

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
                    <span className="text-red-400 font-bold">{"\u{2620}\u{FE0F}"} Hard</span>
                    <span className="text-gray-500 text-xs">
                      1.8x HP, +armor, +speed, -lives, all towers
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
