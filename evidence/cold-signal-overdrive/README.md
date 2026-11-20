# Cold Signal — amplified live effects

2026-11-19. Refinement of playable integration `4ec2925`, following the user's
request for bigger explosions, brighter trails, and more dramatic camera movement
comparable to the Cold Signal arcade study. The approved palette and ship geometry
remain in use. These changes are integrated into the actual game renderer.

## Changes

| Effect | Previous integration | Amplified integration |
| --- | --- | --- |
| Enemy destruction | 18 fragments, 0.48 seconds, collider-depth scale | 36 fragments and rotating shards, 0.72 seconds, cyan/violet shock rings, localized additive bloom and a short white impact cross |
| Burst scale | Directly multiplied by depth scale | `max(0.6, sqrt(depthScale))`, retaining perspective without vanishing at inner depths |
| Projectile trail | Up to 38 world units, one faint stroke | Up to 78 units, layered halo and bright gradient, white head and localized glow |
| Movement trail | Up to 0.14 seconds / 9 samples | Up to 0.24 seconds / 14 samples, luminous ribbon and alternating afterimages |
| Camera translation | 4×3 CSS pixels at maximum impulse | Bounded 18×13 pixels, scaled down with short viewports |
| Camera zoom | Up to 1.5% | Up to 7.5%, plus up to 0.02 radians (about 1.15°) of roll |
| Camera response | Weak kill impulse, quick decay | Stronger kill/special/rescue impulses and longer settling; overlapping impulses remain capped |

Shockwave has a brighter leading edge, a translucent fan, and nine radial streaks
inside its actual 1.6-radian sector. Downing, shield, and rescue rings have larger
bursts and outward fragments. Ship silhouettes, rescue progress, and the sanctuary
boundary draw above the effects. The HTML HUD remains fixed while the world moves.

These are presentation changes. Every hit and impulse still comes from a real
server event, and trails stop at each bullet's first observed depth. Simulation,
spawns, score, cooldowns, collision, input, audio, and network code are unchanged.
No scripted arcade choreography or synthetic kills were introduced. Reduced
motion keeps the original small functional cues and removes decorative bursts,
glow trails, movement ghosts, camera translation, roll, and zoom.

## Checks and captures

- **49 Node tests pass**: the existing 48 plus a camera test covering overlapping
  combat impulses, bounds, pause, settling, and reduced motion.
  [Full output](node-tests.txt).
- Four real browser clients at **1× speed** on `localhost:5176`: one manually
  controlled Ivo and three existing controlled diagnostic clients. Inspected
  automatic fire, orbiting, depth change, a Shockwave kill, hit fragments,
  bright shot/ribbon trails, pause/resume, and the reduced-motion toggle.
- The existing **Tunnel scenario** provided a repeatable constructed setup for
  the Shockwave hit. The [blast capture](blast.jpg) shows its real score increase
  and ability cooldown; this is an early impact frame of the live game.
- [Movement and shot trails](trails.jpg), [continued orbit](orbit-trails.jpg),
  and [reduced motion while paused](reduced.jpg) were captured in that same room.
- [Pause A](pause-a.jpg) and [Pause B](pause-b.jpg), taken apart with active FX,
  are byte-identical: SHA-256
  `2539280007be82c7561cf7e7d25dbb129eeec9e31fddc4f3c824b6234b9423fe`.
- No warnings or errors in the inspected browser logs. `git diff --check` passed.
  The rules, server and dependency lockfile match the preceding integration.
- [Handoff room](ready-room.jpg): four connected clients at 1× pace with full
  effects, Ivo selected, and the three controlled crew ready for the human.

This pass used the already running native game server. No container rebuild,
frame-rate benchmark, or new human enjoyment/recognition study was performed.
The effects have fixed history and particle limits; those bounds are not a
frame-rate measurement. The native game remains available on port 5176.
