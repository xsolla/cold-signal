export class Sound {
  constructor() {
    this.enabled = false;
    this.context = null;
    this.lastBeat = -1;
    this.killUntil = 0;
  }
  async enable() {
    this.context ||= new (window.AudioContext || window.webkitAudioContext)();
    await this.context.resume(); this.enabled = true;
  }
  tone(frequency, duration, volume = .035, type = 'sine', slide = 0, startTime) {
    const c = this.context;
    if (!this.enabled || !c || c.state !== 'running') return;
    const at = startTime ?? c.currentTime;
    const oscillator = c.createOscillator(), gain = c.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(slide, at + duration);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(gain).connect(c.destination); oscillator.start(at); oscillator.stop(at + duration);
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
  events(events) {
    let kills = 0;
    for (const event of events) {
      if (event.type === 'kill') kills++;
      else this.event(event);
    }
    if (kills) this.kill(kills);
  }
  kill(count) {
    const c = this.context;
    if (!this.enabled || c?.state !== 'running' || c.currentTime < this.killUntil) return;
    const at = c.currentTime;
    this.tone(440, .045, .022, 'triangle', 190, at);
    this.killUntil = at + .045;
    // A packet can contain a whole cascade. Spend two quiet higher taps on
    // the largest rolls, with no new kill voices until the current roll ends.
    if (count > 1) {
      this.tone(560, .034, .012, 'triangle', 250, at + .017);
      this.killUntil = at + .017 + .034;
    }
    if (count >= 6) {
      this.tone(700, .029, .010, 'triangle', 315, at + .034);
      this.killUntil = at + .034 + .029;
    }
  }
  event(event) {
    const type = typeof event === 'string' ? event : event.type;
    if (type === 'special') {
      this.tone(event.character === 'ivo' ? 82 : 160, .22, .055, 'triangle', 620);
      this.tone(1200, .045, .014, 'square', 260);
    }
    if (type === 'shield') this.tone(260, .12, .045, 'sine', 100);
    if (type === 'kill') this.kill(1);
    if (type === 'down') this.tone(155, .35, .07, 'sawtooth', 45);
    if (type === 'rescue') { this.tone(330, .2, .06); setTimeout(() => this.tone(660, .28, .04), 90); }
    if (type === 'won') this.tone(660, .7, .06, 'triangle', 990);
  }
  async suspend() { if (this.context?.state === 'running') await this.context.suspend(); }
  async resume() { if (this.enabled && this.context?.state === 'suspended') await this.context.resume(); }
}
