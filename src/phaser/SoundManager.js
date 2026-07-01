/**
 * SoundManager — lightweight Web Audio API sound effects
 * Uses oscillator-based tones (no external audio files needed)
 */
export class SoundManager {
  constructor() {
    this.muted = false
    this.ctx = null
  }

  _ensureCtx() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext
      if (!Ctor) return false
      this.ctx = new Ctor()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return true
  }

  setMuted(v) {
    this.muted = v
  }

  toggleMute() {
    this.muted = !this.muted
    return this.muted
  }

  play(name) {
    if (this.muted) return
    if (!this._ensureCtx()) return
    const ctx = this.ctx

    switch (name) {
      case 'step':
        this._tone(ctx, 200, 0.05, 'square', 0.06)
        this._tone(ctx, 180, 0.04, 'square', 0.04)
        break
      case 'treasure':
        this._tone(ctx, 523, 0.08, 'sine', 0.1)
        setTimeout(() => this._tone(ctx, 659, 0.08, 'sine', 0.1), 80)
        setTimeout(() => this._tone(ctx, 784, 0.12, 'sine', 0.1), 160)
        break
      case 'event':
        this._tone(ctx, 400, 0.06, 'sine', 0.07)
        setTimeout(() => this._tone(ctx, 500, 0.06, 'sine', 0.06), 60)
        break
      case 'win':
        // Fanfare: C E G C (ascending)
        this._tone(ctx, 523, 0.12, 'sine', 0.1)
        setTimeout(() => this._tone(ctx, 659, 0.12, 'sine', 0.1), 120)
        setTimeout(() => this._tone(ctx, 784, 0.12, 'sine', 0.1), 240)
        setTimeout(() => this._tone(ctx, 1047, 0.25, 'sine', 0.12), 360)
        break
    }
  }

  _tone(ctx, freq, dur, type = 'sine', vol = 0.08) {
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(vol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + dur)
    } catch (e) {
      // Silently fail — audio is not critical
    }
  }
}

export const soundManager = new SoundManager()
