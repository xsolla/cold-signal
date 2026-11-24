import assert from 'node:assert/strict';
import test from 'node:test';
import { Sound } from '../public/audio.js';
import { CUE_STEP_SECONDS, hz, playChartStep, STEP_SECONDS } from '../public/audio-score.js';
import { BAR_STEPS, pressureChart, sortieChart, suspendedChord } from '../public/audio-chart.js';
import { AudioFeedback } from '../src/audio-feedback.js';
import { makeMatch, RINGS, step, T } from '../src/rules.js';
import { cascade, seed } from '../scripts/audio-fixture.mjs';

function mixer() {
  const context = {
    currentTime: 1, state: 'running',
    async suspend() { this.state = 'suspended'; },
    async resume() { this.state = 'running'; },
  };
  const sound = new Sound(context), notes = [], ducks = [];
  sound.enabled = true;
  sound.play = (patch, at, bus = 'effects') => notes.push({ ...patch, at, bus });
  sound.bus = () => ({ gain: {
    cancelScheduledValues() {},
    setTargetAtTime(value, at) { if (value < 1) ducks.push({ value, at }); },
  } });
  return { sound, context, notes, ducks };
}

function onCueGrid(at, anchor) {
  const steps = (at - anchor) / CUE_STEP_SECONDS;
  return Math.abs(steps - Math.round(steps)) < 1e-8;
}

test('one kill and a small cascade each get a single impact transient', () => {
  const { sound, context, notes } = mixer();
  sound.events(cascade(makeMatch(seed), 1));
  assert.deepEqual(notes.map(({ pitch, at }) => [pitch, at]), [[undefined, 1], [hz(54), 1]]);
  context.currentTime = 2;
  sound.events(cascade(makeMatch(seed), 3));
  assert.deepEqual(notes.slice(2).map(({ pitch }) => pitch), [undefined, hz(54), hz(57)]);
});

test('a maximum chain plays three tuned hits and preserves the stronger rescue duck', () => {
  const { sound, context, notes, ducks } = mixer();
  const burst = cascade(makeMatch(seed), T.maxEnemies, true);
  assert.equal(burst.filter(event => event.type === 'kill').length, T.maxEnemies);
  sound.events(burst);
  assert.deepEqual(notes.filter(note => note.slide).map(({ pitch, at }) => [pitch, at]), [
    [hz(54), 1], [hz(57), 1 + CUE_STEP_SECONDS], [hz(61), 1 + 2 * CUE_STEP_SECONDS],
  ]);
  assert.deepEqual(notes.filter(note => note.detune).map(note => note.pitch), [hz(61), hz(61)]);
  assert.deepEqual(ducks, [{ value: .32, at: 1 }]);
  const start = notes.length;
  context.currentTime = 1.06;
  sound.events([...burst.filter(event => event.type === 'kill'), { type: 'special', character: 'ivo' }]);
  assert.deepEqual(notes.slice(start).map(({ pitch }) => pitch), [hz(37), hz(47), hz(47), undefined]);
  context.currentTime = 1.30;
  sound.events(cascade(makeMatch(seed), 1));
  assert.equal(notes.at(-1).pitch, hz(54));
});

test('muted or paused events do not consume a new effect', async () => {
  const { sound, notes } = mixer();
  const burst = cascade(makeMatch(seed), T.maxEnemies);
  sound.enabled = false;
  sound.events(burst);
  sound.enabled = true;
  await sound.suspend();
  sound.events(burst);
  assert.deepEqual(notes, []);
  await sound.resume();
  sound.events(cascade(makeMatch(seed), 1));
  assert.equal(notes.length, 2);
});

test('the four-on-the-floor kick keeps tempo at both simulation paces', () => {
  const kickTimes = timeScale => {
    const { sound, context, notes } = mixer();
    for (let frame = 0; frame < 120; frame++) {
      context.currentTime = 1 + frame / 60;
      sound.tick({ status: 'playing', phase: 'INGRESS', time: frame / 60 * timeScale }, false);
    }
    return notes.filter(note => note.bus === 'music' && note.pitch === 148).map(note => note.at);
  };
  const kicks = kickTimes(.5);
  assert.deepEqual(kicks, kickTimes(1));
  assert.equal(kicks.length, 5);
  assert.ok(kicks.slice(1).every((at, i) => Math.abs(at - kicks[i] - 4 * STEP_SECONDS) < 1e-9));
});

