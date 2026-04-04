import { useGameStore } from "../store/gameStore";
import { formatNumber } from "../utils/format";

export function MagiculeDisplay() {
  const magicules = useGameStore((s) => s.magicules);
  const clickPower = useGameStore((s) => s.getClickPower());
  const passivePower = useGameStore((s) => s.getPassivePower());

  return (
    <div className="text-center py-2">
      <div className="text-3xl font-bold text-steel">
        🫧 {formatNumber(magicules)}
      </div>
      <div className="text-sm text-gray-400 mt-1 flex justify-center gap-4">
        <span>{formatNumber(clickPower)}/click</span>
        <span>{formatNumber(passivePower)}/s</span>
      </div>
    </div>
  );
}
