// Run alongside the local game server. The browser uses the real entry point,
// HUD, projection and renderer with a constructed WebSocket snapshot.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { makeMatch, RINGS, T } from '../../src/rules.js';

const label = process.argv[2] || 'candidate';
const url = process.env.COLD_SIGNAL_URL || 'http://127.0.0.1:5182';
const output = resolve(process.env.COLD_SIGNAL_ARTIFACTS || 'artifacts/skill-trials/feel-art');
const rendererPath = process.env.COLD_SIGNAL_RENDERER_PATH;
const chromiumPath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const pulseAngle = -Math.PI / 2;
const state = makeMatch(17, { characters: ['ivo', 'mara', 'rook', 'sana'] });
state.time = 39;
state.elapsed = 78;
state.phase = 'PRESSURE';
state.score = 17350;
for (const [id, placement] of [
  { angle: pulseAngle - .10, ring: 0 },
  { angle: pulseAngle + .05, ring: 0, down: true, rescue: T.rescueSeconds * .5 },
  { angle: .75, ring: 1, ward: 2, wardCharges: 1 },
  { angle: 2.4, ring: 2, rally: 1 },
].entries()) {
  Object.assign(state.players[id], placement, { radius: RINGS[placement.ring], protection: 0 });
}
state.enemies = [
  { type: 'rush', angle: pulseAngle + .26, radius: 30 },
  { type: 'rush', angle: pulseAngle - .61, radius: 178 },
  { type: 'rush', escort: true, angle: pulseAngle - .47, radius: 172 },
  { type: 'flank', angle: -.52, radius: 190 },
  { type: 'suppress', angle: .24, radius: 210 },
  { type: 'skimmer', angle: pulseAngle + .60, radius: RINGS[1], mode: 'patrol' },
  { type: 'stalker', angle: 2.72, radius: RINGS[0], mode: 'patrol' },
];
state.walls = [{ radius: 204, gaps: [{ angle: -1.2, width: .9 }, { angle: 1.76, width: 1.3 }] }];
state.zones = [{ angle: pulseAngle + .22, minRadius: RINGS[0], maxRadius: RINGS[1], width: .46, age: .6, warn: .85 }];
state.bullets = [
  { id: 10, owner: 0, angle: pulseAngle - .10, radius: 55 },
  { id: 11, owner: 2, angle: .75, radius: 97 },
  { id: 12, owner: 3, angle: 2.4, radius: 158 },
];
state.events = [
  { id: 21, type: 'down', angle: pulseAngle + .05, radius: RINGS[0] },
  { id: 22, type: 'kill', angle: pulseAngle + .02, radius: 130, chainDepth: 0 },
  { id: 23, type: 'kill', angle: pulseAngle + .17, radius: 144, chainDepth: 1, fromAngle: pulseAngle + .02, fromRadius: 130 },
  { id: 24, type: 'kill', angle: pulseAngle + .32, radius: 153, chainDepth: 2, fromAngle: pulseAngle + .17, fromRadius: 144 },
  { id: 25, type: 'special', character: 'ivo', angle: -.45, radius: RINGS[0] },
].map(event => ({ ...event, time: state.time }));
state.players[0].specialCooldown = 13.5;
const previous = { ...state, score: 17300, events: [], bullets: state.bullets.map(bullet => ({ ...bullet, radius: bullet.radius + 44 })) };
const config = { count: 4, timeScale: .5 };
const spin = (ws, scene, ready = [false, false, false, false]) => ws.send(JSON.stringify({ type: 'state', code: 'DE1234', state: scene,
  ready, paused: [false, false, false, false], config, characters: state.players.map(p => p.character), connected: [true, true, true, true] }));
