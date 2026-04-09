let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "square", vol = 0.15) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  } catch {
    // audio not available
  }
}

export function playHit() {
  playTone(440, 0.08, "square", 0.12);
}

export function playWallBounce() {
  playTone(300, 0.06, "triangle", 0.1);
}

export function playScore() {
  playTone(220, 0.3, "sawtooth", 0.1);
  setTimeout(() => playTone(330, 0.2, "square", 0.08), 100);
}

export function playWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.25, "square", 0.1), i * 150);
  });
}
