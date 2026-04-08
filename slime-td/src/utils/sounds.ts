let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.08) {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

/** Tower placed on the grid */
export function playPlace() {
  playTone(440, 0.06, "triangle", 0.05);
  setTimeout(() => playTone(550, 0.06, "triangle", 0.05), 60);
}

/** Tower shoots a projectile */
export function playShoot() {
  playTone(800 + Math.random() * 200, 0.03, "square", 0.03);
}

/** Splash / AoE hit */
export function playSplash() {
  playTone(300, 0.1, "sawtooth", 0.04);
}

/** Critical hit */
export function playCrit() {
  playTone(900, 0.06, "square", 0.05);
  setTimeout(() => playTone(1300, 0.08, "square", 0.04), 40);
}

/** Enemy killed */
export function playKill() {
  playTone(600 + Math.random() * 100, 0.05, "sine", 0.04);
}

/** Boss killed */
export function playBossKill() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.15, "sine", 0.06), i * 80));
}

/** Enemy reaches the base — life lost */
export function playLeak() {
  playTone(200, 0.2, "sawtooth", 0.06);
  setTimeout(() => playTone(150, 0.25, "sawtooth", 0.05), 120);
}

/** Wave starts */
export function playWaveStart() {
  playTone(400, 0.1, "triangle", 0.05);
  setTimeout(() => playTone(500, 0.1, "triangle", 0.05), 80);
  setTimeout(() => playTone(600, 0.12, "triangle", 0.05), 160);
}

/** Tower upgraded */
export function playUpgrade() {
  playTone(500, 0.08, "sine", 0.05);
  setTimeout(() => playTone(700, 0.08, "sine", 0.05), 70);
  setTimeout(() => playTone(900, 0.1, "sine", 0.05), 140);
}

/** Tower sold */
export function playSell() {
  playTone(500, 0.06, "triangle", 0.04);
  setTimeout(() => playTone(350, 0.08, "triangle", 0.04), 60);
}

/** Victory */
export function playVictory() {
  const notes = [523, 659, 784, 880, 1047];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.25, "sine", 0.08), i * 100));
}

/** Defeat */
export function playDefeat() {
  playTone(300, 0.3, "sawtooth", 0.06);
  setTimeout(() => playTone(200, 0.4, "sawtooth", 0.06), 200);
  setTimeout(() => playTone(120, 0.5, "sawtooth", 0.05), 400);
}
