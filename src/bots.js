import { RINGS, T, TAU, delta, depthScale, distance, enemySize, moveSpeed, projectRadius } from './rules.js';

const lookAhead = [.08, .22, .40, .62];
const homeRings = [2, 2, 2, 1];
const approachSpeed = { flank: 57, suppress: 42, skimmer: 64, stalker: 64 };
const settled = pilot => Math.abs(pilot.radius - RINGS[pilot.ring]) < 1;

function rescueAssignments(state, human) {
  const available = state.players.filter(pilot => pilot.id !== human.id && !pilot.down);
  // The player occupies slot zero, so a downed player gets the first available helper.
  const fallen = state.players.filter(pilot => pilot.down);
  const assignments = new Map();
  for (const target of fallen) {
    const humanHelping = !human.down && human.ring === target.ring && distance(human.angle, target.angle) <= T.rescueArc
      && Math.abs(human.radius - target.radius) <= 18;
    if (humanHelping || !available.length) continue;
    const travel = pilot => distance(pilot.angle, target.angle) / moveSpeed(pilot)
      + Math.abs(pilot.ring - target.ring) * .30;
    const nearest = available.reduce((best, pilot) => travel(pilot) < travel(best) ? pilot : best);
    assignments.set(nearest.id, target);
    available.splice(available.indexOf(nearest), 1);
  }
  return assignments;
}

function wallToCross(state, pilot, radius) {
  return state.walls.filter(wall => !wall.hit[pilot.id] && wall.radius >= Math.min(pilot.radius, radius) - 16)
    .reduce((first, wall) => !first || wall.radius < first.radius ? wall : first, null);
}

function flightGoal(state, pilot, rescue, human) {
  const home = -Math.PI / 2 + pilot.id * TAU / state.players.length;
  const ring = rescue?.ring ?? homeRings[pilot.id];
  const radius = RINGS[ring];
  const target = state.enemies.filter(enemy => enemy.radius > T.coreRadius && enemy.radius < radius - 14
    && distance(enemy.angle, home) < .69).reduce((best, enemy) => !best || enemy.radius > best.radius ? enemy : best, null);
  let angle = rescue?.angle ?? target?.angle ?? home;
  if (!rescue && !human.down && distance(angle, human.angle) < .28 && ring === human.ring) {
    angle = human.angle + (delta(home, human.angle) < 0 ? -.42 : .42);
  }
  const wall = wallToCross(state, pilot, radius);
  if (wall) {
    const gap = wall.gaps.reduce((best, gap) => distance(gap.angle, pilot.angle) < distance(best.angle, pilot.angle) ? gap : best);
    const arrival = (wall.radius - Math.max(pilot.radius, radius)) / wall.speed;
    const travel = distance(gap.angle, pilot.angle) / moveSpeed(pilot);
    if (arrival < travel + .65 && !wall.gaps.some(gap => distance(gap.angle, angle) < gap.width / 2 - .14)) {
      return { angle: gap.angle, ring: pilot.ring };
    }
  }
  return { angle, ring };
}

function zoneAt(zone, time, angle, radius) {
  const age = zone.age + time;
  if (age < zone.warn - .05 || age >= zone.warn + zone.life) return false;
  const onRail = zone.minRadius === undefined ? Math.abs(radius - zone.radius) < 16
    : radius >= zone.minRadius - 13 && radius <= zone.maxRadius + 13;
  return onRail && distance(zone.angle, angle) < zone.width / 2 + .07;
}

function threatsFor(state, pilot) {
  const enemies = state.enemies.filter(enemy => enemy.radius > T.coreRadius
    && Math.abs(enemy.radius - pilot.radius) < 140);
  const walls = state.walls.filter(wall => !wall.hit[pilot.id] && Math.abs(wall.radius - pilot.radius) < 175);
  return lookAhead.map(time => ({
    time,
    walls: walls.map(wall => ({ gaps: wall.gaps, radius: projectRadius(wall.radius - wall.speed * time) })),
    zones: state.zones.filter(zone => zone.age + time >= zone.warn - .05 && zone.age + time < zone.warn + zone.life),
    enemies: enemies.map(enemy => {
      const rail = RINGS[enemy.ring];
      const speed = approachSpeed[enemy.type] ?? 86;
      const radius = Math.min(enemy.type === 'suppress' ? 156 : rail ?? T.radius, enemy.radius + speed * time);
      let angle = enemy.angle;
      if (enemy.type === 'flank') angle = enemy.base + enemy.turn * .68 * Math.min(1, Math.max(0, (enemy.age + time - 1.2) / .7));
      if (enemy.type === 'skimmer' && radius === rail) angle += enemy.turn * .8 * time;
      if (enemy.type === 'suppress') angle += enemy.turn * .15 * time;
      return { angle, radius: projectRadius(radius), size: enemySize(enemy) * depthScale(radius) };
    })
  }));
}

