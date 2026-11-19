// Presentation state only: the authoritative simulation remains in rules.js.
export const PALETTE = Object.freeze({
  bg: '#101a3a', field: '#182a51', line: '#334678', muted: '#93a9d6',
  paper: '#eef7ff', signal: '#79e5ff', danger: '#ffaf91', accent: '#8d85ff',
});

// Fit the approved fork inside the original ship's 13-unit painted envelope.
const registration = 12.2 / Math.hypot(12, 11);
export const SHIP_POINTS = Object.freeze([
  [-12, 11], [-10, -11], [-4, -4], [0, 4], [4, -4],
  [10, -11], [12, 11], [5, 8], [0, 12], [-5, 8],
].map(([x, y]) => Object.freeze([x * registration, y * registration])));

export function drawFork(ctx, fill, stroke, sides = 3) {
  ctx.lineJoin = 'round';
  ctx.beginPath();
  SHIP_POINTS.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + i * Math.PI * 2 / sides;
    const x = Math.cos(a) * 2.4, y = 6 + Math.sin(a) * 2.4;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath(); ctx.fillStyle = PALETTE.bg; ctx.fill();
}

export const noise = value => {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};

export class Presentation {
  constructor() { this.reset(); }
  reset() {
    this.time = 0; this.lastNow = null; this.stateTime = null; this.cursor = 0;
    this.effects = []; this.trails = new Map(); this.origins = new Map();
  }
  update(state, { now = 0, paused = false, reduced = false, slot = 0, predicted = null } = {}) {
    if (state && this.stateTime !== null && state.time < this.stateTime) this.reset();
    const dt = this.lastNow === null ? 0 : Math.max(0, Math.min(.05, (now - this.lastNow) / 1000));
    this.lastNow = now;
    if (!paused && state?.status !== 'interrupted') this.time += dt;
    if (state) {
      this.stateTime = state.time;
      for (const event of state.events) if (event.id > this.cursor) {
        this.effects.push({ ...event, born: this.time }); this.cursor = event.id;
      }
      const live = new Set(state.bullets.map(b => b.id));
      for (const b of state.bullets) if (!this.origins.has(b.id)) this.origins.set(b.id, b.radius);
      for (const id of this.origins.keys()) if (!live.has(id)) this.origins.delete(id);
      for (const p of state.players) {
        let trail = this.trails.get(p.id) || [];
        trail = trail.filter(t => this.time - t.born < .14);
        const angle = p.id === slot && predicted !== null ? predicted : p.angle;
        const last = trail.at(-1);
        if (!reduced && !paused && state.status === 'playing' && !p.down &&
          (!last || Math.abs(last.angle - angle) > .003 || Math.abs(last.radius - p.radius) > .2)) {
          trail.push({ angle, radius: p.radius, born: this.time });
        }
        this.trails.set(p.id, reduced || p.down ? [] : trail.slice(-9));
      }
    } else { this.origins.clear(); this.trails.clear(); }
    this.effects = this.effects.filter(e => this.time - e.born < 1.15).slice(-64);
  }
  impact(reduced) {
    if (reduced) return 0;
    return Math.min(1, this.effects.reduce((sum, e) => {
      const weight = e.type === 'special' ? (e.character === 'ivo' ? .75 : .25) :
        e.type === 'down' ? .55 : e.type === 'rescue' ? .45 : e.type === 'kill' ? .14 : 0;
      return sum + weight * Math.exp(-(this.time - e.born) * 18);
    }, 0));
  }
}
