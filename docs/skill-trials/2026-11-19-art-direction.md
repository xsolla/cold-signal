# Skill trial: dense rescue readability

Status: observed

## Reproduction

- Date and reviewer — November 19, 2026 Pacific. Codex subagent, self-review.
- Skill name, metadata version and Git commit — `art-direction` v1.1.0 at `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`.
- Skill dirty diff or patch path — clean checkout.
- Cold Signal Git commit and dirty diff or patch path — `19d8cfe6b6734e274c4ae4ac219b4b29465b133c`, with no tracked changes at baseline start. A temporary dependency symlink was present and excluded from the repository. The renderer changes in this trial commit are the game candidate.
- Model, effort/settings and agent version — `gpt-6.2-sol`, high reasoning, Codex subagent. Model snapshot and app build ID were unavailable.
- Exact request and supplied inputs — “Refine or codify established visual grammar (do NOT reopen taste interview). Produce reusable current style guide at docs/art-direction.md with concrete runtime examples/identity motifs, hierarchy for enemies/crew/rescue/chain events and full/reduced motion, source locations, and a bounded dense-scene readability calibration. Use code/vector-native tools, no imagegen needed. Integrate a small supported readability refinement if warranted, respecting approved identity, and inspect actual-size desktop and 640x480 full/reduced candidate.” Inputs included the existing creator selection, source and game design, the original Cold Front and Black Signal arena studies, historical runtime imagery, and the art-direction skill’s production and worked-example references.
- Expected behavior and acceptance criteria — Use the approved identity to make a reproducible guide. Inspect actual visuals and the same dense rescue frame at the intended desktop and compact sizes in both modes. Modify one runtime visual issue only if evidence supports it. Check layout fit, camera and rescue text separately from any human recognition claim.

## Baseline evidence

- Actual artifact, capture or transcript path — [style guide with capture pairs](../art-direction.md), [baseline readings](../../evidence/skill-trials/feel-art/baseline-dense.json), [calibration driver](../../art-direction/skill-trial/dense-scene.mjs).
- Observed behavior — In the constructed close inner-rail rescue at 0.18 seconds into the effects, the `P1 YOU` ink bounds overlapped `P2 / INNER` by 34.1 square CSS pixels at 1440×1000 and 6.4 at 640×480. The compact rescue font measured 4.76 CSS px. Chain fragments and the down burst competed with the peach text in full motion. The same overlapping letters remained in reduced motion alongside the fixed Shockwave outline. The prior art comparison had also recorded close rescue labels crossing.
- Impact on developing Cold Signal — A player needs the downed pilot and rail while shots and wall gaps compete for attention. The same scene and draw instrumentation isolate a spatial presentation defect. The fixture is a fixed snapshot rather than a measured occurrence rate.
- Hypothesis about the skill instruction responsible — No reusable instruction failure observed. The approved-direction refinement and actual-size calibration guidance kept this trial focused on the existing identity and the smallest affected annotation.

## Candidate and comparison

- Candidate skill commit or patch — Same skill pin. Cold Signal draws rescue text above the crew layer with a navy stroke and an 8 CSS px font floor. Nearby active tags shift horizontally only when they cross the rescue text area.
- Reusable instruction change — None.
- Same-input comparison and unaffected regression request — The identical `makeMatch`-derived snapshot, viewports, motion preferences and fixed 0.18-second effect age were loaded by the real app through a mocked WebSocket in Chromium. Inspected all eight captures at their actual CSS size. Compared existing arena composition, HUD fit, warning/chain/ability signals and locked framing. The standard real WebSocket browser suite also exercised the separate diagnostic rescue, shared pause, clean retry and compact layout.
- Outcome against each acceptance criterion — The guide links actual source and role-labeled references. Measured text overlap fell to zero in all four combinations. The compact rescue font reached 8 CSS px. Both sizes fit the existing HUD/footer, and the camera read zero translation and rotation with zoom 1 in each profile. [Candidate readings](../../evidence/skill-trials/feel-art/candidate-dense.json).
- Checks run and actual results — Dense browser calibration passed all four viewport/motion combinations in Chromium 157.0.8103.80. `npm test` passed all 59 tests. `COLD_SIGNAL_URL=http://127.0.0.1:5182 npm run test:browser` passed in the same Chromium version with zero captured errors. `node --check` and `git diff --check` passed.
- Review type — Self-review, screenshot inspection and instrumented Chromium calibration.
- Remaining uncertainty and untested cases — The calibration covers one authored rescue cluster. Multiple overlapping downed labels, animated reassociation with a nearby helper, human recognition, enjoyment, comfort and motor performance remain open. The test is keyboard-oriented and makes no touch claim.

## Contribution

- Upstream branch / PR — None.
- Portable scenario added upstream — None. The calibration is specific to Cold Signal’s renderer.
- Cold Signal evidence / implementation commit — The Cold Signal commit containing this record, the style guide, the constructed comparison, and the rescue-label renderer change.
- Adopted Pocket Studio pin — Existing `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`.

## Integration follow-up

An independent integration review found that moving `P1 YOU` away from a rescue could place it over an active pilot on the adjacent rail. The review supplied a compact fixture with P1 and downed P2 on inner, P3 on middle, and all three at 0.01 radians. A real Chromium replay used the same 640×480 viewport and 365 px Canvas height in each motion setting. P1 and P3 baselines were 0.28 CSS px apart. Their ink bounds overlapped by 0 square CSS px before the art change, 14.07 after the first relocation, and 0 after the follow-up. The original pre-art P1/P2 overlap in this new scene was 51.56 square CSS px, then fell to 0 in both later revisions. [Three-revision measurements](../../evidence/skill-trials/feel-art/adjacent-label-followup.json), [initial compact relocation](../../evidence/skill-trials/feel-art/relocation-adjacent-640-reduced.webp), [corrected compact placement](../../evidence/skill-trials/feel-art/candidate-adjacent-640-reduced.webp).

The follow-up chooses the nearest horizontal position within the arena that clears both rescue text and active tags on the same rows. Chromium checks passed for the original dense scene at both sizes in both motion settings and for the adjacent-rail case at 640×480 in both settings. The final checks kept all measured active tag bounds in the arena and found zero active-to-active or active-to-rescue overlap in those six passes. `npm test` passed all 59 tests and the standard four-client browser suite reported zero captured errors. These fixed scenes verify the cited geometry. Animated tracking, more crowded arrangements and human recognition remain open.
