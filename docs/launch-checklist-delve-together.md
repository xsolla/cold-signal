> Imported planning record from the Delve Together phase. See [Cold Signal](../README.md) for current run instructions.

# Delve Together — release preparation

**Status:** Local Docker first playable verified. GamePix candidate packaging,
hosted verification, submission, and publication remain pending. Local results
below apply only to the identified build in `verification.md`.

**Release scope:** Keyboard browser co-op for four players joining by private
room code; smooth immediate A/D orbit, W/Up and S/Down depth jumps, automatic fire and Space abilities, same-depth proximity rescue
while shooting, distinct enemy behaviors, readable fast patterns, stark
high-contrast presentation, tight percussion, and a roughly three-minute real-time gauntlet at global 0.5× pace.
Difficulty should take several learning attempts. Rescue is a dangerous
comeback gamble that often fails. Victory requires clearing the final surge with all crew active.

**Target:** GamePix. No named competition or separate jam rules have been
provided; do not claim competition eligibility.

**Deadline:** Sunday, November 22, 2026, at 8 p.m. Pacific
(America/Los_Angeles), selected by the creator. GamePix review and publication
timing are external dependencies.

**Title:** Delve Together, supplied by the creator.

**Promised device/input scope:** Keyboard desktop browsers; touch/mobile is not
promised. Record actual browser versions and devices tested before making
specific compatibility claims.

**Candidate identity:** Local 0.1.0 with runtime/source identities in
`verification.md`. No GamePix processed upload/version exists. Changes
invalidate affected checks; local passes do not establish hosted readiness.

## Current official sources

Checked 2026-11-18:

- [GamePix submission guidelines](https://partners.gamepix.com/guidelines/submission)
- [GamePix JavaScript SDK guide](https://partners.gamepix.com/sdk/doc/javascript)

The submission guidelines require relative asset paths, loading feedback,
iframe compatibility including a 640×480 check, compliant SDK use, and correct
audio/pause handling. SDK eligibility and external backend access for this
architecture remain unresolved. The SDK guide defines lifecycle callbacks and
local simulation; a simulated local result does not prove hosted behavior.
See [platform notes](platform-notes.md) for the detailed integration questions.

Statuses: **Pass** means checked on the identified candidate/environment;
**Fail** means an observed failure; **Untested** means evidence is absent or
stale; **N/A** means outside the current promised scope, with a reason.

## Candidate and player path

| Priority | Check | Status | Required evidence / next action |
| --- | --- | --- | --- |
| Must | Candidate and configuration identity | Untested | Build/export the actual game; identify files, source, configuration, and package |
| Must | Fresh browser launch and keyboard focus | Pass | Local Docker/Chrome agent pass exercised A/D + Space; GamePix player remains untested |
| Must | Create/join private room and handle invalid/full room | Pass | Real sockets and two browser clients; room-expiry UI remains untested |
| Must | Local real-time connection | Pass | Two Docker services, authoritative WebSocket state, two-client agreement; Extend is deferred |
| Future hosted release | AGS/Extend and external host integration | Untested | Current local scope requires no AGS access; verify the eventual live architecture separately |
| Must | Downing and exposed rescue | Pass | Constructed agent scenario completed through actual positional input while firing; human tactical/readability evidence pending |
| Must | Both-active outcome, loss, and shared retry | Pass | Rule tests plus constructed final/wipe browser scenarios; natural full-run human clear pending |
| Must | Partner disconnect and return path | Pass | Local agent pass interrupted the run, showed disconnect, and returned to a fresh room |
| Must | Shared pause/recovery | Pass | Local pause button froze both clients; GamePix lifecycle callbacks remain untested |
| Must | Audio start, mute, and resume | Untested | Test player-initiated audio and platform/visibility interruptions |
| Must | Three-ring geometry, center sanctuary, and rail threats | Pass | Rule checks plus four-client depth input and constructed tunnel scenario; human cue readability remains pending |
| Must | Display and resize | Pass | Local desktop and 640×480 screenshots/DOM bounds; human cue comprehension and hosted layout pending |
| Must | GamePix processed player | Untested | Repeat the critical path against the actual hosted candidate/version |
| Should | Stable performance and readable effects | Untested | Observe a complete representative attempt with intended effects and quieter settings |
| Scope-dependent | Mid-run persistence | N/A | No mid-run save or persistent progression is promised; make reset behavior explicit |
| Scope-dependent | Public matchmaking, mobile controls, host migration | N/A | Outside the selected private keyboard co-op scope |

## Listing, assets, and submission

| Priority | Item | Status | Remaining work |
| --- | --- | --- | --- |
| Must | Final title and truthful listing | Untested | Apply the creator's title and chosen victory rule; verify copy against the candidate |
| Must | Current platform requirements | Untested | Sources are reviewed; candidate compliance and SDK eligibility are still unverified |
| Must | Credits and asset/music sources | Untested | Inventory actual assets, permissions/notices, and representative promotional material |
| Must | Icon, cover, and screenshots | Untested | Produce from/representative of the actual game; verify current submission formats |
| Must | Final package and processing allowance | Untested | Package the tested revision and leave time for upload, processing, and a fresh check |

Draft copy, pending the actual candidate and final rule:

> Four pilots. Three depths. Read fast-changing threats, cover your partner, and risk
> everything on a rescue. Survive a short escalating gauntlet of stark shapes
> and tight percussion. A/D orbits; W/S changes depth; ships fire automatically; Space activates a character ability. Match a downed partner’s ring and stay near them to
> rescue them while you keep firing. Four keyboard players join by room code. Choose from four pilots with overlapping abilities.

This copy describes intended features, not a verified available release. Final
copy must state internet/partner requirements, supported environments, reset
behavior, controls, and known limitations accurately.

## Handoff and blockers

The local loop is implemented and technically verified. GamePix release
blockers are the unverified hosted/backend integration, missing final listing
assets/package, and pending human readability and balance feedback on the 0.3 tunnel. AGS access is deferred
and does not block the current local playtest. Title, final-clear rule, and deadline are selected. Rank observed defects only after evidence exists.

The ten-hour plan reserves 1.5 hours for candidate preparation plus 1.5 hours
of contingency. Freeze optional content before spending those reserves.

**Action scope:** Prepare a concrete package, copy, assets, and evidence.
No external submission or publication has been performed. Any required release
decision should concern the actual reviewable candidate and reuse existing
authorization rather than introduce a premature permission request.

**Next action:** Execute the network/platform feasibility milestone and
complete the minimal cooperative attempt. Revisit this
checklist against the resulting candidate.
