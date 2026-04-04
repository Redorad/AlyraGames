import { useEffect, useRef, useState } from "react";
import { formatNumber } from "../utils/format";

interface Props {
  value: number;
  className?: string;
  prefix?: string;
}

export function AnimatedNumber({ value, className = "", prefix = "" }: Props) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;

    // Skip animation for tiny changes or first render
    if (Math.abs(to - from) < 0.01 || from === 0) {
      setDisplay(to);
      return;
    }

    const startTime = performance.now();
    const duration = 300; // ms

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(to);
      }
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value]);

  return <span className={className}>{prefix}{formatNumber(display)}</span>;
}
