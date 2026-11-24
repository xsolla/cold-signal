import assert from 'node:assert/strict';
import test from 'node:test';
import { botInputs } from '../src/bots.js';
import { BAR_SECONDS, pressureChart, sortieChart } from '../public/audio-chart.js';
import { createSoloSession } from '../src/solo-session.js';
import { RINGS, T, distance, downPlayer, makeMatch, step } from '../src/rules.js';

test('the three-minute chart drives every phase, the finale reveal and both deadline outcomes', () => {
  const { bars, phases, endAt, spawns } = sortieChart;
  assert.equal(bars.length, 99);
  assert.equal(endAt, 180);
  assert.deepEqual(phases.map(({ at }) => Math.round(at / BAR_SECONDS)), [0, 16, 32, 36, 56, 60, 76, 80]);
  assert.deepEqual(bars.slice(32, 48), pressureChart.bars);
  for (const [index, { phase, at }] of phases.entries()) {
    if (phase !== 'BREATH') continue;
    assert.ok(!spawns.some(spawn => spawn.at >= at && spawn.at < phases[index + 1].at));
  }

  const state = makeMatch(17321, { encounter: sortieChart });
  for (const pilot of state.players) pilot.protection = 999;
  const entered = [{ phase: state.phase, at: state.elapsed }];
  const surgeAt = phases.at(-1).at;
  while (state.elapsed < endAt - .5) {
    const phase = state.phase;
    step(state);
    if (phase === state.phase) continue;
    entered.push({ phase: state.phase, at: state.elapsed });
    if (state.phase === 'FINAL SURGE') {
      const preview = state.enemies.filter(enemy => enemy.preview >= .65 - T.step);
      const planned = spawns.filter(spawn => spawn.at === surgeAt).reduce((count, { squad }) => count + squad.size, 0);
      assert.equal(preview.length, planned);
    }
  }
  assert.equal(entered.length, phases.length);
  for (const [index, { phase, at }] of entered.entries()) {
    assert.equal(phase, phases[index].phase);
    assert.ok(Math.abs(at - phases[index].at) < T.step);
  }
  assert.equal(state.encounter.nextSpawn, spawns.length);

  const overtime = structuredClone(state);
  while (state.status === 'playing' && state.elapsed < endAt + 1) step(state);
  assert.equal(state.status, 'won');
  assert.ok(Math.abs(state.elapsed - endAt) < T.step);

  const [helper, casualty] = overtime.players;
  Object.assign(casualty, { protection: 0, angle: helper.angle, radius: helper.radius, ring: helper.ring });
  assert.ok(downPlayer(overtime, casualty.id));
  while (overtime.phase !== 'BRING THEM BACK' && overtime.elapsed < endAt + 1) step(overtime);
  assert.equal(overtime.status, 'playing');
  assert.equal(overtime.phase, 'BRING THEM BACK');
  assert.ok(casualty.down);
  assert.ok(casualty.rescue > 0);
  while (overtime.status === 'playing' && overtime.elapsed < endAt + 5) step(overtime);
  assert.equal(overtime.status, 'won');
  assert.deepEqual(overtime.events.slice(-2).map(({ type }) => type), ['rescue', 'won']);
});

test('Pressure rehearsals reveal fixed waves at the chart positions and clear on bar 16', () => {
  const pressureAt = pressureChart.phases[1].at;
  assert.equal(pressureAt, 4 * BAR_SECONDS);
  assert.equal(pressureChart.endAt, 16 * BAR_SECONDS);
  const game = createSoloSession();
  const take = () => {
    game.start('mara', .5, { encounter: pressureChart, repeatSeed: true });
    const state = game.state;
    assert.equal(state.phase, 'BREATH');
    assert.equal(state.elapsed, 0);
    const firstWave = Math.ceil(pressureAt / T.step);
    for (let frame = 1; frame < firstWave; frame++) game.advance(T.step);
    assert.equal(state.enemies.length, 0);
    assert.equal(state.walls.length, 0);
    game.advance(T.step);
    assert.equal(state.phase, 'PRESSURE');
    assert.equal(state.enemies.length, pressureChart.spawns[0].squad.size);
    assert.ok(state.enemies.every(enemy => enemy.preview > 0));
    assert.ok(state.elapsed - pressureAt < T.step);
    const opening = structuredClone(state);
    for (const pilot of state.players) pilot.protection = 99;
    while (state.status === 'playing') game.advance(T.step);
    assert.equal(state.status, 'won');
    assert.equal(state.encounter.nextSpawn, pressureChart.spawns.length);
    assert.ok(state.elapsed - pressureChart.endAt < T.step);
    return opening;
  };
  assert.deepEqual(take(), take());
});

