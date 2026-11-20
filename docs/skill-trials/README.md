# Autonomous Pocket Studio trials

Review branch: `codex/autonomous-skill-trials`. November 19, 2026 Pacific.
The user asked for autonomous project changes with **GPT-6.2 Sol, high**
subagents, starting with agent scaffolding. Agent scaffolding completed before
any other skill trial began. Every trial ran in an isolated game worktree
with its own canonical Pocket Studio worktree.

## Changes by skill

Commit IDs below refer to the integrated Cold Signal history. Trial records
retain their original isolated inputs and commits. The prototype experiment
remains a proposal; the runtime changes in the other rows are implemented.

| Skill and trial | Result to review | Integrated commit |
| --- | --- | --- |
| [agent-scaffolding](2026-11-19-agent-scaffolding.md) | [Lean agent entry](../../AGENTS.md), [architecture](../architecture.md), current context, preserved historical records and two verified task traces. | `dac1c90` |
| [game-design-doc](2026-11-19-game-design-doc.md) | [Current one-page design](../design.md), rescue tradeoff and a discriminating human test. | `40d5bc1` |
| [prototype-plan](2026-11-19-prototype-plan.md) | [Two-hour rescue-window experiment](../prototype-plan.md), pinned baseline, one proposed cue, explicit cuts and a neutral comparison. Plan only. | `24fd042` |
| [game-feel](2026-11-19-game-feel.md) | [Reduced-motion Shockwave coverage](../game-feel.md) now spans the playable rails while the camera stays locked. | `969bf62` |
| [art-direction](2026-11-19-art-direction.md) | [Current style guide and comparisons](../art-direction.md), larger rescue lettering and separated crew tags. Independent review found an adjacent-rail regression; the follow-up reproduces and fixes it. | `7354874`, `4dc3c4f` |
| [playtest](2026-11-19-playtest.md) | [Actual agent session and human retest](../playtest.md), natural loss, separately labeled constructed rescue, retry and interruption; rerunnable browser driver. | `898488e` |
| [time-bandits-game-balance](2026-11-19-time-bandits-game-balance.md) | [Paired rescue diagnostics](../balance-plan.md): 15 qualifying first-down checkpoints, fixed seeds, two policies, complete denominators and unchanged tuning. | `1879115` |
| [generative-sound-design](2026-11-19-generative-sound-design.md) | [Audible A/B reel](../../evidence/skill-trials/sound/index.html), [mix evidence](../sound-design.md), bounded kill voices and preserved critical cues. | `f93091f` |
| [ui-ux-design](2026-11-19-ui-ux-design.md) | [Browser findings and captures](../ui-ux.md): clickable room options, keyboard pilot picker, compact ability descriptions, explicit mute retained and paused input blocked. | `8abd519` |
| [chatgpt-playtest-analytics](2026-11-19-chatgpt-playtest-analytics.md) | [Opt-in local rescue study](../playtest-analytics.md), durable bounded records and a validated report. Off by default; automated and diagnostic cohorts excluded from the default report. | `59b198a` |
| [launch-checklist](2026-11-19-launch-checklist.md) | [Current candidate checklist](../launch-checklist.md), listing material, exact checks and remaining hosted-platform gaps. | `d5be05b` |

## Review and reproduce

Begin with the current game and [UI captures](../ui-ux.md), then compare the
[visual calibration](../art-direction.md) and [audio audition](../sound-design.md).
The design and prototype plan explain what to test with people next. The
playtest, balance and analytics records distinguish actual actions, constructed
scenarios, scripted policies and untested interpretations.

[Verification commands](../verification.md#run-local-checks) include the new
`test:ui`, `test:audio:browser`, `playtest:rescue`, `balance:rescue`,
`audio:audition` and `analytics:report` npm aliases. Browser checks use installed
Chrome and local loopback servers. The art baseline can be replayed from
reachable ancestor `969bf62`; it has the same renderer as the original trial's
`19d8cfe`.

The prototype comparison is deliberately pinned to its pre-trial baseline.
If adopting the later UI/art changes before that experiment, choose a new
baseline and capture a fresh matched pair. Its static rescue-window ticks
have not been implemented or tested with people.

## Starting work and skill sources

The checkout initially had uncommitted Pocket Studio integration work.
Commit `839e8c3` preserves it separately from the trials; original HEAD was
`752efef`. No work was discarded. The [frozen suite input](../../evidence/skill-trials/suite-input.json)
records the exact request, source revisions and model settings.

The trial pin is Pocket Studio `3f8b752`, combining eleven canonical skills.
[Source provenance and local recovery](../pocket-studio.md#recover-the-local-trial-pin)
include a verified Git bundle. The baseline-plus-bundle recovery reproduced
the exact source tree. No upstream branch was pushed and no publication,
upload, submission or external messaging was performed.

The assembled skills passed all eleven structural/resource checks, 22 upstream
unit tests and packaging for all eleven skills. Those checks concern tooling.
The trials exposed project defects and a candidate regression; no reusable
skill-instruction correction was justified by the observed tasks. Skill source
instructions remain unchanged from their imported upstream versions.

## Final integration verification

The combined source candidate is `9a6fd89`. Final documentation and evidence
commits leave its runtime bytes intact. The [candidate manifest](../../evidence/skill-trials/launch/candidate.json)
records source and evidence hashes, environment and commands.

- **68 of 68 Node tests passed** on Node 20.11.0.
- The standard four-client, focused UI and audio browser checks all passed
  in Chrome 157.0.8103.80 against the combined source.
- A separate normal-start four-client pass reached a natural crew loss,
  retried, interrupted the run by reloading a peer, returned to entry, and
  checked audio mute/pause and compact reduced motion. Its first probe used
  an outdated hidden Leave selector; the preserved harness failure and
  corrected replay are identified in the [launch evidence](../launch-checklist.md).
- An independent Sol 6.2 high source review caught the compact adjacent-tag
  regression and a trial-only baseline reference. The tag correction is in
  `4dc3c4f`; reproduction and audio-suppression wording were corrected in
  `ed20b3c`. Final read-only review of `9a6fd89` found no additional actionable
  issues and did not repeat the browser tests.

[Launch handoff, listing and images](../release/local-browser-review.md) ·
[Full Node output](../../evidence/skill-trials/launch/node-tests.txt) ·
[Combined browser report](../../evidence/skill-trials/launch/four-client-browser.json)

These are representative agent trials, self-reviews and independent source
reviews. They are not a blind skill benchmark or human playtest. Four-human
coordination, newcomer comprehension, physical audio/display behavior,
comfort, cross-device LAN and hosted GamePix operation remain unverified.
