export class Sound {
  constructor() { this.enabled = false; this.context = null; this.lastBeat = -1; }
  async enable() {
    this.context ||= new (window.AudioContext || window.webkitAudioContext)();
    await this.context.resume(); this.enabled = true;
  }
  tone(frequency, duration, volume = .035, type = 'sine', slide = 0) {
    const c = this.context;
    if (!this.enabled || !c || c.state !== 'running') return;
    const oscillator = c.createOscillator(), gain = c.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, c.currentTime);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(slide, c.currentTime + duration);
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, c.currentTime + duration);
    oscillator.connect(gain).connect(c.destination); oscillator.start(); oscillator.stop(c.currentTime + duration);
  }
  tick(state, paused) {
    if (!state || state.status !== 'playing' || paused) return;
    const beat = Math.floor(state.time * 140 / 60 * 2);
    if (beat === this.lastBeat) return;
    this.lastBeat = beat;
    if (beat % 4 === 0) this.tone(105, .15, .08, 'sine', 38);
    else if (beat % 2 === 0) this.tone(180, .065, .025, 'triangle', 65);
    else this.tone(1800, .02, .009, 'square', 900);
  }
  event(type) {
    if (type === 'special') this.tone(160, .22, .055, 'triangle', 620);
    if (type === 'shield') this.tone(260, .12, .045, 'sine', 100);
    if (type === 'kill') this.tone(440, .045, .022, 'triangle', 190);
    if (type === 'down') this.tone(155, .35, .07, 'sawtooth', 45);
    if (type === 'rescue') { this.tone(330, .2, .06); setTimeout(() => this.tone(660, .28, .04), 90); }
    if (type === 'won') this.tone(660, .7, .06, 'triangle', 990);
  }
  async suspend() { if (this.context?.state === 'running') await this.context.suspend(); }
  async resume() { if (this.enabled && this.context?.state === 'suspended') await this.context.resume(); }
}