test('the Pressure drop lands with the first wave and transport rejoins the run grid', async () => {
  const { sound, context, notes } = mixer();
  const state = { encounter: pressureChart, elapsed: 0, status: 'playing', players: [{ down: false }] };
  const atDrop = 1 + pressureChart.phases[1].at;
  for (let frame = 0; frame < 60 * 9; frame++) {
    state.elapsed = frame * T.step;
    context.currentTime = 1 + state.elapsed;
    sound.tick(state, false);
  }
  const kicks = notes.filter(note => note.bus === 'music' && note.pitch === 148);
  assert.ok(kicks.length > 3);
  assert.ok(Math.abs(kicks[0].at - atDrop - .022) < 1e-8);
  assert.ok(kicks.every(note => note.at >= atDrop));
  await sound.suspend();
  context.currentTime += 10;
  await sound.resume();
  sound.tick(state, false);
  const nextElapsed = sound.nextStep * STEP_SECONDS;
  assert.ok(nextElapsed >= state.elapsed && nextElapsed - state.elapsed <= 2 * STEP_SECONDS);
  assert.ok(Math.abs(sound.nextAt - context.currentTime - .022 - (nextElapsed - state.elapsed)) < 1e-8);
});

test('the full score leaves three Breath breaks and cadences or holds on the 99-bar grid', () => {
  const { sound, context, notes } = mixer();
  const state = { status: 'playing', elapsed: 0, encounter: { id: sortieChart.id }, players: [{ down: false }] };
  for (let frame = 0; frame < sortieChart.endAt / T.step; frame++) {
    state.elapsed = frame * T.step;
    context.currentTime = 1 + state.elapsed;
    sound.tick(state, false);
  }
  const kicks = notes.filter(({ pitch }) => pitch === 148).map(({ at }) => at - 1.022);
  for (const [index, { phase, at }] of sortieChart.phases.entries()) {
    if (phase !== 'BREATH') continue;
    const drop = sortieChart.phases[index + 1].at;
    assert.ok(kicks.every(kick => kick < at - 1e-6 || kick >= drop - 1e-6));
    assert.ok(kicks.some(kick => Math.abs(kick - drop) < 1e-6));
  }

  const patches = [];
  const play = patch => patches.push(patch);
  const finalStep = sortieChart.bars.length * BAR_STEPS;
  assert.equal(playChartStep(play, sortieChart, finalStep, 180, false), suspendedChord);
  assert.equal(patches.length, 0);
  assert.equal(playChartStep(play, sortieChart, finalStep, 180, true), suspendedChord);
  assert.ok(patches.some(({ pitch }) => pitch === 72));
  assert.ok(!patches.some(({ pitch }) => pitch === 148));
});

test('pause clears queued voices, Breath drops the drums and retry opens on a downbeat', async () => {
  const { sound, context, notes } = mixer();
  const state = { status: 'playing', phase: 'INGRESS' };
  sound.tick(state, false);
  assert.equal(sound.nextStep, 1);
  const stops = [];
  const disconnected = [];
  sound.room = {
    convolver: { disconnect: () => disconnected.push('convolver') },
    level: { disconnect: () => disconnected.push('return') },
  };
  sound.effectsRoom = {
    convolver: { disconnect: () => disconnected.push('effects convolver') },
    level: { disconnect: () => disconnected.push('effects return') },
  };
  sound.voices.add({ source: { stop: at => stops.push(at) }, at: 1.022, end: 1.307 });
  await sound.suspend();
  assert.deepEqual(stops, [1]);
  assert.deepEqual(disconnected, ['convolver', 'return', 'effects convolver', 'effects return']);
  assert.equal(sound.room, null);
  assert.equal(sound.nextStep, 0);
  assert.equal(sound.nextAt, null);
  notes.length = 0;
  await sound.resume();
  for (let frame = 0; frame < 45; frame++) {
    context.currentTime = 1 + frame / 60;
    sound.tick({ ...state, phase: 'BREATH' }, false);
  }
  assert.ok(notes.length > 0);
  assert.ok(!notes.some(note => note.pitch === 148));
  sound.reset();
  notes.length = 0;
  sound.tick(state, false);
  assert.ok(notes.some(note => note.pitch === 148));
});

