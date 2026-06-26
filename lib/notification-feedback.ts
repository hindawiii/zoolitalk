/**
 * Lightweight notification feedback helpers used when a new chat message
 * arrives while the user is outside the conversation.
 *
 * The "ping" sound is synthesized with the Web Audio API so we don't need to
 * ship an audio asset. Vibration uses the standard navigator.vibrate API and
 * silently no-ops on unsupported devices (e.g. desktop, iOS Safari).
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const Ctx =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    if (!audioCtx) audioCtx = new Ctx()
    return audioCtx
  } catch {
    return null
  }
}

/** Play a short two-tone "ding" notification sound. */
export function playNotificationSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    // Resume if the context was suspended by autoplay policies.
    if (ctx.state === 'suspended') void ctx.resume()

    const now = ctx.currentTime
    const tones = [
      { freq: 880, start: 0, dur: 0.12 },
      { freq: 1175, start: 0.1, dur: 0.16 },
    ]

    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + start)
      // Quick attack, smooth decay so it sounds like a soft chime.
      gain.gain.setValueAtTime(0.0001, now + start)
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.02)
    })
  } catch {
    // Ignore audio errors – feedback is best-effort.
  }
}

/** Trigger a short device vibration if the browser allows it. */
export function vibrateDevice(pattern: number | number[] = [40, 30, 40]) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Ignore – not all browsers honor vibrate even when present.
  }
}
