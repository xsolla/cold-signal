# Delve Together — first playable plan

**Question:** Can four players cover distinct threats and make a readable,
risky rescue while responding to fast patterns?

**Current starting point:** A local 0.3 three-depth tunnel now exists in `game/`, with
separate Docker web/backend containers. The creator explicitly deferred AGS
access. Native JavaScript rules, server-authoritative WebSockets, private rooms,
rescue, outcome/retry, and controlled crew-client diagnostics are implemented. W/Up and S/Down jump
between three rails; perspective, protected center previews, and two new rail
enemies are included in this creator-requested iteration.
See `verification.md` for the tested build and limits. The timeboxes below are
the original plan, not a claim that all release work is complete.

**Budget:** Ten focused hours from one creator working with Codex. The timeboxes
below are planning limits, not benchmarked estimates or a release guarantee.
Existing account access reduces onboarding work but does not prove integration.
The creator explicitly expanded the original scope to four compact characters and four-player testing; cut optional systems and content
volume before weakening the selected cooperative experience.

**Complete loop:** Open browser game → create or join a private
four-player room → choose characters → everyone ready → move with auto fire and Space powers → cover threats or attempt an
exposed rescue → complete the gauntlet or all go down → see team result → everyone
ready for retry. Private room codes and the finite gauntlet are selected;
ready/retry is implemented locally.

## Scope

**Essential:** Four networked players (two-player option) in one arena, A/D orbit, W/S depth, auto fire and Space powers, distinct enemy
behaviors, a readable hazard pattern, downed state, exposed rescue, team outcome,
retry, essential feedback, audio controls, and partner interruption handling.
AccelByte Extend stays in the backend plan. Demonstrate its real role rather
than treating any successful REST call as working real-time multiplayer.

**Temporary:** Simple high-contrast shapes, a single fixed layout, scripted wave
ordering, and a small original/procedural percussive sound palette. The
first connected slice uses one enemy and one hazard. A local transport adapter
can isolate game-rule work, but does not establish online multiplayer or release
readiness. A controlled second client is a functional test tool, not an in-game
AI companion feature.

**Deferred — recommended cuts:** Extra arenas, upgrades, persistent
progression, public matchmaking, host migration, mobile controls, a standalone
boss, and custom operator dashboards. Account or network failures retain a
clear return/retry path rather than adding another mode.

**Selected rules:** Four-player rooms, automatic fire, Space abilities, global 0.5× pace, and smooth continuous orbit; stay near a downed partner's marker
briefly to rescue while still shooting; approximately 90-second escalating
gauntlet with a final surge. Immediate movement, stop, and reversal without
drift; stark high-contrast shapes with tight percussive pulses; private room
codes. Propose hold-to-repeat shooting, all crew down ends the run,
no automatic next-wave revival, and brief signaled revival protection.
Exact speeds, radii, protection, and rescue timing are provisional tuning.

**Qualitative targets:** Several learning attempts before a clear; rescue is a
dangerous comeback gamble that often fails. Inspired by the researched Left 4
Dead principles, propose a simple build/surge/lull sequence and enemy behaviors
with distinct cooperation pressures. Keep these additions inside the existing
content/pacing timebox. The final clear requires all crew active. The selected candidate deadline is
November 22, 2026, at 8 p.m. Pacific.

## Build order and timeboxes

The local connection, minimal loop, and compact enemy/pattern implementation
are verified by agent checks. Human feel/playtest and GamePix release work
remain open. Keep a runnable build after every step.

