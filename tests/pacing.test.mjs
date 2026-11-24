import test from 'node:test';
import assert from 'node:assert/strict';
import { T, makeMatch, step } from '../src/rules.js';

function fixture(options = {}) {
  const state = makeMatch(17, { timeScale: 1, ...options });
  state.enemyClock = state.wallClock = 1e6;
  state.players.forEach(p => { p.protection = 1000; });
  return state;
}
const rush = (id, angle, radius = 140, type = 'rush', hp = 1) => ({
  id, angle, base: angle, radius, type, hp, preview: 0, age: 0,
  turn: 1, pulse: 10, mode: 'approach', ring: null,
});
function fireInto(state) {
  state.players.forEach(p => { p.cooldown = 1000; });
  state.bullets = [{ id: 1000, owner: 0, angle: 0, radius: 149 }];
  step(state, []);
}

test('four pilots sustain 60 automatic shots per second at full pace; half pace preserves simulation cadence', () => {
  for (const timeScale of [1, .5]) {
    const state = fixture({ timeScale });
    for (let i = 0; i < 300 / timeScale; i++) step(state, []);
    assert.equal(state.nextId - 1, 300); // 5 simulation seconds, 75 shots per pilot.
    assert.ok(Math.abs(state.time - 5) < 1e-8);
  }
});

test('natural squads provide sustained density with crew-scaled population bounds', () => {
  for (const count of [2, 4]) {
    const state = fixture({ count }); state.enemyClock = .01;
    state.players.forEach(p => { p.cooldown = 1000; });
    step(state, []); assert.equal(state.enemies.length, count === 2 ? 2 : 3);
    assert.ok(state.enemies.every(e => e.preview > 0 && e.radius < T.coreRadius));
    const seen = new Set(state.enemies.map(e => e.id));
    while (state.time < 20) {
      step(state, []); state.enemies.forEach(e => seen.add(e.id));
      assert.ok(state.enemies.length <= T.maxEnemies * count / 4);
    }
    assert.ok(seen.size >= (count === 2 ? 40 : 60), 'dense waves arrive without a diagnostic spawn');
    const cap = T.maxEnemies * count / 4;
    state.enemies = Array.from({ length: cap - 1 }, (_, i) => rush(i + 1, i * .1, 12));
    state.enemyClock = 0; step(state, []);
    assert.equal(state.enemies.length, cap, 'a partial squad fills the final slot without exceeding capacity');
  }
});

test('one bullet cascades through adjacent escorts and credits every kill exactly once', () => {
  const state = fixture(); state.enemies = [rush(1, 0), rush(2, .12), rush(3, .24)];
  Object.assign(state.players[0], { protection: 0, angle: .12, radius: 140, ring: 1 });
  fireInto(state);
  assert.equal(state.enemies.length, 0); assert.equal(state.score, 300); assert.equal(state.players[0].kills, 3);
  const kills = state.events.filter(e => e.type === 'kill');
  assert.deepEqual(kills.map(e => e.chainDepth), [0, 1, 2]);
  assert.equal(kills[2].fromAngle, .12);
  assert.equal(state.players[0].down, false, 'enemy death blasts do not damage nearby crew');
  step(state, []); assert.equal(state.score, 300);
});

test('chains preserve the sanctuary, respect range and damage armor without erasing it', () => {
  const state = fixture(), protectedEnemy = rush(2, .05, 40);
  protectedEnemy.preview = 1;
  const armored = rush(3, .12, 140, 'suppress', 3), distant = rush(4, 2);
  state.enemies = [rush(1, 0), protectedEnemy, armored, distant];
  fireInto(state);
  assert.equal(protectedEnemy.hp, 1); assert.equal(armored.hp, 2); assert.equal(distant.hp, 1);
  assert.equal(state.score, 100); assert.equal(state.players[0].kills, 1);
});

test('a full population cascade terminates without duplicate rewards or lost kill events', () => {
  const state = fixture(); state.enemies = Array.from({ length: T.maxEnemies }, (_, id) => rush(id + 1, id * .01));
  fireInto(state);
  assert.equal(state.enemies.length, 0); assert.equal(state.score, T.maxEnemies * 100);
  assert.equal(state.players[0].kills, T.maxEnemies);
  assert.equal(state.events.filter(e => e.type === 'kill').length, T.maxEnemies);
  assert.equal(new Set(state.events.map(e => e.id)).size, state.events.length);
  assert.ok(state.players.every(p => !p.down));
});

test('escaped escorts do not multiply lingering danger zones; leaders keep their warning', () => {
  const state = fixture(); state.players.forEach(p => { p.cooldown = 1000; });
  state.enemies = [rush(1, 0, 239), { ...rush(2, .14, 239), escort: true }, { ...rush(3, -.14, 239), escort: true }];
  step(state, []);
  assert.equal(state.enemies.length, 0); assert.equal(state.zones.length, 1);
  assert.equal(state.zones[0].angle, 0); assert.ok(state.zones[0].warn > 0);
  assert.equal(state.hull, T.hullMax - 3);
});
