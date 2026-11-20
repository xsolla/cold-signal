# Cold Signal playtest

**Question** — Can a pilot identify the rail of a downed teammate and tell when
an attempted rescue has started, including while a wall is crossing the arena?

**Session** — November 19, 2026 Pacific. A rules-familiar agent operated local
Chrome 157 (1200 × 900, desktop keyboard) against the standalone game at
`dac1c9027cead078768573d03bdf65e436ffa176`. Four independent browser clients
joined by room code at the default 0.5× pace. The lead pilot used Ivo, the other
three held their starting lanes and saved their abilities. The operator could
read WebSocket snapshots to assist steering. See the
[trace](../evidence/skill-trials/playtest-balance/playtest-trace.json) and
[trial record](skill-trials/2026-11-19-playtest.md).

## Observations

Times below are simulation seconds. At 0.5×, wall time in play is about double.

| Source | Action and result |
| --- | --- |
| Normal run, seed 17321 | P1 tapped W into the middle lane. P2 and P4 fell on the outer rail at 6.51. The crew HUD showed `DOWN OUTER` and the bottom message explained the match-and-stay rule. P1 moved out toward P2 and went down at 6.98, with P2 still at 0% rescue. P3 fell at 10.72, ending the run in a crew loss. Ordinary enemies, walls and damage were active throughout. No scenario or special was used. |
| [Natural first down](../evidence/skill-trials/playtest-balance/natural-first-down.jpg) | The outer wall and bright down bursts crossed the outer downed markers and their text in this frame. In the crew strip, both `DOWN OUTER` labels remained unobstructed. The trace records when each pilot fell and leaves the specific hit source unresolved. |
| Constructed rescue, fresh room | The Rescue scenario put P2 on P1’s middle rail, cleared active enemy and wall pressure, delayed new spawns and placed a warning zone on the marker. P1 held within rescue angle on the outer rail for about 0.28 seconds and saw zero progress. W back to the middle rail brought the progress cue up while shots continued. P1 used Shockwave to clear the warning zone, and all four clients saw P2 recover. |
| [Full motion](../evidence/skill-trials/playtest-balance/rescue-full-motion.jpg), [reduced motion](../evidence/skill-trials/playtest-balance/rescue-reduced-motion.jpg) | Both near-concurrent views of the same constructed rescue rendered the downed marker, percentage and progress arc. The views are from different pilots. The reduced-motion view suppresses the full shot trails. |
| Constructed loss, clean retry, then peer closure | Team-wipe check showed the loss overlay across all four clients. Readying again changed the seed from 17321 to 17322 and reset rings, downed and ability-use state. Closing P3 during the retry interrupted the three peers. The regroup prompt directed the lead pilot back to entry through Leave. |

## Priorities for the next test

| Priority | Finding and hypothesis | Smallest follow-up and acceptance |
| --- | --- | --- |
| 1. Read the rescue marker in pressure | The natural down captured one frame of the outer marker text crossing bright geometry. Its effect on a new pilot’s recognition is unknown. The crew strip may already provide a useful fallback. | Present the first outer down at normal desktop scale. Before any cue is pointed out, record whether a first-time pilot can locate the teammate, name or join the correct ring, and explain which visual cue they used. If the arena text consistently stalls that decision, try moving the label clear of the wall and burst, then repeat the same scene and a fresh one. |
| 2. Identify why an attempted rescue has stalled | Inside the correct angular window on the wrong rail, progress stayed at zero. Matching the rail made the progress indicator change in both motion settings. The agent knew the rule and received snapshot assistance. | Record what an unfamiliar pilot expects when aligned on the wrong rail, how they change depth, and whether they independently identify advancing or reset progress. If the on-screen guidance is missed, test a more local match-ring cue and preserve the existing progress cue in both motion settings. |
| 3. Assess the approach risk under ordinary pressure | One ordinary attempt traded middle coverage for an outer rescue and ended before progress. Three stationary teammates constrain what this run says about crew strategy. The elapsed time alone gives no reason to change rescue timing. | Observe at least one fresh attempt with a moving crew. Record whether the rescuer sees a viable route, whether they wait or commit, and whether their reason matches the threats on screen. Link each interpretation to an observed decision. |

The browser session confirmed the flows above and generated priorities for
human testing. It produced no human comprehension, difficulty, comfort or
four-player coordination measurements. There was no runtime change.

## Ready-to-run human retest

Allow about ten minutes with one unfamiliar desktop keyboard player and three
crew members or controlled clients. Give the player a room code in a fresh
private room and use default pace. Let them choose a pilot and a motion preference.
Write down the build, room settings, roster, who controls each slot, and any
help. Use [the local run guide](../README.md#play-without-docker) to prepare the
session. If using controlled peers, record that they act autonomously and can
complete a rescue independently.

1. Say “Join the crew and start a run.” Observe entry, selection and readiness.
2. Say “Try to get everyone through together.” Let the first natural run play.
   Record the first depth choice and why the player made it. On a down, record
   what they notice and what they do before supplying a hint. If the run ends,
   ask “Start another attempt with the same crew” and observe retry.
3. If there was no recoverable down, reset to a fresh room. While the player is
   active on the desired rail, have that client trigger **Rescue scenario**
   under **Local test tools**. A facilitator can operate that button so the
   player does not have to read the debug menu. Log the constructed setup and
   any autonomous peer rescue. Say “Continue the attempt with your crew.”
   Observe whether the player finds the marker, changes depth, and can describe
   the progress or the threat that made them leave. If a pilot stays stalled for
   about ten seconds, first ask what they were trying to do. Then give the
   smallest necessary hint and log the time. Keep assisted success distinct.
4. Ask “What did you think the marker meant?” and “What told you to move, stay,
   or leave?” Replay the most important unclear moment once with the same starting
   state and the other motion setting. Capture order and any learning so the
   second attempt can be interpreted accordingly.

Log time, participant action, visible state, exact hint if any, and the player’s
own explanation. Save genuine reactions separately from facilitator hypotheses.
The [Delve Together playtest record](playtest-delve-together.md) retains the earlier
creator feedback and historical interview plan.
