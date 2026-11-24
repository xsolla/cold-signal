import test from 'node:test';
import assert from 'node:assert/strict';
import { T, makeMatch, step, cleanInput, downPlayer, distance, safeInWall, controlledInput, useSpecial, moveSpeed, CREW, characterById, RINGS, projectRadius, depthScale, enemySize, hullShielded, overdriveRemaining } from '../src/rules.js';
const blank = () => [cleanInput(), cleanInput()];
const fullCharge = pilot => characterById(pilot.character).powerKills;
function fixture() { const s = makeMatch(123, { count: 2, timeScale: 1 }); s.enemyClock = 1e6; s.wallClock = 1e6; return s; }
function advance(s, seconds, inputs = blank()) { for (let n = 0; n < Math.ceil(seconds / T.step); n++) step(s, inputs); return s; }

test('inputs accept explicit booleans and tolerate malformed payloads', () => {
  assert.deepEqual(cleanInput(null), { left: false, right: false, special: false, inward: false, outward: false });
  assert.deepEqual(cleanInput({ left: 1, right: 'true', special: true }), { left: false, right: false, special: true, inward: false, outward: false });
});
test('steering starts, stops, reverses, and cancels conflicting keys', () => {
  const s = fixture(), start = s.players[0].angle;
  step(s, [{ right: true }, {}]); assert.ok(distance(s.players[0].angle, start) > .05);
  const stopped = s.players[0].angle; step(s, blank()); assert.equal(s.players[0].angle, stopped);
  step(s, [{ left: true }, {}]); assert.ok(distance(s.players[0].angle, start) < 1e-9);
  step(s, [{ left: true, right: true }, {}]); assert.ok(distance(s.players[0].angle, start) < 1e-9);
});
test('proximity rescue completes while the survivor continues firing', () => {
  const s = fixture(); s.players[1].down = true; s.players[1].angle = s.players[0].angle;
  advance(s, T.rescueSeconds + .02, [{ shoot: true }, {}]);
  assert.equal(s.players[1].down, false); assert.equal(s.rescues, 1);
  assert.ok(s.bullets.some(b => b.owner === 0)); assert.ok(s.players[1].protection > 0);
});
test('leaving the rescue arc resets uncompleted progress', () => {
  const s = fixture(); s.players[1].down = true; s.players[1].angle = s.players[0].angle;
  advance(s, .8); assert.ok(s.players[1].rescue > .7);
  advance(s, .2, [{ right: true }, {}]); assert.equal(s.players[1].rescue, 0); assert.equal(s.players[1].down, true);
});
test('revival protection blocks an immediate repeat hit then expires', () => {
  const s = fixture(); s.players[1].down = true; s.players[1].angle = s.players[0].angle;
  advance(s, T.rescueSeconds + .02); assert.equal(downPlayer(s, 1), false);
  advance(s, T.protectionSeconds + .02); assert.equal(downPlayer(s, 1), true);
});
test('both down at the finish is a loss, never a victory', () => {
  const s = fixture(); s.time = 89.999; s.players.forEach(p => { p.protection = 0; downPlayer(s, p.id); });
  step(s, blank()); assert.equal(s.status, 'lost');
});
test('the final clear waits for both ships; the survivor can rescue in overtime', () => {
  const s = fixture(); s.time = 89.9; s.players[1].down = true;
  advance(s, .3); assert.equal(s.status, 'playing'); assert.equal(s.phase, 'BRING THEM BACK');
  s.players[1].angle = s.players[0].angle; advance(s, T.rescueSeconds + .02);
  assert.equal(s.status, 'won'); assert.ok(s.players.every(p => !p.down));
});
test('hazard gaps wrap through zero and warning zones do not hit early', () => {
  assert.equal(safeInWall({ gaps: [{ angle: 0, width: .8 }] }, Math.PI * 2 - .2), true);
  assert.equal(safeInWall({ gaps: [{ angle: 0, width: .8 }] }, 1), false);
  const s = fixture(); s.players[0].protection = 0;
  s.zones.push({ id: 1, angle: s.players[0].angle, width: .3, age: 0, warn: 1, life: 1 });
  advance(s, .8); assert.equal(s.players[0].down, false);
  advance(s, .3); assert.equal(s.players[0].down, true);
});
test('fixed seed and recorded inputs reproduce all authoritative state', () => {
  const a = makeMatch(773), b = makeMatch(773);
  const tape = Array.from({ length: 6000 }, (_, i) => [{ right: i % 140 < 75, shoot: true }, { left: i % 110 < 60, shoot: i % 5 !== 0 }]);
  for (const input of tape) { step(a, input); step(b, structuredClone(input)); }
  assert.deepEqual(a, b);
});
test('diagnostic control policy uses the current state without mutating it', () => {
  const s = makeMatch(9), before = structuredClone(s); const input = controlledInput(s, 1);
  assert.deepEqual(s, before); assert.equal(typeof input.special, 'boolean');
});

