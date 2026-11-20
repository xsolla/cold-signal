# Cold Signal design

In this desktop keyboard co-op prototype, four pilots share a three-ring tunnel.
Players create or join a room by code, select a pilot, ready up, and split
coverage. Each active pilot fires inward automatically. A/D or Left/Right
orbits, W/Up and S/Down hop one ring per press, and Space triggers the chosen
pilot's ability. A nearby pilot on the same ring can rescue any downed crew
member while continuing to fire.

## Gameplay rules

- Every pilot must be active at the final clear. A downed crew member sends the
  run into overtime at the time limit. All crew down loses. Ready up again to
  start a fresh run.
- The bullseye absorbs incoming player shots and protects preview enemies from
  player damage until they emerge. Enemy deaths can chain through exposed
  enemies and credit the initiating pilot. Death blasts leave crew unharmed.
- The default four-player room runs at 0.5× simulation pace, with two-player and
  1× options. Pace scales the simulation. Input sampling and network ticks
  continue at their normal rate. The HUD displays real-time seconds.
- Shared pause freezes the run. A disconnect during play interrupts it.

The authoritative timing, tuning, and crew abilities live in
[`src/rules.js`](../src/rules.js). The [README](../README.md) describes the
playable build and controls. The [Delve Together design](design-delve-together.md)
preserves the earlier design decisions and hypotheses.

## Presentation

Keep the camera locked in both motion settings. The presentation transform
keeps translation and roll at zero and zoom at 1. This decision followed reports
of nausea with the earlier camera response. Keep gameplay cues for warnings, abilities, and rescue in both
motion settings. Reduced motion suppresses decorative movement and particles.
See the [pacing and camera decision record](../evidence/cold-signal-pacing/README.md).
