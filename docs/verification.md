# Cold Signal verification

## Run local checks

Run these from the repository root with Node.js 20+. Install dependencies
once with `npm ci`.

| Command | Covers |
| --- | --- |
| `npm test` | Fixed-step rules, combat chains and pacing, presentation lifecycle and locked camera, live WebSocket rooms and replay, and Pocket Studio link tooling. |
| `node --test tests/rules.test.mjs tests/server.test.mjs` | Input semantics, queued between-tick taps, shared state and retry. |
| `node --test tests/presentation.test.mjs tests/pacing.test.mjs` | Presentation event handling, pause/retry, reduced-motion behavior, stationary camera, and authoritative pacing and chain fixtures. |
| `npm run test:browser` | Four independent Chromium clients drive lobby entry, keyboard input, pause, depth movement, abilities, diagnostic rescue and outcomes, retry, disconnect, and compact layouts. |
| `npm run pacing` | Fixed-seed firing, spawn pressure, and controlled traces compared with the [versioned pre-arcade rules](baselines/README.md). |
| `npm run balance` | The existing two-pilot full-speed rescue fixture. |

Start `npm run dev` in a separate terminal for the browser check. It needs local
test tools enabled and an installed Chrome or Chromium. Override `CHROME_PATH`
for another executable and `COLD_SIGNAL_URL` for another local server. For an
isolated run, start `PORT=5186 npm run dev` and then run
`COLD_SIGNAL_URL=http://127.0.0.1:5186 npm run test:browser` from a second terminal.
Check the exit status and `artifacts/browser-check-v03.json`. Keep generated logs
and captures in ignored `artifacts/`.

## Recorded evidence

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
