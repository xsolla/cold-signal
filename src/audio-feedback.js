import { T, canHelpRescue, insideZone, safeInWall } from './rules.js';

const WARNING_WINDOW = .94;
const WARNING_SPACING = .34;

export class AudioFeedback {
  constructor() { this.reset(); }

  reset() {
    this.ring = null;
    this.cooldown = 0;
    this.rescue = null;
    this.warned = new Set();
    this.warningUntil = 0;
  }

  update(state, slot = 0) {
    const own = state.players[slot];
    const depth = !own.down && this.ring !== null ? Math.sign(this.ring - own.ring) : 0;
    const ready = !own.down && own.specialCooldown === 0 && this.cooldown > 0;
    this.ring = own.ring;
    this.cooldown = own.specialCooldown;

    const target = state.players.reduce((best, pilot) => {
      if (!pilot.down || !pilot.rescue || !canHelpRescue(own, pilot)) return best;
      return !best || pilot.rescue > best.rescue ? pilot : best;
    }, null);
    const previous = this.rescue;
    const formerTarget = previous && state.players.find(pilot => pilot.id === previous.target);
    this.rescue = target && { target: target.id, progress: target.rescue / T.rescueSeconds };
    const rescueStarted = !!this.rescue && this.rescue.target !== previous?.target;
    const rescueBroken = !target && formerTarget?.down && formerTarget.rescue === 0 && previous.progress >= .25;

    for (const id of this.warned) {
      if (!state.walls.some(wall => wall.id === id) && !state.zones.some(zone => zone.id === id)) this.warned.delete(id);
    }
    const warning = !own.down && state.elapsed >= this.warningUntil && this.incomingWarning(state, own);
    if (warning) {
      this.warned.add(warning.id);
      this.warningUntil = state.elapsed + WARNING_SPACING;
    }
    return { depth, ready, warning: warning?.kind, rescue: this.rescue, rescueStarted, rescueBroken };
  }

  incomingWarning(state, own) {
    let soonest = WARNING_WINDOW;
    let warning;
    for (const wall of state.walls) {
      const lead = (wall.radius - own.radius) / (wall.speed * state.timeScale);
      if (lead <= .15 || lead > soonest || wall.hit[own.id] || safeInWall(wall, own.angle)
        || this.warned.has(wall.id)) continue;
      soonest = lead;
      warning = { id: wall.id, kind: 'wall' };
    }
    for (const zone of state.zones) {
      const lead = (zone.warn - zone.age) / state.timeScale;
      if (lead <= .12 || lead > soonest || !insideZone(zone, own) || this.warned.has(zone.id)) continue;
      soonest = lead;
      warning = { id: zone.id, kind: 'zone' };
    }
    return warning;
  }
}
