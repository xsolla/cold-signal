import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { T, cleanInput, controlledInput, delta, distance, makeMatch, ringName, safeInWall, step } from '../src/rules.js';

const seeds = [17, 73, 123, 773, 17321, 17322, 27182, 31415];
const counts = [2, 4];
const timeScale = .5;
const openingSeconds = 20;
const rescueSeconds = 8;
const simulationStep = T.step * timeScale;
const policies = ['rescue-now', 'wall-first'];
const hash = source => createHash('sha256').update(source).digest('hex');
const round = seconds => +seconds.toFixed(3);

function firstDown(seed, count) {
  const state = makeMatch(seed, { count, timeScale });
  const roster = state.players.map(p => p.character);
  for (let tick = 0; tick < Math.ceil(openingSeconds / simulationStep); tick++) {
    step(state, state.players.map(p => controlledInput(state, p.id)));
    const downs = state.events.filter(event => event.type === 'down');
    if (!downs.length) continue;
    const target = state.players[downs[0].player];
    return { state, target: target.id, opening: { seed, count, roster, stop: state.status === 'lost' ? 'crew-loss-at-first-down' : 'rescue-checkpoint',
      tick: tick + 1, time: round(state.time), stateHash: hash(JSON.stringify(state)), friend: target.id + 1,
      downedPilots: downs.map(event => event.player + 1), ring: ringName(target.ring).toLowerCase(),
      radius: round(target.radius), proximityTime: round(target.rescue),
      activePilots: state.players.filter(p => !p.down).map(p => ({ pilot: p.id + 1, ring: ringName(p.ring).toLowerCase(),
        angleToTarget: round(distance(target.angle, p.angle)), protectionRemaining: round(p.protection),
        rallyRemaining: round(p.rally), wardCharges: p.wardCharges })),
      enemies: state.enemies.length, walls: state.walls.length, warningZones: state.zones.length } };
  }
  return { opening: { seed, count, roster, stop: 'opening-horizon', time: round(state.time) } };
}

function choice(state, pilot, policy) {
  if (pilot.down) return { input: cleanInput() };
  const travel = friend => distance(pilot.angle, friend.angle) + Math.abs(pilot.ring - friend.ring);
  const target = state.players.filter(p => p.down).sort((a, b) => travel(a) - travel(b))[0];
  if (!target) return { input: { ...controlledInput(state, pilot.id), special: false } };
  if (policy === 'wall-first') {
    // Use the displayed wall/rail positions and gaps. Wait until a non-gap wall has crossed both rails.
    const wall = state.walls.filter(w => w.radius >= Math.min(pilot.radius, target.radius) - 12
      && w.radius <= Math.max(pilot.radius, target.radius) + 130 && !safeInWall(w, target.angle))
      .sort((a, b) => a.radius - b.radius)[0];
    if (wall) {
      const gap = wall.gaps.reduce((nearest, item) => distance(pilot.angle, item.angle) < distance(pilot.angle, nearest.angle) ? item : nearest);
      const direction = delta(gap.angle, pilot.angle);
      return { input: { left: direction < -.035, right: direction > .035 }, waitForWall: true };
    }
  }
  const direction = delta(target.angle, pilot.angle);
  return { input: { left: direction < -.035, right: direction > .035,
    inward: target.ring < pilot.ring && !pilot.inwardHeld, outward: target.ring > pilot.ring && !pilot.outwardHeld } };
}

function playWindow(checkpoint, targetId, policy, capture) {
  const state = structuredClone(checkpoint);
  const target = state.players[targetId];
  let maxProgress = target.rescue;
  let firstProgressSeconds = target.rescue > 0 ? 0 : null;
  let progressTicks = 0;
  let interruptions = 0;
  let waitPilotTicks = 0;
  let ticks = 0;
  let cursor = state.eventId;
  const milestones = [];
  const time = () => round(state.time - checkpoint.time);
  while (ticks < Math.ceil(rescueSeconds / simulationStep) && target.down && state.status === 'playing') {
    const choices = state.players.map(p => choice(state, p, policy));
    const before = target.rescue;
    waitPilotTicks += choices.filter(result => result.waitForWall).length;
    step(state, choices.map(result => result.input));
    ticks++;
    if (target.rescue > before || !target.down) {
      progressTicks++;
      maxProgress = Math.max(maxProgress, target.down ? target.rescue : T.rescueSeconds);
      if (firstProgressSeconds === null) {
        firstProgressSeconds = time();
        if (capture) milestones.push({ seconds: time(), type: 'first-target-progress' });
      }
    }
    if (target.down && before > 0 && target.rescue === 0) {
      interruptions++;
      if (capture) milestones.push({ seconds: time(), type: 'target-progress-reset', previousProgressSeconds: round(before) });
    }
    if (capture) {
      for (const event of state.events) {
        if (event.id <= cursor || !['down', 'rescue'].includes(event.type)) continue;
        milestones.push({ seconds: time(), type: event.type, pilot: event.player + 1, radius: round(event.radius) });
      }
      cursor = state.eventId;
    }
  }
  assert.ok(state.players.every((p, id) => p.specialUses === checkpoint.players[id].specialUses));
  const stop = !target.down ? 'target-rescued' : state.status === 'lost' ? 'crew-loss' : 'rescue-horizon';
  return { policy, stop, ticks, seconds: time(), firstProgressSeconds, progressHeldSeconds: round(progressTicks * simulationStep),
    maxProgressSeconds: round(maxProgress), interruptions, wallWaitPilotSeconds: round(waitPilotTicks * simulationStep),
    crewRescues: state.rescues - checkpoint.rescues, activePilotsAtStop: state.players.filter(p => !p.down).length,
    finalStateHash: hash(JSON.stringify(state)), ...(capture ? { milestones } : {}) };
}

