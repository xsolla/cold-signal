import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { WebSocket } from 'ws';
import { createGameServer } from '../server/index.mjs';
import { downPlayer, RINGS, T } from '../src/rules.js';
import { baseline, cascade, chainRoll, seed } from './audio-fixture.mjs';
import { BPM, CUE_STEP_SECONDS, hz, STEP_SECONDS } from '../public/audio-score.js';

const port = Number(process.env.PORT || 5184);
const url = `http://127.0.0.1:${port}`;
const game = createGameServer({ diagnostics: true });
const historical = process.argv.includes('--historical');
const variants = historical ? [['A', baseline, .5], ['B', chainRoll, .5]] : [['Half pace', null, .5], ['Full pace', null, 1]];
let browser;
try {
  game.server.listen(port, '127.0.0.1');
  await once(game.server, 'listening');
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const report = { browser: browser.version(), seed, baseline, variants: {} };
  for (const [label, revision, timeScale] of variants) {
    const page = await browser.newPage();
    page.setDefaultTimeout(8_000);
    const partners = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (revision) for (const file of ['main.js', 'audio.js']) {
      const body = execFileSync('git', ['show', `${revision}:public/${file}`], { encoding: 'utf8' });
      await page.route(`**/${file}`, route => route.fulfill({ contentType: 'text/javascript', body }));
    }
    await page.addInitScript(() => {
      window.audioProbe = [];
      const create = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () {
        window.audioContextProbe = this;
        const oscillator = create.call(this);
        const start = oscillator.start.bind(oscillator);
        const setFrequency = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
        const rampFrequency = oscillator.frequency.exponentialRampToValueAtTime.bind(oscillator.frequency);
        let frequency, slide;
        oscillator.frequency.setValueAtTime = (value, at) => { frequency = value; return setFrequency(value, at); };
        oscillator.frequency.exponentialRampToValueAtTime = (value, at) => { slide = value; return rampFrequency(value, at); };
        oscillator.start = (at = this.currentTime) => {
          start(at);
          window.audioProbe.push({ frequency, slide, detune: oscillator.detune.value, at, state: this.state });
        };
        return oscillator;
      };
    });
    const heartbeat = setInterval(() => {
      for (const partner of partners) if (partner.readyState === WebSocket.OPEN) partner.send('{"type":"input"}');
    }, 500);
    try {
      let snapshot;
      page.on('websocket', ws => ws.on('framereceived', frame => {
        const message = JSON.parse(String(frame.payload));
        if (message.type === 'state') snapshot = message;
      }));
      await page.goto(url);
      if (!historical) await page.evaluate(async () => {
        const { Sound } = await import('/audio.js');
        const sync = Sound.prototype.syncPilotMix;
        Sound.prototype.syncPilotMix = function (players, at) {
          window.crewMixer = this;
          return sync.call(this, players, at);
        };
      });
      await page.locator('#pace').selectOption(String(timeScale));
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
      const kick = historical ? 105 : 148;
      await page.waitForFunction(pitch => window.audioProbe.some(note => note.frequency === pitch), kick);
      const room = game.rooms.get(code);
      assert.equal(room.state.seed, seed);
      assert.equal(room.state.timeScale, timeScale);
      await page.locator('canvas').focus();
      await page.keyboard.press('Space', { delay: 60 });
      const specialPitch = historical ? 82 : hz(37);
      await page.waitForFunction(pitch => window.audioProbe.some(note => Math.abs(note.frequency - pitch) < .001), specialPitch);
      assert.equal(room.state.players[0].specialUses, 1);
      if (historical) assert.ok((await page.evaluate(() => window.audioProbe)).some(note => note.frequency === 1200));

      let kickInterval, beatOrigin;
      const onGrid = at => {
        const step = (at - beatOrigin) / CUE_STEP_SECONDS;
        return Math.abs(step - Math.round(step)) < 1e-6;
      };
      if (!historical) {
        await page.waitForFunction(() => window.audioProbe.filter(note => note.frequency === 148).length >= 2);
        const kicks = await page.evaluate(() => window.audioProbe.filter(note => note.frequency === 148));
        beatOrigin = kicks[0].at;
        kickInterval = kicks[1].at - kicks[0].at;
        assert.ok(Math.abs(kickInterval - 60 / BPM) < 1e-6);
        const ability = await page.evaluate(pitch => window.audioProbe.find(note => Math.abs(note.frequency - pitch) < .001), specialPitch);
        assert.ok(onGrid(ability.at));
      }

      const killNotes = historical ? [440, 560, 700] : [54, 57, 61, 66, 69].map(hz);
      const rescueNotes = historical ? [330, 660] : [54, 57, 61, 69, 73].map(hz);
      const take = async (count, rescue) => {
        await page.evaluate(() => { window.audioProbe.length = 0; });
        const expected = cascade(room.state, count, rescue);
        const ids = new Set(expected.map(event => event.id));
        assert.equal(expected.filter(event => event.type === 'kill').length, count);
        if (historical) {
          await page.waitForFunction(frequencies => frequencies.every(frequency =>
            window.audioProbe.some(note => Math.abs(note.frequency - frequency) < .001)),
          rescue ? [killNotes[0], rescueNotes.at(-1)] : [killNotes[0]]);
        } else {
          await page.waitForFunction(withRescue => window.audioProbe.some(note =>
            Math.abs(note.slide / note.frequency - 2 ** (-1 / 12)) < 1e-9)
            && (!withRescue || window.audioProbe.some(note => note.detune === -9)), rescue);
        }
        // Let the isolated hit finish, including its possible subdivision wait,
        // before starting the crowded take. Later snapshots replay the same IDs.
        await wait(!historical && count === 1 ? 190 : 100);
        assert.equal(snapshot.state.events.filter(event => ids.has(event.id)).length, expected.length);
        const notes = await page.evaluate(() => window.audioProbe);
        assert.ok(notes.every(note => note.state === 'running'));
        const matching = (observed, expected) => observed.map(note =>
          expected.find(pitch => Math.abs(note.frequency - pitch) < .001)).filter(Number.isFinite);
        const killPitches = matching(notes.filter(note => note.slide), killNotes);
        const rescuePitches = matching(notes.filter(note => !note.slide), rescueNotes);
        if (!historical) {
          const chain = notes.filter(note => note.slide && killNotes.some(pitch => Math.abs(note.frequency - pitch) < .001));
          assert.ok(chain.every(note => onGrid(note.at)));
          assert.ok(chain.slice(1).every((note, index) => Math.abs(note.at - chain[index].at - CUE_STEP_SECONDS) < 1e-6));
        }
        return { killsReceived: count, killPitches, rescuePitches };
      };
      const isolated = await take(1, false);
      const crowded = await take(T.maxEnemies, true);
      if (historical) {
        assert.deepEqual(isolated.killPitches, [killNotes[0]]);
        assert.deepEqual(crowded.killPitches, label === 'A' ? Array(T.maxEnemies).fill(440) : killNotes);
        assert.deepEqual(crowded.rescuePitches, rescueNotes);
      } else {
        assert.equal(isolated.killPitches.length, 1);
        assert.equal(crowded.killPitches.length, 3);
        assert.ok(crowded.killPitches.slice(1).every((pitch, i) => pitch > crowded.killPitches[i]));
        const rescueVoicings = [[54, 61, 61, 69], [54, 57, 57, 73]].map(voicing => voicing.map(hz));
        assert.ok(rescueVoicings.some(voicing => voicing.length === crowded.rescuePitches.length
          && voicing.every((pitch, i) => pitch === crowded.rescuePitches[i])));
      }
      if (!historical) {
        await page.evaluate(() => { window.audioProbe.length = 0; });
        await page.locator('canvas').focus();
        await page.keyboard.press('KeyW');
        await page.waitForFunction(() => window.audioProbe.some(note =>
          Math.abs(note.slide / note.frequency - 2 ** (7 / 12)) < 1e-9));
        const hop = await page.evaluate(() => window.audioProbe.find(note =>
          Math.abs(note.slide / note.frequency - 2 ** (7 / 12)) < 1e-9));
        assert.ok(onGrid(hop.at));
        const pilot = room.state.players[0];
        assert.equal(pilot.ring, 1);

        room.state.zones.push({ id: room.state.nextId++, angle: pilot.angle, radius: RINGS[pilot.ring],
          width: .30, age: 0, warn: .62, life: .3 });
        await page.waitForFunction(step => window.audioProbe.some(first => !first.slide && window.audioProbe.some(second =>
          !second.slide && second.frequency === first.frequency && Math.abs(second.at - first.at - step) < 1e-6)), STEP_SECONDS);
        room.state.zones = [];
        await page.waitForFunction(() => document.querySelector('#ability-state').textContent.endsWith('s'));
        await page.evaluate(() => { window.audioProbe.length = 0; });
        // End the genuine cooldown early so the readiness edge is observable.
        pilot.specialCooldown = .005;
        await page.waitForFunction(step => window.audioProbe.some(first => !first.slide && window.audioProbe.some(second =>
          !second.slide && Math.abs(second.at - first.at - step) < 1e-6
          && [3, 4, 5].some(interval => Math.abs(second.frequency / first.frequency - 2 ** (interval / 12)) < 1e-9))), STEP_SECONDS);

        const casualty = room.state.players[2];
        assert.equal(casualty.character, 'sana');
        for (const player of room.state.players) player.protection = 8;
        casualty.protection = 0;
        assert.ok(downPlayer(room.state, casualty.id));
        const downAt = await page.evaluate(() => window.audioContextProbe.currentTime);
        await page.waitForFunction(since => {
          const strings = window.crewMixer.pilotParts.get('sana');
          return strings.dry.gain.value < .04 && strings.wet.gain.value < .04
            && window.crewMixer.pilotParts.get('ivo').dry.gain.value > .95
            && window.audioProbe.some(note => note.frequency === 148 && note.at > since + .1);
        }, downAt);
        Object.assign(casualty, { angle: pilot.angle, ring: pilot.ring, radius: pilot.radius,
          rescue: T.rescueSeconds - T.step * .25 });
        await page.waitForFunction(() => window.crewMixer.pilotParts.get('sana').dry.gain.value > .95);
        assert.equal(casualty.down, false);

        const verifySuspension = async (suspend, resume) => {
          await suspend();
          await page.waitForFunction(() => window.audioContextProbe.state === 'suspended');
          await page.evaluate(() => { window.audioProbe.length = 0; });
          await wait(180);
          assert.deepEqual(await page.evaluate(() => window.audioProbe), []);
          await resume();
          await page.waitForFunction(() => window.audioProbe.some(note => note.frequency === 148));
        };
        const mute = () => page.locator('#mute').click();
        await verifySuspension(mute, mute);
        await page.locator('canvas').focus();
        await verifySuspension(() => page.keyboard.press('Escape'), () => page.locator('#resume').click());
        await page.evaluate(() => { window.audioProbe.length = 0; });
        await page.locator('#devtools').evaluate(details => { details.open = true; });
        await page.locator('#final').click();
        await page.locator('#overlay-kicker').filter({ hasText: /TEAM CLEAR/ }).waitFor();
        await page.waitForFunction(pitch => window.audioProbe.some(note => Math.abs(note.frequency - pitch) < .001), hz(78));
        assert.equal(await page.evaluate(() => window.audioContextProbe.state), 'running');
      }
      assert.deepEqual(errors, []);
      report.variants[label] = { keyboardSpecialPitches: historical ? [82, 1200] : [specialPitch], kickInterval, isolated, crowded, errors };
    } finally {
      clearInterval(heartbeat);
      for (const ws of partners) ws.terminate();
      await page.close();
    }
  }
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const output = historical ? new URL('../evidence/skill-trials/sound/', import.meta.url) : new URL('../artifacts/audio/', import.meta.url);
  await mkdir(output, { recursive: true });
  await writeFile(new URL('browser-report.json', output), json);
  console.log(json.trim());
} finally {
  await browser?.close();
  if (game.server.listening) await game.close();
}
