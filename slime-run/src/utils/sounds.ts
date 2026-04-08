let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.15,
  freqEnd?: number
) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    if (freqEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration)
    }
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Audio not available
  }
}

export function playJump() {
  playTone(300, 0.15, 'sine', 0.12, 600)
}

export function playDoubleJump() {
  playTone(400, 0.15, 'sine', 0.12, 800)
}

export function playCollect() {
  playTone(800, 0.08, 'square', 0.1)
  setTimeout(() => playTone(1200, 0.12, 'square', 0.1), 80)
}

export function playHurt() {
  playTone(200, 0.3, 'sawtooth', 0.15, 80)
}

export function playDie() {
  playTone(400, 0.5, 'sawtooth', 0.2, 60)
}

export function playVictory() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.2, 'square', 0.1), i * 150)
  })
}

export function playEnemyDie() {
  playTone(500, 0.15, 'square', 0.1, 150)
}

export function playHeal() {
  playTone(600, 0.1, 'sine', 0.1)
  setTimeout(() => playTone(900, 0.15, 'sine', 0.1), 100)
}