const openings = [];
for (const count of counts) for (const seed of seeds) {
  try {
    const { state, target, opening } = firstDown(seed, count);
    const branches = [];
    if (opening.stop === 'rescue-checkpoint') for (const policy of policies) {
      try {
        const { milestones, ...result } = playWindow(state, target, policy, true);
        assert.deepEqual(playWindow(state, target, policy, false), result);
        assert.equal(hash(JSON.stringify(state)), opening.stateHash, 'the shared checkpoint stays fixed');
        branches.push({ ...result, milestones });
      } catch (error) {
        branches.push({ policy, stop: 'crash', error: error.message });
      }
    }
    openings.push({ ...opening, branches });
  } catch (error) {
    openings.push({ seed, count, stop: 'crash', error: error.message, branches: [] });
  }
}

const profiles = counts.map(count => {
  const group = openings.filter(row => row.count === count);
  return { count, openingRuns: group.length, firstDownsWithSurvivors: group.filter(row => row.stop === 'rescue-checkpoint').length,
    openingCrewLosses: group.filter(row => row.stop === 'crew-loss-at-first-down').length,
    openingHorizons: group.filter(row => row.stop === 'opening-horizon').length,
    openingCrashes: group.filter(row => row.stop === 'crash').length,
    policies: policies.map(policy => {
      const branches = group.flatMap(row => row.branches).filter(row => row.policy === policy);
      return { policy, windows: branches.length, withTargetProgress: branches.filter(row => row.firstProgressSeconds != null).length,
        targetRescues: branches.filter(row => row.stop === 'target-rescued').length,
        crewLosses: branches.filter(row => row.stop === 'crew-loss').length,
        rescueHorizons: branches.filter(row => row.stop === 'rescue-horizon').length,
        crashes: branches.filter(row => row.stop === 'crash').length };
    }) };
});
const crashes = profiles.reduce((sum, p) => sum + p.openingCrashes + p.policies.reduce((subtotal, s) => subtotal + s.crashes, 0), 0);
const report = { command: 'node scripts/balance-rescue-windows.mjs', node: process.version,
  rulesSha256: hash(await readFile(new URL('../src/rules.js', import.meta.url))),
  scriptSha256: hash(await readFile(new URL(import.meta.url))),
  seeds, timeScale, fixedElapsedStep: T.step, fixedSimulationStep: simulationStep,
  openingSeconds, rescueSeconds, crashes,
  scope: 'Exploratory natural first-down checkpoints at unchanged rules. Match count and seed in paired branches. Crew size changes encounter scaling.',
  openingPolicy: 'Project controlledInput sampled every fixed step. Natural spawns and hazards, default roster and spawn protection, abilities enabled. Stop at first down or opening horizon.',
  branchPolicies: {
    'rescue-now': 'Each active pilot moves to the nearest downed pilot by angle plus number of rail hops, holds angle and ring to rescue.',
    'wall-first': 'Same, but if a wall within 130 radius units of the farther ship threatens the target angle, hold the current ring and steer toward the nearest visible gap until the wall crosses both relevant positions.' },
  conditions: 'Frozen first-down checkpoint per seed and crew size. No fixture edits, invulnerability or added grants. Branches suppress new Space inputs; opening ability effects can remain active. All active pilots follow the selected branch policy. Lowest event order picks the indexed downed pilot in a tie.',
  stopDefinitions: 'Target-rescued = indexed downed pilot restored, crew-loss = all crew down before indexed pilot restored, rescue-horizon = still playing without restoring that pilot by eight simulation seconds. Crash = caught runner/assertion failure. Every opening and branch has a fixed tick limit.',
  measurements: 'With-target-progress includes positive progress on the checkpoint tick. Progress-held seconds counts advancing ticks; max-progress seconds includes ability boosts. Wall-wait pilot seconds sums time across pilots, so it can exceed branch elapsed time. Earlier success and game loss shorten observation.',
  limits: 'Policies use exact visible positions and steering updates at each fixed step. Wall-first has exact access to current wall positions/gaps, including when partly outside a view; neither branch anticipates local enemies or zones. Match seed/checkpoint is shared before branching, but combat can alter RNG draws after branching. Similar results across related rows are not independent player observations. This batch cannot estimate human success, full-run balance, or an optimal rescue rule.',
  replayChecks: 'Each branch replayed without milestones must match outcome and full final state hash; the original checkpoint hash must remain unchanged. Compare repeated report output for batch determinism.',
  profiles, openings };
console.log(JSON.stringify(report, null, 2));
if (crashes) process.exitCode = 1;