test('four pilots shoot automatically; downed pilots stop firing', () => {
  const s = makeMatch(7); s.players[3].down = true;
  step(s, []);
  assert.equal(s.players.length, 4);
  assert.deepEqual(s.bullets.map(b => b.owner), [0, 1, 2]);
});
test('global half-speed scales movement, projectiles, timers, and match duration', () => {
  const fast = makeMatch(7, { count: 4, timeScale: 1 }), slow = makeMatch(7);
  fast.players[0].ward = slow.players[0].ward = 10;
  const start = fast.players[0].angle;
  step(fast, [{ right: true }]); step(slow, [{ right: true }]);
  assert.ok(Math.abs(distance(fast.players[0].angle, start) / distance(slow.players[0].angle, start) - 2) < 1e-9);
  assert.ok(Math.abs((T.radius - T.muzzleInset - fast.bullets[0].radius) / (T.radius - T.muzzleInset - slow.bullets[0].radius) - 2) < 1e-9);
  assert.equal(fast.time, slow.time * 2); assert.equal(fast.elapsed, slow.elapsed);
  assert.ok(Math.abs((10 - fast.players[0].ward) / (10 - slow.players[0].ward) - 2) < 1e-9);
  assert.equal(T.duration / slow.timeScale, 180);
});
test('Mara wards nearby crew; one absorbed hit grants brief repeat-hit protection', () => {
  const s = fixture(); s.players[1].angle = s.players[0].angle + .5;
  s.players.forEach(p => { p.protection = 0; });
  s.players[0].powerCharge = fullCharge(s.players[0]);
  assert.equal(useSpecial(s, s.players[0]), true);
  assert.ok(s.players.every(p => p.wardCharges === 1));
  assert.equal(downPlayer(s, 0), false); assert.equal(s.players[0].wardCharges, 0);
  assert.equal(downPlayer(s, 0), false);
  advance(s, .7); assert.equal(downPlayer(s, 0), true);
});
test('Ivo clears a sector of enemies and zones and opens a shared wall gap', () => {
  const s = fixture(), p = s.players[0]; p.character = 'ivo';
  s.enemies = [{ id: 1, type: 'suppress', angle: p.angle, radius: 140, hp: 3 },
    { id: 2, type: 'suppress', angle: p.angle + 2, radius: 140, hp: 3 }];
  s.zones = [{ angle: p.angle }, { angle: p.angle + 2 }];
  s.walls = [{ radius: 300, gaps: [], hit: [false, false] }];
  p.powerCharge = fullCharge(p);
  useSpecial(s, p);
  assert.equal(s.enemies[0].hp, 0); assert.equal(s.enemies[1].hp, 3);
  assert.equal(s.zones.length, 1); assert.equal(safeInWall(s.walls[0], p.angle), true);
  assert.equal(safeInWall(s.walls[0], p.angle + 2), false); assert.equal(p.kills, 1);
});
test('any pilot can rescue any downed crew member; Sana accelerates it without a required healer', () => {
  const plain = makeMatch(3, { count: 4, timeScale: 1 });
  plain.enemyClock = plain.wallClock = 100; plain.players[0].down = true;
  plain.players[3].angle = plain.players[0].angle; plain.players[3].character = 'sana';
  const boosted = structuredClone(plain); boosted.players[3].powerCharge = fullCharge(boosted.players[3]); useSpecial(boosted, boosted.players[3]);
  advance(plain, 1.1, []); advance(boosted, 1.1, []);
  assert.equal(plain.players[0].down, true); assert.equal(boosted.players[0].down, false);
  advance(plain, .6, []); assert.equal(plain.players[0].down, false);
  assert.ok(boosted.players[3].rally > 0);
});
test('Rook shares faster movement and brief cover with nearby crew', () => {
  const s = fixture(), p = s.players[0]; p.character = 'rook';
  s.players[1].angle = p.angle + .4; s.players.forEach(p => { p.protection = 0; });
  p.powerCharge = fullCharge(p);
  useSpecial(s, p); assert.ok(s.players.every(other => moveSpeed(other) > T.speed && other.protection > 0));
});
test('four-player victory needs all four; the last survivor can keep a rescue alive', () => {
  const s = makeMatch(4, { count: 4, timeScale: 1 }); s.enemyClock = s.wallClock = 100;
  s.time = 90; s.players[0].down = true; step(s, []); assert.equal(s.status, 'playing');
  s.players[3].angle = s.players[0].angle; advance(s, T.rescueSeconds + .02, []);
  assert.equal(s.status, 'won'); assert.ok(s.players.every(p => !p.down));
});
test('all four down loses and walls track collision independently for four slots', () => {
  const s = makeMatch(8); s.wallClock = 0; step(s, []);
  assert.equal(s.walls[0].hit.length, 4);
  s.players.forEach(p => { p.protection = 0; downPlayer(s, p.id); }); step(s, []);
  assert.equal(s.status, 'lost');
});
test('unknown characters fall back to a valid choice and downed pilots cannot cast', () => {
  const s = makeMatch(9, { characters: ['invalid'] }); assert.equal(s.players[0].character, CREW[0].id);
  s.players[0].powerCharge = fullCharge(s.players[0]);
  s.players[0].down = true; assert.equal(useSpecial(s, s.players[0]), false);
  assert.equal(s.players[0].powerCharge, fullCharge(s.players[0]));
});