test('the finale waits for the first squad at either pace and restores bass on the beat after a rescue', () => {
  for (const timeScale of [.5, 1]) {
    const { sound, context, notes } = mixer();
    const breathAt = T.finalBreathAt / timeScale, surgeAt = T.finalSurgeAt / timeScale;
    const state = { status: 'playing', phase: 'FINAL SURGE', timeScale, elapsed: surgeAt,
      finale: { breathAt, surgeAt, deadlineAt: T.duration / timeScale, squadAt: null }, players: [{ down: true }] };
    sound.tick(state, false);
    assert.equal(sound.finaleSection, 'breath');
    assert.ok(!notes.some(note => note.pitch === 148));
    state.finale.squadAt = state.elapsed = surgeAt + .5;
    context.currentTime += .5;
    sound.events([{ type: 'special', character: 'ivo' }], state);
    sound.tick(state, false);
    assert.equal(sound.finaleSection, 'surge');
    const drop = notes.find(note => note.pitch === 148).at;
    assert.equal(drop, context.currentTime + .022);
    assert.equal(notes.find(note => note.bus === 'effects' && note.pitch).at, drop);
    assert.equal(notes.find(note => note.bus === 'effects' && note.noise).at, context.currentTime);
    const run = (from, to) => {
      for (let frame = from; frame <= to; frame++) {
        context.currentTime = 1.5 + frame / 60;
        state.elapsed = state.finale.squadAt + frame / 60;
        sound.tick(state, false);
      }
    };
    const bass = () => notes.filter(note => note.pitch < 67 && note.bus === 'music');
    run(1, 35);
    assert.equal(bass().length, 0);
    state.players[0].down = false;
    const before = notes.length;
    sound.events([{ type: 'rescue' }], state);
    const rescue = notes.slice(before);
    assert.equal(rescue.find(note => note.noise).at, context.currentTime);
    assert.ok(rescue.filter(note => note.pitch).every(note => onCueGrid(note.at, drop)));
    run(36, 92);
    assert.ok(bass().length > 0);
    assert.ok(bass()[0].at >= drop + 8 * STEP_SECONDS);
  }
});

test('overtime holds the pulse and the final rescue sounds before the clear chord', () => {
  const { sound, context, notes } = mixer();
  const state = { status: 'playing', phase: 'BRING THEM BACK', elapsed: T.duration, timeScale: 1,
    players: [{ down: true }], finale: { breathAt: 70, surgeAt: 74, deadlineAt: 90, squadAt: 75 } };
  sound.tick(state, false);
  assert.ok(notes.some(note => note.pitch === 72 && note.bus === 'music'));
  assert.ok(!notes.some(note => note.pitch === 148));
  context.currentTime = 3;
  sound.events([{ type: 'rescue' }, { type: 'won' }], { ...state, status: 'won' });
  const effects = notes.filter(note => note.bus === 'effects');
  assert.equal(effects[0].pitch, hz(49));
  assert.equal(effects.find(note => note.noise).at, 3);
  assert.ok(effects[0].at >= 3 && effects[0].at - 3 < CUE_STEP_SECONDS);
  const clear = effects.find(note => note.pitch === hz(42));
  assert.ok(Math.abs(clear.at - effects[0].at - 4 * CUE_STEP_SECONDS) < 1e-9);
});

test('local feedback follows confirmed depth, cooldown and threats without duplicate warnings', () => {
  const state = makeMatch(seed, { timeScale: 1 });
  const feedback = new AudioFeedback();
  const own = state.players[1];
  assert.equal(feedback.update(state, own.id).ready, false);
  step(state, [{ inward: true }, { inward: true, special: true }]);
  assert.equal(feedback.update(state, own.id).depth, 1);
  assert.equal(feedback.update(state, own.id).depth, 0);
  own.specialCooldown = .001;
  step(state);
  assert.equal(feedback.update(state, own.id).ready, true);
  assert.equal(feedback.update(state, own.id).ready, false);

  const wall = { id: 50, radius: own.radius + 100, speed: 128, hit: [false, false],
    gaps: [{ angle: own.angle, width: 1 }] };
  state.walls = [wall];
  assert.equal(feedback.update(state, own.id).warning, undefined);
  wall.gaps[0].angle += 1;
  assert.equal(feedback.update(state, own.id).warning, 'wall');
  state.elapsed += 1;
  assert.equal(feedback.update(state, own.id).warning, undefined);
  state.zones = [{ id: 51, angle: own.angle, radius: own.radius, width: .3, age: .1, warn: .6 }];
  assert.equal(feedback.update(state, own.id).warning, 'zone');
});

