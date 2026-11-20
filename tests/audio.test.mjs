import assert from 'node:assert/strict';
import test from 'node:test';
import { Sound } from '../public/audio.js';
import { makeMatch, T } from '../src/rules.js';
import { cascade, seed } from '../scripts/audio-fixture.mjs';

function mixer() {
  const sound = new Sound(), notes = [];
  sound.context = { currentTime: 1, state: 'running' };
  sound.enabled = true;
  sound.tone = (...args) => notes.push(args);
  return { sound, notes };
}

test('an isolated kill keeps its original pulse and a small cascade adds one tap', () => {
  const { sound, notes } = mixer();
  sound.events(cascade(makeMatch(seed), 1));
  assert.deepEqual(notes, [[440, .045, .022, 'triangle', 190, 1]]);
  sound.context.currentTime = 2;
  sound.events(cascade(makeMatch(seed), 3));
  assert.deepEqual(notes.slice(1).map(([frequency]) => frequency), [440, 560]);
});

test('maximum cascade uses three kill voices and leaves other cues outside the cap', () => {
  const { sound, notes } = mixer();
  const burst = cascade(makeMatch(seed), T.maxEnemies);
  assert.equal(burst.length, T.maxEnemies);
  sound.events(burst);
  assert.deepEqual(notes.map(([frequency, , , , , at]) => [frequency, at]), [
    [440, 1], [560, 1.017], [700, 1.034],
  ]);
  sound.context.currentTime = 1.06;
  sound.events([...burst, { type: 'down' }, { type: 'special', character: 'ivo' }]);
  assert.deepEqual(notes.slice(3).map(([frequency]) => frequency), [155, 82, 1200]);
  sound.context.currentTime = 1.064;
  sound.events(cascade(makeMatch(seed), 1));
  assert.equal(notes.at(-1)[0], 440);
});

test('muted or suspended bursts do not consume the next kill roll', () => {
  const { sound, notes } = mixer();
  const burst = cascade(makeMatch(seed), T.maxEnemies);
  sound.enabled = false;
  sound.events(burst);
  sound.enabled = true;
  sound.context.state = 'suspended';
  sound.events(burst);
  assert.deepEqual(notes, []);
  sound.context.state = 'running';
  sound.events(cascade(makeMatch(seed), 1));
  assert.equal(notes.length, 1);
});
