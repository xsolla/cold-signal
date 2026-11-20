import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { distance } from '../src/rules.js';
const base = process.env.COLD_SIGNAL_URL || process.env.DELVE_URL || 'http://127.0.0.1:5176';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifacts = new URL('../artifacts/', import.meta.url);
await mkdir(artifacts, { recursive: true });
const debug = {};
const errors = [], result = { version: '0.3.0', mode: 'four-client agent pass / constructed diagnostic scenarios', url: base, steps: [] };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, label, timeout = 10_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const value = fn(); if (value) return value; await wait(20); }
  throw new Error(`Timed out: ${label}`);
}
async function settle(page) { await page.evaluate(() => { window.scrollTo(0, 0); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }); }
const browsers = [];
try {
  for (let i = 0; i < 4; i++) browsers.push(await chromium.launch({ executablePath, headless: true }));
  const contexts = await Promise.all(browsers.map(b => b.newContext({ viewport: { width: 1440, height: 1000 } })));
  const pages = await Promise.all(contexts.map(c => c.newPage()));
  const [a, b] = pages, states = Array(4).fill(null), histories = Array.from({ length: 4 }, () => []);
  pages.forEach((page, id) => {
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('websocket', ws => ws.on('framereceived', frame => {
      const message = JSON.parse(String(frame.payload));
      if (message.type === 'state') { states[id] = message; histories[id].push(message); debug[id] = { time: message.state?.time, status: message.state?.status, players: message.state?.players.map(p => ({ id: p.id, character: p.character, down: p.down, ring: p.ring, radius: p.radius, inwardHeld: p.inwardHeld, specialUses: p.specialUses, cooldown: p.specialCooldown })) }; }
    }));
  });
  await Promise.all(pages.map(p => p.goto(base)));
  await a.getByText('Room server ready. Bring your crew.', { exact: true }).waitFor();
  assert.equal(await a.locator('#crew-count').inputValue(), '4');
  assert.equal(await a.locator('#pace').inputValue(), '0.5');
  await a.screenshot({ path: new URL('four-player-menu.png', artifacts).pathname });
  await a.locator('#create').click(); await until(() => states[0]?.code, 'created room');
  const code = states[0].code; assert.match(code, /^[A-F0-9]{6}$/);
  await b.locator('#room-input').fill('XXXXXX'); await b.locator('#join').click(); await b.getByText(/Room not found/).waitFor();
  for (const page of pages.slice(1)) { await page.locator('#room-input').fill(code); await page.locator('#join').click(); }
  await until(() => states[0].connected.every(Boolean), 'four pilots joined');
  const choices = ['ivo', 'mara', 'rook', 'sana'];
  for (let id = 0; id < 4; id++) await pages[id].locator(`[data-character="${choices[id]}"]`).click();
  await until(() => JSON.stringify(states[0].characters) === JSON.stringify(choices), 'chosen roster');
  await a.screenshot({ path: new URL('four-player-lobby.png', artifacts).pathname });
  for (const page of pages.slice(0, 3)) await page.locator('#ready').click();
  assert.equal(states[0].state, null);
  await pages[3].locator('#ready').click();
  await until(() => states.every(s => s?.state?.status === 'playing'), 'all four playing');
  assert.deepEqual(states[0].state.players.map(p => p.character), choices);
  await until(() => new Set(states[0].state.bullets.map(b => b.owner)).size === 4, 'automatic fire from every pilot');
  result.steps.push('Four independent browser clients selected characters, all readied, and fired automatically without Space.');
  const startTime = states[0].state.time, wallStart = performance.now();
  await wait(1000); const wallDelta = (performance.now() - wallStart) / 1000;
  const ratio = (states[0].state.time - startTime) / wallDelta;
  assert.ok(ratio > .3 && ratio < .7, `half-speed ratio ${ratio}`); result.measuredSimulationToWallRatio = +ratio.toFixed(3);
  assert.match(await a.locator('#clock').textContent(), /03:00/);
  const angle = states[0].state.players[0].angle;
  await a.locator('canvas').focus(); await a.keyboard.down('KeyD'); await wait(400); await a.keyboard.up('KeyD');
  await until(() => distance(states[0].state.players[0].angle, angle) > .35, 'half-speed steering');
  result.steps.push('Observed half-speed simulation and three-minute display; A/D remained immediate at the slower velocity.');
  // Real keyboard depth controls, including a held key, aliases, and both end stops.
  await a.keyboard.down('KeyW');
  await until(() => states.every(s => s.state.players[0].radius === 176), 'W reaches middle on all clients');
  await wait(450); assert.equal(states[0].state.players[0].ring, 1, 'holding W hops once'); await a.keyboard.up('KeyW');
  await a.keyboard.press('ArrowUp'); await until(() => states.every(s => s.state.players[0].radius === 112), 'Up reaches inner');
  await a.keyboard.press('KeyW'); await wait(100); assert.equal(states[0].state.players[0].ring, 0);
  await a.keyboard.press('KeyS'); await until(() => states.every(s => s.state.players[0].radius === 176), 'S reaches middle');
  await a.keyboard.press('ArrowDown'); await until(() => states.every(s => s.state.players[0].radius === 240), 'Down reaches outer');
  await a.keyboard.press('KeyS'); await wait(100); assert.equal(states[0].state.players[0].ring, 2);
  await a.keyboard.press('KeyW'); await until(() => states[0].state.players[0].radius === 176, 'return middle');
  await b.locator('canvas').focus(); await b.keyboard.press('KeyW');
  await pages[2].locator('canvas').focus(); await pages[2].keyboard.press('ArrowUp'); await wait(80); await pages[2].keyboard.press('ArrowUp');
  await until(() => states.every(s => s.state.players[2].radius === 112), 'third pilot reaches inner');
  await a.locator('#devtools').evaluate(el => { el.open = true; }); await a.locator('#tunnel').click();
  await until(() => states[0].state.enemies.some(e => e.radius <= 44) && states[0].state.enemies.some(e => e.type === 'skimmer'), 'constructed tunnel threats');
  await a.screenshot({ path: new URL('tunnel-three-depths.png', artifacts).pathname });
  await until(() => states[0].state.enemies.some(e => e.type === 'skimmer' && e.mode === 'patrol') && states[0].state.enemies.some(e => e.type === 'stalker' && e.mode === 'patrol'), 'both inner-rail patrols');
  assert.match(await a.locator('#footer-status').textContent(), /MIDDLE RING/);
  await a.screenshot({ path: new URL('tunnel-patrols.png', artifacts).pathname });
  result.steps.push('W/Up and S/Down moved through all three depths on all four clients; holding hopped once, end stops clamped, and constructed core preview plus both rail patrols were visible.');
  for (const page of pages) { await page.locator('canvas').focus(); await page.keyboard.press('Space'); }
  await until(() => states.every(s => s.state.players.every(p => p.specialUses === 1)), 'four abilities authoritative');
  assert.equal(await a.locator('#ability-name').textContent(), 'SHOCKWAVE');
  assert.notEqual(await a.locator('#ability-state').textContent(), 'READY');
  result.steps.push('Space triggered the four selected abilities; usage and cooldown state agreed on every client.');
  await a.locator('#pause').click(); await until(() => states[3].paused[0], 'shared pause');
  await wait(80); const pausedTime = states[3].state.time; await wait(160); assert.equal(states[3].state.time, pausedTime);
  await a.locator('#resume').click(); await until(() => !states[3].paused.some(Boolean), 'resume');
  await a.locator('#devtools').evaluate(el => { el.open = true; });
  await a.locator('#drill').click(); await until(() => states[0].state.players[1].down, 'constructed crew member down');
  await a.locator('canvas').focus(); await a.keyboard.down('KeyD'); await wait(210); await a.keyboard.up('KeyD');
  await until(() => states[0].state.players[1].rescue > .15, 'rescue progress');
  await a.screenshot({ path: new URL('four-player-rescue.png', artifacts).pathname });
  await until(() => states.every(s => s.state.rescues === 1 && !s.state.players[1].down), 'half-speed rescue completed');
  assert.ok(states[0].state.bullets.some(x => x.owner === 0));
  assert.equal(states[0].state.players[1].ring, 1, 'rescued on middle rail');
  result.steps.push('Constructed positional rescue completed across all four clients while automatic fire continued; pause froze the whole crew.');
  await a.locator('#final').click(); await until(() => states.every(s => s.state.status === 'won'), 'all-four-active victory');
  await a.screenshot({ path: new URL('four-player-victory.png', artifacts).pathname });
  const shared = histories[0].find(x => x.state?.time > .2 && histories.slice(1).every(history => history.some(y => JSON.stringify(y.state) === JSON.stringify(x.state))));
  assert.ok(shared, 'All four clients received identical authoritative state.');
  for (const page of pages) await page.locator('#ready').click();
  await until(() => states.every(s => s.state.status === 'playing' && s.state.players.every(p => p.specialUses === 0 && !p.down)), 'clean four-player retry');
  await a.locator('#wipe').click(); await until(() => states.every(s => s.state.status === 'lost'), 'whole crew loss');
  for (const page of pages) await page.locator('#ready').click();
  await until(() => states.every(s => s.state.status === 'playing'), 'second retry');
  await a.screenshot({ path: new URL('four-player-gameplay.png', artifacts).pathname });
  await contexts[2].close(); await until(() => states[0].state.status === 'interrupted' && states[3].state.status === 'interrupted', 'crew disconnect');
  result.steps.push('Three-depth all-active victory, whole-crew loss, reset ability state on retry, and interruption on one crew disconnect passed.');
  await a.getByRole('button', { name: 'LEAVE ROOM', exact: true }).click(); await Promise.all([contexts[1].close(), contexts[3].close()]);
  await a.setViewportSize({ width: 640, height: 480 }); await settle(a);
  await a.screenshot({ path: new URL('four-player-menu-640x480.png', artifacts).pathname });
  const fit = await a.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
    scrollY, footerBottom: document.querySelector('.footer').getBoundingClientRect().bottom,
    create: document.querySelector('#create').getBoundingClientRect().bottom }));
  assert.equal(fit.scrollY, 0); assert.ok(fit.scrollWidth <= fit.width && fit.create <= fit.height && fit.footerBottom <= fit.height + 1, JSON.stringify(fit));
  await a.setViewportSize({ width: 1440, height: 1000 });
  await a.locator('#create').click(); await until(() => states[0]?.connected[0] && !states[0].state, 'new controlled crew room');
  await a.locator('[data-character="sana"]').click();
  await a.locator('#devtools').evaluate(el => { el.open = true; });
  const popups = [];
  for (let i = 0; i < 3; i++) {
    const event = a.waitForEvent('popup'); await a.locator('#partner').click(); const popup = await event; popups.push(popup);
    popup.on('pageerror', e => errors.push(e.message));
    await until(() => states[0].connected.filter(Boolean).length === i + 2, `controlled pilot ${i + 1} joined`);
  }
  await until(() => states[0].ready.slice(1).every(Boolean), 'controlled crew ready');
  await a.setViewportSize({ width: 640, height: 480 }); await settle(a);
  const selectionFit = await a.evaluate(() => {
    const overlay = document.querySelector('#overlay'), ready = document.querySelector('#ready').getBoundingClientRect();
    return { overflow: overlay.scrollHeight - overlay.clientHeight, readyBottom: ready.bottom,
      visibleDescriptions: [...overlay.querySelectorAll('.character-description')].filter(description => description.getBoundingClientRect().height > 0).length };
  });
  assert.equal(selectionFit.overflow, 0);
  assert.equal(selectionFit.visibleDescriptions, 4);
  assert.ok(selectionFit.readyBottom <= 480);
  await a.screenshot({ path: new URL('four-player-selection-640x480.png', artifacts).pathname });
  await a.locator('#ready').click(); await until(() => states[0].state?.status === 'playing', 'controlled four-player session');
  await wait(350); assert.ok(states[0].state.players.slice(1).every((p, id) => distance(p.angle, -Math.PI / 2 + (id + 1) * Math.PI / 2) > .1));
  await settle(a); await a.screenshot({ path: new URL('four-player-gameplay-640x480.png', artifacts).pathname });
  const gameFit = await a.evaluate(() => ({ footer: document.querySelector('footer').getBoundingClientRect().bottom,
    ability: document.querySelector('#ability').getBoundingClientRect().toJSON(), width: innerWidth, scrollY }));
  assert.equal(gameFit.scrollY, 0); assert.ok(gameFit.footer <= 481 && gameFit.ability.right <= gameFit.width);
  result.steps.push('Three separately launched controlled browser clients filled a four-pilot crew; selection, ability HUD, and gameplay fit 640×480.');
  await Promise.all(popups.map(p => p.close()));
  assert.deepEqual(errors, []); result.browser = await browsers[0].version(); result.errors = errors; result.status = 'passed';
  await writeFile(new URL('browser-check-v03.json', artifacts), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result, null, 2));
} catch (error) {
  result.status = 'failed'; result.error = error.stack; result.errors = errors; result.debug = debug;
  await writeFile(new URL('browser-check-v03.json', artifacts), JSON.stringify(result, null, 2) + '\n'); throw error;
} finally { await Promise.all(browsers.map(b => b.close())); }
