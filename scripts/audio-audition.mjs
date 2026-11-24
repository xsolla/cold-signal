import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { makeMatch } from '../src/rules.js';
import { baseline, cascade, chainRoll, seed } from './audio-fixture.mjs';

const evidence = new URL('../evidence/skill-trials/sound/', import.meta.url);
const recipe = JSON.parse(await readFile(new URL('recipe.json', evidence), 'utf8'));
assert.equal(recipe.seed, seed);
const track = recipe.events.map(({ at, kills, rescue, type, character }) => {
  if (!kills) return { at, events: [{ type, character }] };
  const events = cascade(makeMatch(seed), kills, rescue);
  assert.equal(events.filter(event => event.type === 'kill').length, kills);
  assert.equal(events.filter(event => event.type === 'rescue').length, Number(!!rescue));
  return { at, events };
});
for (let beat = 0; recipe.pulseStart + beat * recipe.pulseSeconds < recipe.seconds - .3; beat++) {
  track.push({ at: recipe.pulseStart + beat * recipe.pulseSeconds, beat });
}
const sources = { A: execFileSync('git', ['show', `${baseline}:public/audio.js`], { encoding: 'utf8' }) };
if (!process.argv.includes('--baseline-only')) {
  sources.B = execFileSync('git', ['show', `${chainRoll}:public/audio.js`], { encoding: 'utf8' });
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
try {
  const page = await browser.newPage();
  const report = { browser: browser.version(), baseline, seed, variants: {} };
  const routinePcm = {};
  for (const [id, code] of Object.entries(sources)) {
    const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
    const rendered = await page.evaluate(async ({ url, recipe, track }) => {
      const { Sound } = await import(url);
      const { sampleRate, seconds, previewGain } = recipe;
      const context = new OfflineAudioContext(1, sampleRate * seconds, sampleRate);
      const sound = new Sound();
      const queue = track.map(item => ({ ...item }));
      let clock = 0;
      let voices = 0;
      // Keep the real Web Audio nodes and give both runtime versions the same
      // cue clock. Model the legacy rescue timer's nominal 90 ms delay.
      sound.context = {
        get currentTime() { return clock; }, state: 'running', destination: context.destination,
        createGain: () => context.createGain(),
        createOscillator() {
          voices++;
          const oscillator = context.createOscillator();
          const start = oscillator.start.bind(oscillator);
          oscillator.start = (at = clock) => start(at);
          return oscillator;
        },
      };
      sound.enabled = true;
      const start = performance.now();
      const timer = window.setTimeout;
      try {
        window.setTimeout = (callback, ms) => queue.push({ at: clock + ms / 1000, callback });
        while (queue.length) {
          queue.sort((a, b) => a.at - b.at);
          const item = queue.shift();
          clock = item.at;
          if (item.callback) item.callback();
          else if ('beat' in item) sound.tick({ status: 'playing', time: (item.beat + .01) * 60 / (140 * 2) }, false);
          else if (sound.events) sound.events(item.events);
          else for (const event of item.events) sound.event(event);
        }
      } finally { window.setTimeout = timer; }
      const samples = (await context.startRendering()).getChannelData(0);
      const renderMs = performance.now() - start;
      const windows = { routine: [0, 2.24], smallChain: [2.24, 2.45], busyRescue: [2.77, 3.13] };
      const stats = (from = 0, to = seconds) => {
        const first = Math.round(from * sampleRate), end = Math.round(to * sampleRate);
        let peak = 0, over = 0, square = 0, total = 0, largestJump = 0;
        for (let i = first; i < end; i++) {
          const sample = samples[i];
          if (!Number.isFinite(sample)) throw Error('Non-finite sample');
          if (Math.abs(sample) > 1) over++;
          peak = Math.max(peak, Math.abs(sample));
          square += sample * sample;
          total += sample;
          largestJump = Math.max(largestJump, Math.abs(sample - (samples[i - 1] || 0)));
        }
        return { peak, over, rms: Math.sqrt(square / (end - first)), dc: total / (end - first), largestJump };
      };
      const prePcm = { ...stats(), first: samples[0], last: samples.at(-1) };
      const sections = Object.fromEntries(Object.entries(windows).map(([name, [from, to]]) => [name, stats(from, to)]));
      if (prePcm.peak * previewGain >= 1) throw Error('The matched preview gain would overload PCM');
      const pcm = new Uint8Array(samples.length * 2);
      const data = new DataView(pcm.buffer);
      for (let i = 0; i < samples.length; i++) data.setInt16(i * 2, Math.round(samples[i] * previewGain * 32767), true);
      let binary = '';
      for (let i = 0; i < pcm.length; i += 8192) binary += String.fromCharCode(...pcm.subarray(i, i + 8192));
      return { prePcm, sections, voices, renderMs, pcm: btoa(binary) };
    }, { url, recipe, track });
    const { pcm, ...measurements } = rendered;
    const data = Buffer.from(pcm, 'base64');
    routinePcm[id] = data.subarray(0, Math.round(2.24 * recipe.sampleRate) * 2);
    const header = Buffer.alloc(44);
    header.write('RIFF'); header.writeUInt32LE(36 + data.length, 4); header.write('WAVEfmt ', 8);
    header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
    header.writeUInt32LE(recipe.sampleRate, 24); header.writeUInt32LE(recipe.sampleRate * 2, 28);
    header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(data.length, 40);
    await writeFile(new URL(`reel-${id.toLowerCase()}.wav`, evidence), Buffer.concat([header, data]));
    report.variants[id] = measurements;
  }
  const { A, B } = report.variants;
  assert.ok(A.prePcm.peak > 1, 'The common action reel should reproduce baseline overload');
  if (B) {
    assert.deepEqual(A.sections.routine, B.sections.routine);
    assert.deepEqual(routinePcm.A, routinePcm.B);
    assert.ok(B.prePcm.peak < .25, 'candidate should leave ample headroom in this reel');
    assert.ok(B.voices <= A.voices - 45);
  }
  const json = `${JSON.stringify(report, null, 2)}\n`;
  console.log(json.trim());
  if (B) await writeFile(new URL('signal-report.json', evidence), json);
} finally { await browser.close(); }
