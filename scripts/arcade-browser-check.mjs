import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { BPM } from '../public/audio-score.js';
import { sortieChart } from '../public/audio-chart.js';

const repo = fileURLToPath(new URL('../', import.meta.url));
const artifacts = join(repo, 'artifacts', 'arcade');
const arcadeSite = process.env.COLD_SIGNAL_ARCADE_SITE;
const arcadeExport = resolve(process.env.COLD_SIGNAL_ARCADE_EXPORT || join(repo, 'dist', 'arcade'));
const origin = 'https://arcade.test';
const gamePath = '/preview/games/cold-signal/';
const executablePath = process.env.CHROME_PATH
  || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');

await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const errors = [], sockets = [], unexpected = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('websocket', socket => sockets.push(socket.url()));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === origin && url.pathname.startsWith('/preview/')) {
      if (arcadeSite) {
        const file = url.pathname.slice('/preview/'.length) || 'index.html';
        return route.fulfill({ path: join(arcadeSite, file, file.endsWith('/') ? 'index.html' : '') });
      }
      if (url.pathname === '/preview/play.html') {
        return route.fulfill({ contentType: 'text/html', body: `<!doctype html><button id="host-focus">Host</button><iframe id="game-frame"
          src="${gamePath}" allow="autoplay; fullscreen" style="width:100%;height:95vh;border:0"></iframe>` });
      }
      if (url.pathname.startsWith(gamePath)) {
        return route.fulfill({ path: join(arcadeExport, url.pathname.slice(gamePath.length) || 'index.html') });
      }
    }
    unexpected.push(route.request().url());
    return route.abort();
  });
  await page.addInitScript(path => {
    if (!location.pathname.startsWith(path)) return;
    const requestFrame = window.requestAnimationFrame.bind(window);
    let previous, time;
    window.requestAnimationFrame = callback => requestFrame(now => {
      time = (time ?? now) + (now - (previous ?? now)) * (window.arcadeTestRate || 1);
      previous = now;
      callback(time);
    });
    const Audio = window.AudioContext;
    window.AudioContext = class extends Audio {
      constructor(...args) { super(...args); window.arcadeTestAudio = this; }
      createOscillator() {
        const voice = super.createOscillator();
        const set = voice.frequency.setValueAtTime.bind(voice.frequency);
        voice.frequency.setValueAtTime = (value, at) => {
          if (value === 148) (window.arcadeTestKicks ??= []).push(at);
          return set(value, at);
        };
        return voice;
      }
    };
  }, gamePath);

  await page.goto(`${origin}/preview/play.html?game=cold-signal`);
  const game = page.frameLocator('#game-frame');
  const start = game.locator('#start');
  const canvas = game.locator('canvas');
  const motion = game.locator('#motion');
  await start.waitFor();
  assert.match(await game.locator('#overlay-kicker').textContent(), /3 AI WINGMATES/);
  assert.equal(await game.getByRole('radio').count(), 4);
  const mara = game.getByRole('radio', { name: /Mara/ });
  await mara.press('ArrowRight');
  assert.equal(await game.getByRole('radio', { name: /Ivo/ }).getAttribute('aria-checked'), 'true');
  await game.getByRole('radio', { name: /Ivo/ }).press('ArrowLeft');
  assert.equal(await mara.getAttribute('aria-checked'), 'true');
  await game.locator('#pace').selectOption('1');
  await start.click();
  assert.equal(await canvas.evaluate(node => node === document.activeElement), true);
  assert.equal(await canvas.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  assert.equal(await motion.getAttribute('aria-pressed'), 'false');
  assert.equal(await motion.textContent(), 'REDUCE MOTION');
  assert.equal(await game.locator('#crew span').count(), 4);
  assert.equal(await game.locator('#duration').textContent(), '/ 01:30');
  await page.keyboard.down('KeyW');
  await game.locator('#crew .you').filter({ hasText: /MIDDLE/ }).waitFor();
  await page.waitForTimeout(250);
  assert.match(await game.locator('#crew .you').textContent(), /MIDDLE/);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('Space');
  await game.locator('#ability-state').filter({ hasText: /\d+s/ }).waitFor();
  await page.keyboard.press('KeyS');
  await game.locator('#crew .you').filter({ hasText: /OUTER/ }).waitFor();
  await motion.click();
  assert.equal(await motion.getAttribute('aria-pressed'), 'true');
  assert.equal(await motion.textContent(), 'MOTION REDUCED');
  await motion.click();
  assert.equal(await motion.getAttribute('aria-pressed'), 'false');
  assert.equal(await canvas.evaluate(() => window.arcadeTestAudio?.state), 'running');
  await game.locator('#mute').click();
  await game.locator('#mute').filter({ hasText: 'SOUND OFF' }).waitFor();
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(240);
  await page.keyboard.up('KeyD');
  await game.locator('#clock').filter({ hasText: '00:06' }).waitFor();
  await game.locator('.stage').screenshot({ path: join(artifacts, 'cold-signal.png') });
  await page.keyboard.press('Escape');
  await game.getByRole('button', { name: /^Resume/i }).waitFor();
  const pausedClock = await game.locator('#clock').textContent();
  await page.keyboard.press('KeyW');
  await page.waitForTimeout(1100);
  assert.equal(await game.locator('#clock').textContent(), pausedClock);
  assert.match(await game.locator('#crew .you').textContent(), /OUTER/);
  await page.keyboard.press('Escape');
  assert.equal(await canvas.evaluate(node => node === document.activeElement), true);
  const hostControl = page.locator(arcadeSite ? '.back-link' : '#host-focus');
  await hostControl.focus();
  await game.getByRole('button', { name: /^Resume/i }).waitFor();
  assert.equal(await hostControl.evaluate(node => node === document.activeElement), true);
  await game.locator('#resume').click();
  await canvas.evaluate(() => { window.arcadeTestRate = 7; });
  await game.getByRole('button', { name: /^Retry as Mara/i }).waitFor({ timeout: 60_000 });
  const outcome = await game.locator('#overlay-kicker').textContent();
  await canvas.evaluate(() => { window.arcadeTestRate = 1; });
  await start.click();
  assert.match(await game.locator('#clock').textContent(), /^00:00$/);
  assert.equal(await game.locator('#ability-state').textContent(), 'READY');
  assert.ok((await game.locator('#crew').textContent()).includes('OUTER'));
  await page.keyboard.press('Escape');
  await game.getByRole('button', { name: /Return to pilot select/i }).click();
  await game.getByRole('heading', { name: /Choose your pilot/i }).waitFor();
  await page.setViewportSize({ width: 390, height: 720 });
  await start.waitFor();
  assert.equal(await canvas.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (!arcadeSite) {
    await page.setViewportSize({ width: 1280, height: 800 });
    const frame = page.frames().find(child => new URL(child.url()).pathname === gamePath);
    await frame.goto(`${origin}${gamePath}?finale=synced`);
    await game.locator('#overlay-kicker').filter({ hasText: /FINALE REHEARSAL · SYNCED SCORE/ }).waitFor();
    await game.locator('#pace').selectOption('1');
    await start.click();
    assert.equal(await game.locator('#clock').textContent(), '01:10');
    assert.equal(await game.locator('#phase').textContent(), 'BREATH');
    assert.equal(await canvas.evaluate(() => window.arcadeTestKicks?.length ?? 0), 0);
    await game.locator('#phase').filter({ hasText: 'FINAL SURGE' }).waitFor();
    await frame.waitForFunction(() => window.arcadeTestKicks?.length >= 2);
    const [first, second] = await frame.evaluate(() => window.arcadeTestKicks);
    assert.ok(Math.abs(second - first - 60 / BPM) < 1e-6);
    await page.keyboard.press('Escape');
    await game.locator('#stop').click();
    await game.getByRole('link', { name: /TRY THE ORIGINAL SCORE/ }).click();
    await game.locator('#overlay-kicker').filter({ hasText: /FINALE REHEARSAL · ORIGINAL SCORE/ }).waitFor();

    await frame.goto(`${origin}${gamePath}?pressure=synced`);
    await game.locator('#overlay-kicker').filter({ hasText: /BREATH INTO PRESSURE · SYNCED SCORE/ }).waitFor();
    await frame.evaluate(() => {
      const phase = document.getElementById('phase');
      const observer = new MutationObserver(() => {
        if (phase.textContent === 'PRESSURE') {
          window.arcadeTestPressureAt = window.arcadeTestAudio.currentTime;
          observer.disconnect();
        }
      });
      observer.observe(phase, { childList: true });
    });
    await start.click();
    assert.equal(await game.locator('#duration').textContent(), '/ 00:29');
    assert.equal(await game.locator('#phase').textContent(), 'BREATH');
    await page.keyboard.press('KeyW');
    await game.locator('#crew .you').filter({ hasText: /MIDDLE/ }).waitFor();
    await page.keyboard.press('KeyS');
    await game.locator('#crew .you').filter({ hasText: /OUTER/ }).waitFor();
    assert.equal(await canvas.evaluate(() => window.arcadeTestKicks?.length ?? 0), 0);
    await frame.waitForFunction(() => window.arcadeTestPressureAt != null && window.arcadeTestKicks?.length >= 2,
      undefined, { timeout: 10000 });
    const { reveal, kicks } = await frame.evaluate(() => ({
      reveal: window.arcadeTestPressureAt,
      kicks: window.arcadeTestKicks,
    }));
    assert.ok(Math.abs(kicks[0] - reveal) < .12, JSON.stringify({ reveal, kicks }));
    assert.ok(Math.abs(kicks[1] - kicks[0] - 60 / BPM) < 1e-6);
    await canvas.evaluate(() => { window.arcadeTestRate = 5; });
    await game.getByRole('button', { name: /^Retry as Mara/i }).waitFor({ timeout: 20000 });
    await canvas.evaluate(() => { window.arcadeTestRate = 1; });
    await start.click();
    assert.equal(await game.locator('#clock').textContent(), '00:00');
    assert.equal(await game.locator('#phase').textContent(), 'BREATH');
    await page.keyboard.press('Escape');
    await game.locator('#stop').click();
    await game.getByRole('link', { name: /TRY THE ORIGINAL SCORE/ }).click();
    await game.locator('#overlay-kicker').filter({ hasText: /BREATH INTO PRESSURE · ORIGINAL SCORE/ }).waitFor();
    console.log(`Pressure rehearsal drop offset ${Math.round((kicks[0] - reveal) * 1000)} ms; input, outcome, retry and comparison passed.`);

    await frame.goto(`${origin}${gamePath}`);
    const realTime = process.env.COLD_SIGNAL_REALTIME === '1';
    await frame.evaluate(() => {
      const phase = document.getElementById('phase');
      const clock = document.getElementById('clock');
      window.arcadeTestPhases = [];
      new MutationObserver(() => window.arcadeTestPhases.push({
        phase: phase.textContent, clock: clock.textContent, at: window.arcadeTestAudio?.currentTime,
      })).observe(phase, { childList: true });
    });
    assert.equal(await game.locator('#pace').inputValue(), '0.5');
    await start.click();
    assert.equal(await game.locator('#duration').textContent(), '/ 03:00');
    assert.equal(await game.locator('#phase').textContent(), 'INGRESS');
    if (!realTime) await canvas.evaluate(() => { window.arcadeTestRate = 7; });
    await game.getByRole('button', { name: /^Retry as Mara/i }).waitFor({ timeout: realTime ? 215000 : 65000 });
    const observed = await frame.evaluate(() => ({ phases: window.arcadeTestPhases, kicks: window.arcadeTestKicks }));
    const expected = sortieChart.phases.map(({ phase }) => phase);
    assert.deepEqual(observed.phases.slice(0, expected.length).map(({ phase }) => phase), expected);
    assert.match(await game.locator('#overlay-kicker').textContent(), /^TEAM CLEAR/);
    if (realTime) {
      const dropOffsets = Object.fromEntries(['PRESSURE', 'CONVERGENCE', 'FINAL SURGE'].map(phase => {
        const { at } = observed.phases.find(mark => mark.phase === phase);
        const nearest = observed.kicks.reduce((best, kick) => Math.abs(kick - at) < Math.abs(best - at) ? kick : best);
        assert.ok(Math.abs(nearest - at) < .12, JSON.stringify({ phase, at, nearest }));
        return [phase, Math.round((nearest - at) * 1000)];
      }));
      console.log('Real-time three-minute transitions, kick offsets in ms', dropOffsets);
    }
    await canvas.evaluate(() => { window.arcadeTestRate = 1; });
    await start.click();
    assert.equal(await game.locator('#clock').textContent(), '00:00');
    assert.equal(await game.locator('#phase').textContent(), 'INGRESS');
    console.log(`Three-minute solo score passed at ${realTime ? 'real-time' : 'accelerated'} pace with all eight phases, clear and retry.`);
  }
  assert.deepEqual(sockets, []);
  assert.deepEqual(unexpected, []);
  assert.deepEqual(errors, []);
  console.log(`Arcade ${arcadeSite ? 'player' : 'nested iframe'} passed on Chromium ${browser.version()}. Outcome: ${outcome}. Retry, focus, audio, pause, compact layout and static-only requests passed.`);
} finally {
  await browser.close();
}