test('finale rehearsals repeat the seed and stamp the first visible squad at either pace', () => {
  for (const timeScale of [.5, 1]) {
    const game = createSoloSession(17321);
    const take = () => {
      game.start('mara', timeScale, { finale: true });
      const state = game.state;
      assert.equal(state.time, T.finalBreathAt);
      assert.equal(state.phase, 'BREATH');
      assert.equal(state.seed, 17321);
      while (state.time < T.finalSurgeAt) game.advance(T.step);
      assert.equal(state.finale.squadAt, null);
      for (let frame = 0; frame < 180 && state.finale.squadAt === null; frame++) game.advance(T.step);
      assert.ok(state.finale.squadAt >= T.finalSurgeAt / timeScale);
      assert.equal(state.finale.squadAt, state.elapsed);
      assert.ok(state.enemies.some(enemy => enemy.preview > 0));
      return structuredClone(state);
    };
    assert.deepEqual(take(), take());
  }
});

test('solo places the selected pilot first and consumes brief taps once across fixed steps', () => {
  const game = createSoloSession();
  game.start('ivo', 1);
  const state = game.state, player = state.players[0];
  assert.deepEqual(state.players.map(pilot => pilot.character), ['ivo', 'mara', 'sana', 'rook']);
  game.setInput({ inward: true, special: true });
  game.setInput({});
  game.advance(T.step / 2);
  assert.equal(player.ring, 2);
  game.advance(T.step / 2);
  assert.equal(player.ring, 1);
  assert.equal(player.specialUses, 1);
  game.advance(3 * T.step);
  assert.equal(player.ring, 1);
  assert.equal(player.specialUses, 1);
  assert.deepEqual(new Set(state.bullets.map(shot => shot.owner)), new Set([0, 1, 2, 3]));
  const before = player.angle;
  game.setInput({ right: true });
  game.advance(T.step);
  assert.ok(player.angle > before);
});

test('solo pause drops queued and held input together with the partial step', () => {
  const game = createSoloSession();
  game.start('mara', .5);
  const player = game.state.players[0], initialAngle = player.angle;
  game.setInput({ left: true, inward: true });
  game.advance(T.step / 2);
  game.setPaused(true);
  game.advance(30);
  game.setInput({ special: true });
  assert.equal(game.state.elapsed, 0);
  game.setPaused(false);
  game.advance(T.step / 2);
  assert.equal(game.state.elapsed, 0);
  game.advance(T.step / 2);
  assert.equal(game.state.elapsed, T.step);
  assert.equal(player.angle, initialAngle);
  assert.equal(player.ring, 2);
  assert.equal(player.specialUses, 0);
});

test('the nearest free bot reaches and revives a downed player through normal rules', () => {
  const game = createSoloSession(17);
  game.start('mara', 1);
  const state = game.state, [player, helper] = state.players;
  player.angle = helper.angle + .42;
  player.protection = 0;
  state.enemyClock = state.wallClock = 10;
  downPlayer(state, player.id);
  assert.equal(botInputs(state)[0].right, true);
  for (let tick = 0; tick < 180 && player.down; tick++) game.advance(T.step);
  assert.equal(player.down, false);
  assert.equal(state.rescues, 1);
  assert.ok(distance(player.angle, helper.angle) <= T.rescueArc);
  assert.equal(helper.ring, player.ring);
});

test('a rescuer steers toward a wall gap before approaching a threatened marker', () => {
  const state = makeMatch(17);
  const [player, helper] = state.players;
  player.protection = 0;
  player.angle = helper.angle + .4;
  downPlayer(state, player.id);
  assert.equal(botInputs(state)[0].right, true);
  state.walls.push({ radius: 310, speed: 128, gaps: [{ angle: helper.angle - .5, width: .8 }], hit: Array(4).fill(false) });
  assert.equal(botInputs(state)[0].left, true);
});

test('solo resolves a wipe and retry resets the match before an all-active clear', () => {
  const game = createSoloSession(17);
  game.start('mara', 1);
  for (const pilot of game.state.players) {
    pilot.protection = 0;
    downPlayer(game.state, pilot.id);
  }
  game.advance(T.step);
  assert.equal(game.state.status, 'lost');
  game.start('sana', .5);
  assert.equal(game.state.seed, 18);
  assert.equal(game.state.time, 0);
  assert.equal(game.state.score, 0);
  assert.deepEqual(game.state.events, []);
  assert.ok(game.state.players.every(pilot => !pilot.down && pilot.radius === RINGS[2]));
  assert.equal(game.state.players[0].character, 'sana');
  game.state.time = T.duration - .004;
  game.advance(T.step);
  assert.equal(game.state.status, 'won');
});
