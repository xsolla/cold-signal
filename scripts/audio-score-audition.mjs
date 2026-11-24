import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { BPM, pressureChart, sortieChart } from '../public/audio-chart.js';
import { AudioFeedback } from '../src/audio-feedback.js';
import { characterById, controlledInput, downPlayer, makeMatch, phaseAt, step, T, useSpecial } from '../src/rules.js';
import { createSoloSession } from '../src/solo-session.js';
import { cascade, seed } from './audio-fixture.mjs';

const sampleRate = 48_000;
const bar = 4 * 60 / BPM;
const seconds = 32.5;
const phases = [
  { at: 0, name: 'INGRESS' },
  { at: 4 * bar, name: 'PRESSURE' },
  { at: 8 * bar, name: 'BREATH' },
  { at: 10 * bar, name: 'FINAL SURGE' },
];
const chain = (count, rescue) => cascade(makeMatch(seed), count, rescue);
const cues = [
  { at: 1.8, events: chain(1) },
  { at: 5.2, events: [{ type: 'special', character: 'mara' }] },
  { at: 8.8, events: [{ type: 'special', character: 'ivo' }] },
  { at: 11.3, events: [{ type: 'down' }] },
  { at: 13, events: chain(3) },
  { at: 17.2, events: [{ type: 'special', character: 'rook' }] },
  { at: 12 * bar + .022, events: chain(T.maxEnemies, true) },
  { at: 26.2, events: [{ type: 'special', character: 'sana' }] },
  { at: 17 * bar + .075, events: [{ type: 'won' }] },
];
// Construct a single full-pace action tape for both arrangements. The same
// rules generate the reveal, rescue and outcome events for both audio takes.
function finaleTape(withFeedback) {
  const state = makeMatch(seed, { timeScale: 1 });
  state.time = state.elapsed = T.finalBreathAt;
  state.phase = phaseAt(state.time);
  const [pilot, casualty] = state.players;
  if (withFeedback) pilot.powerCharge = characterById(pilot.character).powerKills;
  const cues = withFeedback ? [
    [T.finalSurgeAt + 4, 'down'], [T.finalSurgeAt + 5.15, 'hold'],
    [T.finalSurgeAt + 5.80, 'release'], [T.finalSurgeAt + 6.1, 'hold'],
    [T.duration - 3, 'down'], [T.duration + 1, 'hold'],
  ] : [
    [T.finalSurgeAt + 4, 'down'], [T.finalSurgeAt + 7, 'finish'],
    [T.duration - 3, 'down'], [T.duration + 2, 'finish'],
  ];
  const observer = withFeedback ? new AudioFeedback() : null;
  const activations = { depth: 0, ready: 0, warning: 0, rescueStarted: 0, rescueBroken: 0 };
  const sections = [{ at: 0, name: 'LAST BREATH' }];
  const frames = [];
  let eventId = 0, squad = false, overtime = false;
  for (let frame = 1; frame <= 24 * 60 && state.status === 'playing'; frame++) {
    const at = frame * T.step;
    for (const player of state.players) player.protection = 99;
    if (cues[0]?.[0] <= state.time + T.step) {
      const [, action] = cues.shift();
      if (action === 'hold' || action === 'finish') {
        Object.assign(casualty, { angle: pilot.angle, ring: pilot.ring, radius: pilot.radius });
        if (action === 'finish') casualty.rescue = T.rescueSeconds - T.step / 2;
      } else if (action === 'release') {
        pilot.angle += .55;
      } else {
        casualty.protection = 0;
        // Start the next rescue out of the pilot's immediate reach.
        casualty.angle = pilot.angle + 1.1;
        downPlayer(state, casualty.id);
      }
    }
    const input = withFeedback ? { special: frame === 32, inward: frame === 81, outward: frame === 156 } : {};
    step(state, [input]);
    if (!squad && state.finale.squadAt != null) {
      squad = true;
      sections.push({ at, name: 'FIRST SQUAD' });
    }
    if (!overtime && state.phase === 'BRING THEM BACK') {
      overtime = true;
      sections.push({ at, name: 'OVERTIME' });
    }
    const events = state.events.filter(event => event.id > eventId);
    eventId = state.eventId;
    const feedback = observer && observer.update(state);
    if (feedback) for (const type of Object.keys(activations)) if (feedback[type]) activations[type]++;
    frames.push({ at, events, feedback, status: state.status, phase: state.phase, elapsed: state.elapsed,
      timeScale: state.timeScale, finale: { ...state.finale }, players: scorePlayers(state) });
    if (state.status === 'won') sections.push({ at, name: 'RESCUE AND CLEAR' });
  }
  assert.ok(squad && overtime && state.status === 'won');
  assert.equal(state.rescues, 2);
  if (withFeedback) assert.ok(Object.values(activations).every(count => count > 0), JSON.stringify(activations));
  return { frames, sections, activations, seconds: Math.ceil(frames.at(-1).at + 2) };
}

