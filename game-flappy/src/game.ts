/* ===== Flappy Clone - Canvas Game Engine ===== */

// ---------- Constants ----------
const GRAVITY = 1400; // px/s^2
const FLAP_VEL = -420; // px/s
const PIPE_SPEED = 180; // px/s
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPAWN_DIST = 220; // horizontal distance between pipes
const BIRD_RADIUS = 18;
const GROUND_HEIGHT = 60;
const CLOUD_COUNT = 6;

// ---------- Types ----------
interface Bird {
  x: number;
  y: number;
  vel: number;
  rotation: number;
}

interface Pipe {
  x: number;
  gapY: number; // center of the gap
  scored: boolean;
}

interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  opacity: number;
}

export interface GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  bird: Bird;
  pipes: Pipe[];
  clouds: Cloud[];
  groundOffset: number;
  score: number;
  state: "menu" | "playing" | "gameover";
  lastTime: number;
  animFrame: number;
  onScoreChange: (s: number) => void;
  onGameOver: () => void;
  flashTimer: number;
}

// ---------- Helpers ----------
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function randomRange(lo: number, hi: number) {
  return lo + Math.random() * (hi - lo);
}

// Day/night sky colors based on score
function getSkyColors(score: number): { top: string; bottom: string } {
  // Cycle: day 0-14, sunset 15-29, night 30-44, sunrise 45-59, then repeat
  const cycle = score % 60;
  if (cycle < 15) {
    // Day
    const t = cycle / 14;
    return {
      top: lerpColor("#4a90d9", "#e8734a", t * 0.2),
      bottom: lerpColor("#87ceeb", "#f0c27f", t * 0.2),
    };
  } else if (cycle < 30) {
    // Sunset
    const t = (cycle - 15) / 14;
    return {
      top: lerpColor("#4a6fa5", "#0a0e27", t),
      bottom: lerpColor("#e8734a", "#1a2050", t),
    };
  } else if (cycle < 45) {
    // Night
    return { top: "#0a0e27", bottom: "#111640" };
  } else {
    // Sunrise
    const t = (cycle - 45) / 14;
    return {
      top: lerpColor("#0a0e27", "#4a90d9", t),
      bottom: lerpColor("#111640", "#87ceeb", t),
    };
  }
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(lerp(pa.r, pb.r, t));
  const g = Math.round(lerp(pa.g, pb.g, t));
  const bl = Math.round(lerp(pa.b, pb.b, t));
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// ---------- Init ----------
function initClouds(w: number, h: number): Cloud[] {
  const clouds: Cloud[] = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push({
      x: Math.random() * w,
      y: randomRange(20, h * 0.45),
      w: randomRange(60, 140),
      h: randomRange(25, 50),
      speed: randomRange(15, 40),
      opacity: randomRange(0.15, 0.35),
    });
  }
  return clouds;
}

export function createEngine(
  canvas: HTMLCanvasElement,
  onScoreChange: (s: number) => void,
  onGameOver: () => void
): GameEngine {
  const ctx = canvas.getContext("2d")!;
  const width = canvas.width;
  const height = canvas.height;

  return {
    canvas,
    ctx,
    width,
    height,
    bird: {
      x: width * 0.25,
      y: height * 0.45,
      vel: 0,
      rotation: 0,
    },
    pipes: [],
    clouds: initClouds(width, height),
    groundOffset: 0,
    score: 0,
    state: "menu",
    lastTime: 0,
    animFrame: 0,
    onScoreChange,
    onGameOver,
    flashTimer: 0,
  };
}

// ---------- Actions ----------
export function flap(e: GameEngine) {
  if (e.state === "menu") {
    startGame(e);
  }
  if (e.state === "playing") {
    e.bird.vel = FLAP_VEL;
  }
}

function startGame(e: GameEngine) {
  e.state = "playing";
  e.score = 0;
  e.bird.y = e.height * 0.45;
  e.bird.vel = FLAP_VEL;
  e.bird.rotation = 0;
  e.pipes = [];
  e.flashTimer = 0;
  e.onScoreChange(0);
  // Spawn first pipe
  spawnPipe(e);
}

export function resetToMenu(e: GameEngine) {
  e.state = "menu";
  e.score = 0;
  e.bird.y = e.height * 0.45;
  e.bird.vel = 0;
  e.bird.rotation = 0;
  e.pipes = [];
  e.flashTimer = 0;
}

function spawnPipe(e: GameEngine) {
  const playableTop = 80;
  const playableBot = e.height - GROUND_HEIGHT - 80;
  const gapY = randomRange(playableTop + PIPE_GAP / 2, playableBot - PIPE_GAP / 2);
  const lastX =
    e.pipes.length > 0 ? e.pipes[e.pipes.length - 1].x : e.width;
  e.pipes.push({
    x: Math.max(lastX + PIPE_SPAWN_DIST, e.width + 40),
    gapY,
    scored: false,
  });
}

