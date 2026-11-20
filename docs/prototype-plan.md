# Cold Signal — read the rescue window

**Question.** Can players tell where to hold for a rescue and weigh that
position against an impending hazard? The [design brief](design.md) calls
for a deliberate choice between taking that risk and keeping the crew's
remaining ships safe.

**Completed.** The standalone browser build already supports four-pilot
rooms, keyboard orbit and depth changes, auto fire and abilities, proximity
rescue, team outcomes, and ready/retry. Four local browser clients completed
a constructed middle-rail rescue on the mechanical path. Whether a human
recognizes the hold position and chooses to commit is open.
[Agent-scaffolding verification](skill-trials/2026-11-19-agent-scaffolding.md)

**Proposed.** Two hours for one developer with Codex and a desktop Chromium
target. Build and check one small candidate. Use the final test slot for a
human comparison if four players are available. The
[original ten-hour plan](prototype-plan-delve-together.md) records the first
playable.

## Comparison

- **Baseline** — The current rescue marker, depth label, progress ring, and
  warning arcs at Cold Signal revision `dac1c9027cead078768573d03bdf65e436ffa176`.
- **Candidate** — In the downed-pilot draw path, add two static ticks just
  outside the marker's rail at the two angular edges of the hold area
  (`angle ± T.rescueArc`). Use one subdued light color so they read as
  position marks beside the existing warning arc. Draw the same ticks in both
  motion settings. Use a separate local commit so a revert restores the
  baseline. [Renderer](../public/renderer.js) · [Rescue rule](../src/rules.js)
- **Fixed conditions** — Use the existing *Rescue scenario* in generation-one
  rooms with four slots at 0.5×. Match browser, viewport, sound, full-motion
  setting, pilot picks, and player-to-slot assignments across versions.
  Keep the hazard, rescue rules, abilities, and shared locked-camera framing
  fixed. [Diagnostic and room setup](../server/index.mjs)
- **Reset and repetition** — Serve both versions locally on separate ports
  with `npm run dev`. For a four-human session, expose both servers on the
  intended local network with `HOST=0.0.0.0` and verify that all four desktops
  can join during setup. Use a fresh room per attempt and ready all four
  clients. At the start, have slot 1 tap inward once. When the pilot has settled on
  the middle rail, trigger *Local test tools → Rescue scenario* from slot 1.
  Match this setup across attempts. It downs slot 2 at a fixed angular offset
  and puts a timed warning at the marker. Use fresh rooms even after a clear
  or loss to restore the same first-run seed and slot positions. Record the exact build and
  scenario conditions for each capture.

## Two-hour sequence

| Time | Milestone and dependency | Playable proof |
| --- | --- | --- |
| 00–20 | Start the baseline in desktop Chromium. Rehearse the setup and capture the marker and warning on the same frame. | The room starts with four clients, the fixture places the downed marker on the middle rail, and an operator completes the rescue while firing. |
| 20–45 | Once the drill is repeatable, add the ticks in the candidate renderer and load it in the same browser. | The same drill still plays. Both ends of the hold area are visible in full and reduced motion, separate from the warning arc. The ticks clear on rescue or retry. |
| 45–80 | Once the candidate renders, run the focused rules/presentation tests and the existing four-client browser check in the candidate. Compare the rescue frame to the baseline. | Holding inside the same-ring window advances rescue, leaving it resets progress, and approaching from the wrong rail leaves progress at zero. The clients agree on revival and fresh retry. Inspect that the warning, progress ring, and pilot silhouettes remain readable. |
| 80–110 | After the candidate clears mechanical checks, run the brief human task if a crew is available. | Capture unassisted actions and explanations for each version. If a crew is unavailable, rehearse the protocol and keep the human result open. |
| 110–120 | Record the build pair, conditions, and result or blocker. | Keep the candidate commit available for another run if the technical checks pass. Revert it if the cue obscures gameplay feedback. |

Use `node --test tests/rules.test.mjs tests/presentation.test.mjs` for the
focused checks and the [browser verification instructions](verification.md)
for the candidate. If the drill or cue is unresolved at minute 45, use the
rest of the block for a baseline rehearsal and preserve the existing playable
room-to-retry loop. **Deferred work** includes cue animation, new onboarding,
tuning changes, and a dense natural-wave comparison. The drill isolates
angular positioning and immediate danger. It removes live waves and starts
the rescuer on the correct rail, leaving depth comprehension and broader
combat readability open.

## Human task and decision

After a separate control warm-up, say “Play this attempt together. Continue
as you normally would if the situation changes.” Give room and control
instructions only. Note the first helper, attempted hold position, progress
starts and resets, hazard activation, ability use, and whether the helper
waits, retreats, or takes a hit. Follow with “What were you trying to do there?”
and “What on screen told you where to stop or move?” Record any help separately.

Try the same brief drill in each version and vary version order across crews
if available. Treat a single crew's second exposure as a repeat with practice.
Keep the candidate for a natural-wave retest if first-exposure players
find the hold area more readily and can still explain the warning.
If players reach the hold area in both versions and explain why they chose
to wait or escape, pursue the risk question with the baseline. If the ticks
confuse the warning or the observations are mixed, record the ambiguity before
changing rescue timing.
