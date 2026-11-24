import { T, RINGS, TAU, CREW, characterById, projectRadius, depthScale, pointAt, enemySize, ringName, safeInWall, distance, rushAngle, hullShielded } from './rules.js';
import { STEP_SECONDS } from './audio-chart.js';
import { PALETTE, Presentation, drawFork, noise } from './cold-signal.js';
import { ArenaEffects, arenaSpan } from './arena-effects.js';
const { bg: ink, paper, signal: acid, danger, accent, line, muted, field } = PALETTE;
const hullStart = -Math.PI / 2 + .045, hullSweep = TAU - .09;
const hullAngle = health => hullStart + hullSweep * health / T.hullMax;
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
  bloom(x, y, radius, color, alpha) {
    const c = this.ctx, glow = c.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, color); glow.addColorStop(.25, `${color}70`); glow.addColorStop(1, `${color}00`);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= alpha; c.fillStyle = glow;
    c.fillRect(x - radius, y - radius, radius * 2, radius * 2); c.restore();
  }
  tunnel(own, reduced, hasHull, light) {
    const c = this.ctx, core = projectRadius(T.coreRadius);
    const fog = c.createRadialGradient(0, 0, core, 0, 0, 330);
    fog.addColorStop(0, field); fog.addColorStop(.75, ink); fog.addColorStop(1, ink);
    c.fillStyle = fog; c.beginPath(); c.arc(0, 0, 330, 0, TAU); c.fill();
    if (light) {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.drawImage(light, -arenaSpan / 2, -arenaSpan / 2, arenaSpan, arenaSpan); c.restore();
    }
    if (!light) for (let i = 0; i < 32; i++) {
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
    if (!light) for (let i = 0; i < 12; i++) {
      const t = ((i / 12 + (reduced ? 0 : this.presentation.time * .65)) % 1);
      this.circle(projectRadius(T.coreRadius + t * (T.radius - T.coreRadius)), '#33467880', .55);
    }
    if (!reduced && !light) for (let i = 0; i < 28; i++) {
      const t = (noise(i + 1) + this.presentation.time * (1.2 + noise(i + 30) * .4)) % 1;
      const a = noise(i + 80) * TAU, r = 45 + t * 210;
      c.strokeStyle = i % 4 ? '#8d85ff70' : '#79e5ff90'; c.lineWidth = .7 + t;
      c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      c.lineTo(Math.cos(a) * (r + 8 + t * 27), Math.sin(a) * (r + 8 + t * 27)); c.stroke();
    }
    RINGS.forEach((r, ring) => {
      const selected = own?.ring === ring, pr = projectRadius(r);
      if (ring !== 2 || !hasHull) this.circle(pr, selected ? acid : muted, (selected ? 2 : 1) * Math.max(.6, depthScale(r)));
      const labelRadius = pr + (ring === 2 ? -9 : 6);
      c.fillStyle = selected ? acid : muted; c.font = '8px monospace'; c.textAlign = ring === 2 ? 'right' : 'left';
      c.fillText(`${3 - ring} / ${ringName(ring)}`, Math.cos(-.45) * labelRadius, Math.sin(-.45) * labelRadius - 4);
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
  hull(state) {
    const c = this.ctx;
    const shielded = state.status === 'playing' && hullShielded(state);
    c.save(); c.lineCap = 'butt';
    this.circle(T.radius, line, 7);
    if (state.hull > 0) {
      c.strokeStyle = shielded ? paper : state.hull <= T.hullMax * .25 ? danger : acid;
      c.beginPath(); c.arc(0, 0, T.radius, hullStart, hullAngle(state.hull)); c.stroke();
    }
    c.restore();
  }
  hullImpacts(reduced) {
    const c = this.ctx;
    c.save();
    c.lineCap = 'butt';
    for (const impact of this.presentation.effects) {
      if (impact.type !== 'breach') continue;
      const age = this.presentation.time - impact.born;
      if (age < .2) {
        c.globalAlpha = .8 * (1 - age / .2);
        c.strokeStyle = impact.damage ? danger : paper;
        const width = impact.kind === 'flank' ? .085 : .045;
        c.lineWidth = 3;
        c.beginPath(); c.arc(0, 0, T.radius + 6, impact.angle - width, impact.angle + width); c.stroke();
      }
      const life = reduced ? .25 : .56;
      if (!impact.damage || age >= life) continue;
      const progress = age / life;
      const radius = T.radius + (reduced ? 0 : 30 * (1 - (1 - progress) ** 2));
      c.beginPath();
      c.arc(0, 0, radius, hullAngle(impact.hullAfter), hullAngle(impact.hullAfter + impact.damage));
      c.strokeStyle = danger; c.lineWidth = 12; c.globalAlpha = .52 * (1 - progress);
      c.stroke();
      c.strokeStyle = paper; c.lineWidth = 6; c.globalAlpha = 1 - progress;
      c.stroke();
    }
    c.restore();
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
  formationCues(state, reduced) {
    const c = this.ctx;
    for (const cue of state.encounter?.cues ?? []) {
      const lead = cue.kind === 'gate-crossing' ? 0 : 4 * STEP_SECONDS;
      const remaining = cue.at - state.elapsed;
      if (remaining > 4 * STEP_SECONDS) break;
      if (remaining > lead || remaining < -.24) continue;
      const reveal = remaining <= 1e-8;
      const envelope = reveal ? 1 + remaining / .24 : 1 - remaining / lead;
      c.save();
      c.globalAlpha *= reduced ? .26 + .38 * envelope : .24 + .58 * envelope;
      c.setLineDash(reveal ? [] : [4, 6]);
      if (cue.wall) this.gapCue(cue, reveal);
      for (const squad of cue.squads ?? []) {
        c.setLineDash(reveal ? [] : [4, 6]);
        this.squadCue(squad, cue.kind, reveal);
      }
      c.restore();
    }
  }
  gapCue({ wall, kind }, reveal) {
    const c = this.ctx;
    const radius = kind === 'gate-crossing' ? T.radius : T.radius + 19;
    c.strokeStyle = acid;
    c.lineWidth = reveal ? 3 : 1.5;
    for (const middle of [wall.angle, wall.angle + Math.PI]) {
      const left = middle - wall.width / 2, right = middle + wall.width / 2;
      c.beginPath(); c.arc(0, 0, radius, left, right); c.stroke();
      for (const angle of [left, right]) {
        const inner = pointAt(angle, radius - 13), outer = pointAt(angle, radius + 9);
        c.beginPath(); c.moveTo(inner.x, inner.y); c.lineTo(outer.x, outer.y); c.stroke();
      }
    }
  }
  squadCue({ angle, bend, leader }, kind, reveal) {
    const c = this.ctx;
    const target = { stalker: RINGS[0], skimmer: RINGS[1], suppress: 156 }[leader] ?? 211;
    const color = kind === 'pincer' ? accent : kind === 'ladder' ? danger : acid;
    c.strokeStyle = color; c.lineWidth = reveal ? 2.4 : 1.4;
    c.beginPath();
    for (let index = 0; index <= 10; index++) {
      const radius = T.coreRadius + 4 + (target - T.coreRadius - 4) * index / 10;
      const point = pointAt(bend ? rushAngle(angle, bend, radius) : angle, radius);
      if (index === 0) c.moveTo(point.x, point.y);
      else c.lineTo(point.x, point.y);
    }
    c.stroke();
    const direction = bend ? rushAngle(angle, bend, target) : angle;
    const tip = pointAt(direction, target);
    c.setLineDash([]);
    this.polygon(tip.x, tip.y, reveal ? 9 : 6, kind === 'pincer' || kind === 'ladder' ? 4 : 3,
      direction, reveal ? color : null, color, 1.6);
    if (reveal) {
      c.beginPath(); c.arc(0, 0, projectRadius(58), angle - .21, angle + .21); c.stroke();
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
      const radius = Math.max(T.coreRadius, e.radius - 22);
      const tail = pointAt(e.bend ? rushAngle(e.base, e.bend, radius) : e.angle - (e.type === 'flank' ? .06 : 0), radius);
      c.save(); c.globalAlpha *= .22; c.strokeStyle = e.type === 'rush' ? paper : danger;
      c.lineWidth = Math.max(.5, scale * 2); c.beginPath(); c.moveTo(x, y); c.lineTo(tail.x, tail.y); c.stroke(); c.restore();
    }
    {
      if (e.type === 'rush') this.polygon(x, y, size, 3, e.angle, e.escort ? null : paper, e.escort ? paper : null, line);
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
  player(p, slot, predicted) {
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
  }
  crewLabels(players, slot, predicted, arenaScale) {
    const c = this.ctx, activeSize = 9;
    const rescueSize = Math.max(activeSize, 8 / arenaScale);
    const rescueStep = rescueSize + 2 / arenaScale, padding = 3 / arenaScale;
    const labels = players.map(p => {
      const angle = p.id === slot && predicted !== null && !p.down ? predicted : p.angle;
      const depth = Math.max(.6, depthScale(p.radius));
      const rescuing = !p.down && players.some(other => other.down && other.ring === p.ring
        && distance(angle, other.angle) < .28);
      const radius = projectRadius(p.radius) + (rescuing ? 43 : p.down ? 33 : 20) * depth;
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius + (Math.sin(angle) > 0 ? 10 : -5);
      const text = p.down ? `P${p.id + 1} / ${ringName(p.ring)}` : `P${p.id + 1}${p.id === slot ? ' YOU' : ''}`;
      return { player: p, x, y, text };
    });
    c.save(); c.textAlign = 'center';
    c.font = `${rescueSize}px monospace`;
    const rescues = labels.filter(label => label.player.down).map(label => {
      const progress = `RESCUE ${Math.round(label.player.rescue / T.rescueSeconds * 100)}%`;
      const width = Math.max(c.measureText(label.text).width, c.measureText(progress).width);
      return { ...label, progress, left: label.x - width / 2, right: label.x + width / 2 };
    });
    c.font = `${activeSize}px monospace`;
    const active = labels.filter(label => !label.player.down);
    if (rescues.length) {
      for (const label of active) label.halfWidth = c.measureText(label.text).width / 2;
      for (const label of active) {
        const { x, y, halfWidth } = label, clearance = halfWidth + padding;
        const blocked = rescues.filter(rescue => y >= rescue.y - rescueSize - padding && y - activeSize <= rescue.y + rescueStep + padding)
          .map(rescue => [rescue.left - clearance, rescue.right + clearance]);
        const contains = (interval, center) => center > interval[0] && center < interval[1];
        if (!blocked.some(interval => contains(interval, x))) continue;
        // A relocated tag must clear both rescue blocks and adjacent active tags.
        for (const other of active) {
          if (other === label || Math.abs(other.y - y) > activeSize + padding) continue;
          const spacing = clearance + other.halfWidth;
          blocked.push([other.x - spacing, other.x + spacing]);
        }
        const limit = this.width / (2 * arenaScale) - clearance;
        const alternatives = [-limit, limit, ...blocked.flat()].sort((a, b) => Math.abs(a - x) - Math.abs(b - x));
        label.x = alternatives.find(center => Math.abs(center) <= limit && !blocked.some(interval => contains(interval, center))) ?? x;
      }
    }
    for (const { player, text, x, y } of active) {
      c.fillStyle = player.id === slot ? acid : muted; c.fillText(text, x, y);
    }
    // Put rescue text above other labels and use a navy outline against bursts.
    c.font = `${rescueSize}px monospace`;
    c.strokeStyle = ink; c.lineWidth = 2 / arenaScale; c.lineJoin = 'round'; c.fillStyle = danger;
    for (const { text, progress, x, y } of rescues) {
      c.strokeText(text, x, y); c.fillText(text, x, y);
      c.strokeText(progress, x, y + rescueStep); c.fillText(progress, x, y + rescueStep);
    }
    c.restore();
  }
  bullet(b, slot, reduced) {
    const c = this.ctx, from = pointAt(b.angle, b.radius);
    // Never extend a trail beyond where this real projectile was first observed.
    const end = Math.min(this.presentation.origins.get(b.id) ?? b.radius, b.radius + (reduced ? 12 : 78));
    const to = pointAt(b.angle, end), head = pointAt(b.angle, Math.max(T.coreRadius, b.radius - 5));
    const color = b.owner === slot ? acid : this.players[b.owner]?.character === 'sana' ? accent : paper;
    const ds = depthScale(b.radius);
    c.save(); c.strokeStyle = color;
    if (!reduced && end > b.radius) {
      const gradient = c.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, color); gradient.addColorStop(.45, `${color}b0`); gradient.addColorStop(1, `${color}00`);
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = gradient;
      for (const [alpha, width] of [[.2, 10], [.9, 3.5]]) {
        c.globalAlpha = alpha; c.lineWidth = Math.max(width / 3, width * ds);
        c.beginPath(); c.moveTo(from.x, from.y); c.lineTo(to.x, to.y); c.stroke();
      }
      this.bloom(from.x, from.y, 10 * Math.max(.4, ds), color, .45);
    }
    c.globalAlpha = 1; c.strokeStyle = reduced ? color : paper;
    c.lineWidth = Math.max(reduced ? .5 : .9, (reduced ? 2 : 2.5) * ds);
    c.beginPath(); c.moveTo(head.x, head.y); c.lineTo(from.x, from.y); c.stroke(); c.restore();
  }
  explosion(e, pos, age, ds, reduced, enhanced) {
    const c = this.ctx;
    if (reduced) {
      if (age >= .48) return;
      c.globalAlpha = 1 - age / .48; c.strokeStyle = paper; c.lineWidth = Math.max(.5, ds);
      c.beginPath(); c.arc(pos.x, pos.y, (5 + age / .48 * 3) * ds, 0, TAU); c.stroke(); return;
    }
    if (age >= .72) return;
    // FX retain depth but do not collapse to collider size near the vanishing point.
    const scale = Math.max(.6, Math.sqrt(ds)), t = age / .72, fade = (1 - t) ** 1.6;
    c.translate(pos.x, pos.y); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade;
    if (enhanced) {
      c.globalAlpha *= .72;
      this.circle((5 + t * 54) * scale, e.chainDepth > 0 ? accent : acid, (1.5 * (1 - t) + .5) * scale);
    } else {
      this.bloom(0, 0, (22 + t * 65) * scale, acid, .5);
      this.circle((8 + t * 112) * scale, acid, (3.5 * (1 - t) + .6) * scale);
      c.beginPath(); c.arc(0, 0, (4 + t * 80) * scale, e.id, e.id + TAU * .77);
      c.strokeStyle = accent; c.lineWidth = 2 * scale; c.stroke();
    }
    if (age < .09) {
      c.globalAlpha = 1 - age / .09; c.strokeStyle = paper; c.lineWidth = 3 * scale;
      c.beginPath(); c.moveTo(-26 * scale, 0); c.lineTo(26 * scale, 0);
      c.moveTo(0, -26 * scale); c.lineTo(0, 26 * scale); c.stroke();
    }
    if (enhanced) return;
    for (let i = 0; i < 36; i++) {
      const a = noise(e.id * 23 + i) * TAU, speed = 90 + noise(i + e.id) * 240;
      const distance = (6 + age * speed) * scale, length = (3 + (1 - t) * 20) * scale;
      const x = Math.cos(a) * distance, y = Math.sin(a) * distance;
      const color = [acid, paper, accent, danger][i % 4];
      c.globalAlpha = fade * (.45 + noise(i * 17 + e.id) * .55);
      if (i % 6 === 0) this.polygon(x, y, (2 + (1 - t) * 3) * scale, 3, a + age * 8, color, null);
      else {
        c.strokeStyle = color; c.lineWidth = (i % 3 ? 1.5 : 3) * scale;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * length, y + Math.sin(a) * length); c.stroke();
      }
    }
  }
  effects(reduced, enhanced) {
    const c = this.ctx, time = this.presentation.time;
    for (const e of this.presentation.effects) {
      const age = time - e.born, radius = e.radius ?? T.radius, ds = depthScale(radius);
      const pos = pointAt(e.angle ?? 0, radius);
      c.save();
      if (e.type === 'kill') {
        if (!reduced && e.chainDepth > 0 && age < .3) {
          const from = pointAt(e.fromAngle, e.fromRadius);
          c.globalAlpha = 1 - age / .3; c.globalCompositeOperation = 'lighter';
          c.strokeStyle = accent; c.lineWidth = 2;
          c.beginPath(); c.moveTo(from.x, from.y); c.lineTo(pos.x, pos.y); c.stroke();
        }
        this.explosion(e, pos, age, ds, reduced, enhanced);
      }
      if (e.type === 'special' && age < .65) {
        const t = Math.min(1, age / .4); c.globalAlpha = 1 - age / .65;
        c.strokeStyle = e.character === 'sana' ? accent : acid;
        c.lineWidth = (e.character === 'ivo' ? 4 : 2) * ds;
        if (e.character === 'ivo') {
          // The arena cue shows the 1.6-radian sector across all playable rails.
          const start = e.angle - .8, end = e.angle + .8;
          const core = projectRadius(T.coreRadius), outer = projectRadius(T.radius);
          if (reduced) {
            c.lineWidth = 2;
            c.beginPath(); c.arc(0, 0, core, start, end);
            const outerStart = pointAt(start, T.radius);
            c.moveTo(outerStart.x, outerStart.y); c.arc(0, 0, outer, start, end);
            for (const angle of [start, end]) {
              const from = pointAt(angle, T.coreRadius), to = pointAt(angle, T.radius);
              c.moveTo(from.x, from.y); c.lineTo(to.x, to.y);
            }
            c.stroke();
          } else {
            const r = projectRadius(T.coreRadius + (T.radius - T.coreRadius) * t), fade = c.globalAlpha;
            c.globalCompositeOperation = 'lighter';
            const fan = c.createRadialGradient(0, 0, core, 0, 0, Math.max(core + .01, r));
            fan.addColorStop(0, `${acid}00`); fan.addColorStop(.7, `${accent}0c`); fan.addColorStop(1, `${acid}45`);
            c.fillStyle = fan; c.beginPath(); c.arc(0, 0, r, start, end);
            c.arc(0, 0, core, end, start, true); c.closePath(); c.fill();
            c.globalAlpha = fade * .25; c.lineWidth = 16;
            c.beginPath(); c.arc(0, 0, r, start, end); c.stroke();
            c.globalAlpha = fade; c.lineWidth = 5;
            c.beginPath(); c.arc(0, 0, r, start, end); c.stroke();
            c.strokeStyle = paper; c.lineWidth = 1.2;
            c.beginPath(); c.arc(0, 0, Math.max(core, r - 8), start, end); c.stroke();
            for (let i = 0; i < 9; i++) {
              const a = start + i * .2; c.strokeStyle = i % 2 ? accent : acid; c.lineWidth = i % 2 ? 1.5 : 2.5;
              c.beginPath(); c.moveTo(Math.cos(a) * Math.max(core, r - 65), Math.sin(a) * Math.max(core, r - 65));
              c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke();
            }
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
        const scale = reduced ? ds : Math.max(.6, Math.sqrt(ds)), color = e.type === 'down' ? danger : acid;
        c.globalAlpha = 1 - age / .7; c.strokeStyle = color; c.lineWidth = (reduced ? 2 : 3) * scale;
        c.beginPath(); c.arc(pos.x, pos.y, (20 + (reduced ? 0 : age * 145)) * scale, 0, TAU); c.stroke();
        if (!reduced && !enhanced) {
          this.bloom(pos.x, pos.y, (25 + age * 70) * scale, color, .3);
          c.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 16; i++) {
            const a = i * TAU / 16 + e.id, r = (24 + age * 175) * scale;
            c.strokeStyle = i % 2 ? accent : color; c.lineWidth = 2 * scale;
            c.beginPath(); c.moveTo(pos.x + Math.cos(a) * r, pos.y + Math.sin(a) * r);
            c.lineTo(pos.x + Math.cos(a) * (r + 10 * scale), pos.y + Math.sin(a) * (r + 10 * scale)); c.stroke();
          }
        }
        if (e.type === 'rescue') { c.fillStyle = acid; c.font = 'bold 10px monospace'; c.textAlign = 'center'; c.fillText('BACK IN THE FIGHT', pos.x, pos.y - 38 * Math.max(.6, ds)); }
      }
      c.restore();
    }
    const burst = this.presentation.effects.filter(e => e.type === 'kill' && time - e.born < .3);
    if (burst.length >= 3) { c.fillStyle = acid; c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.fillText(`${burst.length} TARGETS CLEARED${burst.some(e => e.chainDepth > 0) ? ' / CHAIN' : ''}`, 0, -304); }
  }
  render(state, { joined = false, slot = 0, reduced = false, paused = false, now = 0, predicted = null, roster = [], crewCount = 4 } = {}) {
    const c = this.ctx, w = this.width, h = this.height;
    this.presentation.update(state, { now, paused, reduced, slot, predicted }); this.reduced = reduced;
    c.clearRect(0, 0, w, h); c.fillStyle = ink; c.fillRect(0, 0, w, h);
    const scale = Math.min(joined ? w : w * .78, h) / arenaSpan;
    const camera = this.presentation.camera(reduced || paused), clock = this.presentation.time, motionScale = Math.min(1, h / 680);
    c.save(); c.translate((joined ? w / 2 : w * .79) + camera.x * motionScale, h * .53 + camera.y * motionScale);
    c.rotate(camera.rotation); c.scale(scale * camera.zoom, scale * camera.zoom);
    const time = reduced ? 0 : clock * .08;
    let light = null;
    if (state && !reduced && scale > 0) {
      this.arenaEffects ??= new ArenaEffects();
      light = this.arenaEffects.draw(state, this.presentation, arenaSpan * scale, slot);
    }
    c.globalAlpha = joined ? 1 : .65; this.tunnel(state?.players[slot], reduced, !!state, light);
    if (state?.status === 'playing') this.formationCues(state, reduced);
    const count = joined ? crewCount : 4;
    const players = state?.players || Array.from({ length: count }, (_, id) => ({ id,
      character: characterById(roster[id] || CREW[id].id).id, angle: -Math.PI / 2 + id * TAU / count + time,
      ring: joined ? 2 : [2, 1, 0, 1][id], radius: joined ? T.radius : RINGS[[2, 1, 0, 1][id]], down: false }));
    this.players = players;
    for (const p of players) if (!p.down && !reduced) {
      const trail = this.presentation.trails.get(p.id) || [];
      const color = p.id === slot ? acid : p.character === 'sana' ? accent : paper;
      if (trail.length > 1) {
        const from = pointAt(trail[0].angle, trail[0].radius), to = pointAt(trail.at(-1).angle, trail.at(-1).radius);
        const gradient = c.createLinearGradient(from.x, from.y, to.x, to.y);
        gradient.addColorStop(0, `${color}00`); gradient.addColorStop(1, color);
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = gradient;
        for (const [alpha, width] of [[.2, 9], [.65, 2.5]]) {
          c.globalAlpha *= alpha; c.lineWidth = Math.max(1, width * depthScale(p.radius)); c.beginPath();
          trail.forEach((point, i) => { const pos = pointAt(point.angle, point.radius); i ? c.lineTo(pos.x, pos.y) : c.moveTo(pos.x, pos.y); });
          c.stroke(); c.globalAlpha = joined ? 1 : .65;
        }
        c.restore();
      }
      for (let i = 0; i < trail.length; i += 2) {
        const ghost = trail[i], age = clock - ghost.born; if (age < .005) continue;
        const { x, y } = pointAt(ghost.angle, ghost.radius), ds = depthScale(ghost.radius);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= .32 * (1 - age / .24);
        c.translate(x, y); c.rotate(ghost.angle - Math.PI / 2); c.scale(ds, ds);
        drawFork(c, color, ink, characterById(p.character).sides); c.restore();
      }
    }
    const entities = [];
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
    if (state) {
      this.effects(reduced, !!light);
      this.hull(state);
      this.hullImpacts(reduced);
    }
    // Pilot silhouettes, rescue progress and the sanctuary stay above large FX.
    const crewByDepth = [...players].sort((a, b) => a.radius - b.radius);
    crewByDepth.forEach(p => this.player(p, slot, predicted));
    if (joined && scale > 0) this.crewLabels(crewByDepth, slot, predicted, scale);
    this.circle(projectRadius(T.coreRadius), muted, 1);
    this.circle(projectRadius(T.coreRadius) - 4, line, .7);
    this.circle(3, danger, .8); c.fillStyle = danger; c.fillRect(-.7, -.7, 1.4, 1.4);
    c.restore();
  }
}
