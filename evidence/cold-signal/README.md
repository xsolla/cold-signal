# Cold Signal — playable integration verification

2026-11-19. Integrated and inspected in the actual Delve Together browser client.
This is the production follow-through of the art-direction v1.1.0 trial, using
the user's approved Cold Front palette with Black Signal's geometry and arcade
motion. The prior scripted `art-direction/vector-relay/arcade/` viewer remains
a separate motion study. No scripted waves, kills, scores, or combo multipliers
from that viewer were imported into gameplay.

## Integration

The UI and Canvas renderer share navy, ice white, cyan, peach, and violet roles.
The forked ships face inward and fit the previous 13-unit painted envelope;
the original perspective and collision sizes remain in use. Character motifs
sit inside the common silhouette. Downed pilots use an open circle, separated
bars, and authoritative rescue progress. Enemy silhouettes and warning geometry
retain their existing gameplay identities.

Streaming depth rings, speed lines, short movement ghosts, shot trails, hit
fragments, and bounded camera impulses supply the arcade motion. Actual server
event IDs trigger effects once. Projectile tails stop at their first observed
depth. Shockwave draws a 1.6-radian sector outside the protected bullseye;
Bulwark, Rally, Slipstream, shields, downings, and rescues have distinct feedback.
Particles use presentation time without changing the simulation or RNG.

Shared pause stops this presentation clock. Retry and leaving a room reset its
event cursor, trails, and projectile history. Reduced motion suppresses camera
movement, streaming rings, speed lines, ghosts, and fragmentation while keeping
functional warnings, buffs, and rescue feedback. Its initial setting respects
the OS preference. The menu grows to keep join controls reachable; the in-room
stage fits short viewports.

The baseline playable source was preserved intact in commit `1ba2398` before
integration. `src/`, `server/`, the dependency lockfile, Docker configuration,
and rules tests have no changes from that baseline. The branch descends from
the requested `codex/tempest-hexagon-jam` base `531c486`.

## Checks performed

- All **48 Node tests passed**: 42 existing rules/network tests plus six
  presentation lifecycle, pause, reset, reduced-motion, trail, and registration
  checks. [Full output](node-tests.txt).
- Actual four-client browser run at 0.5× with one manually controlled client
  and three existing diagnostic clients. Observed A/D movement, W/S depth changes,
  automatic fire, Ivo's cooldown and sector effect, downed markers, rescue
  progress, and revival. Constructed rescue tests and controlled pilots contributed
  to the three rescues visible in the team-clear screen.
- Constructed tunnel, final-clear, and wipe scenarios exercised the live client
  and authoritative server. Observed team clear, loss, and retry returning all
  pilots to the outer rail with a fresh score, cooldown, and effects history.
- Full motion and reduced motion inspected. A separate two-client run at 1×
  verified Mara's Bulwark feedback in reduced mode.
- Pause captures taken apart are byte-identical (SHA-256
  `172824f155a69b7a464b445c702a4953ad0b6480b44f58bb30a9a2d6bec4ec09`).
  This supports the visible pause check in addition to the clock tests.
- Menu, lobby, and live gameplay inspected in the normal desktop pane and at
  a temporary **960×640** viewport. The compact gameplay footer ended at y=627,
  inside the viewport. The temporary override was reset.
- No warnings or errors in the inspected browser logs. `git diff --check` passed.

Docker's daemon did not answer the bounded status check, so this pass ran the
same Node server and public assets natively on loopback port **5176**, with
`DEV_TOOLS=1`. The older Docker game on 5173 was not rebuilt. Container packaging,
cross-device LAN play, frame-rate benchmarking, and a new human enjoyment or
recognition study were not performed.

## Runtime captures

These are browser captures of the actual game; diagnostic scenarios are labeled.

| Capture | Context |
| --- | --- |
| [Menu](menu.jpg) | Cold Signal entry screen, OS reduced-motion preference honored. |
| [Tunnel fixture](tunnel-fixture.jpg) | Constructed protected bullseye preview and rail arrivals. |
| [Shockwave](shockwave.jpg) | A real Space input on a fresh four-player run; cooldown and sector visible. |
| [Rescue/combat](rescue.jpg) | Live crew, downed marker, projectiles and hazards after the rescue fixture. |
| [Reduced motion](reduced-motion.jpg) | Full gameplay feedback with decorative motion suppressed. |
| [Paused](paused.jpg), [later pause](paused-later.jpg) | Identical frozen world and HUD. |
| [Team clear](team-clear.jpg) | Constructed final-clear check after the live rescue sequence. |
| [Compact lobby](compact-lobby.jpg) | 960×640, two-player/full-speed setup. |
| [Compact gameplay](compact-gameplay.jpg) | Actual full-speed two-client game with reduced motion and Bulwark. |
| [Team wipe](team-wipe.jpg) | Constructed loss in that compact game. |
| [Ready room](ready-room.jpg) | Final handoff: four connected clients, Ivo selected, 1× pace, full motion; waiting for the human to ready. |

The integration is playable and technically checked. These checks do not
establish player comprehension, fun, balance, or release readiness.
