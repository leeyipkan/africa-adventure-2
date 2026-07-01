/**
 * SoundManager — lightweight Web Audio API sound effects
 * Uses oscillator-based tones (no external audio files needed)
 */
export class SoundManager {
  constructor() {
    this.muted = false
    this.ctx = null
    this.bgmNodes = []  // For background music cleanup
    this.bgmPlaying = false
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
    if (v) this.stopBGM()
    else this.startBGM()
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.muted) this.stopBGM()
    else this.startBGM()
    return this.muted
  }

  startBGM() {
    if (this.bgmPlaying || this.muted) return
    if (!this._ensureCtx()) return
    this.bgmPlaying = true
    this._playAmbient()
  }

  stopBGM() {
    this.bgmPlaying = false
    if (this._bgmTimer) {
      clearTimeout(this._bgmTimer)
      this._bgmTimer = null
    }
    this.bgmNodes.forEach(n => {
      try { n.stop() } catch(e) {}
    })
    this.bgmNodes = []
  }

  /** Ambient African-style drone with gentle rhythm */
  _playAmbient() {
    if (!this.bgmPlaying || this.muted || !this.ctx) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const vol = 0.025  // Very quiet — background only

    // Low drone (bass note, pentatonic: C3)
    const drone = ctx.createOscillator()
    drone.type = 'sine'
    drone.frequency.value = 131
    const dGain = ctx.createGain()
    dGain.gain.setValueAtTime(vol, now)
    dGain.gain.linearRampToValueAtTime(vol * 0.5, now + 2)
    drone.connect(dGain).connect(ctx.destination)
    drone.start(now)
    this.bgmNodes.push(drone)

    // Gentle fifth (G3)
    const fifth = ctx.createOscillator()
    fifth.type = 'sine'
    fifth.frequency.value = 196
    const fGain = ctx.createGain()
    fGain.gain.setValueAtTime(vol * 0.4, now)
    fGain.gain.linearRampToValueAtTime(0, now + 3)
    fifth.connect(fGain).connect(ctx.destination)
    fifth.start(now)
    this.bgmNodes.push(fifth)

    // Subtle kalimba-style rhythm (loop)
    const notes = [262, 330, 392, 330]  // C4 E4 G4 E4 — pentatonic
    const noteDur = 0.6
    const loopLen = notes.length * noteDur

    const scheduleNote = (offset) => {
      if (!this.bgmPlaying || this.muted) return
      const idx = Math.floor((offset / noteDur) % notes.length)
      const freq = notes[idx]
      const t = now + offset
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(vol * 0.6, t + 0.02)
      g.gain.linearRampToValueAtTime(0, t + noteDur * 0.8)
      osc.connect(g).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + noteDur)
      this.bgmNodes.push(osc)
    }

    // Schedule 4 loops ahead (about 10 seconds)
    for (let i = 0; i < 16; i++) {
      scheduleNote(i * noteDur)
    }

    // Re-schedule after the loop
    this._bgmTimer = setTimeout(() => this._playAmbient(), loopLen * 4 * 1000 * 0.8)
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
