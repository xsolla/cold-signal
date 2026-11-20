// Bounded diagnostic over the actual rules, not a human difficulty/fun estimate.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as candidate from '../src/rules.js';

const baselineCommit = '222834b';
const baselineSource = await readFile(new URL('../docs/baselines/pre-arcade-rules.mjs', import.meta.url), 'utf8');
const baseline = await import(`data:text/javascript;base64,${Buffer.from(baselineSource).toString('base64')}`);
const candidateSource = await readFile(new URL('../src/rules.js', import.meta.url));
const sha = source => createHash('sha256').update(source).digest('hex');
const seeds = [17, 73, 123, 773];

function firing(rules) {
  const s = rules.makeMatch(17, { count: 4, timeScale: 1 });
  s.enemyClock = s.wallClock = 1000;
  for (let i = 0; i < 300; i++) rules.step(s, []);
  return { realSeconds: 5, shots: s.nextId - 1, teamShotsPerSecond: (s.nextId - 1) / 5 };
}
function pressure(rules, seed) {
  const s = rules.makeMatch(seed, { count: 4, timeScale: 1 }), seen = new Set();
  s.wallClock = 1000; s.players.forEach(p => { p.protection = p.cooldown = 1000; });
  let peak = 0;
  for (let i = 0; i < 1200; i++) {
    rules.step(s, []); s.enemies.forEach(e => seen.add(e.id)); peak = Math.max(peak, s.enemies.length);
  }
  return { seed, simulationSeconds: 20, spawned: seen.size, peakLiveEnemies: peak };
}
function controlledTrace(rules, seed) {
  const s = rules.makeMatch(seed, { count: 4, timeScale: 1 });
  let cursor = 0, chainKills = 0, peak = 0;
  for (let i = 0; i < 5401 && s.status === 'playing'; i++) {
    rules.step(s, s.players.map(p => rules.controlledInput(s, p.id)));
    peak = Math.max(peak, s.enemies.length);
    for (const event of s.events) if (event.id > cursor) {
      cursor = event.id; if (event.type === 'kill' && event.chainDepth > 0) chainKills++;
    }
  }
  return { seed, stop: s.status, simulationSeconds: +s.time.toFixed(3), score: s.score,
    kills: s.players.reduce((sum, p) => sum + p.kills, 0), chainKills, rescues: s.rescues, peakLiveEnemies: peak };
}
function inspect(rules) {
  return { firing: firing(rules), pressureFixtures: seeds.map(seed => pressure(rules, seed)),
    controlledTraces: seeds.map(seed => controlledTrace(rules, seed)) };
}
console.log(JSON.stringify({
  type: 'Matched deterministic pacing diagnostics over authoritative JavaScript rules',
  baselineCommit, baselineRulesSha256: sha(baselineSource), candidateRulesSha256: sha(candidateSource),
  timeStep: candidate.T.step, seeds,
  limits: 'Firing excludes threats; pressure grants invulnerability and disables firing/walls. Controlled traces use the existing diagnostic policy, not humans. No population win rate, enjoyment, comfort or final balance claim.',
  baseline: inspect(baseline), candidate: inspect(candidate),
}, null, 2));