const viewports = [{ width: 1440, height: 1000 }, { width: 640, height: 480 }];
const results = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: chromiumPath, headless: true });
try {
  for (const viewport of viewports) for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion });
    try {
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      if (rendererPath) await page.route('**/renderer.js', route => route.fulfill({ path: rendererPath, contentType: 'text/javascript' }));
      let socket;
      await page.routeWebSocket('**/ws', ws => {
        socket = ws;
        ws.send(JSON.stringify({ type: 'welcome', diagnostics: false }));
        ws.onMessage(raw => {
          const request = JSON.parse(String(raw));
          if (request.type === 'create') {
            ws.send(JSON.stringify({ type: 'joined', code: 'DE1234', slot: 0, config }));
            spin(ws, null);
          }
          if (request.type === 'ready') spin(ws, previous);
        });
      });
      await page.goto(url);
      await page.evaluate(async () => {
        const { Renderer } = await import('/renderer.js');
        const render = Renderer.prototype.render;
        const targets = new Set(['P1 YOU', 'P2 / INNER', 'RESCUE 50%']);
        window.sceneProbe = { now: 10000, effectsAge: 0, text: {}, camera: null };
        Renderer.prototype.render = function (state, options) {
          const probe = window.sceneProbe;
          if (!state) return render.call(this, state, options);
          const c = this.ctx, fillText = c.fillText;
          c.fillText = function (text, x, y) {
            if (targets.has(text)) {
              const m = c.measureText(text), t = c.getTransform();
              const [left, right] = [x - m.actualBoundingBoxLeft, x + m.actualBoundingBoxRight].map(px => t.a * px + t.e);
              const [top, bottom] = [y - m.actualBoundingBoxAscent, y + m.actualBoundingBoxDescent].map(py => t.d * py + t.f);
              probe.text[text] = { left, right, top, bottom, cssFontPixels: parseFloat(c.font.replace(/^bold /, '')) * t.a };
            }
            return fillText.apply(this, arguments);
          };
          try { render.call(this, state, { ...options, now: probe.now }); }
          finally { c.fillText = fillText; }
          probe.effectsCount = this.presentation.effects.length;
          probe.effectsAge = this.presentation.effects.length ? this.presentation.time - this.presentation.effects[0].born : 0;
          probe.camera = this.presentation.camera();
        };
      });
      await page.locator('#create').click();
      await page.locator('#ready').click();
      await page.waitForFunction(() => document.querySelector('#score').textContent === '017300' && window.sceneProbe.camera);
      if (await page.locator('#mute').getAttribute('aria-pressed') !== 'true') await page.locator('#mute').click();
      spin(socket, state);
      await page.waitForFunction(() => document.querySelector('#score').textContent === '017350' && window.sceneProbe.effectsCount === 5);
      const report = await page.evaluate(async () => {
        for (let i = 0; i < 4; i++) {
          window.sceneProbe.now += 45;
          await new Promise(requestAnimationFrame);
        }
        const arena = document.querySelector('#arena').getBoundingClientRect();
        return { ...window.sceneProbe, canvas: [arena.width, arena.height], scrollWidth: document.documentElement.scrollWidth,
          footerBottom: document.querySelector('footer').getBoundingClientRect().bottom };
      });
      assert.deepEqual(report.camera, { x: 0, y: 0, rotation: 0, zoom: 1 });
      assert.ok(report.scrollWidth <= viewport.width && report.footerBottom <= viewport.height + 1);
      assert.ok(Math.abs(report.effectsAge - .18) < 1e-9, `expected 0.18s effect age, saw ${report.effectsAge}`);
      assert.deepEqual(errors, []);
      const [helper, down] = [report.text['P1 YOU'], report.text['P2 / INNER']];
      const overlap = Math.max(0, Math.min(helper.right, down.right) - Math.max(helper.left, down.left))
        * Math.max(0, Math.min(helper.bottom, down.bottom) - Math.max(helper.top, down.top));
      if (label === 'baseline') {
        assert.ok(overlap > 0, 'baseline reproduces the helper and rescue label overlap');
      } else {
        assert.equal(overlap, 0, 'helper and rescue text bounds must be separate');
        assert.ok(down.cssFontPixels >= 7.99, 'rescue text has an 8 CSS pixel font floor');
      }
      const filename = `${label}-dense-${viewport.width}-${reducedMotion === 'reduce' ? 'reduced' : 'full'}.png`;
      await page.screenshot({ path: resolve(output, filename) });
      results.push({ filename, viewport: [viewport.width, viewport.height], reducedMotion, overlapSquareCssPixels: overlap, ...report });
    } finally { await context.close(); }
  }
  const report = { label, browser: await browser.version(), source: 'fixed constructed snapshots over a mocked WebSocket; application Canvas, HUD and CSS at actual viewport sizes', results };
  await writeFile(resolve(output, `${label}-dense.json`), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
