import { useMemo } from "react";

const PARTICLE_COLORS = [
  "rgba(126,200,227,0.6)",  // steel blue
  "rgba(167,139,250,0.5)",  // accent purple
  "rgba(251,191,36,0.4)",   // gold
  "rgba(200,230,255,0.5)",  // ice blue
  "rgba(180,140,255,0.4)",  // lavender
];

export function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 6 + Math.random() * 8,
        size: 2 + Math.random() * 3,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        isStar: Math.random() < 0.3,
        twinkleDelay: Math.random() * 3,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) =>
        p.isStar ? (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.left}%`,
              width: p.size + 2,
              height: p.size + 2,
              animation: `sparkleFloat ${p.duration}s linear ${p.delay}s infinite`,
            }}
          >
            {/* 4-point star shape */}
            <div
              style={{
                width: "100%",
                height: "100%",
                background: p.color,
                clipPath: "polygon(50% 0%, 60% 35%, 100% 50%, 60% 65%, 50% 100%, 40% 65%, 0% 50%, 40% 35%)",
                animation: `pulseGlow ${1.5 + p.twinkleDelay}s ease-in-out infinite`,
              }}
            />
          </div>
        ) : (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              animation: `particleFloat ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        )
      )}
    </div>
  );
}
