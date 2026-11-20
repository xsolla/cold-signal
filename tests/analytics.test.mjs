import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocket } from 'ws';
import { createGameServer } from '../server/index.mjs';
import { createAnalyticsLog, createRescueAnalytics, localRescueAnalytics } from '../server/playtest-analytics.mjs';
import { summarizeRescueStudy } from '../scripts/analytics-report.mjs';
import { makeMatch, step } from '../src/rules.js';

const serialize = records => records.map(record => JSON.stringify(record)).join('\n');

async function until(check) {
  const deadline = performance.now() + 4000;
  while (performance.now() < deadline) {
    const value = check();
    if (value) return value;
    await delay(8);
  }
  throw new Error('Timed out waiting for condition');
}

async function crew(t, options) {
  const game = createGameServer(options);
  game.server.listen(0, '127.0.0.1');
  await once(game.server, 'listening');
  t.after(() => game.close());
  const url = `ws://127.0.0.1:${game.server.address().port}/ws`;

  async function client() {
    const ws = new WebSocket(url);
    const messages = [];
    ws.on('message', data => messages.push(JSON.parse(data)));
    await once(ws, 'open');
    return { ws, messages, send: packet => ws.send(JSON.stringify(packet)) };
  }
  const [a, b] = await Promise.all([client(), client()]);
  a.send({ type: 'create', count: 2, timeScale: 1 });
  const { code } = await until(() => a.messages.find(message => message.type === 'joined'));
  b.send({ type: 'join', code });
  await until(() => b.messages.some(message => message.type === 'joined'));
  return { a, b, room: game.rooms.get(code) };
}

test('committed server actions log a rescue, reset, clean retry and one interruption', async t => {
  const records = [];
  const logDir = await mkdtemp(join(tmpdir(), 'cold-signal-analytics-'));
  t.after(() => rm(logDir, { recursive: true, force: true }));
  const file = join(logDir, 'rescue.jsonl');
  const log = createAnalyticsLog(file);
  const analytics = createRescueAnalytics({ build: 'candidate', cohort: 'study', emit(record) {
    const state = room.state;
    records.push({ record, status: state.status, down: state.players[1].down, progress: state.players[1].rescue });
    log.append(record);
  } });
  const { a, b, room } = await crew(t, { analytics, diagnostics: true });
  const ready = { type: 'ready' };
  a.send({ type: 'character', character: 'ivo' });
  a.send(ready);
  await until(() => room.ready[0]);
  assert.equal(records.length, 0, 'partial readiness has no run start');
  b.send(ready);
  await until(() => room.state?.status === 'playing');
  a.send(ready);
  const scenario = action => a.send({ type: 'diagnostic', action });
  const aim = input => a.send({ type: 'input', input });
  scenario('rescue');
  scenario('rescue');
  await until(() => records.some(entry => entry.record.type === 'rescue_exposed'));

  aim({ right: true });
  await until(() => room.state.players[1].rescue > 0);
  aim({ inward: true });
  await until(() => records.some(entry => entry.record.type === 'rescue_reset'));
  aim({ outward: true, special: true });
  await until(() => room.state.rescues === 1);
  assert.equal(records.filter(entry => entry.record.type === 'rescue_started').length, 1);

  // The second drill repositions a different episode. The tunnel removes it without a rescue.
  scenario('rescue');
  await until(() => room.state.players[1].down);
  scenario('tunnel');
  scenario('tunnel');
  await until(() => !room.state.players[1].down);
  assert.equal(room.state.rescues, 1);
  scenario('wipe');
  await until(() => room.state.status === 'lost');
  const lost = room.state;
  a.send(ready);
  b.send(ready);
  await until(() => room.state !== lost);
  a.send(ready);
  b.send({ type: 'leave' });
  await until(() => room.state.status === 'interrupted');
  b.ws.close();
  await once(b.ws, 'close');
  const raw = records.map(entry => entry.record);
  assert.deepEqual(raw.map(event => event.type), [
    'run_start', 'rescue_exposed', 'rescue_started', 'rescue_reset', 'rescue_completed',
    'rescue_exposed', 'rescue_removed', 'run_end', 'run_start', 'run_end',
  ]);
  assert.ok(records[2].down && records[2].progress > 0, 'accepted progress already exists');
  assert.ok(records[3].down && records[3].progress === 0, 'accepted reset already exists');
  assert.equal(records[4].down, false, 'completion already committed');
  assert.equal(records[7].status, 'lost');
  assert.equal(records[9].status, 'interrupted');
  assert.notEqual(raw[0].run, raw[8].run);
  assert.ok(raw.every(event => event.cohort === 'diagnostic'));
  assert.deepEqual(await log.flush(), { written: 10, dropped: 0 });
  assert.equal((await stat(file)).mode & 0o777, 0o600);
  const stored = await readFile(file, 'utf8');
  assert.deepEqual(stored.trim().split(/\n+/).map(line => JSON.parse(line)), raw);
  const report = summarizeRescueStudy(stored, { build: 'candidate', cohort: 'diagnostic' });
  assert.deepEqual(report.runOutcomes, { starts: 2, won: 0, lost: 1, interrupted: 1, missingEnd: 0 });
  assert.deepEqual(report.opportunities.rescuePerResolved, { numerator: 1, denominator: 1, rate: 1 });
  assert.equal(report.opportunities.diagnosticRemoved, 1);
  assert.equal(summarizeRescueStudy(stored, { build: 'candidate' }).runOutcomes.starts, 0);
});

