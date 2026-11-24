# Cold Signal architecture and workflows

Cold Signal runs in a desktop browser using native JavaScript modules, Canvas,
and Web Audio. Solo runs a fixed-step match entirely in the browser and ships
as a static export. In multiplayer, a local Node.js process serves HTTP and
authoritative WebSockets.
[Docker Compose](../compose.yaml) uses the same application code with
[Nginx](../nginx.conf) serving assets and proxying `/ws` and `/health`.
Both multiplayer paths default to loopback port 5176. The local runtime has no
account or cloud dependency. See the [run guide](../README.md) for Docker and
opt-in LAN setup.

## Source ownership

| Change | Source and responsibility |
| --- | --- |
| Rules, tuning, replay | [`src/rules.js`](../src/rules.js) defines tuning, seeded match initialization, and fixed-step state updates. It owns movement, shots, enemies, projected collisions, abilities, rescue, scoring, and outcomes. The server and headless harnesses use the same module. |
| Rooms and transport | [`server/index.mjs`](../server/index.mjs) owns the in-memory room lifecycle, crew slots, readiness, pause, input queues, ticks, and state broadcasts. It retains brief depth and ability taps between ticks and consumes them on the next step. |
| Solo session and wingmates | [`src/solo-session.js`](../src/solo-session.js) advances the same rules and queues keyboard taps for player zero. [`src/bots.js`](../src/bots.js) reads live threats and produces regular pilot inputs for the other three slots. |
| Entry, controls, and HUD | [`public/index.html`](../public/index.html) loads [`public/main.js`](../public/main.js). The client samples keyboard input, sends intent, and displays room and match snapshots. It predicts only the local ship's angle for display. |
| Solo entry and export | [`public/solo.html`](../public/solo.html) and [`public/solo.js`](../public/solo.js) own the pilot-selection-to-retry loop. [`scripts/build-arcade.mjs`](../scripts/build-arcade.mjs) copies the solo entry as `index.html` and bundles its dependencies and notices into `dist/arcade/`. |
| Visuals and sound | [`public/renderer.js`](../public/renderer.js) draws Canvas using shared projection helpers. [`public/cold-signal.js`](../public/cold-signal.js) owns palette, ship geometry, and transient presentation state. [`public/audio.js`](../public/audio.js) schedules and mixes effects and the [score](../public/audio-score.js) via Web Audio. The [three-minute chart](../public/audio-chart.js) supplies authored bars and encounter times. |

Optional rescue analytics observes committed server state through
[`server/playtest-analytics.mjs`](../server/playtest-analytics.mjs). It writes
bounded local records only when configured and keeps measurements outside
match state and gameplay randomness. Use the [study contract](playtest-analytics.md)
when changing hooks, cohorts or report denominators.

Presentation consumes server events by ID. Keep visual effects out of the
simulation and use the shared projection when aligning silhouettes and
collisions. The renderer keeps pilots and rescue progress above large effects.
The [art studies](../art-direction/) record earlier visual choices. Runtime
assets live in [`public/`](../public/).

## Change and verify

- **Input or rules:** Trace keyboard input in `public/main.js` through the
  server input queue to `step` in `src/rules.js`. Run the affected check in
  `tests/rules.test.mjs` or `tests/server.test.mjs`. For a depth tap, verify
  one hop per press and agreement on the new rail across snapshots.
- **Presentation:** Trace the relevant snapshot or event from the rules to the
  renderer or audio module. Run `node --test tests/presentation.test.mjs` for
  effects. In the browser, check both motion settings and a shared pause.
  Check fixed framing against the [camera decision](design.md#presentation).
- **Room flow or browser packaging:** Run `npm test` and the
  [browser check](verification.md#run-local-checks). Verify that all four
  clients agree on the outcome and can ready up for a fresh run.
- **Solo flow or Arcade packaging:** Run `npm run test:arcade`. It loads the
  built game under a nested URL and checks a run, outcome and retry with
  Chromium, including that the game opens no WebSocket connections.

For a manual smoke check, run `npm ci` with Node.js 20+ and then `npm run dev`.
Open [the local game](http://127.0.0.1:5176), create a four-player room, and use
**Local test tools** to add three controlled crew clients. Ready up, orbit, tap
inward, cast a special, and pause and resume. Use **Final-clear check** with all crew
active to reach the shared clear, then ready up for a fresh run. This last
step is a constructed outcome check.