const place = (p, ring) => { p.ring = ring; p.radius = p.prevRadius = RINGS[ring]; };
const enemy = (type, radius, angle, ring = null) => ({ id: 999, type, radius, angle, base: angle, ring,
  hp: 1, age: 0, turn: 1, pulse: 1, preview: 0, mode: 'approach' });
const silence = s => s.players.forEach(p => { p.cooldown = 1000; });
test('each pilot earns its own charge from kills and chains and needs a fresh Space press', () => {
  for (const [id, needed] of [['rook', 25], ['mara', 28], ['sana', 30], ['ivo', 35]]) {
    const s = fixture(), [p, ally] = s.players;
    p.character = id;
    silence(s);
    const shootPack = count => {
      s.enemies = Array.from({ length: count }, (_, i) => ({ ...enemy('rush', 150, i * .003), id: s.nextId++ }));
      s.bullets = [{ id: s.nextId++, owner: p.id, radius: 159, angle: 0 }];
      step(s, [{ special: true }]);
    };
    step(s, [{ special: true }]);
    assert.equal(p.powerCharge, 0);
    shootPack(needed - 1);
    assert.equal(p.powerCharge, needed - 1);
    assert.equal(useSpecial(s, p), false);
    shootPack(2);
    assert.equal(p.kills, needed + 1);
    assert.equal(p.powerCharge, needed);
    assert.equal(ally.powerCharge, 0);
    step(s, [{ special: true }]);
    assert.equal(p.specialUses, 0);
    step(s, [{ special: false, taps: { special: true } }]);
    assert.equal(p.specialUses, 1);
    assert.equal(p.powerCharge, 0);
    shootPack(2);
    assert.equal(p.kills, needed + 3);
    assert.equal(p.powerCharge, 0, 'kills during the drain cannot pre-charge another cast');
    advance(s, T.overdriveSeconds, [{ special: true }]);
    assert.equal(p.specialUses, 1);
    assert.equal(p.powerCharge, 0);
    shootPack(2);
    assert.equal(p.powerCharge, 2);
  }
});
test('outer breaches deal damage once, and zero hull takes priority over the final clear', () => {
  const s = fixture(); silence(s);
  s.enemies = [enemy('rush', 238, 0), enemy('flank', 239.5, .5)];
  step(s);
  assert.equal(s.hull, T.hullMax - 3);
  assert.equal(s.enemies.length, 1);
  step(s);
  assert.equal(s.hull, T.hullMax - 4);
  assert.deepEqual(s.events.map(event => [event.type, event.damage, event.hullAfter]),
    [['breach', 3, 97], ['breach', 1, 96]]);
  s.hull = 1; s.time = T.duration;
  s.enemies = [enemy('flank', 239.5, .5)];
  step(s);
  assert.equal(s.hull, 0);
  assert.equal(s.status, 'lost');
  assert.ok(s.players.every(p => !p.down));
  assert.equal(s.events.at(-1).type, 'lost');
});
test('Overdrive protects for three real-time seconds at both paces and overlapping casts keep their own deadlines', () => {
  for (const timeScale of [.5, 1]) {
    const s = makeMatch(2, { timeScale, count: 2 });
    const [p, ally] = s.players;
    s.enemyClock = s.wallClock = 100; s.hull = 1; silence(s);
    p.powerCharge = fullCharge(p); ally.powerCharge = fullCharge(ally);
    step(s, [{ special: true }]);
    assert.ok(Math.abs(p.overdriveUntil - s.elapsed - 3) < 1e-8);
    advance(s, 1);
    assert.ok(overdriveRemaining(s, p) < T.overdriveSeconds - .9);
    step(s, [{}, { special: true }]);
    p.protection = p.wardCharges = 0; downPlayer(s, p.id);
    const breach = () => { s.enemies = [enemy('rush', 239.9, .5)]; step(s); };
    breach();
    assert.equal(s.hull, 1, 'the shield survives the caster going down');
    assert.equal(s.events.at(-1).damage, 0);
    advance(s, p.overdriveUntil - s.elapsed + .02);
    assert.equal(overdriveRemaining(s, p), 0);
    breach();
    assert.equal(s.hull, 1, 'the later cast still protects the hull');
    advance(s, ally.overdriveUntil - s.elapsed - T.step);
    breach();
    assert.equal(hullShielded(s), false);
    assert.equal(s.hull, 0);
    assert.equal(s.status, 'lost');
    assert.equal(ally.down, false);
  }
});
test('depth keys hop one rail per press, clamp at both ends, and cancel opposing keys', () => {
  const s = fixture(), p = s.players[0];
  advance(s, .6, [{ inward: true }]); assert.equal(p.ring, 1); assert.equal(p.radius, RINGS[1]);
  advance(s, .6, [{ inward: true }]); assert.equal(p.ring, 1, 'holding never cascades');
  step(s, []); advance(s, .3, [{ inward: true }]); assert.equal(p.ring, 0); assert.equal(p.radius, RINGS[0]);
  step(s, []); step(s, [{ inward: true }]); assert.equal(p.ring, 0);
  step(s, []); step(s, [{ inward: true, outward: true }]); assert.equal(p.ring, 0);
  for (let i = 0; i < 3; i++) { step(s, []); advance(s, .3, [{ outward: true }]); }
  assert.equal(p.ring, 2); assert.equal(p.radius, T.radius);
});
test('a downed jumper settles on their target ring and fires no further shots', () => {
  const s = fixture(), p = s.players[0]; step(s, [{ inward: true }]);
  assert.ok(p.radius < T.radius && p.radius > RINGS[1]); p.protection = 0; downPlayer(s, 0);
  const nextId = s.nextId; s.players[1].cooldown = 100; advance(s, .5);
  assert.equal(p.radius, RINGS[1]); assert.equal(p.ring, 1); assert.equal(p.down, true); assert.equal(s.nextId, nextId);
});
test('automatic fire originates at the actual depth, including during a hop', () => {
  const s = fixture(), p = s.players[0]; step(s, [{ inward: true }]);
  assert.ok(Math.abs(s.bullets[0].radius - (p.radius - T.muzzleInset - T.bulletSpeed * T.step)) < 1e-8);
  place(p, 0); p.cooldown = 0; step(s, []);
  assert.ok(s.bullets.some(b => b.owner === 0 && Math.abs(b.radius - (RINGS[0] - T.muzzleInset - T.bulletSpeed * T.step)) < 1e-8));
});
test('rescue requires matching depth and completes after reaching that rail', () => {
  const s = fixture(); s.players[1].down = true; s.players[1].angle = s.players[0].angle; place(s.players[1], 0);
  advance(s, 2); assert.equal(s.players[1].rescue, 0); assert.equal(s.players[1].down, true);
  step(s, [{ inward: true }]); step(s, []); step(s, [{ inward: true }]);
  advance(s, 2.2); assert.equal(s.players[1].down, false); assert.equal(s.rescues, 1);
});
test('support abilities reach an adjacent rail but not through two depths', () => {
  const s = makeMatch(1); s.players.forEach(p => { p.angle = 0; });
  s.players[0].powerCharge = fullCharge(s.players[0]);
  place(s.players[1], 1); place(s.players[2], 0); useSpecial(s, s.players[0]);
  assert.equal(s.players[1].wardCharges, 1); assert.equal(s.players[2].wardCharges, 0);
});
test('walls survive the outer rim and threaten all three rails', () => {
  const s = makeMatch(1, { timeScale: 1 }); s.enemyClock = s.wallClock = 1000; silence(s);
  place(s.players[1], 1); place(s.players[2], 0); s.players.forEach(p => { p.protection = 0; });
  s.walls = [{ id: 1, radius: 260, speed: 128, gaps: [{ angle: s.players[3].angle, width: .4 }], hit: [false, false, false, false] }];
  advance(s, .6); assert.equal(s.walls.length, 1); assert.ok(s.walls[0].radius < 195);
  advance(s, .7); assert.deepEqual(s.players.map(p => p.down), [true, true, true, false]);
  assert.deepEqual(s.walls[0].hit, [true, true, true, false]);
});
test('jumping across a solid wall cannot tunnel through its collision', () => {
  const s = fixture(), p = s.players[0]; p.protection = 0;
  s.walls = [{ id: 1, radius: 205, speed: 0, gaps: [], hit: [false, false] }];
  advance(s, .2, [{ inward: true }]); assert.equal(p.down, true);
});
test('both new enemies approach a rail, patrol it, and mark danger at that depth', () => {
  for (const [type, ring] of [['skimmer', 1], ['stalker', 0]]) {
    const s = fixture(); silence(s); const e = enemy(type, RINGS[ring] - 5, 0, ring); s.enemies = [e];
    advance(s, .3); assert.equal(e.mode, 'patrol'); assert.equal(e.radius, RINGS[ring]); assert.ok(e.angle > 0);
    advance(s, 1.3); assert.ok(s.zones.some(z => z.radius === RINGS[ring]));
  }
});
test('patrol contact and warning zones threaten the occupied rail, not a distant one', () => {
  const s = fixture(); silence(s); const p = s.players[0], q = s.players[1]; p.angle = q.angle = 0;
  p.protection = q.protection = 0; place(q, 0); s.enemies = [enemy('stalker', RINGS[0], 0, 0)];
  step(s, []); assert.equal(p.down, false); assert.equal(q.down, true);
  s.enemies = []; q.down = false; s.zones = [{ id: 1, radius: RINGS[0], angle: 0, width: .4, age: 0, warn: .1, life: 1 }];
  advance(s, .2); assert.equal(p.down, false); assert.equal(q.down, true);
});
test('projection and silhouettes grow continuously toward the player', () => {
  const radii = [12, 44, 80, ...RINGS, 300];
  radii.slice(1).forEach((r, i) => { assert.ok(projectRadius(r) > projectRadius(radii[i])); assert.ok(depthScale(r) >= depthScale(radii[i])); });
  assert.equal(projectRadius(T.radius), T.radius); assert.ok(projectRadius(RINGS[0]) < RINGS[0]);
  assert.ok(enemySize({ type: 'rush' }) * depthScale(80) < enemySize({ type: 'rush' }) * depthScale(200));
});
test('swept bullets hit small distant targets without skipping them', () => {
  const s = fixture(); silence(s); s.enemies = [enemy('rush', 60 - 86 * .05, 0)];
  s.bullets = [{ id: 1, owner: 0, radius: 76, angle: 0 }]; step(s, [], .05);
  assert.equal(s.enemies.length, 0); assert.equal(s.players[0].kills, 1);
});
test('distant silhouettes have a narrower angular hit window than near targets', () => {
  const aperture = r => Math.asin(11.25 * depthScale(r) / projectRadius(r));
  const angle = (aperture(80) + aperture(200)) / 2;
  assert.ok(aperture(80) < aperture(200));
  for (const [radius, hit] of [[80, false], [200, true]]) {
    const s = fixture(); silence(s); s.enemies = [enemy('rush', radius - 86 * .05, angle)];
    s.bullets = [{ id: 1, owner: 0, radius: radius + 15, angle: 0 }]; step(s, [], .05);
    assert.equal(s.players[0].kills > 0, hit);
  }
});
test('bullseye absorbs every bullet, protects preview enemies from all attacks, and allows emergence', () => {
  const s = fixture(); silence(s); const p = s.players[0]; p.character = 'ivo'; p.angle = 0;
  p.powerCharge = fullCharge(p);
  const e = enemy('rush', 20, 0); e.preview = 1; s.enemies = [e];
  s.bullets = [{ id: 1, owner: 0, radius: 50, angle: 0 }]; step(s, [], .05);
  assert.equal(s.bullets.length, 0); assert.equal(e.hp, 1); useSpecial(s, p); assert.equal(e.hp, 1);
  advance(s, 1.5); assert.ok(e.radius > T.coreRadius); assert.equal(e.hp, 1);
  s.bullets = [{ id: 2, owner: 0, radius: e.radius + 15, angle: 0 }]; step(s, [], .05);
  assert.equal(s.enemies.length, 0); assert.equal(p.kills, 1);
});

test('a release and new press between ticks still jumps when the previous tick held inward', () => {
  const s = fixture(); step(s, [{ inward: true }]); assert.equal(s.players[0].ring, 1);
  step(s, [{ inward: false, taps: { inward: true } }]); assert.equal(s.players[0].ring, 0);
  step(s, [{ outward: false, taps: { outward: true } }]); assert.equal(s.players[0].ring, 1);
});

test('normal spawning previews all five enemy behaviors during the gauntlet', () => {
  const s = makeMatch(123, { timeScale: 1 }); s.hull = 1000; s.players.forEach(p => { p.protection = 1000; });
  const seen = new Set(), previewed = new Set();
  while (s.status === 'playing' && s.time < 60) {
    step(s, []);
    for (const e of s.enemies) { seen.add(e.type); if (e.radius <= T.coreRadius && e.preview > 0) previewed.add(e.type); }
  }
  assert.deepEqual([...seen].sort(), ['flank', 'rush', 'skimmer', 'stalker', 'suppress']);
  assert.deepEqual([...previewed].sort(), [...seen].sort());
});
