// Web Audio API sound effects — no files needed, works everywhere

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)()
  } catch {
    return null
  }
}

function playTone(ctx: AudioContext, freq: number, startTime: number, duration: number, gain: number, type: OscillatorType = 'sine') {
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  gainNode.gain.setValueAtTime(0, startTime)
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

/** 3-note ascending arpeggio — for Mastered */
export function playMasteredSound() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  // C5 - E5 - G5 ascending arpeggio
  playTone(ctx, 523.25, now,        0.25, 0.18) // C5
  playTone(ctx, 659.25, now + 0.12, 0.25, 0.18) // E5
  playTone(ctx, 783.99, now + 0.24, 0.4,  0.20) // G5
}

/** Single soft chime — for Learned */
export function playLearnedSound() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  // E5, short and soft
  playTone(ctx, 659.25, now, 0.3, 0.10)
}

/** Level up fanfare — ascending arpeggio with harmony */
export function playLevelUpSound() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  // C5 - E5 - G5 - C6 ascending fanfare with longer sustain
  playTone(ctx, 523.25, now,        0.4, 0.15)  // C5
  playTone(ctx, 659.25, now + 0.15, 0.4, 0.15)  // E5
  playTone(ctx, 783.99, now + 0.30, 0.4, 0.18)  // G5
  playTone(ctx, 1046.5, now + 0.45, 0.6, 0.22)  // C6 (octave up, longer)
  // Harmony chord at the end
  playTone(ctx, 523.25, now + 0.60, 0.8, 0.10)  // C5
  playTone(ctx, 659.25, now + 0.60, 0.8, 0.10)  // E5
  playTone(ctx, 783.99, now + 0.60, 0.8, 0.12)  // G5
  playTone(ctx, 1046.5, now + 0.60, 0.8, 0.12)  // C6
}

/** Quick descending buzzer — for Wrong answer */
export function playWrongSound() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  // Low buzz tone descending, quick and punchy
  playTone(ctx, 220, now, 0.15, 0.15, 'square') // A3, square wave for buzzer effect
}