function gameOver(e: GameEngine) {
  e.state = "gameover";
  e.flashTimer = 0.15;
  e.onGameOver();
}

// ---------- Update ----------
export function update(e: GameEngine, dt: number) {
  // Cap dt to avoid spiral of death
  dt = Math.min(dt, 0.05);

  // Flash timer
  if (e.flashTimer > 0) e.flashTimer -= dt;

  // Update clouds always
  updateClouds(e, dt);
  // Update ground scroll always
  e.groundOffset = (e.groundOffset + PIPE_SPEED * dt) % 40;

  if (e.state === "menu") {
    // Gentle bob
    e.bird.y = e.height * 0.45 + Math.sin(Date.now() / 400) * 10;
    return;
  }

  if (e.state !== "playing") return;

  // Bird physics
  e.bird.vel += GRAVITY * dt;
  e.bird.y += e.bird.vel * dt;

  // Rotation based on velocity
  const targetRot = clamp(e.bird.vel / 400, -0.5, 1.2);
  e.bird.rotation = lerp(e.bird.rotation, targetRot, dt * 8);

  // Pipe movement and spawning
  for (const p of e.pipes) {
    p.x -= PIPE_SPEED * dt;
  }

  // Remove off-screen pipes
  e.pipes = e.pipes.filter((p) => p.x + PIPE_WIDTH > -20);

  // Spawn new pipes
  const rightmost = e.pipes.length > 0 ? e.pipes[e.pipes.length - 1].x : 0;
  if (rightmost < e.width - PIPE_SPAWN_DIST + 40) {
    spawnPipe(e);
  }

  // Scoring
  for (const p of e.pipes) {
    if (!p.scored && p.x + PIPE_WIDTH < e.bird.x) {
      p.scored = true;
      e.score++;
      e.onScoreChange(e.score);
    }
  }

  // Collision detection
  const groundY = e.height - GROUND_HEIGHT;

  // Ground / ceiling
  if (e.bird.y + BIRD_RADIUS >= groundY || e.bird.y - BIRD_RADIUS <= 0) {
    e.bird.y = clamp(e.bird.y, BIRD_RADIUS, groundY - BIRD_RADIUS);
    gameOver(e);
    return;
  }

  // Pipes
  for (const p of e.pipes) {
    // Horizontal overlap
    if (
      e.bird.x + BIRD_RADIUS > p.x &&
      e.bird.x - BIRD_RADIUS < p.x + PIPE_WIDTH
    ) {
      // Top pipe
      if (e.bird.y - BIRD_RADIUS < p.gapY - PIPE_GAP / 2) {
        gameOver(e);
        return;
      }
      // Bottom pipe
      if (e.bird.y + BIRD_RADIUS > p.gapY + PIPE_GAP / 2) {
        gameOver(e);
        return;
      }
    }
  }
}

function updateClouds(e: GameEngine, dt: number) {
  for (const c of e.clouds) {
    c.x -= c.speed * dt;
    if (c.x + c.w < 0) {
      c.x = e.width + randomRange(10, 80);
      c.y = randomRange(20, e.height * 0.45);
      c.w = randomRange(60, 140);
      c.h = randomRange(25, 50);
      c.speed = randomRange(15, 40);
      c.opacity = randomRange(0.15, 0.35);
    }
  }
}

