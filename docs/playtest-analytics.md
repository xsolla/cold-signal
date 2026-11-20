# Cold Signal rescue study

The first ordinary agent-operated attempt ended after the lead pilot moved
toward an outer-rail teammate without producing rescue progress. In a
constructed scenario, matching the downed pilot’s rail produced progress and
the crew completed the rescue. The fixed-seed balance branches also found
outer- and middle-rail downs under different pressure. These traces suggest
checking where rescue attempts stall during ordinary play. See the
[playtest](playtest.md) and [balance traces](balance-plan.md).

## Study record

The provisional cohort is four desktop-keyboard pilots, including an
unfamiliar lead, at the default 0.5× pace in a private room. Use first
unprompted opportunities in ordinary runs. Record familiarity, moderator
assistance, and explanations in the separate
[human retest notes](playtest.md#ready-to-run-human-retest). The report counts
opportunities across a crew and its retries. Use a separate local log for
coached replays or other recruitment conditions. Agree on the sample and
study window when recruiting.

| Priority and provisional hypothesis | Behavioral evidence | What would change the next test |
| --- | --- | --- |
| 1. First-time crews reach the rescue window often enough to start progress. | Opportunities with any progress divided by eligible downs, sliced by crew size, pace and downed rail. | If crews frequently register no progress and the moderator sees pilots stopping on the wrong rail or short of the marker, try a more local match-rail cue. If pilots knowingly wait for an unsafe route to clear, keep the cue and observe another encounter. |
| 2. An approach that starts progress can turn into a recovery even under pressure. | Opportunities with any reset among opportunities that started, plus actual recoveries among resolved opportunities. | If resets recur in ordinary play, replay those encounters and observe the route, warning and departure. Change the rescue window only after the trace and player account point to a timing problem. |

Eligibility is broader than a reachable rescue window. One active pilot
after the down makes the opportunity eligible, even during an unsafe or
brief approach. Interpreting cue recognition, enjoyment and intent also
requires player observation or debriefing. Rail slices reflect encounter
pressure, movement, ability choice and crew familiarity. An unresolved
opportunity can have evidence of progress by its last observation.

## Event map and report

The Node server observes the accepted rules state after each fixed step,
lobby start/retry, interruption and development scenario. The existing
state owns all outcome decisions. Each run starts at full-crew readiness
with a fresh anonymous UUID. Each record has immutable schema 1, build,
cohort and run fields, plus a positive sequence `seq` and a finite
`type`. The record identity is `(run, seq)`. An opportunity is indexed
by the sequence of its exposure in that run. Slot numbers only exist in
the in-memory observer to link state transitions. Reloading a client
follows the server’s existing disconnect and regroup behavior.

| Type | Accepted-state trigger and fields | Verification |
| --- | --- | --- |
| `run_start` | Full crew readies and the server commits a new match. `crew` is 2 or 4, `pace` is 0.5 or 1. | Partial and repeated ready messages add zero starts. A committed retry gets a new UUID. |
| `rescue_exposed` | Newly observed downed pilot in a playing state after commit with at least one active pilot. `ring` is the downed pilot’s committed destination rail (0 inner, 1 middle, 2 outer), including during a hop. Downs first observed on the full-wipe commit are ineligible. | Two outer downs with survivors create two exposures. A whole crew wiped in one commit creates zero. |
| `rescue_started` | The first committed positive rescue progress for the `opportunity`. It can share a tick with exposure. | Moving a helper into range logs once. Re-entering range after a reset leaves the start count unchanged. |
| `rescue_reset` | The first committed transition from positive progress to zero for a still-downed `opportunity`, including a loss tick. | Leaving the rail logs one reset. Completion resolves the opportunity directly. |
| `rescue_completed` | A fixed step recovers the downed pilot for the `opportunity`. | The Chrome rescue logs completion when the crew observes the pilot active. |
| `rescue_removed` | A development scenario clears the downed state for the `opportunity`. | Applying the tunnel scenario twice clears the episode once and leaves the rescue count unchanged. |
| `run_end` | The server commits `outcome` as `won`, `lost` or `interrupted`. | Retry, disconnect and repeated close messages keep one ending per run. |

The report takes one build and one cohort. The same selection applies to all
run counts and opportunity denominators. Cohorts are `study`, `automated`,
and `diagnostic`. Every run on a development-tools server gets the
`diagnostic` label at start. Use the `automated` label for scripted play on
a regular build. The report defaults to `study`. Use one file per study
window to keep the selection tied to that window.

- **Start per eligible** divides opportunities with observed positive progress
  by all recorded eligible downs.
- **Reset per started** divides opportunities with an observed reset by those
  with an observed start. Each down contributes at most one start and reset.
- **Rescue per resolved** divides observed recoveries by recoveries plus still
  open opportunities at a known crew loss. Unresolved opportunities at an
  interruption or missing run end are censored. The report displays
  development-scenario removals separately. Known recoveries still count if
  the run end is missing.
- **Empty selections** show counts and denominators of zero, with a
  `null` rate for a zero denominator. Group rows appear when their selection
  contains at least one eligible down.
- **Log health** covers the whole supplied file and identifies malformed rows,
  duplicate records, conflicting identities, and invalid runs. Gaps,
  conflicting payloads, inconsistent attribution and impossible lifecycle
  order exclude the affected run. A missing tail keeps the last valid
  observations and any open outcomes censored. A pre-start write failure can
  leave zero observable records for a run.

## Run locally

    mkdir -p artifacts/skill-trials/analytics
    COLD_SIGNAL_ANALYTICS_FILE=artifacts/skill-trials/analytics/study.jsonl \
    COLD_SIGNAL_ANALYTICS_BUILD="$(git rev-parse --short HEAD)" \
    COLD_SIGNAL_ANALYTICS_COHORT=study PORT=5185 npm start

Supply a build label that identifies the actual code, including any local
modifications. Start with a fresh log for a new study window. Omit the file
variable to keep analytics off. Development tools automatically keep runs
out of the study report, including ordinary encounters in those runs.

Run the report after the server has flushed the local file. Supply the
recorded build label when reading a historical file.

    node scripts/analytics-report.mjs artifacts/skill-trials/analytics/study.jsonl \
      --build "$(git rev-parse --short HEAD)"

Use `--cohort automated` or `--cohort diagnostic` to inspect verification
data. The report reads the operator’s local file.

The collector appends up to 128 records per write and syncs each batch.
At most 1,024 records wait behind any write in flight. It drops records
on a saturated queue or failed append, warns once, and keeps play running.
A leading newline separates batches so a later append can be parsed after a
partial final line. Graceful CLI shutdown waits for the queue to flush.
An abrupt stop can leave buffered records missing. Keep the directory
outside `public/`; new logs have owner-only permissions. The stored data is
limited to the above fields. Explain this local logging before enrolling
participants and delete the ignored log after the agreed review window.

## Verification and limits

- The automated WebSocket test checks accepted-state order, reset and
  recovery, repeated notifications, retry, interruption, local file readback,
  and an unwritable sink alongside replay of every committed game tick.
- An automated four-browser run exercised an ordinary down with development
  tools off. It recorded two outer exposures, zero starts, and two censored
  opportunities when a peer closed. A separate constructed browser run
  recorded one middle exposure, one start and one recovery. The default
  study report excluded both sets. See the
  [browser readback](../evidence/skill-trials/analytics/browser-readback.json).

Human behavior and hosted collection remain unmeasured. Use the human retest
and its debrief before changing rescue cues or timing.
