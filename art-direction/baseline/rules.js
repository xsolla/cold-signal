// Authoritative rules and perspective: shared by server, renderer, and replay checks.
export const TAU = Math.PI * 2;
export const RINGS = Object.freeze([112, 176, 240]);
export const ringName = ring => ['INNER', 'MIDDLE', 'OUTER'][ring] || 'OUTER';
export const T = Object.freeze({ radius: 240, coreRadius: 44, hopSpeed: 320, muzzleInset: 2,
  speed: 3.1, fireInterval: .115, bulletSpeed: 590, rescueSeconds: 1.65, rescueArc: .20,
  protectionSeconds: .85, duration: 90, step: 1 / 60 });
// The vanishing point compresses distant rails. Foreground remains linear for readable wall warnings.
export const projectRadius = r => r >= T.radius ? r : Math.max(0, r) / (1.8 - .8 * Math.max(0, r) / T.radius);
export const depthScale = r => Math.max(.08, Math.min(2.4, (projectRadius(r) / T.radius) ** 1.18));
export const pointAt = (angle, radius) => ({ x: Math.cos(angle) * projectRadius(radius), y: Math.sin(angle) * projectRadius(radius) });
export const enemySize = e => e.type === 'suppress' ? 15 : ['skimmer', 'stalker'].includes(e.type) ? 12 : 10;
export const CREW = Object.freeze([
  { id: 'mara', name: 'Mara', role: 'Anchor', ability: 'Bulwark', symbol: '▲', sides: 3, cooldown: 12,
    description: 'Shield nearby crew against a hit. Hold a rescue position.', quote: 'Stay with me.' },
  { id: 'ivo', name: 'Ivo', role: 'Breaker', ability: 'Shockwave', symbol: '◇', sides: 4, cooldown: 14,
    description: 'Blast a sector, clear marked danger, and open a wall gap.', quote: 'I can make a way.' },
  { id: 'sana', name: 'Sana', role: 'Beacon', ability: 'Rally', symbol: '⬟', sides: 5, cooldown: 12,
    description: 'Boost nearby crew’s automatic fire and proximity rescue.', quote: 'We are still here.' },
  { id: 'rook', name: 'Rook', role: 'Runner', ability: 'Slipstream', symbol: '⬡', sides: 6, cooldown: 10,
    description: 'Give nearby crew faster movement and a moment of cover.', quote: 'On your left.' }
]);
export const characterById = id => CREW.find(c => c.id === id) || CREW[0];
export const moveSpeed = p => T.speed * (p.haste > 0 ? 1.55 : 1);
export const wrap = a => { const value = a % TAU; return value < 0 ? value + TAU : value; };
export const delta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const distance = (a, b) => Math.abs(delta(a, b));
export function cleanInput(input = {}) {
  if (!input || typeof input !== 'object') input = {};
  return { left: input.left === true, right: input.right === true, special: input.special === true,
    inward: input.inward === true, outward: input.outward === true };
}
export function makeMatch(seed = 1, options = {}) {
  const count = options.count === 2 ? 2 : 4;
  const timeScale = options.timeScale === 1 ? 1 : .5;
  return { status: 'playing', time: 0, elapsed: 0, timeScale, seed: seed >>> 0, rng: (seed >>> 0) || 1,
    nextId: 1, eventId: 0, score: 0, rescues: 0, phase: 'INGRESS',
    enemyClock: .7, wallClock: 5, players: Array.from({ length: count }, (_, id) => ({ id,
      character: characterById(options.characters?.[id] || CREW[id].id).id,
      angle: wrap(-Math.PI / 2 + id * TAU / count), ring: 2, radius: T.radius, prevRadius: T.radius,
      inwardHeld: false, outwardHeld: false, down: false, rescue: 0,
      protection: 1.4, cooldown: 0, kills: 0, specialCooldown: 0, specialHeld: false,
      specialUses: 0, ward: 0, wardCharges: 0, rally: 0, haste: 0 })),
    enemies: [], bullets: [], walls: [], zones: [], events: [] };
}
function random(s) {
  let x = s.rng; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  s.rng = x >>> 0; return s.rng / 4294967296;
}
function event(s, type, data = {}) {
  s.events.push({ id: ++s.eventId, type, time: s.time, ...data });
  if (s.events.length > 20) s.events.shift();
}
export function downPlayer(s, id) {
  const p = s.players[id];
  if (s.status !== 'playing' || !p || p.down || p.protection > 0) return false;
  if (p.ward > 0 && p.wardCharges > 0) {
    p.wardCharges--; p.protection = .6; event(s, 'shield', { player: id, angle: p.angle, radius: p.radius }); return false;
  }
  p.down = true; p.rescue = 0; event(s, 'down', { player: id, angle: p.angle, radius: p.radius });
  return true;
}
export function phaseAt(time) {
  if (time < 12) return 'INGRESS'; if (time < 26) return 'CROSSCURRENT';
  if (time < 31) return 'BREATH'; if (time < 49) return 'PRESSURE';
  if (time < 54) return 'BREATH'; if (time < 70) return 'CONVERGENCE';
  if (time < 74) return 'BREATH'; if (time < 90) return 'FINAL SURGE';
  return 'BRING THEM BACK';
}
function spawnEnemy(s) {
  const roll = random(s);
  const type = s.time < 5 ? 'rush' : roll < .30 ? 'rush' : roll < .53 ? 'skimmer'
    : roll < .72 ? 'stalker' : s.time < 14 ? 'rush' : s.time < 30 || roll < .9 ? 'flank' : 'suppress';
  const angle = random(s) * TAU;
  s.enemies.push({ id: s.nextId++, type, angle, base: angle, radius: 12, preview: 1.15,
    hp: type === 'suppress' ? 3 : type === 'flank' ? 2 : 1, age: 0,
    ring: type === 'skimmer' ? 1 : type === 'stalker' ? 0 : null, mode: 'approach',
    turn: random(s) < .5 ? -1 : 1, pulse: 1.2 });
}
function spawnWall(s) {
  const angle = random(s) * TAU, single = s.time > 40 && random(s) > .65;
  const width = s.time < 28 ? 1.55 : s.time < 65 ? 1.3 : 1.1;
  s.walls.push({ id: s.nextId++, radius: 450, speed: s.time > 74 ? 155 : 128,
    gaps: single ? [{ angle, width: 2.25 }] : [{ angle, width }, { angle: wrap(angle + Math.PI), width }],
    hit: s.players.map(() => false) });
}
export function safeInWall(wall, angle) {
  return wall.gaps.some(g => distance(angle, g.angle) < g.width / 2);
}
function hurtEnemy(s, e, amount, owner) {
  // All player attacks respect the preview sanctuary, including Shockwave.
  if (e.hp <= 0 || e.radius <= T.coreRadius) return;
  e.hp -= amount;
  if (e.hp <= 0) {
    s.score += e.type === 'rush' ? 100 : e.type === 'flank' ? 150 : e.type === 'suppress' ? 250 : 175;
    s.players[owner].kills++;
    event(s, 'kill', { angle: e.angle, radius: e.radius, kind: e.type });
  }
}
export function useSpecial(s, p) {
  if (s.status !== 'playing' || p.down || p.specialCooldown > 0) return false;
  const character = characterById(p.character);
  p.specialCooldown = character.cooldown; p.specialUses++;
  const nearby = s.players.filter(other => distance(other.angle, p.angle) <= .72 && Math.abs(other.radius - p.radius) <= 68);
  if (character.id === 'mara') for (const other of nearby) { other.ward = 3; other.wardCharges = 1; }
  if (character.id === 'ivo') {
    for (const e of s.enemies) if (distance(e.angle, p.angle) <= .8) hurtEnemy(s, e, 3, p.id);
    s.zones = s.zones.filter(z => distance(z.angle, p.angle) > .8);
    for (const w of s.walls) w.gaps.push({ angle: p.angle, width: 1.3 });
  }
  if (character.id === 'sana') for (const other of nearby) other.rally = 4;
  if (character.id === 'rook') for (const other of nearby) { other.haste = 3; other.protection = Math.max(other.protection, .65); }
  event(s, 'special', { player: p.id, character: character.id, angle: p.angle, radius: p.radius });
  return true;
}
function updateEnemy(s, e, dt) {
  if (e.preview > 0) { e.preview = Math.max(0, e.preview - dt); e.radius = Math.min(T.coreRadius - 6, e.radius + 22 * dt); return; }
  e.age += dt;
  if (e.type === 'skimmer' || e.type === 'stalker') {
    const rail = RINGS[e.ring];
    e.radius = Math.min(rail, e.radius + 64 * dt);
    if (e.radius >= rail) {
      e.mode = 'patrol';
      const target = e.type === 'stalker' ? s.players.filter(p => !p.down && p.ring === e.ring)
        .sort((a, b) => distance(a.angle, e.angle) - distance(b.angle, e.angle))[0] : null;
      const direction = target ? Math.sign(delta(target.angle, e.angle)) : e.turn;
      e.angle = wrap(e.angle + direction * (e.type === 'skimmer' ? .8 : .5) * dt);
      e.pulse -= dt;
      if (e.pulse <= 0) {
        s.zones.push({ id: s.nextId++, angle: wrap(e.angle + direction * .42), radius: rail,
          width: .42, age: 0, warn: .85, life: 1.1 });
        e.pulse = e.type === 'skimmer' ? 2.5 : 3;
      }
    }
    if (e.age > 18) e.hp = 0;
  } else if (e.type === 'flank') {
    e.radius += 57 * dt;
    e.angle = wrap(e.base + e.turn * .68 * Math.min(1, Math.max(0, (e.age - 1.2) / .7)));
  } else if (e.type === 'suppress') {
    e.radius = Math.min(156, e.radius + 42 * dt); e.angle = wrap(e.angle + e.turn * .15 * dt);
    if (e.radius >= 150) {
      e.pulse -= dt;
      if (e.pulse <= 0) {
        s.zones.push({ id: s.nextId++, angle: e.angle, minRadius: 150, maxRadius: T.radius,
          width: .38, age: 0, warn: .95, life: 1.65 }); e.pulse = 2.5;
      }
    }
    if (e.age > 14) e.hp = 0;
  } else e.radius += 86 * dt;
  if (e.radius > T.radius - 3) {
    s.zones.push({ id: s.nextId++, angle: e.angle, radius: T.radius, width: .34, age: 0, warn: .25, life: 1.35 });
    e.hp = 0;
  }
}
// Sweeping prevents fast bullets skipping the tiny silhouettes at the far end of the tunnel.
function bulletHit(b, previous, e) {
  const from = pointAt(b.angle, previous), to = pointAt(b.angle, b.radius), center = pointAt(e.angle, e.radius);
  const dx = to.x - from.x, dy = to.y - from.y, length2 = dx * dx + dy * dy;
  const along = length2 ? Math.max(0, Math.min(1, ((center.x - from.x) * dx + (center.y - from.y) * dy) / length2)) : 0;
  return Math.hypot(center.x - from.x - along * dx, center.y - from.y - along * dy)
    < (enemySize(e) + 1.25) * depthScale(e.radius);
}
export function step(s, rawInputs = [], dt = T.step) {
  if (s.status !== 'playing') return s;
  dt = Math.max(0, Math.min(dt, .05)); s.elapsed += dt; dt *= s.timeScale;
  const inputs = s.players.map((_, i) => cleanInput(rawInputs[i]));
  s.time += dt; s.phase = phaseAt(s.time);
  for (const p of s.players) {
    p.prevRadius = p.radius;
    for (const timer of ['protection', 'cooldown', 'specialCooldown', 'ward', 'rally', 'haste']) p[timer] = Math.max(0, p[timer] - dt);
    // Transport captures edges even when release/repress happens between simulation ticks.
    const input = inputs[p.id], taps = rawInputs[p.id]?.taps;
    const special = (input.special && !p.specialHeld) || taps?.special === true;
    const inward = (input.inward && !p.inwardHeld) || taps?.inward === true;
    const outward = (input.outward && !p.outwardHeld) || taps?.outward === true;
    p.specialHeld = input.special; p.inwardHeld = input.inward; p.outwardHeld = input.outward;
    if (!p.down && !(input.inward && input.outward) && !(inward && outward)) {
      if (inward) p.ring = Math.max(0, p.ring - 1);
      if (outward) p.ring = Math.min(2, p.ring + 1);
    }
    // Finish a jump even when hit, so a downed marker always settles on a reachable rail.
    p.radius += Math.sign(RINGS[p.ring] - p.radius) * Math.min(Math.abs(RINGS[p.ring] - p.radius), T.hopSpeed * dt);
    if (p.down) continue;
    if (special) useSpecial(s, p);
    p.angle = wrap(p.angle + ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * moveSpeed(p) * dt);
    if (p.cooldown <= 0) {
      s.bullets.push({ id: s.nextId++, owner: p.id, angle: p.angle, radius: p.radius - T.muzzleInset });
      p.cooldown = T.fireInterval * (p.rally > 0 ? .65 : 1);
    }
  }
  const lull = s.phase === 'BREATH'; s.enemyClock -= dt;
  if (s.enemyClock <= 0) {
    if (!lull && s.enemies.length < 26) spawnEnemy(s);
    s.enemyClock = lull ? 1.4 : s.time < 12 ? 1.4 : s.time < 40 ? 1.05 : s.time < 74 ? .8 : .65;
  }
  s.wallClock -= dt;
  if (s.wallClock <= 0) { if (!lull) spawnWall(s); s.wallClock = s.time < 26 ? 4.2 : s.time < 74 ? 3.4 : 2.7; }
  for (const e of s.enemies) updateEnemy(s, e, dt);
  for (const b of s.bullets) {
    const previous = b.radius; b.radius = Math.max(T.coreRadius, b.radius - T.bulletSpeed * dt);
    const hits = s.enemies.filter(e => e.hp > 0 && e.radius > T.coreRadius && bulletHit(b, previous, e)).sort((a, b) => b.radius - a.radius);
    if (hits.length) { hurtEnemy(s, hits[0], 1, b.owner); b.radius = -100; }
  }
  // Contact hazards use the very same projected silhouettes as the renderer.
  for (const e of s.enemies) {
    if (e.hp <= 0 || e.radius <= T.coreRadius) continue;
    const a = pointAt(e.angle, e.radius);
    for (const p of s.players) {
      if (p.down) continue;
      const b = pointAt(p.angle, p.radius);
      if (Math.hypot(a.x - b.x, a.y - b.y) < enemySize(e) * depthScale(e.radius) + 11 * depthScale(p.radius)) downPlayer(s, p.id);
    }
  }
  for (const w of s.walls) {
    const previous = w.radius; w.radius -= w.speed * dt;
    for (const p of s.players) {
      const before = projectRadius(previous) - projectRadius(p.prevRadius), after = projectRadius(w.radius) - projectRadius(p.radius);
      const close = Math.min(Math.abs(before), Math.abs(after)) < 16 * depthScale(p.radius) || before * after <= 0;
      if (!p.down && !w.hit[p.id] && close && !safeInWall(w, p.angle)) { w.hit[p.id] = true; downPlayer(s, p.id); }
    }
  }
  for (const z of s.zones) {
    z.age += dt;
    if (z.age >= z.warn && z.age < z.warn + z.life) for (const p of s.players) {
      const onDepth = z.minRadius !== undefined ? p.radius >= z.minRadius - 10 && p.radius <= z.maxRadius + 10
        : Math.abs(p.radius - (z.radius ?? T.radius)) < 13;
      if (onDepth && distance(p.angle, z.angle) < z.width / 2) downPlayer(s, p.id);
    }
  }
  for (const p of s.players) {
    if (!p.down) continue;
    const helpers = s.players.filter(other => other.id !== p.id && !other.down && other.ring === p.ring
      && Math.abs(other.radius - p.radius) <= 18 && distance(p.angle, other.angle) <= T.rescueArc);
    if (helpers.length) {
      const boosted = p.rally > 0 || helpers.some(other => other.rally > 0); p.rescue += dt * (boosted ? 1.6 : 1);
      if (p.rescue + 1e-8 >= T.rescueSeconds) {
        p.down = false; p.rescue = 0; p.protection = T.protectionSeconds;
        s.rescues++; s.score += 500; event(s, 'rescue', { player: p.id, angle: p.angle, radius: p.radius });
      }
    } else p.rescue = 0;
  }
  s.bullets = s.bullets.filter(b => b.radius > T.coreRadius);
  s.enemies = s.enemies.filter(e => e.hp > 0); s.walls = s.walls.filter(w => w.radius > T.coreRadius);
  s.zones = s.zones.filter(z => z.age < z.warn + z.life);
  if (s.players.every(p => p.down)) { s.status = 'lost'; event(s, 'lost'); }
  else if (s.time >= T.duration && s.players.every(p => !p.down)) { s.status = 'won'; event(s, 'won'); }
  return s;
}
export function controlledInput(s, id) {
  const p = s.players[id]; if (!p || p.down) return cleanInput();
  const friend = s.players.filter(other => other.id !== id && other.down)
    .sort((a, b) => distance(a.angle, p.angle) + Math.abs(a.ring - p.ring) - distance(b.angle, p.angle) - Math.abs(b.ring - p.ring))[0];
  const targetRing = friend ? friend.ring : [2, 1, 0, 1][id];
  let target = friend ? friend.angle : wrap(s.time * .3 + id * TAU / s.players.length);
  const incoming = s.walls.filter(w => w.radius > p.radius - 10).sort((a, b) => a.radius - b.radius)[0];
  if (incoming && incoming.radius < p.radius + 130 && (!friend || incoming.radius < p.radius + 50))
    target = incoming.gaps.reduce((a, b) => distance(a.angle, p.angle) < distance(b.angle, p.angle) ? a : b).angle;
  const direction = delta(target, p.angle), danger = !!friend || s.enemies.some(e => e.radius > T.coreRadius && distance(e.angle, p.angle) < .8)
    || (incoming && incoming.radius < p.radius + 80);
  return { left: direction < -.035, right: direction > .035,
    inward: targetRing < p.ring && !p.inwardHeld, outward: targetRing > p.ring && !p.outwardHeld,
    special: !p.specialHeld && p.specialCooldown <= 0 && !!danger };
}
