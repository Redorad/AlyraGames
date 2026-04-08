let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.1) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playClick() {
  playTone(600, 0.08, 'square', 0.06);
}

export function playBuy() {
  playTone(800, 0.1, 'square', 0.06);
  setTimeout(() => playTone(1000, 0.1, 'square', 0.06), 60);
}

export function playHit() {
  playTone(200, 0.12, 'sawtooth', 0.08);
}

export function playCrit() {
  playTone(300, 0.08, 'sawtooth', 0.1);
  setTimeout(() => playTone(500, 0.15, 'sawtooth', 0.1), 50);
}

export function playDeath() {
  playTone(400, 0.2, 'sawtooth', 0.08);
  setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.08), 100);
}

export function playVictory() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.2, 'square', 0.06), i * 120);
  });
}

export function playDefeat() {
  const notes = [400, 350, 300, 200];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.3, 'sawtooth', 0.06), i * 200);
  });
}

export function playPlace() {
  playTone(500, 0.06, 'triangle', 0.06);
}

export function playReroll() {
  playTone(700, 0.05, 'square', 0.04);
  setTimeout(() => playTone(900, 0.05, 'square', 0.04), 40);
  setTimeout(() => playTone(700, 0.05, 'square', 0.04), 80);
}