test('disabled analytics and sink failures leave WebSocket play identical to headless replay', async t => {
  assert.equal(localRescueAnalytics({ COLD_SIGNAL_ANALYTICS_BUILD: 'candidate' }), null);
  const dir = await mkdtemp(join(tmpdir(), 'cold-signal-analytics-failure-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const warnings = [];
  const log = createAnalyticsLog(join(dir, 'missing-parent', 'events.jsonl'), message => warnings.push(message));
  let calls = 0;
  t.mock.method(console, 'warn', message => warnings.push(message));
  assert.equal(localRescueAnalytics({ COLD_SIGNAL_ANALYTICS_FILE: 'public/exposed.jsonl',
    COLD_SIGNAL_ANALYTICS_BUILD: 'candidate', COLD_SIGNAL_ANALYTICS_COHORT: 'study' }), null);
  assert.match(warnings.shift(), /outside public/);
  for (const mode of ['disabled', 'throwing', 'unwritable']) {
    await t.test(mode, async t => {
      const tape = [];
      const emit = mode === 'throwing' ? () => { calls++; throw new Error('sink failed'); } : log.append;
      const analytics = mode === 'disabled' ? null : createRescueAnalytics({ build: 'candidate', cohort: 'automated', emit });
      const { a, b, room } = await crew(t, { analytics, onStep: record => tape.push(record) });
      a.send({ type: 'ready' });
      b.send({ type: 'ready' });
      await until(() => tape.length > 2);
      a.send({ type: 'input', input: { inward: true, special: true } });
      a.send({ type: 'diagnostic', action: 'wipe' });
      await until(() => room.state.players[0].ring === 1 && tape.length >= 20);
      assert.equal(room.state.status, 'playing');
      assert.equal(room.state.players[0].specialUses, 1);
      assert.ok(room.state.players.every(pilot => !pilot.down));
      a.send({ type: 'pause', paused: true });
      await until(() => room.paused[0]);
      const replay = makeMatch(tape[0].seed, { count: 2, timeScale: 1 });
      for (const { inputs, state } of tape) {
        step(replay, inputs);
        assert.deepEqual(state, replay);
      }
    });
  }
  assert.equal(calls, 1, 'a failed observer is disabled after its first exception');
  assert.deepEqual(await log.flush(), { written: 0, dropped: 2 });
  assert.equal(warnings.length, 2, 'each failed path warns once');
});

test('report validates record identities and keeps matched denominators, exclusions and missing ends', () => {
  const records = [];
  function addRun(events, { build = 'candidate', cohort = 'study', crew = 4, pace = .5 } = {}) {
    const run = randomUUID();
    const fields = [{ type: 'run_start', crew, pace }, ...events];
    const rows = fields.map((event, i) => ({ schema: 1, build, cohort, run, seq: i + 1, ...event }));
    records.push(...rows);
    return rows;
  }
  const expose = ring => ({ type: 'rescue_exposed', ring });
  const start = { type: 'rescue_started', opportunity: 2 };
  const end = outcome => ({ type: 'run_end', outcome });
  const [, firstExposure] = addRun([
    expose(2), start, { type: 'rescue_reset', opportunity: 2 }, { type: 'rescue_completed', opportunity: 2 }, expose(2), end('lost'),
  ]);
  // Reordered JSON keys do not alter identity or make this a new event.
  records.push({ ring: firstExposure.ring, ...firstExposure });
  addRun([expose(1), start, end('interrupted')], { crew: 2, pace: 1 });
  addRun([expose(1)], { crew: 2, pace: 1 });
  addRun([end('won')]);
  addRun([expose(0), end('lost')], { build: 'other-build' });
  addRun([expose(1), end('lost')], { cohort: 'automated' });
  addRun([expose(2), { type: 'rescue_removed', opportunity: 2 }, end('won')], { cohort: 'diagnostic' });
  const [, conflict] = addRun([expose(0), end('lost')]);
  records.push({ ...conflict, ring: 1 });
  addRun([{ ...expose(0), ring: 'outer' }, end('lost')]);
  addRun([{ ...expose(2), cohort: 'automated' }, end('lost')]);
  addRun([expose(2), { type: 'rescue_completed', opportunity: 2 }, end('won')]);
  records.push({ ...firstExposure, type: ['rescue_exposed'] });
  const data = serialize(records) + '\n{"incomplete":\n';
  const report = summarizeRescueStudy(data, { build: 'candidate' });
  assert.deepEqual(report.logHealth, { duplicateRows: 1, conflictingIds: 1, malformedRows: 3, invalidRuns: 4 });
  assert.deepEqual(report.runOutcomes, { starts: 4, won: 1, lost: 1, interrupted: 1, missingEnd: 1 });
  const { opportunities } = report;
  assert.equal(opportunities.interrupted, 1);
  assert.equal(opportunities.missingEnd, 1);
  assert.deepEqual(opportunities.startPerEligible, { numerator: 2, denominator: 4, rate: .5 });
  assert.deepEqual(opportunities.resetPerStarted, { numerator: 1, denominator: 2, rate: .5 });
  assert.deepEqual(opportunities.rescuePerResolved, { numerator: 1, denominator: 2, rate: .5 });
  assert.deepEqual(report.byCrewPaceRing.map(group => [group.crew, group.pace, group.ring, group.eligible]), [[2, 1, 1, 2], [4, .5, 2, 2]]);
  assert.equal(summarizeRescueStudy(data, { build: 'candidate', cohort: 'automated' }).opportunities.eligible, 1);
  assert.equal(summarizeRescueStudy(data, { build: 'candidate', cohort: 'diagnostic' }).opportunities.diagnosticRemoved, 1);
  assert.equal(summarizeRescueStudy(data, { build: 'other-build' }).opportunities.eligible, 1);
  assert.deepEqual(summarizeRescueStudy(data, { build: 'absent' }).opportunities.startPerEligible,
    { numerator: 0, denominator: 0, rate: null });
});
