import { T, RINGS, TAU, CREW, characterById, projectRadius, depthScale, pointAt, enemySize, ringName, safeInWall } from './rules.js';
import { PALETTE, Presentation, drawFork, noise } from './cold-signal.js';
const { bg: ink, paper, signal: acid, danger, accent, line, muted, field } = PALETTE;
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.presentation = new Presentation();
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); this.resize();
  }
  resetEffects() { this.presentation.reset(); }
  resize() {
    const r = this.canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    this.width = r.width; this.height = r.height;
    this.canvas.width = Math.round(r.width * d); this.canvas.height = Math.round(r.height * d);
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  polygon(x, y, radius, sides, angle, fill, stroke, line = 2) {
    const c = this.ctx; c.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = angle + i * TAU / sides, px = x + Math.cos(a) * radius, py = y + Math.sin(a) * radius;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath(); c.lineWidth = line;
    if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.stroke(); }
  }
  circle(radius, color, width = 1) {
    const c = this.ctx; c.strokeStyle = color; c.lineWidth = width;
    c.beginPath(); c.arc(0, 0, radius, 0, TAU); c.stroke();
  }
  tunnel(own, reduced) {
    const c = this.ctx, core = projectRadius(T.coreRadius);
    const fog = c.createRadialGradient(0, 0, core, 0, 0, 330);
    fog.addColorStop(0, field); fog.addColorStop(.75, ink); fog.addColorStop(1, ink);
    c.fillStyle = fog; c.beginPath(); c.arc(0, 0, 330, 0, TAU); c.fill();
    for (let i = 0; i < 32; i++) {
      const a = i * TAU / 32, b = (i + 1) * TAU / 32;
      if (i % 2 === 0) {
        c.fillStyle = '#eef7ff04'; c.beginPath(); c.moveTo(Math.cos(a) * core, Math.sin(a) * core);
        c.lineTo(Math.cos(a) * T.radius, Math.sin(a) * T.radius); c.arc(0, 0, T.radius, a, b);
        c.lineTo(Math.cos(b) * core, Math.sin(b) * core); c.arc(0, 0, core, b, a, true); c.fill();
      }
      const gradient = c.createLinearGradient(Math.cos(a) * core, Math.sin(a) * core, Math.cos(a) * 300, Math.sin(a) * 300);
      gradient.addColorStop(0, '#33467855'); gradient.addColorStop(1, '#93a9d680');
      c.strokeStyle = gradient; c.lineWidth = i % 3 === 0 ? 1 : .55;
      c.beginPath(); c.moveTo(Math.cos(a) * core, Math.sin(a) * core); c.lineTo(Math.cos(a) * 300, Math.sin(a) * 300); c.stroke();
    }
    // Fine depth rings stream outward; rails and all gameplay geometry stay fixed.
    for (let i = 0; i < 12; i++) {
      const t = ((i / 12 + (reduced ? 0 : this.presentation.time * .65)) % 1);
      this.circle(projectRadius(T.coreRadius + t * (T.radius - T.coreRadius)), '#33467880', .55);
    }
    if (!reduced) for (let i = 0; i < 28; i++) {
      const t = (noise(i + 1) + this.presentation.time * (1.2 + noise(i + 30) * .4)) % 1;
      const a = noise(i + 80) * TAU, r = 45 + t * 210;
      c.strokeStyle = i % 4 ? '#8d85ff70' : '#79e5ff90'; c.lineWidth = .7 + t;
      c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      c.lineTo(Math.cos(a) * (r + 8 + t * 27), Math.sin(a) * (r + 8 + t * 27)); c.stroke();
    }
    RINGS.forEach((r, ring) => {
      const selected = own?.ring === ring, pr = projectRadius(r);
      this.circle(pr, selected ? acid : muted, (selected ? 2 : 1) * Math.max(.6, depthScale(r)));
      c.fillStyle = selected ? acid : muted; c.font = '8px monospace'; c.textAlign = 'left';
      c.fillText(`${3 - ring} / ${ringName(ring)}`, Math.cos(-.45) * (pr + 6), Math.sin(-.45) * (pr + 6) - 4);
    });
    this.circle(268, line, .8);
    for (let i = 0; i < 60; i++) {
      const a = i * TAU / 60;
      c.strokeStyle = i % 5 === 0 ? muted : line; c.lineWidth = 1;
      c.beginPath(); c.moveTo(Math.cos(a) * 268, Math.sin(a) * 268);
      c.lineTo(Math.cos(a) * (i % 5 === 0 ? 276 : 271), Math.sin(a) * (i % 5 === 0 ? 276 : 271)); c.stroke();
    }
    c.fillStyle = ink; c.beginPath(); c.arc(0, 0, core, 0, TAU); c.fill();
  }
  wall(wall) {
    const c = this.ctx, radius = projectRadius(wall.radius), scale = depthScale(wall.radius);
    c.strokeStyle = accent; c.lineWidth = 10 * scale; c.lineCap = 'butt';
    for (let i = 0; i < 200; i++) {
      const a = i * TAU / 200;
      if (!safeInWall(wall, a + TAU / 400)) { c.beginPath(); c.arc(0, 0, radius, a, a + TAU / 200 + .002); c.stroke(); }
    }
    for (const gap of wall.gaps) for (const sign of [-1, 1]) {
      const a = gap.angle + sign * gap.width / 2;
      c.strokeStyle = acid; c.lineWidth = 2 * scale; c.beginPath();
      c.moveTo(Math.cos(a) * (radius - 10 * scale), Math.sin(a) * (radius - 10 * scale));
      c.lineTo(Math.cos(a) * (radius + 10 * scale), Math.sin(a) * (radius + 10 * scale)); c.stroke();
    }
  }
  zone(z) {
    const c = this.ctx, warning = z.age < z.warn;
    const radii = z.minRadius !== undefined ? [z.minRadius, ...RINGS.filter(r => r > z.minRadius && r <= z.maxRadius)] : [z.radius ?? T.radius];
    c.save();
    for (const radius of radii) {
      const scale = depthScale(radius);
      c.strokeStyle = warning ? danger : paper; c.lineWidth = (warning ? 2 : 17) * scale;
      c.setLineDash(warning ? [4 * scale, 4 * scale] : []); c.beginPath();
      c.arc(0, 0, projectRadius(radius), z.angle - z.width / 2, z.angle + z.width / 2); c.stroke();
    }
    if (z.minRadius !== undefined) {
      c.setLineDash([2, 4]); c.lineWidth = 1; c.strokeStyle = danger;
      const a = pointAt(z.angle, z.minRadius), b = pointAt(z.angle, z.maxRadius);
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    c.restore();
  }
  enemy(e) {
    const c = this.ctx, { x, y } = pointAt(e.angle, e.radius), scale = depthScale(e.radius);
    const preview = e.radius <= T.coreRadius, size = Math.max(preview ? 2 : 0, enemySize(e) * scale), line = Math.max(preview ? .7 : .45, 2 * scale);
    c.save();
    if (preview) c.globalAlpha = .85;
    if (!preview && !this.reduced) {
      const tail = pointAt(e.angle - (e.type === 'flank' ? .06 : 0), Math.max(T.coreRadius, e.radius - 22));
      c.save(); c.globalAlpha *= .22; c.strokeStyle = e.type === 'rush' ? paper : danger;
      c.lineWidth = Math.max(.5, scale * 2); c.beginPath(); c.moveTo(x, y); c.lineTo(tail.x, tail.y); c.stroke(); c.restore();
    }
    {
      if (e.type === 'rush') this.polygon(x, y, size, 3, e.angle, paper, null);
      if (e.type === 'flank') { this.polygon(x, y, size, 4, e.angle, ink, paper, line); this.polygon(x, y, 2 * scale, 4, 0, paper, null); }
      if (e.type === 'suppress') { this.polygon(x, y, size, 6, e.angle, ink, paper, line); this.polygon(x, y, 7 * scale, 3, e.angle, danger, null); }
      if (e.type === 'skimmer') {
        this.polygon(x, y, size, 4, e.angle + Math.PI / 4, danger, null);
        this.polygon(x, y, size * .43, 4, e.angle + Math.PI / 4, ink, null);
      }
      if (e.type === 'stalker') {
        this.polygon(x, y, size, 3, e.angle + Math.PI / 2, ink, danger, line);
        this.polygon(x, y, size * .4, 3, e.angle + Math.PI / 2, danger, null);
      }
      if (e.mode === 'patrol') {
        c.strokeStyle = danger; c.lineWidth = Math.max(.5, scale); c.beginPath();
        c.arc(0, 0, projectRadius(e.radius), e.angle - .15, e.angle + .15); c.stroke();
      }
    }
    c.restore();
  }
  player(p, slot, predicted, joined) {
    const c = this.ctx, character = characterById(p.character);
    const a = p.id === slot && predicted !== null && !p.down ? predicted : p.angle;
    const radius = p.radius ?? T.radius, scale = depthScale(radius), { x, y } = pointAt(a, radius);
    c.save(); c.translate(x, y); c.rotate(a - Math.PI / 2); c.scale(scale, scale);
    if (p.down) {
      c.strokeStyle = danger; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, 13, -.9, .9); c.arc(0, 0, 13, Math.PI - .9, Math.PI + .9); c.stroke();
      c.beginPath(); c.moveTo(-5, -6); c.lineTo(5, -6); c.moveTo(-5, 6); c.lineTo(5, 6); c.stroke();
      c.strokeStyle = acid; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 23, -Math.PI / 2, -Math.PI / 2 + Math.max(.02, p.rescue / T.rescueSeconds * TAU)); c.stroke();
      c.setLineDash([2, 3]); c.strokeStyle = muted; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 27, 0, TAU); c.stroke();
    } else {
      drawFork(c, p.id === slot ? acid : p.character === 'sana' ? accent : paper, ink, character.sides);
      if (p.ward > 0 && p.wardCharges > 0) this.polygon(0, 0, 25, 6, 0, null, acid, 2);
      if (p.rally > 0) { c.fillStyle = accent; c.fillRect(-3, 20, 6, 2); c.fillRect(-1, 18, 2, 6); }
      if (p.haste > 0) { c.strokeStyle = paper; c.lineWidth = 1; c.beginPath(); c.moveTo(-19, -3); c.lineTo(-27, -3); c.moveTo(-19, 3); c.lineTo(-27, 3); c.stroke(); }
      if (p.protection > 0) { c.strokeStyle = paper; c.setLineDash([3, 4]); c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.stroke(); }
    }
    c.restore();
    if (joined) {
      const rescuing = !p.down && this.players.some(other => other.down && other.ring === p.ring && Math.abs(Math.atan2(Math.sin(a - other.angle), Math.cos(a - other.angle))) < .28);
      const labelRadius = projectRadius(radius) + (rescuing ? 43 : p.down ? 33 : 20) * Math.max(.6, scale);
      const x = Math.cos(a) * labelRadius, y = Math.sin(a) * labelRadius + (Math.sin(a) > 0 ? 10 : -5);
      c.fillStyle = p.down ? danger : p.id === slot ? acid : muted; c.font = '9px monospace'; c.textAlign = 'center';
      c.fillText(p.down ? `P${p.id + 1} / ${ringName(p.ring)}` : `P${p.id + 1}${p.id === slot ? ' YOU' : ''}`, x, y);
      if (p.down) c.fillText(`RESCUE ${Math.round(p.rescue / T.rescueSeconds * 100)}%`, x, y + 11);
    }
  }
  bullet(b, slot, reduced) {
    const c = this.ctx, from = pointAt(b.angle, b.radius);
    // Never extend a trail beyond where this real projectile was first observed.
    const end = Math.min(this.presentation.origins.get(b.id) ?? b.radius, b.radius + (reduced ? 12 : 38));
    const to = pointAt(b.angle, end), head = pointAt(b.angle, Math.max(T.coreRadius, b.radius - 5));
    c.save(); c.strokeStyle = b.owner === slot ? acid : paper;
    if (!reduced) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .28; c.lineWidth = Math.max(.5, 3.5 * depthScale(b.radius)); c.beginPath(); c.moveTo(from.x, from.y); c.lineTo(to.x, to.y); c.stroke(); }
    c.globalAlpha = 1; c.lineWidth = Math.max(.5, 2 * depthScale(b.radius));
    c.beginPath(); c.moveTo(head.x, head.y); c.lineTo(from.x, from.y); c.stroke(); c.restore();
  }
  effects(reduced) {
    const c = this.ctx, time = this.presentation.time;
    for (const e of this.presentation.effects) {
      const age = time - e.born, radius = e.radius ?? T.radius, ds = depthScale(radius);
      const pos = pointAt(e.angle ?? 0, radius);
      c.save();
      if (e.type === 'kill' && age < .48) {
        const t = age / .48; c.globalAlpha = 1 - t;
        if (!reduced) c.globalCompositeOperation = 'lighter';
        c.strokeStyle = paper; c.lineWidth = Math.max(.5, ds);
        c.beginPath(); c.arc(pos.x, pos.y, (5 + (reduced ? 3 : t * 42)) * ds, 0, TAU); c.stroke();
        if (!reduced && age < .07) {
          c.lineWidth = 2 * ds; c.beginPath();
          c.moveTo(pos.x - 16 * ds, pos.y); c.lineTo(pos.x + 16 * ds, pos.y);
          c.moveTo(pos.x, pos.y - 16 * ds); c.lineTo(pos.x, pos.y + 16 * ds); c.stroke();
        }
        if (!reduced) for (let i = 0; i < 18; i++) {
          const a = noise(e.id * 23 + i) * TAU, distance = (8 + t * (28 + noise(i + e.id) * 58)) * ds;
          const x = pos.x + Math.cos(a) * distance, y = pos.y + Math.sin(a) * distance;
          c.strokeStyle = [acid, paper, accent, danger][i % 4]; c.lineWidth = (i % 3 ? 1 : 2) * ds;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 8 * ds, y + Math.sin(a) * 8 * ds); c.stroke();
        }
      }
      if (e.type === 'special' && age < .65) {
        const t = Math.min(1, age / .4); c.globalAlpha = 1 - age / .65;
        c.strokeStyle = e.character === 'sana' ? accent : acid;
        c.lineWidth = (e.character === 'ivo' ? 4 : 2) * ds;
        if (e.character === 'ivo') {
          // The real Shockwave affects a 1.6-radian sector outside the sanctuary.
          const r = projectRadius(reduced ? radius : T.coreRadius + (T.radius - T.coreRadius) * t);
          c.beginPath(); c.arc(0, 0, r, e.angle - .8, e.angle + .8); c.stroke();
          if (!reduced) for (const offset of [-.8, -.4, 0, .4, .8]) {
            const a = e.angle + offset; c.strokeStyle = accent; c.lineWidth = 1;
            c.beginPath(); c.moveTo(Math.cos(a) * Math.max(projectRadius(T.coreRadius), r - 38), Math.sin(a) * Math.max(projectRadius(T.coreRadius), r - 38));
            c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke();
          }
        } else {
          if (e.character === 'mara') c.setLineDash([7 * ds, 4 * ds]);
          c.beginPath(); c.arc(0, 0, projectRadius(radius) + (reduced ? 0 : age * 30 * ds), e.angle - .75, e.angle + .75); c.stroke();
          if (e.character === 'sana') { c.fillStyle = accent; c.fillRect(pos.x - 3 * ds, pos.y - 12 * ds, 6 * ds, 24 * ds); c.fillRect(pos.x - 12 * ds, pos.y - 3 * ds, 24 * ds, 6 * ds); }
          if (e.character === 'rook' && !reduced) for (let i = 0; i < 8; i++) {
            const a = e.angle + (i - 4) * .05;
            const from = pointAt(a, radius), to = pointAt(a + .08 + age * .25, radius);
            c.beginPath(); c.moveTo(from.x, from.y); c.lineTo(to.x, to.y); c.stroke();
          }
        }
      }
      if (['down', 'shield', 'rescue'].includes(e.type) && age < .7) {
        c.globalAlpha = 1 - age / .7; c.strokeStyle = e.type === 'down' ? danger : acid; c.lineWidth = 2 * ds;
        c.beginPath(); c.arc(pos.x, pos.y, (20 + (reduced ? 0 : age * 75)) * ds, 0, TAU); c.stroke();
        if (e.type === 'rescue') { c.fillStyle = acid; c.font = 'bold 10px monospace'; c.textAlign = 'center'; c.fillText('BACK IN THE FIGHT', pos.x, pos.y - 38 * Math.max(.6, ds)); }
      }
      c.restore();
    }
    const burst = this.presentation.effects.filter(e => e.type === 'kill' && time - e.born < .3);
    if (burst.length >= 3) { c.fillStyle = acid; c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.fillText(`${burst.length} TARGETS CLEARED`, 0, -304); }
  }
  render(state, { joined = false, slot = 0, reduced = false, paused = false, now = 0, predicted = null, roster = [], crewCount = 4 } = {}) {
    const c = this.ctx, w = this.width, h = this.height;
    this.presentation.update(state, { now, paused, reduced, slot, predicted }); this.reduced = reduced;
    c.clearRect(0, 0, w, h); c.fillStyle = ink; c.fillRect(0, 0, w, h);
    const scale = Math.min(joined ? w : w * .78, h) / 690;
    const impact = this.presentation.impact(reduced), clock = this.presentation.time;
    c.save(); c.translate((joined ? w / 2 : w * .79) + Math.sin(clock * 93) * impact * 4, h * .53 + Math.cos(clock * 79) * impact * 3);
    c.scale(scale * (1 + impact * .015), scale * (1 + impact * .015));
    const time = reduced ? 0 : clock * .08;
    c.globalAlpha = joined ? 1 : .65; this.tunnel(state?.players[slot], reduced);
    const count = joined ? crewCount : 4;
    const players = state?.players || Array.from({ length: count }, (_, id) => ({ id,
      character: characterById(roster[id] || CREW[id].id).id, angle: -Math.PI / 2 + id * TAU / count + time,
      ring: joined ? 2 : [2, 1, 0, 1][id], radius: joined ? T.radius : RINGS[[2, 1, 0, 1][id]], down: false }));
    this.players = players;
    for (const p of players) if (!p.down && !reduced) for (const ghost of this.presentation.trails.get(p.id) || []) {
      const age = clock - ghost.born; if (age < .005) continue;
      const { x, y } = pointAt(ghost.angle, ghost.radius), ds = depthScale(ghost.radius);
      c.save(); c.globalAlpha *= .22 * (1 - age / .14); c.translate(x, y); c.rotate(ghost.angle - Math.PI / 2); c.scale(ds, ds);
      drawFork(c, p.id === slot ? acid : accent, ink, characterById(p.character).sides); c.restore();
    }
    const entities = players.map(p => ({ radius: p.radius, draw: () => this.player(p, slot, predicted, joined) }));
    if (state) {
      for (const z of state.zones) this.zone(z);
      for (const wall of state.walls) entities.push({ radius: wall.radius, draw: () => this.wall(wall) });
      for (const e of state.enemies) entities.push({ radius: e.radius, draw: () => this.enemy(e) });
      for (const b of state.bullets) entities.push({ radius: b.radius, draw: () => this.bullet(b, slot, reduced) });
    } else for (let i = 0; i < 8; i++) {
      const radius = 18 + i * 25, angle = i * TAU / 8 + time * .5;
      entities.push({ radius, draw: () => this.enemy({ radius, angle, type: ['rush', 'skimmer', 'stalker', 'flank'][i % 4] }) });
    }
    entities.sort((a, b) => a.radius - b.radius).forEach(e => e.draw());
    // The sanctuary boundary stays legible while enemies remain visible inside it.
    this.circle(projectRadius(T.coreRadius), muted, 1);
    this.circle(projectRadius(T.coreRadius) - 4, line, .7);
    this.circle(3, danger, .8); c.fillStyle = danger; c.fillRect(-.7, -.7, 1.4, 1.4);
    if (state) this.effects(reduced);
    c.restore();
  }
}
