> Imported planning record from the Delve Together phase. See [Cold Signal](../README.md) for current run instructions.

# Browser co-op and GamePix — feasibility notes

Status: updated 2026-11-18 for the creator's local-first decision. The Docker
web/backend stack is running and verified; AGS and GamePix hosting remain
unverified and are not local prerequisites. Focused work budget is ten hours.
See `game/README.md` and `verification.md` for the current runtime and evidence.

## Backend direction

The creator selected AccelByte Extend. Preserve that choice while determining
the specific runtime responsibilities and real-time connection.

[AccelByte's Service Extension documentation](https://docs.accelbyte.io/gaming-services/modules/foundations/extend/service-extension/)
describes a custom REST service implemented with gRPC and a gRPC Gateway. It
also points browser callers to CORS configuration. This supports considering
Service Extension for a custom game API; it does not by itself verify a
low-latency game-state transport or stateful match runtime for this project.
Do not assume WebSocket upgrades, an authoritative simulation loop, replica
affinity, or host migration work through the deployed Extend ingress.

Candidate architecture questions for the prototype-plan interview:

- Which match rules must run in Extend, and which run in the browsers?
- Should gameplay use an authoritative server or a host-authoritative browser
  connection? Preserve Extend in either proposal and explain its actual role.
- If considering browser peer-to-peer play, inspect the documented AGS
  Session/Lobby signaling and TURN/STUN path before adding a custom relay.
- Verify the actual configured transport with two browser clients, then with
  a restrictive-network or forced-relay case if peer-to-peer is chosen.
- Define timeout, partner disconnect, pause, and retry behavior. Public
  matchmaking and host migration are proposed cuts, not accepted decisions.

Only conceptual/local planning has been performed; live authentication was not
required. The creator has confirmed existing namespace access and enabled
Extend capability; these have not been independently verified. Do not put
server credentials in the browser bundle.

## GamePix requirements that affect the design

Sources checked on 2026-11-18:

- [Submission guidelines](https://partners.gamepix.com/guidelines/submission)
- [JavaScript SDK integration guide](https://partners.gamepix.com/sdk/doc/javascript)

The guidelines restrict bundled SDKs to GamePix and Xsolla SDKs. They do not
explicitly establish the eligibility of the AccelByte client SDK by name.
Confirm that eligibility before bundling it. Direct browser API calls with
backend-only SDK use are another implementation candidate, not proof of
platform approval. The JavaScript guide discusses using a backend for complex
state, including multiplayer; confirm this game's external service access in
the actual GamePix player.

Pause gameplay and mute audio on the required platform callbacks. Ads belong
between levels/attempts. Interpret this for co-op before implementation:
one player's platform interruption must not leave them taking unavoidable
damage while their partner continues. A synchronized pause/ready flow is a
candidate to test, not an implemented solution.

Package resources with relative paths, include loading feedback, and verify
the game in an iframe at least 640 by 480 pixels. Test resize, keyboard focus,
visibility changes, audio start/resume, and the processed hosted candidate.
Keyboard is the approved input; mobile/touch support has not been promised.

The guidelines accept complete games rather than drafts/demos. The weekend
target should therefore be a small complete candidate prepared for submission.
GamePix review and a public release date are external dependencies; do not
promise approval within the weekend.

## Early feasibility checks

Current state:

1. Budget and account availability: creator reports ten hours and both accounts
   available. Live authentication and enabled capabilities remain unverified.
2. Four-player shared threat coverage and exposed rescue are selected. Detailed
   rules and the complete join/start/retry flow remain proposed.
3. Establish Extend's role and prove the selected real-time connection.
4. Resolve SDK eligibility and test external calls in the GamePix runtime.
5. Exercise shared interruption/recovery with two clients.
6. Build the content set only after the minimal cooperative slice works.

Local agent checks and a bounded shared-rule diagnostic have run. The creator
reported the 0.1 prototype was fun. Four-human play, 0.2 human acceptance, and
GamePix release verification remain pending. Keep those evidence states visible as the project grows.
