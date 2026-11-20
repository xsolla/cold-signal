# Delve Together — 0.1 verification (historical)

Evidence date: 2026-11-18. Candidate: local 0.1.0, uncommitted project files on
`codex/tempest-hexagon-jam`. This is local agent/technical evidence. The creator
has not yet provided human playtest observations.

## Runtime identity

- Docker Desktop engine 28.4.0, Compose 2.39.2, Linux ARM64 containers.
- Backend image: `sha256:363600f708449d5eae705483c4f338559f07e00ff17333de21f5f2b0987fb417`.
- Web image: `sha256:6986404711861272e09cd80fd7ca3b6e20d8aaef5fc3adfef19f697f5d02499b`.
- Authoritative rules SHA-256: `38e8f9f6de5767c1e958eb1255124ce94b52c4b84557f5bfa84059f406388272`.
- Browser verification: installed Google Chrome 157.0.8103.80, headless automated
  clients. Native host test runtime: Node.js 20.11.0.
- Both Compose containers reported healthy; web is bound at
  `http://localhost:5173` on loopback. There are no cloud or AGS calls.

Dockerfiles pin the tested base manifests. The lockfile pins `ws` 8.23.0 and
`playwright-core` 1.65.1. Source checksums and generated results/screenshots are
in ignored `game/artifacts/`; rerun the documented commands to recreate them.
These identities need updating after runtime source or configuration changes.

## Commands and observations

From `projects/arcade-jam/game`:

- `docker compose up --build -d --wait`: both services started and became healthy.
- `npm test`: **15 checks passed**. Covered input validation, instantaneous
  start/stop/reversal, shooting during proximity rescue, interrupted rescue,
  revival protection, both-down loss, both-active final clear and overtime,
  warning/gap rules, determinism, room capacity/errors, shared pause/retry,
  disconnect, and disabling diagnostic commands.
- A live server test recorded a real socket-driven input tape covering movement,
  fire, and spawned entities. Replaying that tape through the shared headless
  rules agreed at every recorded checkpoint. This is a short tested tape,
  rather than proof of parity for every future engine or networking change.
- `npm run test:browser`: the two-browser agent pass completed without browser
  errors. Actual key input moved and fired; both clients received an identical
  authoritative snapshot. One client's pause froze the shared clock.
- A **constructed** downed-partner scenario was rescued using real A/D position
  and Space firing. Both clients observed revival. Fast-forward final/wipe
  diagnostics exercised victory/loss, followed by shared clean retries.
- Disconnect stopped the active run and showed a partner-disconnected state.
  Invalid room input had a recoverable error. The controlled-client launcher
  opened a real second browser client that joined, readied, and moved.
- Menu/gameplay screenshots and DOM bounds were inspected at desktop size and
  640×480. This is local browser layout evidence, not GamePix hosting or a
  physical mobile/device compatibility claim.

## Unchanged balance baseline

`npm run balance` imported the server's actual rules and ran eight six-second
maximum constructed cases, with one survivor, one downed partner, and a marked
zone. Natural enemy and wall spawning were deliberately excluded. No tuning
candidate was selected or parameter search performed.

| Constructed encounter | Approach now | Wait while zone is active |
| --- | --- | --- |
| Wide warning window | Rescue completed at about 1.72 s | Rescue completed at about 1.72 s |
| Closing warning window | Team loss at about 1.72 s | Team loss at about 1.72 s |
| Already active threat | Team loss at about 0.22 s | Rescue completed at about 3.23 s |
| Fresh diagnostic check | Rescue completed at about 1.77 s | Rescue completed at about 1.77 s |

The waiting policy reacts to an already active zone; it does not anticipate a
closing warning, which explains its failure in that case. This is a policy
limitation to inspect, not evidence that waiting has no value. The conditional
results establish that the implemented exposure/timing can change outcomes.
They do not estimate normal-run rescue success, human skill, clear rate,
perceived fairness, or enjoyment. Keep the creator's qualitative targets intact
until human evidence supports a tuning change.

## Remaining evidence

The next useful step is the creator playing with the controlled second client
and reporting what they watched, what told them rescue was progressing, and
why they stayed or left. The creator knows the design, so this cannot establish
newcomer discovery or two-human coordination.

Still unverified: human tension/fun and audiovisual judgment, physical audio
and input latency, performance on other devices/browsers, a natural full-run
human clear, AGS/Extend auth/runtime integration, GamePix SDK/host compatibility,
processed upload, and public release readiness. The local Docker game runs
without those external prerequisites.