// ---------- Render ----------
export function render(e: GameEngine) {
  const { ctx, width, height } = e;
  const groundY = height - GROUND_HEIGHT;

  // Sky gradient with day/night cycle
  const sky = getSkyColors(e.score);
  const grad = ctx.createLinearGradient(0, 0, 0, groundY);
  grad.addColorStop(0, sky.top);
  grad.addColorStop(1, sky.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, groundY);

  // Stars at night
  const cycle = e.score % 60;
  if (cycle >= 25 && cycle < 50) {
    const starAlpha = cycle >= 30 && cycle < 45 ? 0.7 : 0.3;
    ctx.fillStyle = `rgba(255,255,255,${starAlpha})`;
    // Deterministic stars
    const seed = 42;
    for (let i = 0; i < 30; i++) {
      const sx = ((seed * (i + 1) * 7) % width);
      const sy = ((seed * (i + 1) * 13) % (groundY * 0.6));
      const sr = ((i % 3) + 1) * 0.7;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Clouds
  drawClouds(e);

  // Pipes
  drawPipes(e);

  // Ground
  drawGround(e, groundY);

  // Bird
  drawBird(e);

  // Flash on death
  if (e.flashTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${e.flashTimer / 0.15 * 0.5})`;
    ctx.fillRect(0, 0, width, height);
  }

  // Score display during gameplay
  if (e.state === "playing") {
    drawScore(e);
  }
}

function drawClouds(e: GameEngine) {
  const { ctx } = e;
  for (const c of e.clouds) {
    ctx.fillStyle = `rgba(255,255,255,${c.opacity})`;
    ctx.beginPath();
    // Draw fluffy cloud shape
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    ctx.ellipse(cx, cy, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - c.w * 0.25, cy - c.h * 0.15, c.w * 0.3, c.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + c.w * 0.2, cy - c.h * 0.1, c.w * 0.28, c.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPipes(e: GameEngine) {
  const { ctx, height } = e;
  const groundY = height - GROUND_HEIGHT;

  for (const p of e.pipes) {
    const topEnd = p.gapY - PIPE_GAP / 2;
    const botStart = p.gapY + PIPE_GAP / 2;

    // Pipe body color
    const bodyGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
    bodyGrad.addColorStop(0, "#2d8b2d");
    bodyGrad.addColorStop(0.3, "#4caf50");
    bodyGrad.addColorStop(0.7, "#4caf50");
    bodyGrad.addColorStop(1, "#2d7a2d");

    // Top pipe
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(p.x, 0, PIPE_WIDTH, topEnd);

    // Top pipe cap
    const capW = PIPE_WIDTH + 10;
    const capH = 24;
    const capX = p.x - 5;
    const capGrad = ctx.createLinearGradient(capX, 0, capX + capW, 0);
    capGrad.addColorStop(0, "#236b23");
    capGrad.addColorStop(0.3, "#43a047");
    capGrad.addColorStop(0.7, "#43a047");
    capGrad.addColorStop(1, "#1b5e1b");
    ctx.fillStyle = capGrad;
    ctx.fillRect(capX, topEnd - capH, capW, capH);

    // Top pipe cap border
    ctx.strokeStyle = "#1a4d1a";
    ctx.lineWidth = 2;
    ctx.strokeRect(capX, topEnd - capH, capW, capH);

    // Bottom pipe
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(p.x, botStart, PIPE_WIDTH, groundY - botStart);

    // Bottom pipe cap
    ctx.fillStyle = capGrad;
    ctx.fillRect(capX, botStart, capW, capH);
    ctx.strokeStyle = "#1a4d1a";
    ctx.lineWidth = 2;
    ctx.strokeRect(capX, botStart, capW, capH);

    // Pipe highlight
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(p.x + 6, 0, 8, topEnd);
    ctx.fillRect(p.x + 6, botStart, 8, groundY - botStart);
  }
}

function drawGround(e: GameEngine, groundY: number) {
  const { ctx, width, height } = e;

  // Ground body
  ctx.fillStyle = "#8B6914";
  ctx.fillRect(0, groundY, width, height - groundY);

  // Ground top grass
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(0, groundY, width, 8);

  // Ground stripe pattern
  ctx.fillStyle = "#7A5C12";
  const stripeW = 40;
  for (let x = -e.groundOffset; x < width + stripeW; x += stripeW) {
    ctx.fillRect(x, groundY + 12, stripeW / 2, 4);
  }

  // Ground top highlight
  ctx.fillStyle = "#66BB6A";
  ctx.fillRect(0, groundY, width, 3);
}

function drawBird(e: GameEngine) {
  const { ctx, bird } = e;
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  // Body shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.arc(2, 2, BIRD_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const bodyGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, BIRD_RADIUS);
  bodyGrad.addColorStop(0, "#FFE082");
  bodyGrad.addColorStop(0.6, "#FFC107");
  bodyGrad.addColorStop(1, "#F9A825");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Body outline
  ctx.strokeStyle = "#E65100";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // Wing
  const wingFlap = Math.sin(Date.now() / 80) * 4;
  ctx.fillStyle = "#FFB300";
  ctx.beginPath();
  ctx.ellipse(-6, 4 + wingFlap, 10, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#E65100";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-6, 4 + wingFlap, 10, 6, -0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Eye white
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(7, -4, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye border
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(7, -4, 6.5, 0, Math.PI * 2);
  ctx.stroke();

  // Pupil
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.arc(9, -4, 3, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(10.5, -5.5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = "#FF5722";
  ctx.beginPath();
  ctx.moveTo(BIRD_RADIUS - 2, -2);
  ctx.lineTo(BIRD_RADIUS + 10, 2);
  ctx.lineTo(BIRD_RADIUS - 2, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#BF360C";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Blush
  ctx.fillStyle = "rgba(255,138,101,0.35)";
  ctx.beginPath();
  ctx.ellipse(4, 6, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawScore(e: GameEngine) {
  const { ctx, width } = e;
  const text = String(e.score);
  ctx.save();
  ctx.font = "bold 48px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillText(text, width / 2 + 2, 42);

  // White text
  ctx.fillStyle = "#fff";
  ctx.fillText(text, width / 2, 40);

  // Outline
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeText(text, width / 2, 40);

  ctx.restore();
}
