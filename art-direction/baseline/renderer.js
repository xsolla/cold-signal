import { T, RINGS, TAU, CREW, characterById, projectRadius, depthScale, pointAt, enemySize, ringName, safeInWall } from './rules.js';
const ink = '#10120f', paper = '#eeeee5', acid = '#d4f45b', danger = '#ff826a';
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); this.resize();
  }
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
  tunnel(own) {
    const c = this.ctx, core = projectRadius(T.coreRadius);
    const fog = c.createRadialGradient(0, 0, core, 0, 0, T.radius);
    fog.addColorStop(0, '#070b09'); fog.addColorStop(.58, '#141c17'); fog.addColorStop(1, '#283024');
    c.fillStyle = fog; c.beginPath(); c.arc(0, 0, T.radius, 0, TAU); c.fill();
    for (let i = 0; i < 24; i++) {
      const a = i * TAU / 24, b = (i + 1) * TAU / 24;
      if (i % 2 === 0) {
        c.fillStyle = '#edf7d405'; c.beginPath(); c.moveTo(Math.cos(a) * core, Math.sin(a) * core);
        c.lineTo(Math.cos(a) * T.radius, Math.sin(a) * T.radius); c.arc(0, 0, T.radius, a, b);
        c.lineTo(Math.cos(b) * core, Math.sin(b) * core); c.arc(0, 0, core, b, a, true); c.fill();
      }
      const gradient = c.createLinearGradient(Math.cos(a) * core, Math.sin(a) * core, Math.cos(a) * 300, Math.sin(a) * 300);
      gradient.addColorStop(0, '#29352b'); gradient.addColorStop(1, '#626c50');
      c.strokeStyle = gradient; c.lineWidth = i % 3 === 0 ? 1 : .55;
      c.beginPath(); c.moveTo(Math.cos(a) * core, Math.sin(a) * core); c.lineTo(Math.cos(a) * 300, Math.sin(a) * 300); c.stroke();
    }
    for (const r of [64, 84, 144, 208]) this.circle(projectRadius(r), '#3a473536', Math.max(.4, depthScale(r)));
    RINGS.forEach((r, ring) => {
      const selected = own?.ring === ring, pr = projectRadius(r);
      this.circle(pr, selected ? acid : '#a4b296', (selected ? 2 : 1) * Math.max(.6, depthScale(r)));
      c.fillStyle = selected ? acid : '#78876c'; c.font = '8px monospace'; c.textAlign = 'left';
      c.fillText(`${3 - ring} / ${ringName(ring)}`, Math.cos(-.45) * (pr + 6), Math.sin(-.45) * (pr + 6) - 4);
    });
    this.circle(268, '#4b5340', .8);
    for (let i = 0; i < 60; i++) {
      const a = i * TAU / 60;
      c.strokeStyle = i % 5 === 0 ? '#899474' : '#3d4630'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(Math.cos(a) * 268, Math.sin(a) * 268);
      c.lineTo(Math.cos(a) * (i % 5 === 0 ? 276 : 271), Math.sin(a) * (i % 5 === 0 ? 276 : 271)); c.stroke();
    }
    c.fillStyle = '#050807'; c.beginPath(); c.arc(0, 0, core, 0, TAU); c.fill();
  }
  wall(wall) {
    const c = this.ctx, radius = projectRadius(wall.radius), scale = depthScale(wall.radius);
    c.strokeStyle = paper; c.lineWidth = 10 * scale; c.lineCap = 'butt';
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
    c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.scale(scale, scale);
    if (p.down) {
      this.polygon(0, 0, 15, 4, Math.PI / 4, ink, danger, 2);
      c.strokeStyle = danger; c.lineWidth = 2; c.beginPath(); c.moveTo(-5, -5); c.lineTo(5, 5); c.moveTo(-5, 5); c.lineTo(5, -5); c.stroke();
      c.strokeStyle = acid; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 23, -Math.PI / 2, -Math.PI / 2 + Math.max(.02, p.rescue / T.rescueSeconds * TAU)); c.stroke();
      c.setLineDash([2, 3]); c.strokeStyle = '#b07667'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 27, 0, TAU); c.stroke();
    } else {
      this.polygon(0, 0, 13, character.sides, character.sides === 3 ? Math.PI / 2 : Math.PI / 4, p.id === slot ? acid : ink, p.id === slot ? ink : paper, 2);
      if (p.ward > 0 && p.wardCharges > 0) this.polygon(0, 0, 25, 6, 0, null, acid, 2);
      if (p.rally > 0) { c.fillStyle = acid; c.fillRect(-3, 20, 6, 2); c.fillRect(-1, 18, 2, 6); }
      if (p.haste > 0) { c.strokeStyle = paper; c.lineWidth = 1; c.beginPath(); c.moveTo(-19, -3); c.lineTo(-27, -3); c.moveTo(-19, 3); c.lineTo(-27, 3); c.stroke(); }
      if (p.protection > 0) { c.strokeStyle = paper; c.setLineDash([3, 4]); c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.stroke(); }
    }
    c.restore();
    if (joined) {
      const labelRadius = projectRadius(radius) + 18 * Math.max(.6, scale);
      c.fillStyle = p.down ? danger : p.id === slot ? acid : '#a9b19a'; c.font = '9px monospace'; c.textAlign = 'center';
      c.fillText(p.down ? `P${p.id + 1} RESCUE ${Math.round(p.rescue / T.rescueSeconds * 100)}%` : `P${p.id + 1} ${p.id === slot ? 'YOU' : character.name.toUpperCase()}`, Math.cos(a) * labelRadius, Math.sin(a) * labelRadius + (Math.sin(a) > 0 ? 10 : -5));
    }
  }
  render(state, { joined = false, slot = 0, reduced = false, now = 0, predicted = null, roster = [], crewCount = 4 } = {}) {
    const c = this.ctx, w = this.width, h = this.height;
    c.clearRect(0, 0, w, h); c.fillStyle = ink; c.fillRect(0, 0, w, h);
    const scale = Math.min(joined ? w : w * .78, h) / 690;
    c.save(); c.translate(joined ? w / 2 : w * .79, h * .53); c.scale(scale, scale);
    const time = state?.time || (reduced ? 0 : now * .00008);
    c.globalAlpha = joined ? 1 : .65; this.tunnel(state?.players[slot]);
    const count = joined ? crewCount : 4;
    const players = state?.players || Array.from({ length: count }, (_, id) => ({ id,
      character: characterById(roster[id] || CREW[id].id).id, angle: -Math.PI / 2 + id * TAU / count + time,
      ring: joined ? 2 : [2, 1, 0, 1][id], radius: joined ? T.radius : RINGS[[2, 1, 0, 1][id]], down: false }));
    const entities = players.map(p => ({ radius: p.radius, draw: () => this.player(p, slot, predicted, joined) }));
    if (state) {
      for (const z of state.zones) this.zone(z);
      for (const wall of state.walls) entities.push({ radius: wall.radius, draw: () => this.wall(wall) });
      for (const e of state.enemies) entities.push({ radius: e.radius, draw: () => this.enemy(e) });
      for (const b of state.bullets) entities.push({ radius: b.radius, draw: () => {
        const from = pointAt(b.angle, b.radius), to = pointAt(b.angle, b.radius + 8);
        c.strokeStyle = b.owner === slot ? acid : paper; c.lineWidth = Math.max(.5, 2.5 * depthScale(b.radius));
        c.beginPath(); c.moveTo(from.x, from.y); c.lineTo(to.x, to.y); c.stroke();
      } });
    } else for (let i = 0; i < 8; i++) {
      const radius = 18 + i * 25, angle = i * TAU / 8 + time * .5;
      entities.push({ radius, draw: () => this.enemy({ radius, angle, type: ['rush', 'skimmer', 'stalker', 'flank'][i % 4] }) });
    }
    entities.sort((a, b) => a.radius - b.radius).forEach(e => e.draw());
    // The sanctuary boundary stays legible while enemies remain visible inside it.
    this.circle(projectRadius(T.coreRadius), '#87967b', 1);
    this.circle(projectRadius(T.coreRadius) - 4, '#384b3c', .7);
    this.circle(3, danger, .8); c.fillStyle = danger; c.fillRect(-.7, -.7, 1.4, 1.4);
    if (state) for (const e of state.events) {
      const age = state.time - e.time, radius = e.radius ?? T.radius, ds = depthScale(radius);
      if (age < 0) continue;
      if (e.type === 'kill' && !reduced && age < .3) {
        const { x, y } = pointAt(e.angle, radius); c.save(); c.globalAlpha = 1 - age / .3;
        c.strokeStyle = paper; c.lineWidth = Math.max(.5, ds); c.beginPath(); c.arc(x, y, (5 + age * 48) * ds, 0, TAU); c.stroke(); c.restore();
      }
      if (e.type === 'special' && age < .8) {
        c.save(); c.globalAlpha = Math.max(.15, 1 - age / .8); c.strokeStyle = e.character === 'sana' ? acid : paper;
        c.lineWidth = (e.character === 'ivo' ? 5 : 2) * ds; if (e.character === 'mara') c.setLineDash([7 * ds, 5 * ds]);
        c.beginPath(); c.arc(0, 0, projectRadius(radius) + (reduced ? 10 : age * 32) * ds, e.angle - .75, e.angle + .75); c.stroke(); c.restore();
      }
    }
    c.restore();
  }
}
