import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { WebSocket } from 'ws';
import { createGameServer } from '../server/index.mjs';
import { T } from '../src/rules.js';
import { baseline, cascade, seed } from './audio-fixture.mjs';

const port = Number(process.env.PORT || 5184);
const url = `http://127.0.0.1:${port}`;
const game = createGameServer({ diagnostics: true });
let browser;
try {
  game.server.listen(port, '127.0.0.1');
  await once(game.server, 'listening');
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const report = { browser: browser.version(), seed, baseline, variants: {} };
  for (const label of ['A', 'B']) {
    const page = await browser.newPage();
    page.setDefaultTimeout(8_000);
    const partners = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (label === 'A') for (const file of ['main.js', 'audio.js']) {
      const body = execFileSync('git', ['show', `${baseline}:public/${file}`], { encoding: 'utf8' });
      await page.route(`**/${file}`, route => route.fulfill({ contentType: 'text/javascript', body }));
    }
    await page.addInitScript(() => {
      window.audioProbe = [];
      const create = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () {
        const oscillator = create.call(this);
        const start = oscillator.start.bind(oscillator);
        const setFrequency = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
        let frequency;
        oscillator.frequency.setValueAtTime = (value, at) => { frequency = value; return setFrequency(value, at); };
        oscillator.start = (at = this.currentTime) => {
          start(at);
          window.audioProbe.push({ frequency, at, state: this.state });
        };
        return oscillator;
      };
    });
    try {
      let snapshot;
      page.on('websocket', ws => ws.on('framereceived', frame => {
        const message = JSON.parse(String(frame.payload));
        if (message.type === 'state') snapshot = message;
      }));
      await page.goto(url);
      await page.locator('#create').click();
      await page.waitForFunction(() => /^[A-F0-9]{6}$/.test(document.querySelector('#room-code').textContent));
      const code = await page.locator('#room-code').textContent();
      assert.match(code, /^[A-F0-9]{6}$/);
      await page.locator('[data-character="ivo"]').click();
      for (let i = 0; i < 3; i++) {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
        partners.push(ws);
        await once(ws, 'open');
        ws.send(JSON.stringify({ type: 'join', code }));
        ws.send(JSON.stringify({ type: 'ready' }));
      }
      await page.locator('#ready').click();
      await page.waitForFunction(() => window.audioProbe.some(note => note.frequency === 105));
      const room = game.rooms.get(code);
      assert.equal(room.state.seed, seed);
      await page.locator('canvas').focus();
      await page.keyboard.press('Space', { delay: 60 });
      await page.waitForFunction(() => window.audioProbe.some(note => note.frequency === 82));
      assert.equal(room.state.players[0].specialUses, 1);
      assert.ok((await page.evaluate(() => window.audioProbe)).some(note => note.frequency === 1200));

      const take = async (count, rescue) => {
        await page.evaluate(() => { window.audioProbe.length = 0; });
        const expected = cascade(room.state, count, rescue);
        const ids = new Set(expected.map(event => event.id));
        assert.equal(expected.filter(event => event.type === 'kill').length, count);
        await page.waitForFunction(frequencies => frequencies.every(frequency =>
          window.audioProbe.some(note => note.frequency === frequency)), rescue ? [440, 660] : [440]);
        await wait(100); // Later snapshots replay the event history without new starts.
        assert.equal(snapshot.state.events.filter(event => ids.has(event.id)).length, expected.length);
        const notes = await page.evaluate(() => window.audioProbe);
        assert.ok(notes.every(note => note.state === 'running'));
        const killPitches = notes.filter(note => [440, 560, 700].includes(note.frequency)).map(note => note.frequency);
        const rescuePitches = notes.filter(note => [330, 660].includes(note.frequency)).map(note => note.frequency);
        return { killsReceived: count, killPitches, rescuePitches };
      };
      const isolated = await take(1, false);
      const crowded = await take(T.maxEnemies, true);
      assert.deepEqual(isolated.killPitches, [440]);
      assert.deepEqual(crowded.killPitches, label === 'A' ? Array(T.maxEnemies).fill(440) : [440, 560, 700]);
      assert.deepEqual(crowded.rescuePitches, [330, 660]);
      assert.deepEqual(errors, []);
      report.variants[label] = { keyboardSpecialPitches: [82, 1200], isolated, crowded, errors };
    } finally {
      for (const ws of partners) ws.terminate();
      await page.close();
    }
  }
  const json = `${JSON.stringify(report, null, 2)}\n`;
  await writeFile(new URL('../evidence/skill-trials/sound/browser-report.json', import.meta.url), json);
  console.log(json.trim());
} finally {
  await browser?.close();
  if (game.server.listening) await game.close();
}
