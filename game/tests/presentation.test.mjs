import test from 'node:test';
import assert from 'node:assert/strict';
import { Presentation, SHIP_POINTS } from '../public/cold-signal.js';
import { makeMatch, step } from '../src/rules.js';

test('network replays emit each presentation event once without changing authoritative state', () => {
  const state = makeMatch(17), fx = new Presentation();
  state.events = [{ id: 1, type: 'kill', time: 0, angle: 1, radius: 140 }];
  const before = structuredClone(state);
  fx.update(state, { now: 0 }); fx.update(state, { now: 16 });
  assert.equal(fx.effects.length, 1); assert.equal(fx.effects[0].born, 0);
  assert.deepEqual(state, before);
  state.events.push({ id: 2, type: 'rescue', time: 0, angle: 2, radius: 240 });
  fx.update(state, { now: 32 }); assert.equal(fx.effects.length, 2);
});

test('pausing freezes effects and trails; resuming does not accumulate wall time', () => {
  const state = makeMatch(17), fx = new Presentation();
  state.events = [{ id: 1, type: 'special', character: 'ivo' }];
  fx.update(state, { now: 0 }); fx.update(state, { now: 20 });
  const clock = fx.time, impact = fx.impact(false), trails = structuredClone(fx.trails);
  fx.update(state, { now: 10000, paused: true });
  assert.equal(fx.time, clock); assert.equal(fx.impact(false), impact); assert.deepEqual(fx.trails, trails);
  fx.update(state, { now: 10016 }); assert.ok(Math.abs(fx.time - clock - .016) < 1e-9);
});

test('retry resets event IDs, transient particles, trails, and observed bullet origins', () => {
  const state = makeMatch(17), fx = new Presentation(); step(state, []);
  state.time = 60; state.events = [{ id: 100, type: 'kill' }];
  fx.update(state, { now: 100 }); assert.ok(fx.origins.size > 0);
  const retry = makeMatch(18); retry.events = [{ id: 1, type: 'special', character: 'mara' }];
  fx.update(retry, { now: 200 });
  assert.equal(fx.effects.length, 1); assert.equal(fx.cursor, 1); assert.equal(fx.origins.size, 0); assert.equal(fx.time, 0);
});

test('reduced motion immediately removes camera impulse and movement ghosts', () => {
  const state = makeMatch(17), fx = new Presentation();
  state.events = [{ id: 1, type: 'down' }];
  fx.update(state, { now: 0 }); assert.ok(fx.trails.get(0).length > 0); assert.ok(fx.impact(false) > 0);
  fx.update(state, { now: 16, reduced: true });
  assert.equal(fx.impact(true), 0); assert.ok([...fx.trails.values()].every(t => t.length === 0));
  assert.equal(fx.effects.length, 1); // Functional rescue/ability feedback is retained.
});

test('projectile trails retain their first observed depth and release vanished IDs', () => {
  const state = makeMatch(17), fx = new Presentation();
  state.bullets = [{ id: 7, radius: 105 }]; fx.update(state);
  state.bullets[0].radius = 65; fx.update(state);
  assert.equal(fx.origins.get(7), 105);
  state.bullets = [{ id: 8, radius: 170 }]; fx.update(state);
  assert.equal(fx.origins.has(7), false); assert.equal(fx.origins.size, 1);
});

test('presentation history is bounded and the fork fits the previous painted ship envelope', () => {
  const state = makeMatch(17), fx = new Presentation();
  state.events = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, type: 'kill' }));
  for (let i = 0; i < 100; i++) {
    state.players[0].angle += .02; fx.update(state, { now: i * 5 });
  }
  assert.ok(fx.effects.length <= 64); assert.ok(fx.trails.get(0).length <= 14);
  assert.ok(SHIP_POINTS.every(([x, y]) => Math.hypot(x, y) + .6 <= 13));
  for (let i = 0; i < 80; i++) fx.update({ ...state, events: [] }, { now: 500 + i * 20 });
  assert.equal(fx.effects.length, 0);
});

test('stacked combat impulses keep camera bounds, freeze on pause, and disappear in reduced mode', () => {
  const state = makeMatch(17), fx = new Presentation();
  state.events = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, type: 'kill' }));
  for (let i = 0; i < 30; i++) {
    fx.update(state, { now: i * 16 }); const c = fx.camera(false);
    assert.ok(Math.abs(c.x) <= 18 && Math.abs(c.y) <= 13);
    assert.ok(Math.abs(c.rotation) <= .02 && c.zoom >= 1 && c.zoom <= 1.075);
  }
  const camera = fx.camera(false); fx.update(state, { now: 50000, paused: true });
  assert.deepEqual(fx.camera(false), camera);
  assert.deepEqual(fx.camera(true), { x: 0, y: 0, rotation: 0, zoom: 1 });
  for (let i = 0; i < 80; i++) fx.update(state, { now: 50016 + i * 16 });
  assert.equal(fx.camera(false).zoom, 1);
});
