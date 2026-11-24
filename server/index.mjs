import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, extname } from 'node:path';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { WebSocketServer, WebSocket } from 'ws';
import { makeMatch, step, cleanInput, T, downPlayer, CREW, RINGS } from '../src/rules.js';
import { localRescueAnalytics } from './playtest-analytics.mjs';

const pulseKeys = ['special', 'inward', 'outward'];
const clearPending = room => room.pending.forEach(input => pulseKeys.forEach(key => { input[key] = false; }));
const sharedModules = new Set(['/rules.js', '/bots.js', '/solo-session.js', '/audio-feedback.js']);

export function createGameServer({ diagnostics = false, idleMs = 300_000, onStep = null, analytics = null } = {}) {
  let observe = analytics && ((state, transition) => {
    try { analytics.observe(state, transition, diagnostics); }
    catch {
      observe = null;
      console.warn('Cold Signal analytics observer stopped after an error.');
    }
  });
  const rooms = new Map();
  const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, mode: 'local', rooms: rooms.size }));
    }
    // Convenient native start; Docker serves the same assets from the web container.
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const shared = sharedModules.has(pathname);
      const path = shared ? resolve(webRoot, '../src' + pathname)
        : resolve(webRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!shared && !path.startsWith(webRoot + '/')) throw new Error('not found');
      const body = await readFile(path);
      const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
      res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096 });
  const send = (ws, message) => {
    if (ws?.readyState === WebSocket.OPEN && ws.bufferedAmount < 256_000) ws.send(JSON.stringify(message));
  };
  const broadcast = room => room.clients.forEach(ws => send(ws, { type: 'state',
    code: room.code, state: room.state, ready: room.ready, paused: room.paused,
    config: room.config, characters: room.characters,
    connected: room.clients.map(ws => ws?.readyState === WebSocket.OPEN),
    controls: T, diagnostics }));
  function leave(ws) {
    const room = ws.room;
    if (!room) return;
    ws.room = null;
    room.clients[ws.slot] = null;
    room.ready.fill(false); room.paused.fill(true); clearPending(room);
    if (room.state?.status === 'playing') {
      room.state.status = 'interrupted';
      observe?.(room.state, 'interrupt');
    }
    room.clients.forEach(client => send(client, { type: 'notice', text: 'A crew member disconnected. Leave this room to form a fresh crew.' }));
    broadcast(room);
    if (room.clients.every(client => !client)) rooms.delete(room.code);
  }
  function attach(ws, room, slot) {
    room.clients[slot] = ws; ws.room = room; ws.slot = slot;
    room.lastActivity = Date.now();
    send(ws, { type: 'joined', code: room.code, slot, diagnostics, controls: T, config: room.config });
    broadcast(room);
  }
  wss.on('connection', ws => {
    ws.lastInput = Date.now(); ws.alive = true;
    ws.on('pong', () => { ws.alive = true; });
    send(ws, { type: 'welcome', mode: 'local', version: 3, diagnostics });
    let burstStart = Date.now(), count = 0;
    ws.on('message', raw => {
      const now = Date.now();
      if (now - burstStart > 1000) { burstStart = now; count = 0; }
      if (++count > 90) { ws.close(1008, 'Too many messages'); return; }
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return send(ws, { type: 'error', text: 'Invalid message.' }); }
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'leave') { leave(ws); return; }
      if (msg.type === 'create') {
        if (ws.room) return;
        if (rooms.size >= 100) return send(ws, { type: 'error', text: 'Local server is full.' });
        let code;
        do { code = randomBytes(4).toString('hex').slice(0, 6).toUpperCase(); } while (rooms.has(code));
        const count = msg.count === 2 ? 2 : 4;
        const config = { count, timeScale: msg.timeScale === 1 ? 1 : .5 };
        const room = { code, config, clients: Array(count).fill(null),
          inputs: Array.from({ length: count }, () => cleanInput()), ready: Array(count).fill(false),
          paused: Array(count).fill(false), pending: Array.from({ length: count }, () => cleanInput()), characters: CREW.slice(0, count).map(c => c.id),
          state: null, generation: 0, lastActivity: now, lastTick: performance.now(), accumulator: 0 };
        rooms.set(code, room); return attach(ws, room, 0);
      }
      if (msg.type === 'join') {
        if (ws.room) return;
        const room = rooms.get(String(msg.code || '').trim().toUpperCase());
        if (!room) return send(ws, { type: 'error', text: 'Room not found. Check the code or create a new room.' });
        if (room.state || room.clients.every(Boolean)) return send(ws, { type: 'error', text: 'This room is full or its run has already begun.' });
        return attach(ws, room, room.clients.findIndex(client => !client));
      }
      const room = ws.room;
      if (!room) return;
      room.lastActivity = now; ws.lastInput = now;
      if (msg.type === 'character' && room.state?.status !== 'playing') {
        if (!CREW.some(c => c.id === msg.character)) return send(ws, { type: 'error', text: 'Unknown crew member.' });
        room.characters[ws.slot] = msg.character; room.ready[ws.slot] = false;
      }
      if (msg.type === 'input') {
        const next = cleanInput(msg.input);
        for (const key of pulseKeys) if (next[key] && !room.inputs[ws.slot][key]) room.pending[ws.slot][key] = true;
        room.inputs[ws.slot] = next;
      }
      if (msg.type === 'pause') {
        room.paused[ws.slot] = msg.paused !== false;
        room.inputs[ws.slot] = cleanInput(); room.pending[ws.slot] = cleanInput();
      }
      if (msg.type === 'ready' && room.state?.status !== 'playing') {
        room.ready[ws.slot] = true;
        if (room.clients.every(Boolean) && room.ready.every(Boolean)) {
          room.state = makeMatch(17320 + ++room.generation, { ...room.config, characters: room.characters });
          room.ready.fill(false); room.inputs = room.clients.map(() => cleanInput()); clearPending(room);
          room.paused.fill(false); room.lastTick = performance.now(); room.accumulator = 0;
          observe?.(room.state, 'start');
        }
      }
      if (msg.type === 'diagnostic' && diagnostics && room.state?.status === 'playing') {
        if (msg.action === 'rescue') {
          room.state.enemies = []; room.state.walls = []; room.state.zones = [];
          room.state.enemyClock = 10; room.state.wallClock = 10;
          const partner = room.state.players.find(p => p.id !== ws.slot && !p.down) || room.state.players.find(p => p.id !== ws.slot);
          partner.protection = 0; partner.ward = 0; partner.wardCharges = 0; partner.angle = room.state.players[ws.slot].angle + .45;
          partner.ring = room.state.players[ws.slot].ring; partner.radius = RINGS[partner.ring]; partner.prevRadius = partner.radius;
          downPlayer(room.state, partner.id);
          room.state.zones.push({ id: room.state.nextId++, angle: partner.angle, radius: partner.radius, width: .30, age: 0, warn: 2.4, life: 1 });
        }
        if (msg.action === 'tunnel') {
          const s = room.state, angle = s.players[ws.slot].angle;
          s.enemies = [
            { type: 'rush', angle: angle + .35, radius: 18, preview: 1.8, hp: 1 },
            { type: 'skimmer', angle: angle + 1.1, radius: 160, ring: 1, hp: 1 },
            { type: 'stalker', angle: angle - 1.1, radius: 100, ring: 0, hp: 1 }
          ].map(e => ({ id: s.nextId++, base: e.angle, age: 0, turn: 1, pulse: 1.2, mode: 'approach', preview: 0, ...e }));
          s.walls = []; s.zones = []; s.bullets = []; s.enemyClock = s.wallClock = 12;
          for (const p of s.players) { p.down = false; p.rescue = 0; p.protection = 2; }
        }
        if (msg.action === 'final') {
          room.state.time = 89.5; room.state.elapsed = 89.5 / room.state.timeScale; room.state.enemies = []; room.state.walls = []; room.state.zones = [];
          room.state.enemyClock = 10; room.state.wallClock = 10;
        }
        if (msg.action === 'wipe') for (const p of room.state.players) { p.protection = 0; p.ward = 0; p.wardCharges = 0; downPlayer(room.state, p.id); }
        observe?.(room.state, 'diagnostic');
      }
      broadcast(room);
    });
    ws.on('close', () => leave(ws));
    ws.on('error', () => leave(ws));
  });
  let lastBroadcast = 0;
  const tick = setInterval(() => {
    const now = performance.now();
    for (const room of rooms.values()) {
      const elapsed = Math.min((now - room.lastTick) / 1000, .12); room.lastTick = now;
      for (let i = 0; i < room.clients.length; i++) {
        if (room.clients[i] && Date.now() - room.clients[i].lastInput > 2500) {
          room.paused[i] = true; room.inputs[i] = cleanInput(); room.pending[i] = cleanInput();
        }
      }
      if (room.clients.every(Boolean) && !room.paused.some(Boolean) && room.state?.status === 'playing') {
        room.accumulator += elapsed;
        while (room.accumulator >= T.step) {
          const tickInputs = room.inputs.map((input, i) => ({ ...input, taps: { ...room.pending[i] } }));
          step(room.state, tickInputs); room.accumulator -= T.step; clearPending(room);
          observe?.(room.state, 'step');
          if (onStep) onStep({ seed: room.state.seed, inputs: structuredClone(tickInputs), state: structuredClone(room.state) });
        }
      } else room.accumulator = 0;
      if (now - lastBroadcast >= 45) broadcast(room);
      if (Date.now() - room.lastActivity > idleMs) {
        room.clients.forEach(ws => { if (ws) { send(ws, { type: 'notice', text: 'Room expired. Create a fresh room.' }); ws.close(1000, 'Room expired'); } });
        rooms.delete(room.code);
      }
    }
    if (now - lastBroadcast >= 45) lastBroadcast = now;
  }, 1000 / 60);
  const heartbeat = setInterval(() => {
    wss.clients.forEach(ws => { if (!ws.alive) return ws.terminate(); ws.alive = false; ws.ping(); });
  }, 15_000);
  async function close() {
    clearInterval(tick); clearInterval(heartbeat);
    wss.clients.forEach(ws => ws.terminate());
    await new Promise(resolve => wss.close(resolve));
    await new Promise(resolve => server.close(resolve));
  }
  return { server, rooms, close };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const analytics = localRescueAnalytics();
  const game = createGameServer({ diagnostics: process.argv.includes('--dev-tools') || process.env.DEV_TOOLS === '1', analytics });
  game.server.listen(Number(process.env.PORT || 5176), process.env.HOST || '127.0.0.1', () => {
    console.log(`Cold Signal local server listening on ${game.server.address().port}`);
  });
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, async () => {
    await game.close();
    await analytics?.flush();
    process.exit(0);
  });
}
