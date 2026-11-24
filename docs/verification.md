# Cold Signal verification

## Run local checks

Run these from the repository root with Node.js 20+. Install dependencies
once with `npm ci`.

| Command | Covers |
| --- | --- |
| `npm test` | Fixed-step rules, combat chains and pacing, presentation lifecycle and hull-only shake, live WebSocket rooms and replay, and Pocket Studio link tooling. |
| `node --test tests/rules.test.mjs tests/server.test.mjs` | Input semantics, queued between-tick taps, shared state and retry. |
| `node --test tests/presentation.test.mjs tests/pacing.test.mjs` | Presentation event handling, pause/retry, reduced motion, bounded hull shake, and authoritative pacing and chain fixtures. |
| `npm run test:browser` | Four independent Chromium clients drive lobby entry, keyboard input, pause, depth movement, abilities, diagnostic rescue and outcomes, retry, disconnect, and compact layouts. |
| `npm run test:arcade` | Opens the static export in a nested Chromium iframe and checks pilot selection, depth and ability input, pause, audio, motion, a run outcome, retry and compact layout. |
| `npm run pacing` | Fixed-seed firing, spawn pressure, and controlled traces compared with the [versioned pre-arcade rules](baselines/README.md). |
| `npm run balance` | The existing two-pilot full-speed rescue fixture. |
| `npm run playtest:rescue` | Self-hosted browser session: ordinary assisted rescue attempt, labeled constructed rescue, retry and interruption. |
| `npm run balance:rescue` | Paired first-down rescue policies across fixed seeds and two/four-pilot profiles; prints JSON without changing tuning. |
| `npm run test:ui` | Pointer room options, keyboard pilot selection, settings, paused input, outcomes and interruption at desktop and compact sizes. Requires a diagnostics-enabled server; defaults to port 5187. |
| `npm run test:audio:browser` | Chromium room probe for 132 BPM at both paces, keyboard Overdrive and depth audio, a shielded breach at one hull point, a hull loss with all pilots active, threat and readiness cues, a constructed maximum-chain/rescue overlap, an isolated pilot dropout and rescue, mute, pause, and a constructed clear. |
| `node scripts/audio-score-audition.mjs` | Renders and measures a constructed score-and-effects reel using the runtime audio graph. Writes the WAV and report under `artifacts/audio/`. |
| `node scripts/audio-score-audition.mjs --feedback` | Renders a constructed finale with movement, warnings, a readiness cue, and interrupted and completed rescue phrases. |
| `node scripts/audio-score-audition.mjs --pressure` | Renders both Pressure rehearsal mixes from the same seeded solo input sequence, including a wall warning, rescue, and bar-16 clear. |
| `node scripts/audio-score-audition.mjs --sortie` | Renders the complete 99-bar mix from a scripted solo attempt through a rescue and the 3:00 clear. |
| `node scripts/audio-score-audition.mjs --crew` | Renders four controlled solo instrument dropouts and returns across the Pressure arrangement. |
| `node scripts/audio-score-audition.mjs --overdrive` | Renders the four instrument layers individually and together in a constructed Final Surge mix. |
| `npm run analytics:report -- LOG --build BUILD` | Validated, deduplicated local rescue counts for one build; the default study cohort excludes automated and diagnostic runs. |

Start `npm run dev` in a separate terminal for the browser check. It needs local
test tools enabled and an installed Chrome or Chromium. Override `CHROME_PATH`
for another executable and `COLD_SIGNAL_URL` for another local server. For an
isolated run, start `PORT=5186 npm run dev` and then run
`COLD_SIGNAL_URL=http://127.0.0.1:5186 npm run test:browser` from a second terminal.
Check the exit status and `artifacts/browser-check-v03.json`. Keep generated logs
and captures in ignored `artifacts/`.

The Arcade check builds its own static files. Set `COLD_SIGNAL_ARCADE_SITE` and
run `node scripts/arcade-browser-check.mjs` to check an assembled Arcade site.
The check accelerates the browser frame clock after the real-time input checks
to reach the natural outcome. The local export check measures the Pressure
rehearsal's first kick against the encounter transition at real speed and checks
the first sweep's visual lead, reveal, and scheduled synth onset. It captures
the cue in `artifacts/arcade/formation-preview.png` and
`artifacts/arcade/formation-reveal.png`, then checks all eight phases in a
constructed traversal that protects the pilots and replenishes the hull. Kills
still charge Overdrive through combat. Set `COLD_SIGNAL_REALTIME=1` to
measure the three-minute run's drops against its phase transitions at real speed.
See the [Arcade release record](release/pocket-studio-arcade.md).

## Recorded evidence

- [Combined autonomous trial verification](skill-trials/README.md#final-integration-verification)
  covers candidate `9a6fd89`: 68 Node tests, four-client flow, UI, audio and
  normal-start checks. The [candidate manifest](../evidence/skill-trials/launch/candidate.json)
  identifies the tested runtime bytes and environment.


The autonomous skill trials add [current UI findings](ui-ux.md),
[art calibration](art-direction.md), [sound comparison](sound-design.md),
[agent playtest](playtest.md), [paired rescue diagnostics](balance-plan.md),
and an [opt-in local rescue study](playtest-analytics.md). Their captures and
reports identify their own source revisions; a baseline capture is not evidence
of the final integrated candidate. `npm run audio:audition` rebuilds the recorded
WAV comparisons and signal report, so it intentionally changes evidence files.


- [Standalone migration](migration/README.md) and [verification data](migration/verification.json)
  identify the standalone runtime, smoke check, and Docker Compose validation.
- [Arcade pacing and stationary camera](../evidence/cold-signal-pacing/README.md)
  records the last combat changes, fixed-seed diagnostics, and observed local
  play with a manually controlled pilot and three controlled clients.
- [Art integration](../evidence/cold-signal/README.md) and
  [amplified effects](../evidence/cold-signal-overdrive/README.md) document earlier
  presentation revisions. Their camera behavior predates the locked-camera decision.
- [Delve Together 0.3](verification-v03-delve-together.md),
  [0.2](verification-v02.md), and [0.1](verification-v01.md) preserve the
  original local verification and build identities.

Record observed play, constructed fixtures, and hypotheses distinctly.
The rescue, tunnel, final-clear, and wipe scenarios instrument specific paths.
Functional results leave four-human coordination, player comfort, difficulty,
cross-device LAN, and hosted behavior open.