function scorePlayers(state) {
  return state.players.map(({ id, character, down, overdriveUntil }) => ({ id, character, down, overdriveUntil }));
}

// Replay an input sequence through the actual solo session for both mixes.
function soloTape(chart, steer, { pilot = 'mara', firstSeed } = {}) {
  const game = createSoloSession(firstSeed);
  const observer = new AudioFeedback();
  game.start(pilot, .5, { encounter: chart });
  const state = game.state;
  const sections = chart.phases.map(({ phase, at }) => ({ name: phase, at }));
  const frames = [];
  let lastEvent = 0;
  for (let frame = 0; frame <= Math.ceil(chart.endAt / T.step); frame++) {
    const { elapsed, events, status, phase, timeScale } = state;
    const feedback = observer.update(state);
    frames.push({ at: elapsed, elapsed, status, phase, timeScale, encounter: { id: chart.id },
      players: scorePlayers(state), feedback,
      events: events.filter(event => event.id > lastEvent) });
    lastEvent = state.eventId;
    if (status !== 'playing') break;
    const input = steer(state, frame);
    if (input) game.setInput(input);
    game.advance(T.step);
  }
  assert.equal(state.status, 'won');
  assert.ok(Math.abs(state.elapsed - chart.endAt) < T.step);
  assert.ok(frames.some(frame => frame.events.some(event => event.type === 'rescue')));
  sections.push({ at: state.elapsed, name: 'TEAM CLEAR' });
  return { frames, sections, seed: state.seed, seconds: Math.ceil(chart.endAt + 3) };
}

function pressureTape() {
  const tape = soloTape(pressureChart, ({ elapsed }, frame) => ({
    inward: frame === 330, outward: frame === 511, special: frame === 940,
    right: elapsed >= 11.4 && elapsed < 11.8,
    left: elapsed >= 18.35 && elapsed < 19,
  }));
  assert.ok(tape.frames.some(frame => frame.feedback.warning === 'wall'));
  return tape;
}

// A controlled listening pass. Reuse the chart clock and mute each part in
// turn, holding combat effects out so its absence is easy to compare.
function crewTape() {
  const start = sortieChart.phases.find(phase => phase.phase === 'PRESSURE').at;
  const pilots = ['mara', 'ivo', 'sana', 'rook'];
  const transitions = [null, 'mara', null, 'ivo', null, 'sana', null, 'rook', null];
  const sections = transitions.map((down, i) => ({ at: i * 2 * bar, name: down ? `${down} down` : 'Full crew' }));
  const frames = [];
  for (let frame = 0; frame < (sections.at(-1).at + 2 * bar) * 60; frame++) {
    const at = frame / 60;
    const down = transitions[Math.min(transitions.length - 1, Math.floor(at / (2 * bar)))];
    frames.push({ at, elapsed: start + at, status: 'playing', encounter: { id: sortieChart.id }, events: [],
      players: pilots.map(character => ({ character, down: character === down })) });
  }
  sections.push({ at: frames.at(-1).at + T.step, name: 'Room tail' });
  return { frames, sections, seconds: Math.ceil(frames.at(-1).at + 6) };
}