| Milestone | Depends on | Tasks | Playable proof / acceptance | Budget |
| --- | --- | --- | --- | --- |
| Connection and platform feasibility | First slice and transport choice | Verify intended live tool authentication; establish Extend's role; prototype the chosen transport; check GamePix SDK eligibility, origin access, and interruption constraints | Two clients exchange actual movement/input through the selected architecture; one browser reaches the intended Extend API; record direct/relay or server path and limits. GamePix hosted access remains explicitly untested until exercised | 1.5 h |
| Complete minimal co-op attempt | Connection proof; rescue and movement decisions | One arena, shooting, one enemy, one hazard, down/rescue, team outcome, ready/retry | Client A goes down; B reaches the exposed rescue position; both agree on revival. Both down produces one result and a clean shared restart | 2 h |
| Enemy variety and pattern sequence | Complete attempt | Add the two remaining compact behaviors and bounded pattern combinations; teach behaviors before mixing | Each behavior creates a different positional response; the chosen run can finish; a fresh run resets all threats and rescue state | 1.25 h |
| Game-feel comparison | Runnable representative sequence | Refine movement response, warning hierarchy, rescue progress, impact, audio, and reduced motion | Same recorded scenario can run with quiet and intended effects; essential cues remain readable and muted play works | 0.75 h |
| Playtest and critical fixes | Identified playable build | Run neutral tasks with the creator; use an agent-operated second client if no other human is available; fix blocked play or misunderstood rescue | Record actual observations, assistance, inputs, build, and outcome; retest the most consequential change | 1 h |
| Focused balance pass | Actual shared rules and useful traces | Examine whether rescue is plausible versus postponing it; use fixed scenarios and shared rule execution if available | Record real rule traces and comparison limits. Only call a simulation complete if a reproducible runner and replay agreement actually exist | 0.5 h |
| GamePix candidate preparation | Stable build and required fixes | Package, verify loading/iframe/input/audio/pause, prepare representative assets, copy, credits, and known limitations | Identify the exact candidate and mark checks Pass/Fail/Untested/N/A. Recheck affected evidence after changes; hosted checks require the processed host version | 1.5 h |
| Contingency | Blocker with highest player impact | Resolve a bounded connection, rescue, performance, or packaging failure; recheck its player path | A reproducible fix and remaining-risk record, or an explicit release blocker if unresolved | 1.5 h |

Total planned effort: **10 hours**, including integration, human checks,
packaging, and contingency. Do not spend the contingency on new content.

## Cut and stop points

- At 1.5 hours, if there is no credible verified connection path, record the
  precise failure and seek a focused architecture decision. Continue independent
  local rules work where useful, but do not call it a multiplayer candidate.
- At 3.5 hours, preserve a complete minimal attempt with rescue and retry.
  If it is incomplete, use the content timebox to close the loop first.
- At 4.75 hours, freeze content. Preserve distinct enemy responses with simple
  shapes and a small reusable pattern set. If fewer behaviors are proposed,
  explain the effect on the creator's enemy-variety priority.
- At 7 hours, prioritize release blockers and packaging. Do not remove exposed
  rescue or substitute single-player to disguise a missed scope target.
- If co-op or platform compatibility remains unresolved, deliver a truthful
  prototype/blocker record rather than claim the GamePix release is ready.
  Submission approval and a public date are outside the ten-hour guarantee.

## Try the first slice

**Setup:** Record build identity, browser/input, connection path, starting
positions, scenario seed or script, and reset steps. Use isolated test rooms.

**Technical checks:** Identical critical state on both clients; simultaneous
downing; boundary of rescue range; leaving before rescue completes; repeated
Space; conflicting A/D; revival inside a hazard; a partner disappearing during
rescue; one player pausing/muting; retry clearing prior input and state. Select
the actual expected rules before implementing these checks.

**Neutral human task:** "Complete an attempt together. If a ship becomes
disabled, continue as you think the game allows." Let the creator try before
explaining the rescue. Record any hint and assisted completion separately.

**Observe:** Which cues the creator uses, what they expect rescue to do, whether
the route feels chosen or forced, why a hit occurs, and whether effects obscure
the next decision. Do not infer a second human's reactions from an agent client.

**Next decision:** Keep the rule if positional rescue is understood and creates
an interesting choice; otherwise adjust its cue, exposure, or timing and replay
the same scenario. The creator's positive 0.1 report is recorded in `playtest.md`. The creator then called 0.2 “super fun” and requested this tunnel iteration.
The 0.3 technical record is in `verification.md`; human depth/readability feedback remains pending.
