import { useEffect, useRef, useState } from "react";

const COLORS = [
  "#ffffff",
  "#7ec8e3",
  "#a78bfa",
  "#f87171",
  "#fbbf24",
  "#4ade80",
  "#60a5fa",
  "#f472b6",
  "#fb923c",
  "#000000",
];

const SIZES = [2, 5, 10, 20, 40];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState<string>("#a78bfa");
  const [size, setSize] = useState<number>(5);
  const [eraser, setEraser] = useState<boolean>(false);
  const [drawing, setDrawing] = useState<boolean>(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const prev = document.createElement("canvas");
      prev.width = canvas.width;
      prev.height = canvas.height;
      const prevCtx = prev.getContext("2d");
      if (prevCtx && canvas.width > 0 && canvas.height > 0) {
        prevCtx.drawImage(canvas, 0, 0);
      }

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.fillStyle = "#0a0e27";
        ctx.fillRect(0, 0, rect.width, rect.height);
        if (prev.width > 0) {
          ctx.drawImage(prev, 0, 0, rect.width, rect.height);
        }
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0] || e.changedTouches[0];
      if (!t) return null;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    if (!pos) return;
    setDrawing(true);
    lastPoint.current = pos;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = eraser ? "#0a0e27" : color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    if (!pos || !lastPoint.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.strokeStyle = eraser ? "#0a0e27" : color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
  };

  const endDraw = () => {
    setDrawing(false);
    lastPoint.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#0a0e27";
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const savePNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="w-full h-full flex flex-col bg-navy-900 p-2">
      <div className="flex items-center justify-between px-2 py-1 mb-2 gap-2 flex-wrap">
        <h1 className="text-lg sm:text-xl font-black tracking-tight">
          <span className="text-steel">DRAWING</span>
          <span className="text-accent"> PAD</span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={savePNG}
            className="px-3 py-1.5 rounded-lg bg-accent text-navy-900 font-bold text-xs uppercase hover:brightness-110"
          >
            Save PNG
          </button>
          <button
            onClick={clear}
            className="px-3 py-1.5 rounded-lg bg-red-500 text-white font-bold text-xs uppercase hover:brightness-110"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 bg-navy-800 rounded-xl border border-white/5 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
        />
      </div>

      <div className="mt-2 flex items-center gap-2 flex-wrap justify-center bg-navy-800 rounded-xl p-2 border border-white/5">
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setEraser(false);
              }}
              className="w-7 h-7 rounded-full border-2 transition-transform"
              style={{
                background: c,
                borderColor: !eraser && color === c ? "#a78bfa" : "rgba(255,255,255,0.1)",
                transform: !eraser && color === c ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>
        <div className="h-6 w-px bg-white/10 mx-1" />
        <div className="flex gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-navy-700 border transition"
              style={{ borderColor: size === s ? "#a78bfa" : "rgba(255,255,255,0.08)" }}
            >
              <div
                className="rounded-full"
                style={{
                  width: Math.min(s, 18),
                  height: Math.min(s, 18),
                  background: eraser ? "#e2e8f0" : color,
                }}
              />
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-white/10 mx-1" />
        <button
          onClick={() => setEraser((e) => !e)}
          className="px-3 py-1.5 rounded-lg font-bold text-xs uppercase transition"
          style={{
            background: eraser ? "#a78bfa" : "#1a2050",
            color: eraser ? "#0a0e27" : "#e2e8f0",
          }}
        >
          Eraser
        </button>
      </div>
    </div>
  );
}