function overdriveTape() {
  const state = makeMatch(seed);
  state.phase = 'FINAL SURGE';
  const sections = ['Full crew', 'Mara', 'Ivo', 'Sana', 'Rook', 'All four', 'Room tail']
    .map((name, index) => ({ name, at: index * (T.overdriveSeconds + bar) }));
  const frames = [];
  let next = 1, lastEvent = 0;
  for (let frame = 0; state.status === 'playing'; frame++) {
    const at = frame / 60;
    state.elapsed = at;
    if (at >= sections[next].at) {
      if (next === 6) {
        state.status = 'won';
        state.events.push({ id: ++state.eventId, type: 'won' });
      } else for (const pilot of next === 5 ? state.players : [state.players[next - 1]]) {
        pilot.powerCharge = characterById(pilot.character).powerKills;
        useSpecial(state, pilot);
      }
      next++;
    }
    frames.push({ at, elapsed: at, phase: state.phase, status: state.status, players: scorePlayers(state),
      events: state.events.filter(event => event.id > lastEvent) });
    lastEvent = state.eventId;
  }
  return { frames, sections, seconds: Math.ceil(frames.at(-1).at + 4) };
}

const withFeedback = process.argv.includes('--feedback'), withPressure = process.argv.includes('--pressure');
const withSortie = process.argv.includes('--sortie'), withCrew = process.argv.includes('--crew');
const withOverdrive = process.argv.includes('--overdrive');
const tape = withOverdrive ? overdriveTape()
  : withCrew ? crewTape()
  : withSortie ? soloTape(sortieChart, (state, frame) => frame % 4 === 0 ? controlledInput(state, 0) : null,
  { pilot: 'sana', firstSeed: 35 })
  : withPressure ? pressureTape()
  : withFeedback || process.argv.includes('--finale') ? finaleTape(withFeedback) : null;
const takes = withOverdrive ? [{ name: 'cold-signal-overdrive', synced: true }]
  : withCrew ? [{ name: 'cold-signal-pilot-parts', synced: true }]
  : withSortie ? [{ name: 'cold-signal-ensemble-run', synced: true }]
  : withPressure ? [{ name: 'pressure-original', synced: false }, { name: 'pressure-synced', synced: true }]
  : withFeedback ? [{ name: 'cue-variations', synced: true }]
  : tape ? [{ name: 'finale-original', synced: false }, { name: 'finale-synced', synced: true }]
    : [{ name: 'expanded', synced: true }];

const output = new URL('../artifacts/audio/', import.meta.url);
const origin = 'https://audio.test';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome'),
  headless: true,
});

