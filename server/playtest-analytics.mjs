import { randomUUID } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { open } from 'node:fs/promises';
import { basename, dirname, resolve, sep } from 'node:path';

export const analyticsSchema = 1;
export const analyticsCohorts = Object.freeze(['study', 'automated', 'diagnostic']);
export const isAnalyticsBuild = value => typeof value === 'string' && /^[a-zA-Z0-9][-._+a-zA-Z0-9]{0,63}$/.test(value);

export function createRescueAnalytics({ build, cohort, emit }) {
  if (!isAnalyticsBuild(build)) throw new Error('Set COLD_SIGNAL_ANALYTICS_BUILD to a build label or revision.');
  if (!analyticsCohorts.includes(cohort)) throw new Error('Set COLD_SIGNAL_ANALYTICS_COHORT to study, automated or diagnostic.');
  const runs = new WeakMap();

  function record(run, type, fields = {}) {
    return emit({ schema: analyticsSchema, build, cohort: run.cohort, run: run.id, seq: ++run.seq, type, ...fields });
  }

  return {
    observe(state, transition, diagnostics) {
      if (transition === 'start') {
        if (runs.has(state)) return;
        const run = { id: randomUUID(), seq: 0, cohort: diagnostics ? 'diagnostic' : cohort,
          open: new Map(), ended: false };
        runs.set(state, run);
        record(run, 'run_start', { crew: state.players.length, pace: state.timeScale });
        return;
      }

      const run = runs.get(state);
      if (!run || run.ended) return;
      const survivor = state.players.some(pilot => !pilot.down);
      for (const pilot of state.players) {
        let opportunity = run.open.get(pilot.id);
        if (!opportunity && pilot.down && survivor && state.status === 'playing') {
          opportunity = { id: run.seq + 1, positive: false, started: false, reset: false };
          run.open.set(pilot.id, opportunity);
          record(run, 'rescue_exposed', { ring: pilot.ring });
        }
        if (!opportunity) continue;
        const fields = { opportunity: opportunity.id };
        if (!pilot.down) {
          run.open.delete(pilot.id);
          record(run, transition === 'diagnostic' ? 'rescue_removed' : 'rescue_completed', fields);
          continue;
        }

        const positive = pilot.rescue > 0;
        if (positive && !opportunity.started) {
          opportunity.started = true;
          record(run, 'rescue_started', fields);
        } else if (!positive && opportunity.positive && !opportunity.reset) {
          opportunity.reset = true;
          record(run, 'rescue_reset', fields);
        }
        opportunity.positive = positive;
      }
      if (state.status !== 'playing') {
        run.ended = true;
        record(run, 'run_end', { outcome: state.status });
      }
    },
  };
}

const batchLimit = 128;
const queueLimit = 1024;

export function createAnalyticsLog(file, warn = console.warn) {
  const queue = [];
  let pending, written = 0, dropped = 0, reportedFailure = false;

  function drop(count) {
    dropped += count;
    if (!reportedFailure) {
      reportedFailure = true;
      warn('Cold Signal analytics dropped records. Check local log access and capacity.');
    }
  }

  async function drain() {
    while (queue.length) {
      const batch = queue.splice(0, batchLimit);
      try {
        const handle = await open(file, 'a', 0o600);
        try {
          await handle.appendFile('\n' + batch.map(record => JSON.stringify(record)).join('\n') + '\n');
          await handle.sync();
        } finally {
          await handle.close();
        }
        written += batch.length;
      } catch {
        drop(batch.length);
      }
    }
    pending = null;
  }

  return {
    append(record) {
      if (queue.length >= queueLimit) return drop(1);
      queue.push(record);
      pending ??= new Promise(resolve => setImmediate(resolve)).then(drain);
    },
    async flush() {
      await pending;
      return { written, dropped };
    },
  };
}

export function localRescueAnalytics(env = process.env) {
  const file = env.COLD_SIGNAL_ANALYTICS_FILE;
  if (!file) return null;
  try {
    const parent = realpathSync(dirname(resolve(file)));
    const publicDirectory = realpathSync(new URL('../public/', import.meta.url));
    if (parent === publicDirectory || parent.startsWith(publicDirectory + sep)) {
      throw new Error('Choose a log directory outside public/.');
    }
    const log = createAnalyticsLog(resolve(parent, basename(file)));
    const observer = createRescueAnalytics({
      build: env.COLD_SIGNAL_ANALYTICS_BUILD, cohort: env.COLD_SIGNAL_ANALYTICS_COHORT, emit: log.append,
    });
    return { ...observer, flush: log.flush };
  } catch (error) {
    console.warn(`Cold Signal analytics disabled. ${error.message}`);
    return null;
  }
}
