let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported
  }
}

export function playSwap() {
  playTone(440, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(554, 0.1, 'sine', 0.1), 50);
}

export function playMatch(combo = 1) {
  const baseFreq = 523 + combo * 80;
  playTone(baseFreq, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(baseFreq * 1.25, 0.15, 'sine', 0.12), 80);
  setTimeout(() => playTone(baseFreq * 1.5, 0.2, 'sine', 0.12), 160);
}

export function playSpecial() {
  playTone(660, 0.1, 'square', 0.08);
  setTimeout(() => playTone(880, 0.1, 'square', 0.08), 60);
  setTimeout(() => playTone(1100, 0.15, 'square', 0.08), 120);
  setTimeout(() => playTone(1320, 0.2, 'square', 0.08), 180);
}

export function playInvalidSwap() {
  playTone(200, 0.15, 'sawtooth', 0.08);
  setTimeout(() => playTone(160, 0.2, 'sawtooth', 0.08), 100);
}

export function playLevelComplete() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.12), i * 150);
  });
}

export function playGameOver() {
  const notes = [440, 370, 311, 261];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, 'sine', 0.1), i * 200);
  });
}

export function playSelect() {
  playTone(660, 0.08, 'sine', 0.08);
}