test('a player contributes a rescue phrase only while holding the live rescue', () => {
  const state = makeMatch(seed, { timeScale: 1 });
  const observer = new AudioFeedback();
  const { sound, context, notes } = mixer();
  const [own, ally] = state.players;
  Object.assign(ally, { down: true, angle: own.angle, ring: own.ring, radius: RINGS[own.ring], rescue: .2 });
  const contact = observer.update(state);
  assert.equal(contact.rescueStarted, true);
  sound.feedback(contact);
  assert.equal(notes.at(-1).at, context.currentTime);
  for (let frame = 0; frame < 26; frame++) {
    context.currentTime = 1 + frame / 60;
    sound.feedback(observer.update(state));
    sound.tick(state, false);
  }
  const pulses = notes.filter(note => note.group === 'rescue-hold');
  assert.equal(pulses.length, 5);
  assert.ok(pulses.at(-1).pitch > pulses[1].pitch);
  assert.ok(pulses.every(note => !note.wet));

  ally.rescue = .7;
  sound.feedback(observer.update(state));
  const stops = [];
  sound.voices.add({ source: { stop: at => stops.push(at) }, at: context.currentTime + .02,
    end: context.currentTime + .21, group: 'rescue-hold' });
  own.angle += .5;
  ally.rescue = 0;
  const release = observer.update(state);
  assert.equal(release.rescueBroken, true);
  sound.feedback(release);
  assert.deepEqual(stops, [context.currentTime]);
  assert.equal(sound.rescueHold, null);
});

test('chain notes follow the chord at their scheduled onset', () => {
  const { sound, context, notes } = mixer();
  const state = makeMatch(seed, { timeScale: 1 });
  for (let frame = 0; frame <= 215; frame++) {
    context.currentTime = 1 + frame / 60;
    sound.tick(state, false);
  }
  const burst = Array.from({ length: 6 }, () => ({ type: 'kill' }));
  sound.events(burst, state);
  const hits = () => notes.filter(note => note.bus === 'effects' && note.slide).map(note => note.pitch);
  assert.deepEqual(hits(), [hz(54), hz(57), hz(61)]);
  context.currentTime += .36;
  sound.tick(state, false);
  sound.events(burst, state);
  assert.deepEqual(hits().slice(3), [hz(57), hz(62), hz(66)]);
});

test('combat and readiness cues answer each other across the score phrase', () => {
  const { sound, context, notes } = mixer();
  const state = makeMatch(seed, { timeScale: 1 });
  sound.tick(state, false);
  const downbeat = notes.find(note => note.pitch === 148).at;
  const moveTo = at => {
    context.currentTime = at;
    sound.tick(state, false);
    notes.length = 0;
  };
  const singleHit = () => {
    sound.events([{ type: 'kill' }], state);
    return notes.find(note => note.slide);
  };
  moveTo(downbeat);
  const straight = singleHit();
  sound.feedback({ ready: true }, state);
  assert.deepEqual(notes.filter(note => note.pitch && !note.slide).map(note => note.pitch), [hz(61), hz(66), hz(66)]);
  moveTo(downbeat + 2 * STEP_SECONDS);
  const pickup = singleHit();
  assert.equal(straight.pitch, hz(54));
  assert.equal(pickup.pitch, hz(61));
  assert.notEqual(straight.type, pickup.type);
  assert.ok(onCueGrid(pickup.at, downbeat));

  moveTo(downbeat + 16 * STEP_SECONDS);
  sound.feedback({ ready: true }, state);
  assert.deepEqual(notes.filter(note => note.pitch).map(note => note.pitch), [hz(54), hz(57), hz(57)]);
});

test('rail and warning transients stay immediate while pitched cues follow the live grid', () => {
  for (const timeScale of [.5, 1]) {
    const { sound, context, notes } = mixer();
    const state = makeMatch(seed, { timeScale });
    sound.tick(state, false);
    const kickAt = notes.find(note => note.pitch === 148).at;
    context.currentTime = kickAt + .017;
    sound.feedback({ depth: 1, warning: 'wall', ready: true }, state);
    const effects = notes.filter(note => note.bus === 'effects');
    assert.equal(effects.filter(note => note.noise).length, 2);
    assert.ok(effects.filter(note => note.noise).every(note => note.at === context.currentTime));
    assert.equal(effects.filter(note => note.pitch).length, 3);
    assert.ok(effects.filter(note => note.pitch).every(note => onCueGrid(note.at, kickAt)));
    assert.ok(effects[0].at - context.currentTime < CUE_STEP_SECONDS);
    assert.ok(Math.abs(effects[1].at - effects[0].at - STEP_SECONDS) < 1e-9);
  }
});
