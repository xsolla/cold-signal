import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const mode = process.argv[2] || 'candidate';
assert.ok(['baseline', 'candidate'].includes(mode), 'Choose baseline or candidate.');
const base = process.env.COLD_SIGNAL_URL || 'http://127.0.0.1:5187';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifacts = new URL('../artifacts/skill-trials/ui-ux/', import.meta.url);
const desktop = { width: 1440, height: 1000 }, compact = { width: 640, height: 480 };
const result = { mode, base, deviceScale: 1, steps: [], layouts: {}, errors: [] };
const browser = await chromium.launch({ executablePath, headless: true });
result.browser = browser.version();
await mkdir(artifacts, { recursive: true });

async function pilot(viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const messages = { received: {}, sent: [] };
  page.on('pageerror', e => result.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') result.errors.push(m.text()); });
  page.on('websocket', ws => {
    ws.on('framereceived', frame => {
      const message = JSON.parse(String(frame.payload));
      messages.received[message.type] = message;
    });
    ws.on('framesent', frame => {
      const message = JSON.parse(String(frame.payload));
      if (message.type !== 'input' || Object.values(message.input).some(Boolean)) messages.sent.push(message);
    });
  });
  await page.addInitScript(() => {
    window.audioContexts = [];
    const NativeAudioContext = window.AudioContext;
    if (NativeAudioContext) window.AudioContext = class extends NativeAudioContext {
      constructor(...args) { super(...args); window.audioContexts.push(this); }
    };
  });
  await page.goto(base);
  await page.getByText('Room server ready. Bring your crew.').waitFor();
  return { context, page, messages };
}
async function until(condition, label, timeout = 6000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error(`Timed out: ${label}`);
}
const sel = (page, id) => page.locator(`#${id}`);
const choice = (page, name) => page.locator(`[data-character="${name}"]`);
const active = page => page.evaluate(() => document.activeElement.dataset.character || document.activeElement.id || document.activeElement.tagName);
const checked = page => page.locator('[role="radio"][aria-checked="true"]').getAttribute('data-character');
const sound = page => sel(page, 'mute').textContent();
const contextStates = page => page.evaluate(() => window.audioContexts.map(context => context.state));

async function capture(page, label, controls) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const metrics = await page.evaluate(controls => {
    const stage = document.querySelector('.stage');
    const overlay = document.querySelector('#overlay');
    const rect = id => {
      const el = document.querySelector(id), bounds = el.getBoundingClientRect();
      const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      return { top: Math.round(bounds.top), bottom: Math.round(bounds.bottom), width: Math.round(bounds.width),
        height: Math.round(bounds.height), hit: el.contains(hit) };
    };
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollY,
      footerBottom: Math.round(document.querySelector('footer').getBoundingClientRect().bottom),
      stageBottom: Math.round(stage.getBoundingClientRect().bottom),
      overlayOverflow: overlay.hidden ? 0 : overlay.scrollHeight - overlay.clientHeight,
      overlayHeight: Math.round(overlay.getBoundingClientRect().height),
      controls: Object.fromEntries(controls.map(id => [id, rect(id)])) };
  }, controls);
  result.layouts[label] = metrics;
  await page.screenshot({ path: new URL(`${mode}-${label}.jpg`, artifacts).pathname, type: 'jpeg', quality: 86 });
  assert.equal(metrics.scrollY, 0, label);
  assert.equal(metrics.scrollWidth, metrics.width, label);
  assert.ok(metrics.footerBottom <= metrics.height + 1, `${label} footer`);
  if (mode === 'candidate') {
    assert.equal(metrics.overlayOverflow, 0, `${label} overlay scroll`);
    for (const [id, rect] of Object.entries(metrics.controls)) {
      assert.ok(rect.top >= 0 && rect.bottom <= metrics.height && rect.height > 0 && rect.hit, `${label} ${id}: ${JSON.stringify(rect)}`);
    }
  }
}

