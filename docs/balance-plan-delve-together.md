> Imported planning record from the Delve Together phase. See [Cold Signal](../README.md) for current run instructions.

# Delve Together — balance preparation

Prepared using `time-bandits-game-balance`, created by the Time Bandits team.

**Mode and status:** Local shared-rule baseline recorded. The actual server
and headless diagnostics import `game/src/rules.js`. A recorded live-server
input tape matches headless state at every tested tick. Eight constructed
rescue-policy cases ran with unchanged tuning. No human session has run; no
standalone synthetic demo values were used as project evidence.

## Player decision and targets

The concrete decision is when to leave threat coverage and risk approaching a
downed partner. The creator chose proximity rescue with shooting still enabled
and a roughly 90-second finite gauntlet. The first playtest asks whether this
creates a readable, tense choice.

Targets selected by the creator:

- Difficulty: several learning attempts for an arcade-minded new pair.
- Rescue payoff: a dangerous comeback gamble that often fails.
- Inspiration: Left 4 Dead's cooperative design philosophy.

These are qualitative creative targets. Do not invent an approved completion
percentage, reaction time, rescue duration, or player skill distribution.

## Left 4 Dead research and original application

Primary source checked 2026-11-18: Michael Booth, Valve,
[Replayable Cooperative Game Design: Left 4 Dead](https://cdn.akamai.steamstatic.com/apps/valve/2009/GDC2009_ReplayableCooperativeGameDesign_Left4Dead.pdf).

The talk emphasizes team dependence and enemy abilities that create cooperative
problems (slides 14–21), incapacitation as an opportunity for a teammate's
heroic intervention (slide 21), and pressure peaks alternating with lower-threat
periods (slides 36–41). It describes constrained variation to support replay
(slide 34). These principles do not establish any rescue success-rate target
for our game.

Our proposed application is original arena design:

- Give each compact enemy behavior a cooperation purpose: demand coverage,
  disrupt an expected route, or make a rescue position dangerous.
- Build short scripted pressure dips into the 90-second sequence. Keep steering
  and rhythmic energy immediate while briefly reducing overlapping demands.
- Keep rescue deterministic when proximity/time conditions are satisfied.
  The gamble comes from approaching and remaining exposed to visible threats.
  Preserve shooting during rescue as the creator specified.
- Begin with simple encounter ordering for a reproducible baseline. If time
  permits later, use constrained variations that preserve readable escape
  opportunities. No adaptive Director implementation is part of the first plan.

These are recommendations, not implemented rules or findings. The creator selected every crew member active for the final clear, so a solo survivor
must still rescue their partner to achieve team victory.

## Current prerequisites

| Milestone | Current evidence | Next useful artifact |
| --- | --- | --- |
| Find the real rules | Verified `game/src/rules.js`, JavaScript, imported by local server | Identify actual movement, collision, enemy/hazard, down/rescue, and outcome code and tuning |
| Record a baseline | `npm test` replay agreement and `npm run balance` baseline passed | Minimal shared-rule replay command with controlled time and scenario/randomness |
| Compare legal choices | Eight labeled constructed cases, two current-state policies; no natural-run human evidence | Bounded rescue-now versus wait-for-opening comparison with explicit information limits |
| Check fresh evidence | One fresh diagnostic encounter; no candidate tuning was selected | Frozen candidate checked on a different encounter not used for selection |
| Decide | No measured outcomes | Conditional result, uncertainty, and a playable human comparison |

## Smallest useful experiment

Start with the unchanged implemented rules. Replay one fixed input sequence
through live and headless execution and compare critical state at checkpoints.
Use the actual authoritative language/runtime, importing the same rules where
possible. If rules remain engine-dependent, run the engine headlessly. Do not
translate them into a separate Python model merely to obtain convenient output.

Then choose a bounded rescue encounter from an actual trace, or explicitly
label a constructed downed-state encounter as a diagnostic fixture. Compare
immediate approach with waiting for a visible opening, using only information
the player can observe. Distinguish a fixed scripted trace from an adaptive
policy. Scripts do not reproduce human perception, skill, or coordination.

Hold encounter identity, initial state, game version, rules, and time step
fixed. If tuning is needed, change one rescue parameter, keep policy code fixed,
freeze the candidate after screening, and reserve a fresh encounter for the
check. Record what is genuinely matched if gameplay diverges.

Measure attempted/completed/interrupted rescues, exposure time, restored
crew active time, and remaining progression or outcome. Separate normal
team losses from invalid inputs, crashes, network failures, and capped runs.
Do not turn a diagnostic scenario into a population completion rate. Distinguish
a readable tactical failure, an unreachable rescue, and an unclear rule. The
creator's target allows frequent failed rescues; improving the raw completion
percentage is not automatically an improvement. Check whether always delaying
or abandoning rescue dominates under the selected team-victory rule.

## Budget, records, and decision

The plan reserves 0.5 hours for this focused pass, relying on shared-rule work
from implementation. If runner fidelity is not established, report the missing
prerequisite and inspect actual rule traces; do not present guessed outcomes as
simulation or expand into an unbounded harness project.

Future results must identify code/tuning, input or policy revision, scenario or
seeds, time step, stop rules, exact command, and artifacts. Check replay
determinism and that tracing does not alter results. Keep changing results
outside the installed skill. An interactive explorer is optional only after
real results exist; it is not a prerequisite for this small decision.

Numerical comparisons can show what happened under tested inputs. The creator's
playtest still judges readability and tension. A controlled second client
supplies no second human reaction. The baseline demonstrates conditional success/failure windows; it does not
justify population difficulty or enjoyment claims. See [the 0.3 verification record](verification-v03-delve-together.md)
for the observations and policy limitations.

## 0.2 experiment scope

The creator requested four players, automatic shooting, Space-triggered
character abilities, and global 0.5× simulation speed. Every character shares
the basic gun, movement, and proximity rescue. Preserve the initial enemy and
pattern tuning for the first comparison; no difficulty retuning or character
ranking is justified yet. Ability values are provisional.

The eight-case 0.1 fixture record is historical. The narrow diagnostic command
now explicitly uses two pilots at full speed with current rules and no power
inputs. It cannot establish four-player balance. Current technical checks cover
half-speed movement/projectile/timer ratios, all four powers, shared rescue,
short Space taps, cooldown/reset behavior, capacity, and all-active victory.
The next useful evidence is the creator's ability/pace comparison, followed by
a focused experiment only if an actual question remains.

## 0.3 tunnel experiment

Creator-directed expansion: three playable rails; smaller projected silhouettes
at depth; a protected central enemy preview; middle-rail skimmers and inner-rail
stalkers. These are initial implementations, not optimized or validated tuning.
All five enemy types remain in a bounded mix. Walls threaten all rails; rescue
requires matching the downed pilot’s depth. The inner rail offers shorter shots
and smaller silhouettes, but local pursuit and warning arcs create exposure.

Technical checks cover rail bounds, held/repressed inputs, actual-depth shot
origins, swept small-target hits, narrower distant hit windows, protected center
immunity, rail contact/zones, wall crossings, and same-depth rescue. This does
not establish difficulty or prove that no dominant safe strategy exists. First
watch whether the creator changes depth for a threat or rescue; only run a
focused tuning comparison if that reveals a concrete issue.
