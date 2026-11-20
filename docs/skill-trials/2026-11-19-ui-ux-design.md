# Skill trial: Room setup, pilot selection and keyboard recovery

Status: candidate tested

## Reproduction

- Date and reviewer — 2026-11-19, Codex UI/UX trial subagent.
- Skill name, metadata version and Git commit — `ui-ux-design` v1.0.0 at `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`.
- Skill dirty diff — Clean at trial start.
- Cold Signal Git commit and dirty diff — `7354874`, clean at trial start. The baseline driver was added before the app assets changed.
- Model, effort and agent — `gpt-6.2-sol`, high reasoning, Codex subagent.
- Trial brief — “Run actual browser UI audit -> fix a bounded set of concrete high-impact defects -> verify real candidate entry-to-room-to-run-to-outcome/retry/recovery. Preserve approved navy/cyan/violet visual identity, fully locked camera, existing rules/co-op capacities and supported desktop keyboard controls. Prioritize usable entry/selecting/blocked/paused/outcome/interrupted states and exact controls over decoration.” Supplied inputs included the current game, [design](../design.md), [art direction](../art-direction.md), [architecture](../architecture.md), and [browser verification](../verification.md). The trial brief identified selector hit testing, short-pane ability descriptions, the pilot radio group and explicit muting as hypotheses to reproduce.
- Acceptance — Confirm the issues in a real browser before editing. Repeat the entry and recovery paths at 1440×1000 and 640×480 CSS px. Check pointer targets, keyboard focus and Space, error correction, settings during Ready and retry, shared pause, and the ability to recover after a peer disconnect. Use the default game UI. Exercise clear and wipe through labeled dev scenarios.

## Baseline evidence

Actual artifacts are in `artifacts/skill-trials/ui-ux/` in the trial checkout. [Baseline trace](../../evidence/skill-trials/ui-ux/baseline.json), [compact entry](../../evidence/skill-trials/ui-ux/baseline-entry-640.jpg), [compact picker](../../evidence/skill-trials/ui-ux/baseline-lobby-640.jpg), [interrupt panel](../../evidence/skill-trials/ui-ux/baseline-interrupted-640.jpg).

| Priority and state | Observed friction and player cost |
| --- | --- |
| Blocked, configuring entry | At both sizes, selector centers hit the arena. At 640×480, actual mouse clicks failed to focus either select. The pointer could create a default room but could not choose the other size or pace. |
| Substantial friction, selecting and waiting | ArrowRight left Mara focused and selected. Tab moved to Ivo and Space selected him. All descriptions were hidden at 640×480, preventing a player from comparing the unfamiliar abilities using the panel alone. Pressing Ready moved focus to the arena behind the picker. |
| Substantial friction, preference | After toggling Sound on and off using Chrome’s real audio context, creating the room showed Sound On. Ready and retry also showed Sound On. An explicit mute choice did not survive room actions. |
| Substantial friction, paused and resolving | The arena retained focus in shared pause, a constructed clear and a peer interruption. Pressing Up while paused sent one active depth input to the server. Simulation time stayed frozen. The interrupt prompt described leaving while the action lived in the HUD. |

The browser also recovered after a wrong code, showed a room-full error, accepted duplicate pilots, and supported a retry after each outcome. The baseline driver used a programmatic option selection after checking pointer focus so it could continue through a two-player, 1× room. The UI/UX guidance directed the trial to both visible content and actual interaction. No reusable instruction failure was observed.

## Candidate and comparison

The game implementation restores pointer hit targets, gives the existing radio group arrow selection and one Tab stop, and uses descriptions from the rules in all four pilot cards. The compact card layout retains the room HUD and brings all four descriptions and Ready into one pane. Waiting shows the ready count and keeps focus on Ready. Entry errors continue to allow correcting a code in place. Focus follows changes between play, pause, pilot selection, and recovery. Gameplay keys only act while the arena is focused in live play, and losing arena focus clears held input. An explicit mute choice takes precedence over automatic audio activation. [Room and keyboard contract](../ui-ux.md).

- Candidate skill patch, reusable instruction change and unaffected skill scenario — The trial used the same pinned skill for the baseline and candidate. The candidate is a game change.
- Same inputs — The same Chrome driver compared room setup, keyboard selection, readiness, settings and recovery. The existing four-client check covered the default four-pilot, half-speed room, controlled crew slots, and normal combat inputs.
- Outcome — The two selector centers were hittable at both sizes and a real compact pointer click focused each. ArrowRight moved focus and selection to Ivo. Tab advanced directly to Ready and Shift+Tab returned to Ivo from the waiting state. The compact descriptions drew at 11 CSS px and the intended viewport captures showed Ready without scrolling within the overlay. Resizing the open picker retained Ivo and focus. The host’s audio context stayed suspended into play and through retry. A paused Up press sent no active gameplay input. Resume used Space and restored arena focus without casting or changing depth. The clear and wipe produced fresh runs, and a real crew disconnect put focus on Leave Room. Leaving and creating a different room worked from the keyboard.
- Checks — `node scripts/ui-ux-check.mjs candidate`, `npm test` (59 passing), `COLD_SIGNAL_URL=http://127.0.0.1:5187 npm run test:browser`, and `git diff --check`. The existing four-client check now targets the interrupt panel’s Leave Room button and checks that all four compact descriptions and Ready fit.
- Evidence — [Candidate trace](../../evidence/skill-trials/ui-ux/candidate.json), [compact picker](../../evidence/skill-trials/ui-ux/candidate-lobby-640.jpg), [pause](../../evidence/skill-trials/ui-ux/candidate-paused-640.jpg), [interruption](../../evidence/skill-trials/ui-ux/candidate-interrupted-640.jpg). The raw candidate captures and full browser report are under ignored `artifacts/`.
- Review type — Scripted Playwright interaction through actual Chrome, visual self-review at CSS size, and constructed authoritative outcomes through the existing developer buttons. No human playtest.
- Remaining uncertainty — Unaided discovery, screen-reader announcements, physical-device readability, and other browser engines remain open. Preferences were checked in one page session.

## Contribution

- Upstream branch / PR and portable scenario — No skill patch.
- Cold Signal evidence / implementation — This commit includes the game changes, UI interaction check, and compact browser evidence.
- Pocket Studio pin — `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`.
