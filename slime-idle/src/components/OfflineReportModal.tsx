import { useEffect, useState } from "react";
import { formatNumber, formatTime } from "../utils/format";

interface Props {
  offlineSeconds: number;
  earned: number;
  onClose: () => void;
}

export function OfflineReportModal({ offlineSeconds, earned, onClose }: Props) {
  const [visible, setVisible] = useState(true);
  const [displayEarned, setDisplayEarned] = useState(0);

  // Animate the earned number counting up
  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayEarned(earned * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setDisplayEarned(earned);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [earned]);

  // Auto-close after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 10_000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  function handleCollect() {
    setVisible(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
      <div className="glass border border-accent/30 rounded-2xl p-6 max-w-xs w-full text-center">
        <h2 className="gradient-text text-2xl font-bold mb-4">Welcome Back!</h2>

        <div className="text-sm text-gray-400 mb-1">You were away for</div>
        <div className="text-white text-lg font-semibold mb-4">
          {formatTime(offlineSeconds)}
        </div>

        <div className="bg-navy-900/60 rounded-xl p-4 mb-4 border border-steel/10">
          <div className="text-xs text-gray-500 mb-1">Magicules earned</div>
          <div className="text-3xl font-bold gradient-text tabular-nums">
            +{formatNumber(displayEarned)}
          </div>
        </div>

        <button
          onClick={handleCollect}
          className="w-full py-3 bg-accent/20 text-accent rounded-xl text-sm font-bold border border-accent/30 hover:bg-accent/30 active:scale-95 transition-all shimmer-btn"
        >
          Collect
        </button>

        <div className="mt-3 text-xs text-gray-600">Auto-closes in 10s</div>
      </div>
    </div>
  );
}
