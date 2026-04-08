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
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playBuildSound() {
  playTone(220, 0.15, 'square', 0.1);
  setTimeout(() => playTone(330, 0.15, 'square', 0.1), 80);
  setTimeout(() => playTone(440, 0.2, 'square', 0.1), 160);
}

export function playAssignSound() {
  playTone(500, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(600, 0.15, 'sine', 0.1), 60);
}

export function playEventSound() {
  playTone(350, 0.1, 'triangle', 0.12);
  setTimeout(() => playTone(450, 0.1, 'triangle', 0.12), 100);
  setTimeout(() => playTone(350, 0.15, 'triangle', 0.12), 200);
}

export function playMilestoneSound() {
  playTone(440, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(550, 0.15, 'sine', 0.12), 120);
  setTimeout(() => playTone(660, 0.15, 'sine', 0.12), 240);
  setTimeout(() => playTone(880, 0.3, 'sine', 0.15), 360);
}

export function playClickSound() {
  playTone(600, 0.05, 'square', 0.06);
}