function flightRisk(pilot, direction, ring, goal, threats) {
  const speed = moveSpeed(pilot), destination = RINGS[ring];
  let risk = 0;
  for (const { time, walls, zones, enemies } of threats) {
    // Score a sustained turn. The next decision can stop it at the goal.
    const angle = pilot.angle + direction * speed * time;
    const radius = pilot.radius + Math.sign(destination - pilot.radius) * Math.min(Math.abs(destination - pilot.radius), T.hopSpeed * time);
    const depth = depthScale(radius), projected = projectRadius(radius);
    const cost = time < .23 ? 7 : 3.5;
    const blocked = walls.some(wall => Math.abs(wall.radius - projected) < 19 * depth + 8
      && !wall.gaps.some(gap => distance(gap.angle, angle) < gap.width / 2 - .08));
    const inZone = zones.some(zone => zoneAt(zone, time, angle, radius));
    const contact = enemies.some(enemy => {
      const gap = distance(enemy.angle, angle);
      return Math.abs(projected - enemy.radius) < enemy.size + 15 * depth
        && gap * Math.min(projected, enemy.radius) < enemy.size + 16 * depth;
    });
    if (blocked || inZone || contact) risk += cost;
  }
  const error = delta(goal.angle, pilot.angle);
  const progress = Math.abs(error) - Math.abs(delta(goal.angle, pilot.angle + direction * speed * .045));
  return risk - progress * 5 + Math.abs(ring - goal.ring) * .8 + (ring === pilot.ring ? 0 : .14);
}

function combatSpecial(state, pilot, rescue, risk) {
  if (pilot.specialHeld || pilot.specialCooldown > T.step * state.timeScale) return false;
  const close = other => distance(other.angle, pilot.angle) <= .72 && Math.abs(other.radius - pilot.radius) <= 68;
  const covering = rescue && close(rescue);
  if (pilot.character === 'sana') return covering
    || (state.players.filter(other => !other.down && close(other)).length >= 3 && state.enemies.length >= 9);
  if (pilot.character === 'ivo') {
    const targets = state.enemies.filter(enemy => enemy.radius > T.coreRadius && distance(enemy.angle, pilot.angle) < .72);
    return targets.length >= 5 || (risk > 2 && (targets.length > 0 || state.zones.some(zone => distance(zone.angle, pilot.angle) < .72)
      || state.walls.some(wall => !wall.hit[pilot.id] && Math.abs(wall.radius - pilot.radius) < 65)));
  }
  if (pilot.character === 'mara') return (covering && risk > 0) || (risk > 2 && !pilot.wardCharges);
  return (covering && risk > 1) || (risk > 3 && pilot.protection < .1);
}

export function botInputs(state) {
  const [human, ...bots] = state.players;
  const assignments = rescueAssignments(state, human);
  return bots.map(pilot => {
    if (pilot.down) return {};
    const rescue = assignments.get(pilot.id);
    const goal = flightGoal(state, pilot, rescue, human);
    const threats = threatsFor(state, pilot);
    const rings = [pilot.ring];
    if (settled(pilot) && pilot.ring > 0 && !pilot.inwardHeld) rings.push(pilot.ring - 1);
    if (settled(pilot) && pilot.ring < RINGS.length - 1 && !pilot.outwardHeld) rings.push(pilot.ring + 1);
    let best = { direction: 0, ring: pilot.ring, cost: Infinity };
    for (const ring of rings) for (const direction of [0, -1, 1]) {
      const cost = flightRisk(pilot, direction, ring, goal, threats);
      if (cost < best.cost) best = { direction, ring, cost };
    }
    const risk = flightRisk(pilot, 0, pilot.ring, { angle: pilot.angle, ring: pilot.ring }, threats);
    return { left: best.direction < 0, right: best.direction > 0,
      inward: best.ring < pilot.ring, outward: best.ring > pilot.ring,
      special: combatSpecial(state, pilot, rescue, risk) };
  });
}
