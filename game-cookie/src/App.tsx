import { useState, useEffect, useCallback, useRef } from "react";

interface Upgrade {
  name: string;
  emoji: string;
  baseCost: number;
  cps: number; // cookies per second per unit
  count: number;
}

const INITIAL_UPGRADES: Upgrade[] = [
  { name: "Cursor", emoji: "👆", baseCost: 15, cps: 0.1, count: 0 },
  { name: "Grandma", emoji: "👵", baseCost: 100, cps: 1, count: 0 },
  { name: "Farm", emoji: "🌾", baseCost: 1100, cps: 8, count: 0 },
  { name: "Mine", emoji: "⛏️", baseCost: 12000, cps: 47, count: 0 },
  { name: "Factory", emoji: "🏭", baseCost: 130000, cps: 260, count: 0 },
  { name: "Bank", emoji: "🏦", baseCost: 1400000, cps: 1400, count: 0 },
  { name: "Temple", emoji: "⛪", baseCost: 20000000, cps: 7800, count: 0 },
];

function getCost(base: number, count: number): number {
  return Math.floor(base * Math.pow(1.15, count));
}

function fmt(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

interface SaveData {
  cookies: number;
  totalCookies: number;
  upgrades: number[];
  clickPower: number;
}

function loadGame(): SaveData {
  const raw = localStorage.getItem("cookie-save");
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  return { cookies: 0, totalCookies: 0, upgrades: INITIAL_UPGRADES.map(() => 0), clickPower: 1 };
}

function saveGame(data: SaveData) {
  localStorage.setItem("cookie-save", JSON.stringify(data));
}

interface FloatText { id: number; x: number; y: number; text: string; }

export default function App() {
  const save = loadGame();
  const [cookies, setCookies] = useState(save.cookies);
  const [totalCookies, setTotalCookies] = useState(save.totalCookies);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(
    INITIAL_UPGRADES.map((u, i) => ({ ...u, count: save.upgrades[i] || 0 }))
  );
  const [clickPower, setClickPower] = useState(save.clickPower);
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [popping, setPopping] = useState(false);
  const floatIdRef = useRef(0);
  const cookieRef = useRef<HTMLDivElement>(null);

  /* CPS calculation */
  const cps = upgrades.reduce((sum, u) => sum + u.cps * u.count, 0);

  /* Auto-generate cookies */
  useEffect(() => {
    const interval = setInterval(() => {
      if (cps > 0) {
        setCookies(c => c + cps / 10);
        setTotalCookies(t => t + cps / 10);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [cps]);

  /* Save every 5s */
  useEffect(() => {
    const interval = setInterval(() => {
      saveGame({
        cookies,
        totalCookies,
        upgrades: upgrades.map(u => u.count),
        clickPower,
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [cookies, totalCookies, upgrades, clickPower]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    setCookies(c => c + clickPower);
    setTotalCookies(t => t + clickPower);
    setPopping(true);
    setTimeout(() => setPopping(false), 100);

    const rect = cookieRef.current?.getBoundingClientRect();
    if (rect) {
      const id = floatIdRef.current++;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setFloats(f => [...f, { id, x, y, text: `+${clickPower}` }]);
      setTimeout(() => setFloats(f => f.filter(fl => fl.id !== id)), 800);
    }
  }, [clickPower]);

  const buyUpgrade = useCallback((idx: number) => {
    const u = upgrades[idx];
    const cost = getCost(u.baseCost, u.count);
    if (cookies < cost) return;
    setCookies(c => c - cost);
    setUpgrades(prev => prev.map((up, i) =>
      i === idx ? { ...up, count: up.count + 1 } : up
    ));
  }, [upgrades, cookies]);

  const resetGame = useCallback(() => {
    setCookies(0);
    setTotalCookies(0);
    setUpgrades(INITIAL_UPGRADES.map(u => ({ ...u, count: 0 })));
    setClickPower(1);
    localStorage.removeItem("cookie-save");
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 w-full max-w-3xl mx-auto">
      {/* Left: Cookie */}
      <div className="flex flex-col items-center gap-3 flex-1">
        <a href="/AlyraGames/" className="text-steel text-sm hover:underline self-start">&larr; Hub</a>
        <h1 className="text-2xl font-black text-steel">COOKIE FACTORY</h1>
        <p className="text-3xl font-bold text-accent">{fmt(cookies)} cookies</p>
        <p className="text-sm text-slate-400">per second: {cps.toFixed(1)}</p>

        <div ref={cookieRef} className="relative" onClick={handleClick} style={{ cursor: "pointer" }}>
          <div className={`text-8xl select-none ${popping ? "cookie-pop" : ""}`}>
            🍪
          </div>
          {floats.map(f => (
            <div key={f.id} className="float-text" style={{ left: f.x, top: f.y }}>
              {f.text}
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500">Click power: {clickPower}</p>
        <button onClick={resetGame} className="text-xs text-red-400/60 hover:text-red-400 mt-4">
          Reset All
        </button>
      </div>

      {/* Right: Upgrades */}
      <div className="flex flex-col gap-2 w-full md:w-72">
        <h2 className="text-lg font-bold text-steel">Upgrades</h2>
        {upgrades.map((u, i) => {
          const cost = getCost(u.baseCost, u.count);
          const canBuy = cookies >= cost;
          return (
            <button key={u.name} onClick={() => buyUpgrade(i)}
              disabled={!canBuy}
              className={`flex items-center gap-3 p-3 rounded-lg border transition
                ${canBuy
                  ? "bg-navy-700 border-accent/30 hover:border-accent/60 cursor-pointer"
                  : "bg-navy-900 border-white/5 opacity-50 cursor-not-allowed"}`}>
              <span className="text-2xl">{u.emoji}</span>
              <div className="text-left flex-1">
                <div className="font-bold text-sm">{u.name} <span className="text-slate-400 text-xs">x{u.count}</span></div>
                <div className="text-xs text-slate-400">{u.cps} CPS each</div>
              </div>
              <span className="text-sm font-bold text-accent">{fmt(cost)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
