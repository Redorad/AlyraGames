import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";

export function EventLog() {
  const eventLog = useGameStore((s) => s.eventLog);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [eventLog]);

  return (
    <div className="border-t border-navy-700 glass-dark">
      <div className="px-3 py-1 text-xs text-accent font-semibold">
        🧠 Great Sage — Event Log
      </div>
      <div
        ref={scrollRef}
        className="h-24 overflow-y-auto px-3 pb-2 text-xs text-gray-400 space-y-0.5"
      >
        {eventLog.map((msg, i) => (
          <div key={i} className={msg.startsWith("✦") ? "text-yellow-400 font-semibold" : ""}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
