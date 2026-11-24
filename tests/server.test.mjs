import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { createGameServer } from '../server/index.mjs';
import { characterById, makeMatch, step } from '../src/rules.js';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, timeout = 2500) { const end = Date.now() + timeout; while (Date.now() < end) { const value = fn(); if (value) return value; await sleep(10); } throw new Error('Condition timed out'); }
async function client(url) {
  const ws = new WebSocket(url), messages = [];
  ws.on('message', data => messages.push(JSON.parse(data.toString())));
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  return { ws, messages, send: data => ws.send(JSON.stringify(data)), latest: () => messages.filter(m => m.type === 'state').at(-1) };
}
async function setup(t, diagnostics = true, onStep = null, config = { count: 2, timeScale: 1 }) {
  const game = createGameServer({ diagnostics, onStep });
  await new Promise(r => game.server.listen(0, '127.0.0.1', r));
  t.after(() => game.close());
  const url = `ws://127.0.0.1:${game.server.address().port}/ws`;
  const a = await client(url), b = await client(url);
  a.send({ type: 'create', ...config }); const joined = await until(() => a.messages.find(m => m.type === 'joined'));
  b.send({ type: 'join', code: joined.code }); await until(() => b.messages.find(m => m.type === 'joined'));
  const clients = [a, b];
  for (let i = 2; i < config.count; i++) {
    const next = await client(url); next.send({ type: 'join', code: joined.code });
    await until(() => next.messages.find(m => m.type === 'joined')); clients.push(next);
  }
  return { game, a, b, clients, url, code: joined.code };
}

test('two real sockets join one room; invalid/full rooms are recoverable', async t => {
  const { a, b, url, code } = await setup(t);
  const c = await client(url);
  c.send({ type: 'join', code: 'XXXXXX' }); await until(() => c.messages.some(m => m.type === 'error' && /not found/.test(m.text)));
  c.send({ type: 'join', code }); await until(() => c.messages.some(m => m.type === 'error' && /full/.test(m.text)));
  assert.deepEqual(a.latest().connected, [true, true]); assert.equal(b.latest().code, code);
});
test('ready, shared movement, pause, wipe, and retry use authoritative room state', async t => {
  const { game, a, b, code } = await setup(t);
  a.send({ type: 'ready' }); await sleep(40); assert.equal(a.latest().state, null);
  b.send({ type: 'ready' }); await until(() => a.latest()?.state?.status === 'playing');
  const start = a.latest().state.players[0].angle;
  a.send({ type: 'input', input: { right: true, shoot: true } });
  await until(() => a.latest().state.players[0].angle !== start);
  a.send({ type: 'pause', paused: true }); await until(() => b.latest().paused[0]);
  const time = b.latest().state.time; await sleep(120); assert.equal(b.latest().state.time, time);
  a.send({ type: 'pause', paused: false }); a.send({ type: 'input', input: null });
  await until(() => b.latest().state.time > time);
  a.send({ type: 'diagnostic', action: 'wipe' }); await until(() => b.latest()?.state?.status === 'lost');
  a.send({ type: 'ready' }); b.send({ type: 'ready' }); await until(() => b.latest()?.state?.status === 'playing');
  const state = game.rooms.get(code).state;
  assert.equal(state.rescues, 0); assert.equal(state.score, 0); assert.ok(state.players.every(p => !p.down && p.rescue === 0));
});
test('disconnect interrupts the run instead of silently playing on', async t => {
  const { a, b } = await setup(t); a.send({ type: 'ready' }); b.send({ type: 'ready' });
  await until(() => a.latest()?.state?.status === 'playing'); b.ws.close();
  await until(() => a.latest()?.state?.status === 'interrupted');
  assert.equal(a.latest().connected[1], false);
});
test('diagnostic commands are ineffective when server test tools are disabled', async t => {
  const { a, b } = await setup(t, false); a.send({ type: 'ready' }); b.send({ type: 'ready' });
  await until(() => a.latest()?.state?.status === 'playing');
  a.send({ type: 'diagnostic', action: 'wipe' }); await sleep(80);
  assert.equal(a.latest().state.status, 'playing'); assert.ok(a.latest().state.players.every(p => !p.down));
});


