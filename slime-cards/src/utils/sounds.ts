let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function play(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15) {
  if (!enabled) return;
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  } catch {}
}

export function playCardPlay() { play(520, 0.1, "triangle", 0.12); }
export function playAttack() { play(200, 0.15, "sawtooth", 0.1); }
export function playBlock() { play(350, 0.12, "square", 0.08); }
export function playHeal() { play(660, 0.2, "sine", 0.1); play(880, 0.2, "sine", 0.08); }
export function playHit() { play(120, 0.2, "sawtooth", 0.12); }
export function playEnemyDie() { play(300, 0.1, "square", 0.1); play(400, 0.15, "square", 0.08); play(600, 0.2, "square", 0.06); }
export function playDraw() { play(440, 0.06, "triangle", 0.06); }
export function playBuff() { play(440, 0.1, "sine", 0.1); play(550, 0.15, "sine", 0.08); }
export function playDebuff() { play(220, 0.2, "sawtooth", 0.08); }
export function playVictory() { play(523, 0.15, "triangle", 0.12); setTimeout(() => play(659, 0.15, "triangle", 0.12), 100); setTimeout(() => play(784, 0.3, "triangle", 0.1), 200); }
export function playDefeat() { play(300, 0.3, "sawtooth", 0.1); setTimeout(() => play(200, 0.4, "sawtooth", 0.08), 200); }
export function playGold() { play(800, 0.08, "triangle", 0.1); play(1000, 0.1, "triangle", 0.08); }
export function playClick() { play(600, 0.05, "triangle", 0.08); }

export function isSoundEnabled() { return enabled; }
export function setSoundEnabled(v: boolean) { enabled = v; }
