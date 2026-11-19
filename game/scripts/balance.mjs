// Bounded diagnostic only: imports the same authoritative rules as the live server.
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { makeMatch, step, T, controlledInput, cleanInput, delta, distance } from '../src/rules.js';
const identity = createHash('sha256').update(await readFile(new URL('../src/rules.js', import.meta.url))).digest('hex');
const scenarios = [
  { id: 'wide-window', warning: 3.1, offset: .45 },
  { id: 'closing-window', warning: 1.7, offset: .65 },
  { id: 'active-threat', warning: 0, offset: .8 },
  { id: 'fresh-check', warning: 2.2, offset: -.6 }
];
function policy(state, id, kind) {
  const p = state.players[id], friend = state.players[1 - id];
  if (p.down || !friend.down) return controlledInput(state, id);
  if (kind === 'wait-visible-opening') {
    const blocked = state.zones.some(z => z.age >= z.warn && z.age < z.warn + z.life && distance(z.angle, friend.angle) < z.width / 2);
    if (blocked) return { left: false, right: false, special: false };
  }
  const direction = delta(friend.angle, p.angle);
  return { left: direction < -.04, right: direction > .04, special: false };
}
const rows = [];
for (const scenario of scenarios) for (const kind of ['approach-now', 'wait-visible-opening']) {
  const state = makeMatch(123, { count: 2, timeScale: 1 });
  state.enemyClock = 100; state.wallClock = 100; state.players[0].protection = 0;
  state.players[1].down = true; state.players[1].angle = state.players[0].angle + scenario.offset;
  state.zones.push({ id: state.nextId++, angle: state.players[1].angle, width: .34, age: 0, warn: scenario.warning, life: 1.4 });
  let attempted = false, exposure = 0;
  while (state.time < 6 && state.status === 'playing' && !state.rescues) {
    const near = distance(state.players[0].angle, state.players[1].angle) <= T.rescueArc;
    attempted ||= near; if (near) exposure += T.step;
    step(state, [policy(state, 0, kind), cleanInput()]);
  }
  rows.push({ scenario: scenario.id, cohort: scenario.id === 'fresh-check' ? 'fresh diagnostic check' : 'exploratory diagnostic', policy: kind,
    attempted, rescues: state.rescues, survivorDown: state.players[0].down, exposureSeconds: +exposure.toFixed(3),
    elapsedSeconds: +state.time.toFixed(3), stop: state.status === 'lost' ? 'team-loss' : state.rescues ? 'rescued' : 'diagnostic-horizon' });
}
const result = { rulesSha256: identity, timeStep: T.step, horizonSeconds: 6,
  type: 'Constructed rescue-position fixtures; two-pilot outer-rail diagnostic; no tuning candidate',
  limits: 'Scripted policies are not humans. No population success rate, enjoyment, or normal-run difficulty claim. These short traces exclude natural enemy and wall spawning.', rows };
await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
await writeFile(new URL('../artifacts/balance-fixtures-v03.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