try {
  const page = await browser.newPage();
  await page.route(origin + '/', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html>' }));
  await page.route(origin + '/audio*.js', route => route.fulfill({
    path: fileURLToPath(new URL('../public' + new URL(route.request().url()).pathname, import.meta.url)),
    contentType: 'text/javascript',
  }));
  await page.goto(origin);
  for (const { name, synced } of takes) {
    const { pcm, ...report } = await page.evaluate(async ({ phases, cues, sampleRate, seconds, bpm, tape, synced }) => {
      const { Sound } = await import('/audio.js');
      const offline = new OfflineAudioContext(2, seconds * sampleRate, sampleRate);
      let clock = 0;
      const context = new Proxy(offline, {
        get(target, key) {
          if (key === 'state') return 'running';
          if (key === 'currentTime') return clock;
          const value = Reflect.get(target, key, target);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
      const sound = new Sound(context, { syncedFinale: synced, syncedPressure: synced });
      sound.enabled = true;
      const start = performance.now();
      const batches = [];
      if (tape) {
        let frame = 0;
        const scheduleThrough = until => {
          while (tape.frames[frame]?.at < until) {
            const { at, events, feedback, ...state } = tape.frames[frame++];
            clock = at;
            if (events.length) sound.events(events, state);
            if (feedback && state.status === 'playing') sound.feedback(feedback, state);
            sound.tick(state, false);
          }
        };
        // Let finished voices disconnect between batches during the long take.
        // The single context preserves its room tails and musical clock.
        const batchSeconds = seconds > 60 ? 16 : seconds;
        scheduleThrough(batchSeconds);
        for (let at = batchSeconds; at < seconds; at += batchSeconds) {
          batches.push(offline.suspend(at).then(() => {
            scheduleThrough(at + batchSeconds);
            return offline.resume();
          }));
        }
      } else {
        let phase = 0, cue = 0, status = 'playing';
        for (let frame = 0; frame < seconds * 120; frame++) {
          const at = frame / 120;
          while (cues[cue]?.at <= at) {
            clock = cues[cue].at;
            const { events } = cues[cue++];
            sound.events(events);
            if (events.some(event => event.type === 'won')) status = 'won';
          }
          clock = at;
          if (phases[phase + 1]?.at <= at + .10) phase++;
          sound.tick({ status, phase: phases[phase].name }, false);
        }
      }
      const [rendered] = await Promise.all([offline.startRendering(), ...batches]);
      const renderMs = performance.now() - start;
      const left = rendered.getChannelData(0), right = rendered.getChannelData(1);
      const samples = new Int16Array(left.length * 2);
      let peak = 0, peakAt = 0, monoPeak = 0, largestSampleStep = 0;
      const sections = (tape?.sections ?? phases).map(phase => ({ ...phase, square: 0, frames: 0 }));
      let phase = 0;
      for (let i = 0; i < left.length; i++) {
        if (sections[phase + 1]?.at <= i / sampleRate) phase++;
        const l = left[i], r = right[i];
        if (!Number.isFinite(l) || !Number.isFinite(r)) throw Error('Non-finite sample');
        const framePeak = Math.max(Math.abs(l), Math.abs(r));
        if (framePeak > peak) { peak = framePeak; peakAt = i / sampleRate; }
        monoPeak = Math.max(monoPeak, Math.abs((l + r) / 2));
        if (i > 0) largestSampleStep = Math.max(largestSampleStep, Math.abs(l - left[i - 1]), Math.abs(r - right[i - 1]));
        samples[i * 2] = Math.round(Math.max(-1, Math.min(1, l)) * 32767);
        samples[i * 2 + 1] = Math.round(Math.max(-1, Math.min(1, r)) * 32767);
        sections[phase].square += (l * l + r * r) / 2;
        sections[phase].frames++;
      }
      const bytes = new Uint8Array(samples.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return { pcm: btoa(binary), renderMs, sampleRate, seconds, bpm, peak, peakAt, monoPeak, largestSampleStep,
        firstFrame: [left[0], right[0]], lastFrame: [left.at(-1), right.at(-1)],
        sections: sections.map(({ square, frames, ...phase }) => ({ ...phase, rms: Math.sqrt(square / frames) })) };
    }, { phases, cues, sampleRate, seconds: tape?.seconds ?? seconds, bpm: BPM, tape, synced });
    assert.ok(report.peak > .1 && report.peak < .9, `Preview peak ${report.peak.toFixed(3)} at ${report.peakAt.toFixed(3)} s`);
    assert.deepEqual(report.firstFrame, [0, 0]);
    assert.deepEqual(report.lastFrame, [0, 0]);
    const data = Buffer.from(pcm, 'base64');
    const header = Buffer.alloc(44);
    header.write('RIFF'); header.writeUInt32LE(36 + data.length, 4); header.write('WAVEfmt ', 8);
    header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
    header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 4, 28);
    header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(data.length, 40);
    await mkdir(output, { recursive: true });
    await writeFile(new URL(name + '.wav', output), Buffer.concat([header, data]));
    const measurements = { browser: browser.version(), seed: tape?.seed ?? seed,
      ...(withFeedback && { activations: tape.activations }), ...report };
    await writeFile(new URL(name + '-report.json', output), JSON.stringify(measurements, null, 2) + '\n');
    console.log(name, measurements);
  }
} finally {
  await browser.close();
}
