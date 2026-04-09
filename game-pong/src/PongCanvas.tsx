import { useEffect, useRef, useCallback } from "react";
import { useStore, Difficulty } from "./store";
import { playHit, playWallBounce, playScore } from "./audio";

/* ---------- constants ---------- */
const GAME_W = 800;
const GAME_H = 500;
const PADDLE_W = 12;
const PADDLE_H = 80;
const BALL_R = 8;
const PADDLE_MARGIN = 20;
const BALL_SPEED_INIT = 340;
const BALL_SPEED_INC = 18;
const BALL_MAX_SPEED = 750;
const PADDLE_SPEED = 480;
const WINNING_SCORE = 11;

/* neon colours */
const COL_BG = "#0a0e27";
const COL_LINE = "rgba(126,200,227,0.18)";
const COL_PADDLE_PLAYER = "#7ec8e3";
const COL_PADDLE_AI = "#a78bfa";
const COL_BALL = "#ffffff";
const COL_SCORE = "rgba(126,200,227,0.35)";
const COL_GLOW_BALL = "rgba(126,200,227,0.6)";

/* AI reaction speed (fraction of frame, higher = faster reaction) */
const AI_SPEED: Record<Difficulty, number> = {
  easy: 0.25,
  medium: 0.55,
  hard: 0.88,
};

/* trail position */
interface TrailDot {
  x: number;
  y: number;
  age: number;
}

