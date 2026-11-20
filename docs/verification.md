# Delve Together — 0.3 local verification

Evidence date: 2026-11-18 Pacific. Candidate: local 0.3.0 on
`codex/tempest-hexagon-jam`; project files remain uncommitted. The creator called
0.2 “super fun” and asked for inner rails, depth movement, tunnel scaling, and a
protected enemy preview. That is attributed feedback on the preceding build,
not human acceptance of this tunnel iteration.

## Current identity

- Backend image: `sha256:e16155e791aff5783960f5aa6ac66a046f94d06d5fe0b1825dc387227d65709f`.
- Web image: `sha256:a5cf65595e3d290fc52ea304481c8402538ed3ae5e636592f46fa575cded1968`.
- Authoritative rules SHA-256: `ea17e0aada39d41c6f4db096c34fef30aa2a38823ee95bb78458c92dc0547f3e`.
- Native checks: Node.js 20.11.0; four independent Chrome processes,
  Chrome 157.0.8103.80. Containers run Linux ARM64 on Docker Engine 28.4.0 /
  Compose 2.39.2, with pinned dependencies and base image manifests.

The main web/backend containers are healthy at `http://localhost:5173`.
The original 0.1 is still independently available at `http://localhost:5174`.
Both health endpoints returned HTTP 200 after the final build. No cloud service
or AGS access is needed. LAN binding remains opt-in and cross-device play has
not been verified.

## Implemented mechanics

Three playable rails use logical radii 112, 176, and 240. Players start outside.
W/Up jumps one rail inward; S/Down jumps one rail outward. A held key does not
cascade. Jump travel takes 0.2 simulation seconds per rail and can continue
while orbiting and firing. A downed jumper finishes landing on a reachable rail.
Rescue requires the same ring, close radial position, and the existing angular
proximity. Support powers reach nearby same/adjacent rails; Ivo’s sector spans
depths. All crew must be active for the final clear.

One perspective function compresses positions toward the vanishing point and
scales ships, enemies, shots, walls, hazards, and effects. Bullet/contact tests
use that projection too. Distant enemy silhouettes have narrower angular hit
windows; bullets sweep their path to avoid skipping small targets between
ticks. Shots originate at the pilot’s actual depth and travel inward only.

The central bullseye absorbs all player bullets. Enemies spawn visibly inside,
wait briefly, and emerge through it. All player damage, including Shockwave,
respects the sanctuary until an enemy’s center is outside the boundary.
Skimmers enter the middle rail and orbit, while stalkers enter the inner rail
and pursue pilots there. Both mark warning arcs at their occupied depth.
Rushers/flankers threaten pilots they reach at any depth; suppressor beams
threaten the middle/outer region. Incoming walls now continue through every rail.
These are initial timings and enemy weights rather than validated balance.

## Commands and observations

From `projects/arcade-jam/game`:

- `npm test`: **42 rule/network checks passed**. New coverage includes hop bounds,
  held/repressed keys, opposite-key cancellation, landing while downed,
  actual-depth shot origins, same-depth rescue, support reach, walls crossing
  all rails, jumping through walls, both patrol types, depth-specific danger,
  perspective growth, narrower far-target hits, swept shots, bullseye immunity,
  normal spawn previews for all five behaviors, and four-socket depth agreement.
- Recorded live input replay matches every authoritative checkpoint, including
  a queued depth tap and ability tap. This is a bounded tape, not proof about
  every future input or networking condition.
- `docker compose up -d --build`: rebuilt the final candidate; both services
  reached healthy state. `compose.previous.yaml` also passed Compose validation.
- `npm run test:browser`: **four independent browsers passed** room entry,
  character selection, automatic fire, A/D movement, W/Up and S/Down across
  every depth, held-key and endpoint behavior, all four abilities, shared pause,
  a middle-rail rescue, shared victory/loss/retry, and disconnect interruption.
  All four received identical authoritative state. Browser errors: none.
- The browser pass observed a simulation/wall-time ratio of **0.483** in its
  short clock check, consistent with configured 0.5× pace within the test’s
  sampling tolerance. The HUD retains a three-minute target.
- Three controlled browser clients joined, readied, and navigated depth. Menu,
  character selection, and gameplay/HUD fit 640×480. Desktop tunnel/patrol
  screenshots and the compact view were visually reviewed.

The first browser pass found a lost inward press when W release and Up press
arrived before the next tick. The transport now records a fresh press separately
from held state; a regression fixture and the final browser pass cover this.
This also preserves quick Space taps and includes pulse metadata in replay.
A screenshot review moved rail labels away from the horizontal player labels.

The Tunnel, Rescue, Final-clear, and Team-wipe tools construct diagnostic
scenarios. Their success is functional evidence, not a natural three-minute
clear or human judgment of difficulty. A normal seeded spawning check used
long protection to observe all five enemy types, not to measure survival.
No difficulty sweep or automatic tuning was performed.

Generated reports, screenshots, source checksums, and image records are in
ignored `game/artifacts/`. The browser report is `browser-check-v03.json`;
`tunnel-three-depths.png` and `tunnel-patrols.png` show the constructed scenario.
Recheck affected evidence after source/configuration changes.

## Preserved versions and remaining work

[0.1 verification](verification-v01.md) and [0.2 verification](verification-v02.md)
retain their original evidence. The pre-tunnel 0.2 images were tagged before
rebuilding: `delve-together-backend:pre-tunnel-0.2` and
`delve-together-web:pre-tunnel-0.2`, with the identities in the 0.2 record.
The optional `compose.previous.yaml` runs them separately on port 5175;
it is validated but not started. These aliases exist only on this Docker host.

Next human check: change depth under pressure, identify an enemy inside the
bullseye, and rescue a pilot on an inner rail. Observe whether smaller targets
are challenging yet readable and whether each depth presents a useful choice.
Four-human coordination, cross-device LAN, hosted GamePix, AGS/Extend, physical
latency/audio measurements, and public release readiness remain unverified.
