# Delve Together — 0.2 local verification

Evidence date: 2026-11-18. Candidate: local 0.2.0, uncommitted project files on
`codex/tempest-hexagon-jam`. The creator described the original prototype as
“incredibly fun”; that is human feedback on 0.1, not acceptance of this variant.

## Current identity

- Backend image: `sha256:d80ef2de7b6b37ff2640e78217ba7e52b0106d62cb94345a832705de97032075`.
- Web image: `sha256:7118784c1e2b19777559aa2c6b7b140da93ff8a5e897b1dc5d7afef1019ee66f`.
- Authoritative rules SHA-256: `af868f391338c42ef12444cb6deb1151d21cd281251c2969852c584a73043592`.
- Docker Engine 28.4.0 / Compose 2.39.2, Linux ARM64 containers.
- Four-browser agent check: Chrome 157.0.8103.80. Native rule test runtime:
  Node.js 20.11.0. Source/lockfiles pin package dependencies and base manifests.

The main two-container stack is healthy on `http://localhost:5173`. The preserved
0.1 images run in their own Compose network on `http://localhost:5174`. Neither
stack requires AGS or calls a cloud service. The optional LAN bind is opt-in;
its configuration was validated without enabling it. Cross-device LAN play has
not been verified.

## Commands and results

From `projects/arcade-jam/game`:

- `npm test`: **26 checks passed**. Includes automatic fire, stopped/reversed
  steering, all four abilities, overlapping support, rescue by any pilot,
  cooldown/held-key behavior, global half-speed ratios, all-four-active victory,
  last-stand overtime, room capacity, selection, pause, disconnect, and replay.
- The actual server-input replay still matches headless state at every tested
  checkpoint. This short tape establishes its tested scope, not every possible
  future rule/network/engine change.
- `npm run test:browser`: **four independent browser clients passed** selection,
  readiness, automatic fire without Space, all four Space abilities and shared
  cooldown state, steering, pause, constructed rescue, shared outcomes, clean
  retry, and interruption on one crew disconnect. All four received an identical
  authoritative snapshot. Browser errors: none.
- Observed simulation-time / active wall-time ratio was about
  **0.508** in a short check, supporting the configured 0.5× clock.
  The HUD shows a three-minute target and real-second cooldowns.
- The acceptance pass caught a dropped very short Space tap. Input edges are
  now queued until a simulation tick; a quick press/release test and the
  four-browser retry both passed. Holding the key still does not recast.
- Three separately launched controlled browser clients joined and readied with
  the human client's room. Menu, selection, ability HUD, and gameplay were
  checked at 640×480. These are local layout checks, not hosted GamePix evidence.

The rescue, final-clear, and wipe checks use **labeled constructed fixtures**.
The rescue fixture resets current threats and exposes one downed crew member;
its completion used actual A/D proximity while automatic fire continued. A
natural three-minute human clear has not been observed. A lobby-only visual
preview correction uses the selected roster and configured crew size.

Runtime reports, source checksums, screenshots, and image records live in
ignored `game/artifacts/`. They are reproducible through the documented
commands. Recheck affected evidence after code/config changes.

## Preserved comparison and limits

[The 0.1 record](verification-v01.md) contains the original 15 checks and the
bounded eight-case rescue diagnostic. Those results retain their original code
identity. The current narrow balance command explicitly uses two pilots at
full speed without abilities; it cannot establish four-player character balance.
No new difficulty sweep or automatic tuning was done for this experiment.

All four characters share basic guns, movement, and proximity rescue. Their
powers overlap in defense, offense, positioning, and recovery. Duplicate picks
are allowed. This is an implemented starting point; no character ranking,
required composition, or human preference has been established.

Next: the creator tries two characters in a four-player 0.5× room with controlled
crew and reports what changed about the rescue decision and pace. A later
four-human session is needed for natural coordination evidence. AGS/Extend,
GamePix hosting, physical audio/latency measurements, and public release
readiness remain outside the verified local result.

Historical record retained when 0.3 was built. Generic `four-player-*.png`
screenshot filenames were reused by the later acceptance script; they now show
the newer build. The original 0.2 browser JSON and Docker images retain their
version identities. Do not attribute the latest screenshots to this old record.
