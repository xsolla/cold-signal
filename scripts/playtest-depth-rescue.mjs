import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { createGameServer } from '../server/index.mjs';
import { RINGS, T, characterById, delta, distance, ringName } from '../src/rules.js';

const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = Number(process.env.PORT || 5183);
const url = `http://127.0.0.1:${port}`;
const output = new URL('../artifacts/skill-trials/playtest/', import.meta.url);
const stopAt = 16;
const viewport = { width: 1200, height: 900 };
const game = createGameServer({ diagnostics: true });
const browsers = [];
const errors = [];
const report = { status: 'running', mode: 'Agent-operated local browser pass', url, viewport,
  naturalStopSimulationSeconds: stopAt, controls: 'Browser mouse and keyboard; browser WebSocket snapshots read for assisted steering and checks.',
  help: 'Operator knew the controls and rescue rule beforehand. Other three browser pilots stayed on their initial lanes without using abilities.',
  steps: [], naturalEvents: [], errors };
const round = value => +value.toFixed(3);
let stage = 'room-entry';
const startedAt = performance.now();
await mkdir(output, { recursive: true });

async function until(check, label, timeout = 5000) {
  const deadline = performance.now() + timeout;
  while (performance.now() < deadline) {
    const value = check();
    if (value) return value;
    await delay(18);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function client(reducedMotion) {
  const browser = await chromium.launch({ executablePath, headless: true, timeout: 15000 });
  browsers.push(browser);
  const page = await browser.newPage({ viewport, reducedMotion });
  page.setDefaultTimeout(4500);
  const peer = { page, latest: null };
  let lastEvent = 0;
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('websocket', ws => ws.on('framereceived', frame => {
    const message = JSON.parse(String(frame.payload));
    if (message.type !== 'state') return;
    if (message.code !== peer.latest?.code || message.state?.seed !== peer.latest?.state?.seed) lastEvent = 0;
    peer.latest = message;
    if (peer !== crew[0] || stage !== 'natural') return;
    for (const event of message.state?.events ?? []) {
      if (event.id <= lastEvent) continue;
      lastEvent = event.id;
      if (['down', 'rescue', 'lost', 'won'].includes(event.type)) {
        const { id, type, time, player, radius } = event;
        report.naturalEvents.push({ id, type, time: round(time), ...(player === undefined ? {} : { player: player + 1, radius: round(radius) }) });
      }
    }
  }));
  return peer;
}

const crew = [];
const lead = () => crew[0];
const first = () => lead().latest.state;
const player = (peer, id) => peer.latest.state.players[id];
function log(action, peer = lead(), extra = {}) {
  const { latest } = peer;
  const state = latest?.state;
  report.steps.push({ stage, wallSecondsFromLaunch: round((performance.now() - startedAt) / 1000), action,
    ...(state ? { seed: state.seed, time: round(state.time), status: state.status, rescues: state.rescues,
      crew: state.players.map(p => ({ ring: ringName(p.ring).toLowerCase(), radius: round(p.radius), down: p.down, angle: round(p.angle), rescue: round(p.rescue), specialUses: p.specialUses })) } : {}),
    ...extra });
}

async function capture(peer, name) {
  await peer.page.screenshot({ path: new URL(`${name}.jpg`, output).pathname, type: 'jpeg', quality: 86 });
  log('Captured browser viewport', peer, { image: `${name}.jpg`, motion: (await peer.page.locator('#motion').getAttribute('aria-pressed')) === 'true' ? 'reduced' : 'full' });
}

async function makeRoom() {
  for (const peer of crew) peer.latest = null;
  await lead().page.locator('#create').click();
  const room = await until(() => lead().latest?.code, 'created room');
  for (const { page } of crew.slice(1)) {
    await page.locator('#room-input').fill(room.toLowerCase());
    await page.locator('#room-input').press('Enter');
  }
  await until(() => crew.every(peer => peer.latest?.connected.every(Boolean)), 'four room members');
  await lead().page.locator('[data-character="ivo"]').click();
  log('Created default room, joined three peers by code with Enter, selected Ivo', lead(), lead().latest.config);
}

async function ready() {
  for (const { page } of crew) await page.locator('#ready').click();
  await until(() => crew.every(peer => peer.latest.state?.status === 'playing'), 'all four in active run');
  await lead().page.locator('canvas').focus();
  log('All four readied; arena has keyboard focus');
}

async function changeDepth(peer, id, destination) {
  while (!player(peer, id).down && player(peer, id).ring !== destination) {
    const next = player(peer, id).ring + Math.sign(destination - player(peer, id).ring);
    await peer.page.keyboard.press(next < player(peer, id).ring ? 'KeyW' : 'KeyS');
    await until(() => player(peer, id).radius === RINGS[next] || player(peer, id).down, 'hop arrival');
  }
}

async function approach(peer, helper, target) {
  const gap = () => delta(player(peer, target).angle, player(peer, helper).angle);
  if (Math.abs(gap()) <= .13) return;
  const key = gap() > 0 ? 'KeyD' : 'KeyA';
  await peer.page.keyboard.down(key);
  try {
    await until(() => Math.abs(gap()) <= .13 || player(peer, helper).down || !player(peer, target).down || peer.latest.state.status !== 'playing', 'alignment');
  } finally {
    await peer.page.keyboard.up(key);
  }
}

try {
  game.server.listen(port, '127.0.0.1');
  await once(game.server, 'listening');
  for (const mode of ['no-preference', 'reduce', 'no-preference', 'no-preference']) crew.push(await client(mode));
  report.browser = await browsers[0].version();
  await Promise.all(crew.map(({ page }) => page.goto(url)));
  await lead().page.getByText('Room server ready. Bring your crew.', { exact: true }).waitFor();
  await makeRoom();

  stage = 'natural';
  await ready();
  await until(() => first().time >= 1.5, 'opening spawn grace ends');
  await changeDepth(lead(), 0, 1);
  log('Tapped W to cover the middle rail with ordinary enemies, walls, and damage enabled');
  await until(() => first().players.some(p => p.down) || first().time >= stopAt, 'first down or natural horizon', stopAt * 2500);
  const target = first().players.find(p => p.down && p.id !== 0);
  if (target && !first().players[0].down) {
    log('Chose to follow the first fallen teammate; HUD indicated depth and snapshots assisted precise steering', lead(), { target: target.id + 1,
      arenaNote: await lead().page.locator('#arena-note').textContent(), crewLabels: await lead().page.locator('#crew span').allTextContents() });
    await capture(lead(), 'natural-first-down');
    await changeDepth(lead(), 0, target.ring);
    if (!first().players[0].down) await approach(lead(), 0, target.id);
    log('Attempted to match ring and angle without any special input', lead(), { target: target.id + 1 });
  } else {
    log('No approach available to the lead pilot at the first down or horizon');
    await capture(lead(), 'natural-first-down');
  }
  await until(() => first().status !== 'playing' || first().time >= stopAt, 'natural outcome or horizon', stopAt * 2500);
  log('Ended natural attempt', lead(), { stop: first().status === 'playing' ? 'bounded-horizon' : first().status,
    ...(first().status === 'playing' ? {} : { outcomeLabel: await lead().page.locator('#overlay-kicker').textContent() }) });
  for (const { page } of crew) await page.locator('#leave:visible, #leave-interrupted:visible').click();

  stage = 'constructed-rescue';
  await makeRoom();
  await ready();
  await changeDepth(lead(), 0, 1);
  await lead().page.getByText('Local test tools', { exact: true }).click();
  await lead().page.getByRole('button', { name: 'Fill crew power meters', exact: true }).click();
  await until(() => {
    const pilot = first().players[0];
    return pilot.powerCharge === characterById(pilot.character).powerKills;
  }, 'constructed full power');
  await lead().page.getByRole('button', { name: 'Rescue scenario', exact: true }).click();
  await until(() => first().players[1].down, 'constructed middle-ring down');
  log('Filled crew power meters, then used Rescue scenario to down P2, clear live threats, delay spawns and add a warning zone');
  await changeDepth(lead(), 0, 2);
  await approach(lead(), 0, 1);
  const alignedAt = first().time;
  await until(() => first().time - alignedAt >= .28, 'wrong-ring hold');
  assert.ok(distance(first().players[0].angle, first().players[1].angle) <= T.rescueArc);
  assert.equal(first().players[1].rescue, 0);
  log('Held angular alignment on the wrong ring; progress stayed at zero');
  await changeDepth(lead(), 0, 1);
  await until(() => first().players[1].rescue > .18, 'same-ring rescue progress');
  const leadBullets = first().bullets.filter(b => b.owner === 0).length;
  assert.ok(leadBullets > 0);
  log('Tapped W while remaining aligned; progress became positive with auto-fire still visible', lead(), {
    leadBullets,
    arenaNote: await lead().page.locator('#arena-note').textContent(), crewLabels: await lead().page.locator('#crew span').allTextContents() });
  await Promise.all([capture(lead(), 'rescue-full-motion'), capture(crew[1], 'rescue-reduced-motion')]);
  assert.equal(await lead().page.locator('#motion').getAttribute('aria-pressed'), 'false');
  assert.equal(await crew[1].page.locator('#motion').getAttribute('aria-pressed'), 'true');
  await lead().page.keyboard.press('Space');
  await until(() => first().players[0].specialUses === 1 && !first().zones.length, 'Shockwave clears the fixture zone');
  log('Used Space to clear the scripted warning zone with Shockwave');
  await until(() => crew.every(peer => peer.latest.state.rescues === 1 && !peer.latest.state.players[1].down), 'all four saw rescue complete');
  log('Matched middle-ring rescue completed while the group kept firing');

  stage = 'constructed-outcome';
  await lead().page.getByRole('button', { name: 'Team-wipe check', exact: true }).click();
  await until(() => crew.every(peer => peer.latest.state.status === 'lost'), 'constructed loss on all clients');
  log('Used Team-wipe check; all four got the loss and retry overlay', lead(), { outcomeLabel: await lead().page.locator('#overlay-kicker').textContent() });
  await ready();
  assert.equal(first().seed, 17322);
  assert.ok(first().players.every(p => !p.down && p.ring === 2 && p.specialUses === 0));
  log('Retried by readying all four; seed advanced and crew, ring and ability state reset');

  stage = 'interruption';
  await crew[2].page.close();
  await until(() => [0, 1, 3].every(id => crew[id].latest.state.status === 'interrupted'), 'all remaining clients interrupted');
  assert.equal(await lead().page.locator('#ready').isVisible(), false);
  log('Closed P3 client during the active retry; peers received interruption and leave instructions', lead(), {
    outcomeLabel: await lead().page.locator('#overlay-kicker').textContent(), prompt: await lead().page.locator('#overlay-copy').textContent() });
  await lead().page.locator('#leave-interrupted').click();
  await lead().page.locator('#create').waitFor();
  lead().latest = null;
  log('Returned to room entry using Leave', lead(), { entryVisible: true });
  assert.deepEqual(errors, []);
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = error.stack;
  throw error;
} finally {
  await writeFile(new URL('trace.json', output), JSON.stringify(report, null, 2) + '\n');
  await Promise.all(browsers.map(browser => browser.close()));
  await game.close();
}