test('a recorded live server input tape agrees with headless replay at every tick', async t => {
  const tape = [];
  const { a, b } = await setup(t, false, record => tape.push(record));
  a.send({ type: 'ready' }); b.send({ type: 'ready' });
  await until(() => tape.length > 2);
  a.send({ type: 'input', input: { right: true, inward: true } });
  a.send({ type: 'input', input: { right: true } });
  b.send({ type: 'input', input: { special: true } });
  b.send({ type: 'input', input: {} });
  await sleep(650);
  a.send({ type: 'input', input: { left: true, shoot: true } });
  b.send({ type: 'input', input: { right: true, shoot: true } });
  await sleep(650);
  a.send({ type: 'pause', paused: true });
  await until(() => a.latest().paused[0]);
  const replay = makeMatch(tape[0].seed, { count: tape[0].state.players.length, timeScale: tape[0].state.timeScale, characters: tape[0].state.players.map(p => p.character) });
  for (const record of tape) { step(replay, record.inputs); assert.deepEqual(replay, record.state); }
  assert.ok(tape.length > 65);
  assert.ok(replay.nextId > 1, 'replay covers spawned enemies and projectiles');
  assert.equal(replay.players[0].ring, 1, 'replay includes a queued depth tap');
  assert.ok(tape.some(record => record.inputs[1].taps.special), 'replay includes a queued ability tap');
  assert.equal(replay.players[1].specialUses, 0, 'the uncharged tap cannot cast');
});

test('four sockets select characters, all ready, cast abilities, and reject a fifth pilot', async t => {
  const { game, clients, url, code } = await setup(t, true, null, { count: 4, timeScale: .5 });
  const fifth = await client(url); fifth.send({ type: 'join', code: clients[0].latest().code });
  await until(() => fifth.messages.some(m => m.type === 'error' && /full/.test(m.text)));
  const choices = ['rook', 'sana', 'ivo', 'mara'];
  clients.forEach((c, i) => c.send({ type: 'character', character: choices[i] }));
  await until(() => JSON.stringify(clients[0].latest().characters) === JSON.stringify(choices));
  clients.slice(0, 3).forEach(c => c.send({ type: 'ready' })); await sleep(70);
  assert.equal(clients[0].latest().state, null);
  clients[3].send({ type: 'ready' }); await until(() => clients.every(c => c.latest()?.state?.status === 'playing'));
  assert.deepEqual(clients[0].latest().state.players.map(p => p.character), choices);
  assert.equal(clients[0].latest().state.timeScale, .5);
  const state = game.rooms.get(code).state;
  state.players[3].powerCharge = characterById(state.players[3].character).powerKills;
  clients[3].send({ type: 'input', input: { special: true, character: 'ivo' } });
  clients[3].send({ type: 'input', input: { special: false } });
  await until(() => clients.every(c => c.latest().state.players[3].specialUses === 1));
  assert.equal(clients[0].latest().state.players[3].character, 'mara');
  assert.ok(clients.every(c => c.latest().state.players[3].overdriveUntil === state.players[3].overdriveUntil));
  clients[2].send({ type: 'pause', paused: true }); await until(() => clients[0].latest().paused[2]);
  const clock = clients[0].latest().state.time; await sleep(100); assert.equal(clients[3].latest().state.time, clock);
  clients[2].send({ type: 'pause', paused: false }); clients[2].ws.close();
  await until(() => clients[0].latest().state.status === 'interrupted' && clients[3].latest().state.status === 'interrupted');
});

test('brief depth key taps reach all four clients and retry resets everyone to the outer rail', async t => {
  const { clients } = await setup(t, true, null, { count: 4, timeScale: .5 });
  clients.forEach(c => c.send({ type: 'ready' })); await until(() => clients.every(c => c.latest()?.state?.status === 'playing'));
  clients[0].send({ type: 'input', input: { inward: true } });
  await until(() => clients.every(c => c.latest().state.players[0].ring === 1 && c.latest().state.players[0].radius === 176));
  clients[0].send({ type: 'input', input: {} }); clients[0].send({ type: 'input', input: { inward: true } }); clients[0].send({ type: 'input', input: {} });
  await until(() => clients.every(c => c.latest().state.players[0].radius === 112));
  clients[0].send({ type: 'input', input: { outward: true } }); clients[0].send({ type: 'input', input: {} });
  await until(() => clients.every(c => c.latest().state.players[0].radius === 176));
  clients[0].send({ type: 'diagnostic', action: 'wipe' }); await until(() => clients.every(c => c.latest().state.status === 'lost'));
  clients.forEach(c => c.send({ type: 'ready' }));
  await until(() => clients.every(c => c.latest().state.status === 'playing' && c.latest().state.players.every(p => p.ring === 2 && p.radius === 240)));
});
