# Skill trial for local rescue analytics

Status — observed and locally verified.

## Reproduction

- **Date and reviewer** — November 19, 2026 Pacific. Autonomous branch trial by the analytics subagent.
- **Skill** — `chatgpt-playtest-analytics` v1.0.1 at `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`. The skill checkout was clean.
- **Game starting revision** — `18791157b1e1c278fac55e115a375971ef3a0c1b` in a clean, isolated trial worktree. It included the earlier scaffolding, design, prototype, game-feel, playtest and balance trial work.
- **Model and settings** — Codex subagent, `gpt-6.2-sol`, high reasoning effort.
- **Original request** — “On a new branch, test out each of the skills autonomously using your best judgement using Sol 6.2 high subagents. I will be away from my computer so I will be unable to take action. Go with your gut and make your own decisions. I want to come back and be able to review all of the changes that have been made to this project as a reasult of each of those skills. Start with the agent-scaffold skill before doing the other ones.”
- **Delegated task** — “Apply skill to concrete current Cold Signal hypotheses and implement MINIMAL LOCAL-ONLY opt-in measurement with working hooks/report.” The delegated acceptance checks required real browser input, durable readback, no change to gameplay rules, explicit verification cohorts, rejection and repeated-notification coverage, consistent denominators, and isolated observer failure. Inputs were [project instructions](../../AGENTS.md), [design](../design.md), [verification](../verification.md), [architecture](../architecture.md), the [current playtest](../playtest.md), [balance branches](../balance-plan.md), the server and rules, and the skill’s study record and interview, instrumentation, and verification guides.
- **Expected result** — A reversible local study that distinguishes reaching positive progress, resetting progress and recovering from an eligible down. A normal server can run with analytics disabled. Automated and diagnostic play are excluded from the default study report.

## Baseline evidence

The ordinary four-browser playtest observed two outer downs and a lead
pilot going down before positive progress. Its constructed rescue showed
progress after reaching the right rail. The balance fixture sampled middle
and outer downs under different pressure. Neither established how often
unfamiliar humans progress in ordinary play. The game had transient
authoritative down and rescue events and an optional replay hook; an
opportunity could span many ticks and its progress reset was only visible
in player state. There was no persistent study log or report.

The skill’s denominator and accepted-state guidance fit this gap. With
the user unavailable, use of provisional hypotheses and a bounded local
collector followed the skill’s existing path. No repeatable skill
instruction defect surfaced in this run.

## Candidate and comparison

The [study record](../playtest-analytics.md) defines eligibility, event
fields, distinct run endings, exact filters, and which observations could
inform the next design decision. The implementation adds an opt-in
[observer and local writer](../../server/playtest-analytics.mjs), state
commit calls in the [authoritative server](../../server/index.mjs), and
the [JSON report](../../scripts/analytics-report.mjs). The observer uses
a per-match UUID and sequential record IDs, outside the game RNG. The
collector and report use anonymous bounded facts. The test captures
identity from a committed rescue through an append, a file readback and
report aggregation.

| Check | Observed result |
| --- | --- |
| `npm test` using Node 20.11.0 | 65 passed. The focused [analytics tests](../../tests/analytics.test.mjs) exercise partial readiness, action commitment, progress reset, diagnostic removal, duplicate messages, clean retry, and a single interruption. The tests replay every captured game tick when collection is disabled, the observer throws, and the log sink fails. They also verify routing malformed, duplicated, conflicting and incomplete records through the report. |
| `COLD_SIGNAL_URL=http://127.0.0.1:5185 npm run test:browser` with the separate diagnostic log | Passed on Chrome 157.0.8103.80. Four starts ended in one win, one loss and two interruptions. Eleven durable records, including one eligible middle-rail exposure linked by sequence to one progress start and one committed rescue. Rates were 1/1 start, 0/1 reset, and 1/1 recovery among resolved opportunities. |
| Separate four-client Chrome pass with development tools off | Four contexts joined through the actual game UI. The lead pressed W to move in. The first downs appeared at 6.5083 simulation seconds. Closing a peer interrupted the run. Four records survived shutdown and readback, including two outer exposures and the interruption. Rates were 0/2 start, 0/0 reset and 0/0 recovery among resolved opportunities. Both open opportunities were censored. |
| Report CLI after either game server exited | Readback from the combined local log under build `18791157b1e1+analytics-v1`. Default `study` selected zero starts and zero eligible opportunities, including an explicit null for the recovery rate. Explicit `diagnostic` or `automated` selected only the named cohort. No malformed rows, duplicates, identity conflicts or invalid runs in either browser file. |

The [compact browser readback](../../evidence/skill-trials/analytics/browser-readback.json)
records candidate Git blobs, environment, durable IDs, event order,
filtered summaries and denominators. Raw runs, launcher output, captures
and test TAP were kept under ignored `artifacts/` in the isolated trial
worktree. To reproduce the diagnostic browser pass, use the
[local setup](../playtest-analytics.md#run-locally) with cohort
`diagnostic`, `npm run dev` and a fresh file. Run the existing browser
check at the chosen URL, close the server, and execute the report CLI.
To recreate the ordinary scenario, use four default-lobby browser
contexts on a regular `automated` server, move the first pilot inward
with W, keep the other pilots still, then close a peer after the first
downs. This is an observer-level check with a deliberately censored ending.

Review type — agent self-review of actual local game integration,
automated browser and socket play, and a constructed arithmetic fixture.
The human cohort, comfort, comprehension, damage causes and hosted
collection remain unmeasured. The current candidate isolates ordinary
playtest report denominators from this verification traffic.

## Contribution

- **Skill candidate and comparison** — The installed skill completed its workflow in the local environment. No skill change or same-input candidate comparison was needed.
- **Cold Signal evidence and implementation** — This trial commit contains the study, collector, report, tests, and browser evidence.
- **Pocket Studio pin used** — `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`.
