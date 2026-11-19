# Cold Signal — arcade combat, stationary camera

2026-11-19. Candidate following `222834b`. The user requested denser actual waves,
faster firing, more chain explosions, and less camera shake after player reports
of nausea. This pass used the repository's game-feel skill and authoritative
JavaScript rules, with bounded diagnostics and a live browser check.

## Implemented

- Automatic firing interval: 115ms → 65ms. At the fixed 60Hz simulation step,
  measured full-speed cadence is 15 shots per second per pilot.
- Single random spawns replaced with clustered squads: three, four, then five
  enemies; two-player squads contain two or three. Cadence progresses through
  0.9, 0.85, 0.8 and 0.75 simulation seconds. Population caps are 48 / 24.
- Each squad has one behavior leader and one-hit rush escorts. Escorts use an
  outlined triangle and do not leave lingering danger on escape. Leaders keep
  their original behavior. This bounds the extra area hazards created by density.
- Initial spawn begins at 0.35s; center preview is 0.65s. The sanctuary remains
  protected from every player attack, including cascades.
- Enemy deaths deal one damage within a projected range of
  `52 * depthScale(source.radius)`. Deaths can propagate iteratively through
  adjacent enemies. Dead targets cannot score twice; armor still takes damage
  normally. Crew never take death-blast damage. Ivo starts inside its sector;
  subsequent chains can propagate beyond its edge.
- Kill events include actual chain depth and source coordinates. Violet links
  and the chain clear label use these events. Event history increased to 96 so
  a whole 48-enemy cascade survives a network snapshot; presentation history
  remains bounded at 64 effects.
- Camera translation, roll and zoom pulses are **all disabled**, including
  full motion. The large visual bursts and bright trails remain. Reduced motion
  continues to suppress decorative effects while retaining functional cues.

Movement, collision sizes, bullet speed, support abilities, rescue timers,
wall cadence, breathing phases, score values, crew-size defaults, half-speed
scaling, and final-clear conditions were retained.

## Mechanical verification

**55 tests pass**, including six new pacing/chain checks and the revised locked
camera contract. [Complete test output](node-tests.txt). The checks cover 60 team
shots/second, equivalent half-speed simulation cadence, dense natural squads,
crew-scaled caps, cascading ownership/score, sanctuary/range/armor, nearby crew
safety, a full-population cascade, and leader/escort danger behavior. Existing
live WebSocket replay, pause, retry, depth and rescue checks also pass.

`node scripts/pacing-check.mjs` executes both the preceding revision and current
authoritative modules. It uses fixed seeds 17, 73, 123 and 773, a 1/60 step, four
pilots and 1× pace. [Full data, source hashes and limits](pacing.json).

| Constructed check | Before | Candidate |
| --- | --- | --- |
| Shots in five seconds, no threats | 172 | 300 |
| Team shots per second in that check | 34.4 | 60 |
| Enemies spawned over 20 seconds, firing/walls off and invulnerability granted | 16 for each seed | 79 for each seed |
| Peak live enemies in that spawn check | 7–9 | 19–24 |
| Chain kills in normal controlled traces | 0 | 8, 35, 26, 27 |

The existing diagnostic policy is not a human. All four controlled traces lost
on both revisions: baseline stops ranged from 23.817–40.317 simulation seconds;
candidate stops ranged from 7.667–40.4 seconds. These results expose a difficult
candidate and policy limitations; they do not establish human difficulty,
enjoyment, a population success rate, or an approved final balance target.

## Live browser check

The native server on loopback port 5176 was restarted with the final rules and
the clients reloaded. Four browser clients used 1× pace, with one manually
controlled Ivo and three existing controlled crew clients. Inspected orbiting,
depth change, faster automatic fire, natural squads, overlapping multi-kill
explosions, Shockwave, fixed framing, pause/resume, retry, and reduced motion.
No diagnostic spawn fixture was used in these captures.

- [Natural combat](combat.jpg): six kills by the opening four seconds, with
  overlapping squad destruction effects and the stationary rails.
- [Ability impact](impact.jpg): the same room following a real Space input.
- [Reduced feedback](reduced.jpg): reduced motion during the shared pause.
- [Fresh handoff room](ready-room.jpg): four connected clients at 1× pace, full
  effects with a fixed camera, Ivo selected, waiting for the human to ready.
- [Pause A](paused-a.jpg) and [Pause B](paused-b.jpg): captures taken apart after
  restoring full effects are byte-identical (SHA-256
  `ab8a118b1a03cf5bf65f67740b69eb5772e87a76a2713a74a8f4d803e3edf4b9`).

Inspected browser logs contained no warnings or errors. `git diff --check`
passed. The camera is mechanically stationary; whether this resolves the
reported discomfort and whether the new rhythm feels right require the user’s
comparison. No comfort, recognition, enjoyment, cross-device or frame-rate study
was performed. The older Docker game was not rebuilt in this pass.
