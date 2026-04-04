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

export function playClick() {
  playTone(600 + Math.random() * 200, 0.05, "sine", 0.06);
}

export function playCrit() {
  playTone(800, 0.08, "square", 0.06);
  setTimeout(() => playTone(1200, 0.1, "square", 0.05), 50);
}

export function playBuy() {
  playTone(440, 0.06, "triangle", 0.05);
  setTimeout(() => playTone(550, 0.06, "triangle", 0.05), 60);
}

export function playEvolution() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, "sine", 0.07), i * 120));
}

export function playAchievement() {
  playTone(880, 0.15, "sine", 0.06);
  setTimeout(() => playTone(1100, 0.2, "sine", 0.06), 100);
}

export function playStorm() {
  playTone(200, 0.3, "sawtooth", 0.04);
  setTimeout(() => playTone(300, 0.3, "sawtooth", 0.04), 150);
}

export function playBossHit() {
  playTone(150 + Math.random() * 100, 0.05, "square", 0.05);
}

export function playBossVictory() {
  const notes = [523, 659, 784, 880, 1047];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.25, "sine", 0.08), i * 100));
}

export function playBossDefeat() {
  playTone(300, 0.3, "sawtooth", 0.06);
  setTimeout(() => playTone(200, 0.4, "sawtooth", 0.06), 200);
}