export default function PongCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const difficulty = useStore((s) => s.difficulty);
  const soundOn = useStore((s) => s.soundOn);
  const screen = useStore((s) => s.screen);
  const addPlayerScore = useStore((s) => s.addPlayerScore);
  const addAiScore = useStore((s) => s.addAiScore);
  const playerScore = useStore((s) => s.playerScore);
  const aiScore = useStore((s) => s.aiScore);

  /* refs for mutable game state (avoids re-render) */
  const state = useRef({
    ballX: GAME_W / 2,
    ballY: GAME_H / 2,
    ballVX: 0,
    ballVY: 0,
    playerY: GAME_H / 2,
    aiY: GAME_H / 2,
    trail: [] as TrailDot[],
    serving: true,
    serveTimer: 0,
    keysDown: new Set<string>(),
    mouseY: -1,
    touchY: -1,
    useMouseControl: false,
    lastTime: 0,
    animId: 0,
    scoreFlash: 0,
  });

  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  const screenRef = useRef(screen);
  screenRef.current = screen;

  const diffRef = useRef(difficulty);
  diffRef.current = difficulty;

  const playerScoreRef = useRef(playerScore);
  playerScoreRef.current = playerScore;

  const aiScoreRef = useRef(aiScore);
  aiScoreRef.current = aiScore;

  /* serve the ball */
  const serveBall = useCallback(() => {
    const s = state.current;
    s.ballX = GAME_W / 2;
    s.ballY = GAME_H / 2;
    const angle = (Math.random() * 0.8 - 0.4); // -0.4..0.4 rad
    const dir = Math.random() < 0.5 ? 1 : -1;
    s.ballVX = Math.cos(angle) * BALL_SPEED_INIT * dir;
    s.ballVY = Math.sin(angle) * BALL_SPEED_INIT;
    s.serving = false;
    s.trail = [];
  }, []);

  /* reset positions for new round */
  const resetRound = useCallback(() => {
    const s = state.current;
    s.ballX = GAME_W / 2;
    s.ballY = GAME_H / 2;
    s.ballVX = 0;
    s.ballVY = 0;
    s.serving = true;
    s.serveTimer = 0.8;
    s.trail = [];
  }, []);

  /* canvas scaling helper */
  const getScale = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    return canvas.width / GAME_W;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d")!;
    const s = state.current;

    /* --- sizing --- */
    function resize() {
      const cw = container!.clientWidth;
      const ch = container!.clientHeight;
      const scaleX = cw / GAME_W;
      const scaleY = ch / GAME_H;
      const scale = Math.min(scaleX, scaleY);
      const w = Math.floor(GAME_W * scale);
      const h = Math.floor(GAME_H * scale);
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      canvas!.width = GAME_W * 2; // 2x for retina
      canvas!.height = GAME_H * 2;
    }
    resize();
    window.addEventListener("resize", resize);

    /* --- input --- */
    function onKey(e: KeyboardEvent) {
      if (e.key === "w" || e.key === "W" || e.key === "s" || e.key === "S" ||
          e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        s.useMouseControl = false;
      }
      if (e.type === "keydown") s.keysDown.add(e.key.toLowerCase());
      else s.keysDown.delete(e.key.toLowerCase());
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const scale = rect.height / GAME_H;
      s.mouseY = (e.clientY - rect.top) / scale;
      s.useMouseControl = true;
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      const scale = rect.height / GAME_H;
      const touch = e.touches[0];
      s.touchY = (touch.clientY - rect.top) / scale;
      s.useMouseControl = true;
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      const scale = rect.height / GAME_H;
      const touch = e.touches[0];
      s.touchY = (touch.clientY - rect.top) / scale;
      s.useMouseControl = true;
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });

    /* init */
    s.playerY = GAME_H / 2;
    s.aiY = GAME_H / 2;
    resetRound();

    /* --- game loop --- */
    s.lastTime = performance.now();

    function loop(now: number) {
      s.animId = requestAnimationFrame(loop);

      if (screenRef.current !== "playing") {
        s.lastTime = now;
        return;
      }

      const rawDt = (now - s.lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05); // cap to avoid spiral
      s.lastTime = now;

      /* serve timer */
      if (s.serving) {
        s.serveTimer -= dt;
        if (s.serveTimer <= 0) serveBall();
      }

      /* ---- player paddle ---- */
      if (s.useMouseControl) {
        const target = s.touchY >= 0 ? s.touchY : s.mouseY;
        if (target >= 0) {
          const diff = target - s.playerY;
          const maxMove = PADDLE_SPEED * 2 * dt;
          s.playerY += Math.sign(diff) * Math.min(Math.abs(diff), maxMove);
        }
      } else {
        if (s.keysDown.has("w") || s.keysDown.has("arrowup")) s.playerY -= PADDLE_SPEED * dt;
        if (s.keysDown.has("s") || s.keysDown.has("arrowdown")) s.playerY += PADDLE_SPEED * dt;
      }
      s.playerY = Math.max(PADDLE_H / 2, Math.min(GAME_H - PADDLE_H / 2, s.playerY));

      /* ---- AI paddle ---- */
      const aiReact = AI_SPEED[diffRef.current];
      const aiTarget = s.ballY;
      const aiDiff = aiTarget - s.aiY;
      const aiMaxMove = PADDLE_SPEED * aiReact * dt;
      s.aiY += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), aiMaxMove);
      s.aiY = Math.max(PADDLE_H / 2, Math.min(GAME_H - PADDLE_H / 2, s.aiY));

      /* ---- ball physics ---- */
      if (!s.serving) {
        s.ballX += s.ballVX * dt;
        s.ballY += s.ballVY * dt;

        /* trail */
        s.trail.push({ x: s.ballX, y: s.ballY, age: 0 });
        if (s.trail.length > 18) s.trail.shift();
        for (const t of s.trail) t.age += dt;

        /* top/bottom walls */
        if (s.ballY - BALL_R < 0) {
          s.ballY = BALL_R;
          s.ballVY = Math.abs(s.ballVY);
          if (soundRef.current) playWallBounce();
        }
        if (s.ballY + BALL_R > GAME_H) {
          s.ballY = GAME_H - BALL_R;
          s.ballVY = -Math.abs(s.ballVY);
          if (soundRef.current) playWallBounce();
        }

        /* paddle collision - player (left) */
        const plLeft = PADDLE_MARGIN;
        const plRight = PADDLE_MARGIN + PADDLE_W;
        const plTop = s.playerY - PADDLE_H / 2;
        const plBot = s.playerY + PADDLE_H / 2;

        if (
          s.ballVX < 0 &&
          s.ballX - BALL_R <= plRight &&
          s.ballX + BALL_R >= plLeft &&
          s.ballY + BALL_R >= plTop &&
          s.ballY - BALL_R <= plBot
        ) {
          s.ballX = plRight + BALL_R;
          const hitPos = (s.ballY - s.playerY) / (PADDLE_H / 2); // -1..1
          const angle = hitPos * (Math.PI / 3.5);
          const speed = Math.min(
            Math.sqrt(s.ballVX * s.ballVX + s.ballVY * s.ballVY) + BALL_SPEED_INC,
            BALL_MAX_SPEED
          );
          s.ballVX = Math.cos(angle) * speed;
          s.ballVY = Math.sin(angle) * speed;
          if (soundRef.current) playHit();
        }

        /* paddle collision - AI (right) */
        const arLeft = GAME_W - PADDLE_MARGIN - PADDLE_W;
        const arRight = GAME_W - PADDLE_MARGIN;
        const arTop = s.aiY - PADDLE_H / 2;
        const arBot = s.aiY + PADDLE_H / 2;

        if (
          s.ballVX > 0 &&
          s.ballX + BALL_R >= arLeft &&
          s.ballX - BALL_R <= arRight &&
          s.ballY + BALL_R >= arTop &&
          s.ballY - BALL_R <= arBot
        ) {
          s.ballX = arLeft - BALL_R;
          const hitPos = (s.ballY - s.aiY) / (PADDLE_H / 2);
          const angle = Math.PI - hitPos * (Math.PI / 3.5);
          const speed = Math.min(
            Math.sqrt(s.ballVX * s.ballVX + s.ballVY * s.ballVY) + BALL_SPEED_INC,
            BALL_MAX_SPEED
          );
          s.ballVX = Math.cos(angle) * speed;
          s.ballVY = Math.sin(angle) * speed;
          if (soundRef.current) playHit();
        }

        /* scoring */
        if (s.ballX < -BALL_R * 2) {
          if (soundRef.current) playScore();
          addAiScore();
          s.scoreFlash = 0.5;
          if (aiScoreRef.current + 1 < WINNING_SCORE) resetRound();
        }
        if (s.ballX > GAME_W + BALL_R * 2) {
          if (soundRef.current) playScore();
          addPlayerScore();
          s.scoreFlash = 0.5;
          if (playerScoreRef.current + 1 < WINNING_SCORE) resetRound();
        }
      }

      /* score flash */
      if (s.scoreFlash > 0) s.scoreFlash -= dt;

      /* ---- draw ---- */
      const sx = 2; // scale for retina
      ctx.setTransform(sx, 0, 0, sx, 0, 0);

      /* bg */
      ctx.fillStyle = COL_BG;
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      /* center dashed line */
      ctx.strokeStyle = COL_LINE;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(GAME_W / 2, 0);
      ctx.lineTo(GAME_W / 2, GAME_H);
      ctx.stroke();
      ctx.setLineDash([]);

      /* scores */
      ctx.fillStyle = COL_SCORE;
      ctx.font = "bold 72px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(String(playerScoreRef.current), GAME_W / 2 - 80, 20);
      ctx.fillText(String(aiScoreRef.current), GAME_W / 2 + 80, 20);

      /* player paddle (left) - neon glow */
      ctx.shadowColor = COL_PADDLE_PLAYER;
      ctx.shadowBlur = 15;
      ctx.fillStyle = COL_PADDLE_PLAYER;
      ctx.fillRect(
        PADDLE_MARGIN,
        s.playerY - PADDLE_H / 2,
        PADDLE_W,
        PADDLE_H
      );
      ctx.shadowBlur = 0;

      /* AI paddle (right) - neon glow */
      ctx.shadowColor = COL_PADDLE_AI;
      ctx.shadowBlur = 15;
      ctx.fillStyle = COL_PADDLE_AI;
      ctx.fillRect(
        GAME_W - PADDLE_MARGIN - PADDLE_W,
        s.aiY - PADDLE_H / 2,
        PADDLE_W,
        PADDLE_H
      );
      ctx.shadowBlur = 0;

      /* ball trail */
      for (let i = 0; i < s.trail.length; i++) {
        const t = s.trail[i];
        const alpha = ((i + 1) / s.trail.length) * 0.4;
        const r = BALL_R * ((i + 1) / s.trail.length) * 0.7;
        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(126,200,227,${alpha})`;
        ctx.fill();
      }

      /* ball with glow */
      if (!s.serving) {
        ctx.shadowColor = COL_GLOW_BALL;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2);
        ctx.fillStyle = COL_BALL;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      /* serve countdown indicator */
      if (s.serving && s.serveTimer > 0) {
        ctx.fillStyle = "rgba(126,200,227,0.5)";
        ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Get Ready", GAME_W / 2, GAME_H / 2);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    s.animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(s.animId);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("resize", resize);
    };
  }, [serveBall, resetRound, addPlayerScore, addAiScore, getScale]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="rounded-lg"
        style={{ cursor: "none", touchAction: "none" }}
      />
    </div>
  );
}
