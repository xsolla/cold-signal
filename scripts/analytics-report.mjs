import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { analyticsCohorts, analyticsSchema, isAnalyticsBuild } from '../server/playtest-analytics.mjs';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const positiveInteger = n => Number.isSafeInteger(n) && n > 0;
const terminalStatuses = ['won', 'lost', 'interrupted'];
const fieldsByType = {
  run_start: { crew: n => n === 2 || n === 4, pace: n => n === .5 || n === 1 },
  rescue_exposed: { ring: n => n === 0 || n === 1 || n === 2 },
  rescue_started: { opportunity: positiveInteger },
  rescue_reset: { opportunity: positiveInteger },
  rescue_completed: { opportunity: positiveInteger },
  rescue_removed: { opportunity: positiveInteger },
  run_end: { outcome: outcome => terminalStatuses.includes(outcome) },
};

function parseRecord(line) {
  let row;
  try { row = JSON.parse(line); } catch { return null; }
  if (!row || typeof row !== 'object' || Array.isArray(row) || typeof row.type !== 'string'
    || !Object.hasOwn(fieldsByType, row.type)) return null;
  const { schema, build, cohort, run, seq, type } = row;
  if (schema !== analyticsSchema || !isAnalyticsBuild(build) || !analyticsCohorts.includes(cohort)
    || typeof run !== 'string' || !uuid.test(run) || !positiveInteger(seq)) return null;
  const fields = Object.entries(fieldsByType[type]);
  if (Object.keys(row).length !== fields.length + 6) return null;
  const record = { schema, build, cohort, run, seq, type };
  for (const [key, valid] of fields) {
    if (!valid(row[key])) return null;
    record[key] = row[key];
  }
  return record;
}

function collectRun(events) {
  events.sort((a, b) => a.seq - b.seq);
  const start = events[0];
  if (start.type !== 'run_start') return null;
  const opportunities = new Map();
  let outcome = 'missingEnd';
  for (const [index, event] of events.entries()) {
    if (event.seq !== index + 1 || event.cohort !== start.cohort || event.build !== start.build || outcome !== 'missingEnd') return null;
    if (index === 0) continue;
    if (event.type === 'run_start') return null;
    if (event.type === 'run_end') {
      outcome = event.outcome;
      continue;
    }
    if (event.type === 'rescue_exposed') {
      opportunities.set(event.seq, { ring: event.ring, started: false, reset: false, outcome: null });
      continue;
    }
    const opportunity = opportunities.get(event.opportunity);
    if (!opportunity || opportunity.outcome) return null;
    if (event.type === 'rescue_started') {
      if (opportunity.started) return null;
      opportunity.started = true;
    } else if (event.type === 'rescue_reset') {
      if (!opportunity.started || opportunity.reset) return null;
      opportunity.reset = true;
    } else if (event.type === 'rescue_completed') {
      if (!opportunity.started) return null;
      opportunity.outcome = 'rescued';
    } else {
      if (start.cohort !== 'diagnostic') return null;
      opportunity.outcome = 'diagnosticRemoved';
    }
  }
  if (outcome === 'won' && [...opportunities.values()].some(opportunity => !opportunity.outcome)) return null;
  return { start, outcome, opportunities: opportunities.values() };
}

const blank = () => ({
  eligible: 0, started: 0, reset: 0, rescued: 0, lost: 0, interrupted: 0, missingEnd: 0, diagnosticRemoved: 0,
});

function count(summary, opportunity, runOutcome) {
  summary.eligible++;
  if (opportunity.started) summary.started++;
  if (opportunity.reset) summary.reset++;
  summary[opportunity.outcome ?? runOutcome]++;
}

const rate = (numerator, denominator) => ({ numerator, denominator, rate: denominator ? numerator / denominator : null });

function withRates(summary) {
  return { ...summary,
    startPerEligible: rate(summary.started, summary.eligible),
    resetPerStarted: rate(summary.reset, summary.started),
    rescuePerResolved: rate(summary.rescued, summary.rescued + summary.lost),
  };
}

export function summarizeRescueStudy(log, { build, cohort = 'study' }) {
  if (!isAnalyticsBuild(build)) throw new Error('Specify a build label or revision with --build.');
  if (!analyticsCohorts.includes(cohort)) throw new Error('Cohort must be study, automated or diagnostic.');
  const logHealth = { malformedRows: 0, duplicateRows: 0, conflictingIds: 0, invalidRuns: 0 };
  const byRun = new Map();
  const conflicts = new Set();
  for (const line of log.split('\n')) {
    if (!line.trim()) continue;
    const event = parseRecord(line);
    if (!event) {
      logHealth.malformedRows++;
      continue;
    }
    if (!byRun.has(event.run)) byRun.set(event.run, new Map());
    const events = byRun.get(event.run);
    const previous = events.get(event.seq);
    if (!previous) events.set(event.seq, event);
    else if (JSON.stringify(previous) === JSON.stringify(event)) logHealth.duplicateRows++;
    else conflicts.add(`${event.run}:${event.seq}`);
  }
  logHealth.conflictingIds = conflicts.size;
  const conflictedRuns = new Set([...conflicts].map(id => id.split(':')[0]));

  const runOutcomes = { starts: 0, won: 0, lost: 0, interrupted: 0, missingEnd: 0 };
  const totals = blank();
  const groups = new Map();
  for (const [id, events] of byRun) {
    const run = conflictedRuns.has(id) ? null : collectRun([...events.values()]);
    if (!run) {
      logHealth.invalidRuns++;
      continue;
    }
    if (run.start.build !== build || run.start.cohort !== cohort) continue;
    runOutcomes.starts++;
    runOutcomes[run.outcome]++;
    const { crew, pace } = run.start;
    for (const opportunity of run.opportunities) {
      const { ring } = opportunity;
      const key = `${crew}/${pace}/${ring}`;
      if (!groups.has(key)) groups.set(key, { crew, pace, ring, counts: blank() });
      count(groups.get(key).counts, opportunity, run.outcome);
      count(totals, opportunity, run.outcome);
    }
  }
  const byCrewPaceRing = [...groups.values()]
    .sort((a, b) => a.crew - b.crew || a.pace - b.pace || a.ring - b.ring)
    .map(({ counts, ...group }) => ({ ...group, ...withRates(counts) }));
  return { selection: { schema: analyticsSchema, build, cohort }, logHealth, runOutcomes,
    opportunities: withRates(totals), byCrewPaceRing };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { positionals, values } = parseArgs({
      allowPositionals: true,
      options: { build: { type: 'string' }, cohort: { type: 'string', default: 'study' } },
    });
    if (positionals.length !== 1 || !values.build) {
      throw new Error('Usage: node scripts/analytics-report.mjs LOG --build BUILD [--cohort study|automated|diagnostic]');
    }
    const log = await readFile(positionals[0], 'utf8');
    console.log(JSON.stringify(summarizeRescueStudy(log, values), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