// Exercise Chromium’s pointer hit-testing before choosing the option.
async function mouseSelect(page, id, value) {
  const bounds = await sel(page, id).boundingBox();
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  const pointerFocused = await active(page) === id;
  await page.keyboard.press('Escape');
  await sel(page, id).selectOption(value);
  return pointerFocused;
}

try {
  const host = await pilot(desktop), peer = await pilot(compact), extra = await pilot(desktop);
  const a = host.page, b = peer.page, c = extra.page;
  const state = () => host.messages.received.state;
  await capture(a, 'entry-1440', ['#crew-count', '#pace', '#create', '#room-input', '#join']);
  await a.setViewportSize(compact);
  await capture(a, 'entry-640', ['#crew-count', '#pace', '#create', '#room-input', '#join']);
  const pointer = {
    crew: await mouseSelect(a, 'crew-count', '2'),
    pace: await mouseSelect(a, 'pace', '1')
  };
  result.entrySelectPointerFocus = pointer;
  assert.deepEqual(pointer, { crew: mode === 'candidate', pace: mode === 'candidate' });
  assert.equal(await sel(a, 'duration-label').textContent(), '90 SEC · 1×');
  assert.equal(await sel(a, 'size-label').textContent(), '2 PLAYERS');

  await sel(a, 'mute').click();
  await until(async () => (await contextStates(a)).includes('running'), 'explicit sound on');
  await a.keyboard.press('Space');
  await until(async () => (await contextStates(a)).includes('suspended'), 'explicit sound off via keyboard');
  await sel(a, 'motion').focus();
  await a.keyboard.press('Space');
  assert.equal(await sel(a, 'motion').getAttribute('aria-pressed'), 'true');
  await sel(a, 'create').click();
  await until(() => state()?.code, 'created room');
  await a.getByText(/1\/2 PILOTS/).waitFor();
  const code = state().code;
  assert.deepEqual(state().config, { count: 2, timeScale: 1 });
  result.initialRoomFocus = await active(a);
  result.audioAfterCreate = await sound(a);
  assert.equal(result.audioAfterCreate, mode === 'candidate' ? 'SOUND OFF' : 'SOUND ON');
  assert.equal(result.initialRoomFocus, mode === 'candidate' ? 'mara' : 'arena');

  await choice(a, 'mara').focus();
  await a.keyboard.press('ArrowRight');
  if (mode === 'candidate') await until(async () => await checked(a) === 'ivo', 'arrow selection');
  result.arrowSelection = { active: await active(a), checked: await checked(a) };
  assert.deepEqual(result.arrowSelection, mode === 'candidate' ? { active: 'ivo', checked: 'ivo' } : { active: 'mara', checked: 'mara' });
  if (mode === 'baseline') { await a.keyboard.press('Tab'); assert.equal(await active(a), 'ivo'); }
  await a.keyboard.press('Space');
  await until(async () => await checked(a) === 'ivo', 'Space selection');
  const description = choice(a, 'ivo').locator('.character-description');
  result.compactDescriptionVisible = await description.isVisible();
  assert.equal(result.compactDescriptionVisible, mode === 'candidate');
  if (mode === 'candidate') {
    result.compactDescriptionFontSize = await description.evaluate(e => parseFloat(getComputedStyle(e).fontSize));
    assert.ok(result.compactDescriptionFontSize >= 11);
    await a.keyboard.press('Tab');
    assert.equal(await active(a), 'ready');
  }
  await capture(a, 'lobby-640', ['#ready', '[data-character="ivo"]', '#leave']);
  await a.setViewportSize(desktop);
  assert.equal(await checked(a), 'ivo');
  assert.equal(await active(a), mode === 'candidate' ? 'ready' : 'ivo');
  await capture(a, 'lobby-1440', ['#ready', '[data-character="ivo"]', '#leave']);
  await a.setViewportSize(compact);

  await sel(a, 'ready').focus();
  await a.keyboard.press('Space');
  await until(() => state().ready[0], 'ready while crew is missing');
  assert.equal(state().state, null);
  await capture(a, 'waiting-640', ['#ready', '[data-character="ivo"]']);
  result.waitingReadyFocus = await active(a);
  if (mode === 'candidate') {
    assert.equal(result.waitingReadyFocus, 'ready');
    assert.equal(await sel(a, 'ready').getAttribute('aria-disabled'), 'true');
    const readyCount = host.messages.sent.filter(m => m.type === 'ready').length;
    await a.keyboard.press('Space');
    await a.waitForTimeout(100);
    assert.equal(host.messages.sent.filter(m => m.type === 'ready').length, readyCount);
    await a.keyboard.press('Shift+Tab');
    assert.equal(await active(a), 'ivo');
  }
  await choice(a, 'sana').click();
  await until(() => state().characters[0] === 'sana' && !state().ready[0], 'changing pilot withdraws readiness');
  await sel(b, 'room-input').fill('XXXXXX');
  await b.keyboard.press('Enter');
  await b.getByText(/Room not found/).waitFor();
  assert.equal(await active(b), 'room-input');
  await capture(b, 'room-error-640', ['#room-input', '#join']);
  await sel(b, 'room-input').fill(code.toLowerCase());
  await b.keyboard.press('Enter');
  await until(() => state().connected.every(Boolean), 'peer joined via corrected code');
  await sel(c, 'room-input').fill(code);
  await sel(c, 'join').click();
  await c.getByText(/This room is full/).waitFor();
  await extra.context.close();
  await choice(b, 'sana').click();
  await until(() => state().characters.every(c => c === 'sana'), 'duplicate picks allowed');
  await sel(a, 'motion').focus();
  if (mode === 'candidate') {
    await a.keyboard.press('Space');
    assert.equal(await active(a), 'motion');
    await a.keyboard.press('Space');
  }
  await sel(a, 'ready').click();
  result.audioAfterReady = await sound(a);
  assert.equal(result.audioAfterReady, mode === 'candidate' ? 'SOUND OFF' : 'SOUND ON');
  await sel(b, 'ready').click();
  await until(() => state().state?.status === 'playing', 'started run');
  assert.equal(await active(a), 'arena');
  assert.equal(await sel(a, 'motion').getAttribute('aria-pressed'), 'true');
  if (mode === 'candidate') assert.deepEqual(await contextStates(a), ['suspended']);
  await a.keyboard.press('ArrowUp');
  await until(() => state().state.players[0].ring === 1, 'keyboard hop');
  if (mode === 'candidate') {
    await sel(a, 'devtools').evaluate(details => { details.open = true; });
    await sel(a, 'charge').click();
    await sel(a, 'ability-state').filter({ hasText: 'SPACE READY' }).waitFor();
    await sel(a, 'arena').focus();
    await sel(a, 'devtools').evaluate(details => { details.open = false; });
  }
  await a.keyboard.press('Space');
  await until(() => state().state.players[0].specialUses === 1, 'keyboard ability');
  assert.equal(await sel(a, 'ability-name').textContent(), 'RALLY');
  await capture(a, 'run-640', ['#pause', '#ability']);

  await a.keyboard.press('Escape');
  await until(() => state().paused[0], 'local Escape paused everyone');
  await sel(a, 'resume').waitFor();
  await b.getByText(/Waiting for a crew member/).waitFor();
  result.pausedFocus = await active(a);
  result.peerPausedFocus = await active(b);
  if (mode === 'candidate') {
    assert.equal(result.pausedFocus, 'resume');
    assert.equal(result.peerPausedFocus, 'overlay-title');
  }
  const elapsed = state().state.time;
  const inputCount = host.messages.sent.filter(m => m.type === 'input').length;
  await a.keyboard.press('ArrowUp');
  await new Promise(resolve => setTimeout(resolve, 125));
  assert.equal(state().state.time, elapsed);
  result.activeInputWhilePaused = host.messages.sent.filter(m => m.type === 'input').length - inputCount;
  assert.equal(result.activeInputWhilePaused, mode === 'candidate' ? 0 : 1);
  await capture(a, 'paused-640', ['#resume']);
  await sel(a, 'resume').focus();
  await a.keyboard.press('Space');
  await until(() => !state().paused.some(Boolean) && state().state.time > elapsed, 'Space on Resume resumes run');
  assert.equal(await active(a), 'arena');
  assert.equal(state().state.players[0].specialUses, 1);
  assert.equal(state().state.players[0].ring, 1);

  // These existing dev-tool buttons drive constructed authoritative outcomes.
  await sel(a, 'devtools').locator('summary').click();
  await sel(a, 'final').click();
  await until(() => state().state.status === 'won', 'constructed clear');
  await sel(a, 'ready').waitFor();
  result.clearFocus = await active(a);
  if (mode === 'candidate') assert.equal(result.clearFocus, 'sana');
  await sel(a, 'devtools').locator('summary').click();
  await a.evaluate(() => window.scrollTo(0, 0));
  await capture(a, 'clear-640', ['#ready', '[data-character="sana"]']);
  await sel(a, 'ready').click();
  await sel(b, 'ready').click();
  await until(() => state().state.status === 'playing' && state().state.players.every(p => !p.specialUses), 'retry resets abilities');
  result.audioAfterRetry = await sound(a);
  assert.equal(result.audioAfterRetry, mode === 'candidate' ? 'SOUND OFF' : 'SOUND ON');
  assert.equal(await sel(a, 'motion').getAttribute('aria-pressed'), 'true');
  if (mode === 'candidate') assert.deepEqual(await contextStates(a), ['suspended']);
  await sel(a, 'devtools').locator('summary').click();
  await sel(a, 'wipe').click();
  await until(() => state().state.status === 'lost', 'constructed wipe');
  await sel(a, 'devtools').locator('summary').click();
  await a.evaluate(() => window.scrollTo(0, 0));
  await capture(a, 'wipe-640', ['#ready', '[data-character="sana"]']);
  await sel(a, 'ready').click();
  await sel(b, 'ready').click();
  await until(() => state().state.status === 'playing', 'retry after wipe');

  await peer.context.close();
  await until(() => state().state.status === 'interrupted', 'peer disconnect');
  await a.getByText('CONNECTION INTERRUPTED').waitFor();
  result.interruptFocus = await active(a);
  const leave = mode === 'candidate' ? 'leave-interrupted' : 'leave';
  await capture(a, 'interrupted-640', [`#${leave}`]);
  if (mode === 'candidate') assert.equal(result.interruptFocus, leave);
  await sel(a, leave).focus();
  await a.keyboard.press('Space');
  await sel(a, 'create').waitFor();
  if (mode === 'candidate') assert.equal(await active(a), 'create');
  assert.equal(await sel(a, 'crew-count').inputValue(), '2');
  assert.equal(await sel(a, 'pace').inputValue(), '1');
  assert.equal(await sel(a, 'motion').getAttribute('aria-pressed'), 'true');
  await a.keyboard.press('Enter');
  if (mode === 'baseline') await sel(a, 'create').click();
  await until(() => state().code !== code && state().state === null, 'fresh room after interruption');
  assert.deepEqual(result.errors, []);
  result.steps.push('Entry selects, invalid and full room responses, radio and Ready flow, resize, explicit settings, real keyboard inputs, shared pause, constructed clear and wipe, retries, and interruption recovery exercised.');
  result.status = 'passed';
} catch (error) {
  result.status = 'failed';
  result.error = error.stack;
  throw error;
} finally {
  await writeFile(new URL(`${mode}.json`, artifacts), JSON.stringify(result, null, 2) + '\n');
  await browser.close();
}
