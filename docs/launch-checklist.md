# Cold Signal local release review

**Decision:** Local desktop browser review is the current handoff. GamePix is
the later distribution target. The imported [Delve Together release plan](launch-checklist-delve-together.md)
records November 22, 2026 at 8 p.m. Pacific (America/Los_Angeles) as the
creator's candidate goal. Separate jam rules and a GamePix review window remain unknown.

**Scope:** Two or four keyboard pilots join a private room by six-character
code. Four pilots and 0.5× pace are the defaults. The crew survives a
three-ring tunnel together, with shared pause, retry, and interruption.
A Node.js process serves the game and runs authoritative WebSocket rooms.
The verified target is the local Node server and desktop Chrome.

**Candidate:** Cold Signal 0.3.0 at `9a6fd898d6548e9be90d5b1405b1b805b96c1772`. The
[candidate manifest](../evidence/skill-trials/launch/candidate.json) pins the
tested source bytes, Node and Chrome versions, server settings and captured
artifacts. See the [source handoff](release/local-browser-review.md) for
launch instructions, listing copy, screenshots and credits.

**Status keys:** Pass = checked on this candidate and environment. Fail =
observed defect or known incompatibility. Untested = evidence unavailable.
N/A = outside the stated review scope.

## Local player path

| Priority | Check | Status | Evidence |
| --- | --- | --- | --- |
| Must | Source identity and review configuration | Pass | The source manifest includes runtime hashes and pinned dependencies. The normal server exposed no test tools. Analytics was off and no study log was created. |
| Must | Fresh entry, room code, lobby and keyboard focus | Pass | Four fresh Chrome clients entered by keyboard, selected their pilots and reached arena focus after everyone readied. [Normal review](../evidence/skill-trials/launch/local-review.json). |
| Must | Orbit, one-tap depth changes, auto-fire, Space and controls guide | Pass | P1 orbited, hopped to middle and cast Shockwave. Every pilot fired automatically. The [four-client check](../evidence/skill-trials/launch/four-client-browser.json) also covered keyboard aliases, end stops and all four abilities. |
| Must | Representative attempt, outcome, retry, leave or regroup | Pass | The ordinary opening ended in a crew loss at 11.292 simulation seconds. The next run restored the crew and abilities. Constructed rescue and all-active final clear agreed across all four clients. [Normal review](../evidence/skill-trials/launch/local-review.json), [four-client check](../evidence/skill-trials/launch/four-client-browser.json). |
| Must | Loss, crew interruption and reset | Pass | Reloading a pilot interrupted the other three clients. The reloaded client and the lead using Leave Room returned to entry. [Normal review](../evidence/skill-trials/launch/local-review.json). |
| Must | Shared pause and sound gesture, mute and resume | Pass | Escape froze all clocks. Web Audio suspended on shared pause and mute and resumed on each return. The UI check also covered mute through ready and retry. [Normal review](../evidence/skill-trials/launch/local-review.json), [UI check](../evidence/skill-trials/launch/ui-browser.json), [audio check](../evidence/skill-trials/launch/audio-browser.json). |
| Must | Resize, reduced motion and retained critical cues | Pass | The 1440 × 900 review resized to 640 × 480 and captured a reduced-motion pause with reachable Resume. The UI check exercised compact entry, selection and play. Presentation tests covered essential cues. [Capture](../evidence/skill-trials/launch/reduced-pause.jpg), [UI check](../evidence/skill-trials/launch/ui-browser.json), [test summary](../evidence/skill-trials/launch/node-tests.txt). |
| Must | Current listing, representative images and attribution inventory | Pass | The review handoff contains current copy, native captures and credit and notice sources. |
| Should | New-pilot rescue comprehension, comfort and full crew coordination | Untested | The [human retest](playtest.md#ready-to-run-human-retest) is prepared. Agent and constructed checks cover mechanics. |
| Should | Cross-device LAN, browser coverage and longer performance observation | Untested | Evidence covers local desktop Chrome. |
| Scope-dependent | Persistent run/score, mobile controls, matchmaking and host migration | N/A | The local release scope promises private keyboard rooms and fresh attempts. |
| Scope-dependent | Hosted player, accounts and ads | N/A | The local review uses a loopback server. See the separate GamePix checks. |

## Later GamePix candidate

Official pages checked on November 19, 2026 Pacific. The submission guidelines
call for a loading screen, relative resources, a minimum 640 × 480 iframe
test, representative icon and cover imagery, and appropriate visibility and
audio behavior. They allow SDK-free games as well as the GamePix and Xsolla
SDKs and bar external analytics and ads. The developer page presents the
SDK-based path. If that path is chosen, the JavaScript integration guide
requires pause/resume callbacks and muting on pause. SDK-free distribution and
requirements for this title still need confirmation. [Submission guidelines](https://partners.gamepix.com/guidelines/submission),
[Developer program](https://partners.gamepix.com/developers),
[JavaScript SDK guide](https://partners.gamepix.com/sdk/doc/javascript).

| Priority | Check | Status | Evidence or next action |
| --- | --- | --- | --- |
| Must | Gameplay from a static upload of the current client | Fail | The client opens `/ws` at its own origin. The Node server supplies that transport and serves the shared rules as `/rules.js`. An upload of `public/` alone omits both. |
| Must | Allowed route from the processed iframe to an authoritative backend | Untested | The SDK guide discusses developer backends for complex multiplayer data. Cold Signal's same-origin route, permitted external WSS origin/proxy, and deployment configuration need confirmation for this player. |
| Must | Platform lifecycle, loading, visibility and audio | Untested | Confirm the integration path and test loading, visibility, shared pause and audio in the real player. If ads are required, put them at attempt boundaries and verify the crew stops together. |
| Must | Actual processed iframe, keyboard focus and device scope | Untested | A local 640 × 480 viewport test leaves iframe delivery and host focus unverified. Confirm desktop-keyboard eligibility and repeat the critical path in the processed player. |
| Must | HTML5 upload and listing fields | Untested | Confirm the dashboard's package format, entry path, limits and icon/cover specifications. The public guidelines specify `.gpx` for Unity. The JavaScript format remains open. |
| Must | Candidate package, hosted version and processing time | Untested | GamePix packaging and hosting are pending. Confirm the requirements and leave time for processing and a fresh room-to-retry pass before any submission decision. |

Establish the hosted WebSocket path and target eligibility before packaging the
client. Keep the current local source candidate available while resolving
that route. Defer accounts, ads decisions and host-specific integrations
until the distribution path is established. This handoff covers preparation and local verification. Upload, review submission and public release are future decisions.
