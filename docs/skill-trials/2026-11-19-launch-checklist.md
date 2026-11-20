# Skill trial — local release evidence and the GamePix gate

Status — observed

## Reproduction

- **Date and reviewer** — November 19, 2026 Pacific. Dedicated Codex subagent in
  the isolated `codex/trial-launch` worktree.
- **Skill** — `launch-checklist` v1.0.0 at Pocket Studio
  `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`. The skill source was clean.
  Used the checklist template, browser profile, and examples.
- **Game** — clean on entry at `4dc3c4ffb23f298ce454edb599644b950fbaee27`.
  Final verification ran the integrated runtime at `9a6fd898d6548e9be90d5b1405b1b805b96c1772`. The
  [manifest](../../evidence/skill-trials/launch/candidate.json) records the
  tested source bytes. At verification the launch worktree also held the
  new release handoff, trial record, a temporary dependency link, and
  ignored probe files. The runtime and check files matched the candidate.
- **Model and settings** — GPT-6.2 Sol, high reasoning, Codex desktop subagent.
- **Exact delegated task and inputs** — “APPLY launch-checklist to actual
  current local browser review candidate and clearly distinguish later
  GamePix target.” “Prepare current launch checklist with Pass/Fail/Untested/N/A
  tied to exact candidate/runtime source identity, actual listing
  copy/controls/limitations, credits/notice reconciliation and only needed
  listing imagery from actual candidate.” The supplied inputs were the
  original November 22 at 8 p.m. Pacific candidate goal, historical GamePix
  notes, current design, trial evidence and the integrated source snapshot.
- **Acceptance** — Verify the combined revision through the normal player
  path and established integration checks. Make local launch instructions,
  evidence, listing assets and attribution review usable. Use official
  current sources to identify GamePix blockers and unknowns. Keep ordinary
  play, development scenarios and human/hosted gaps clear.

## Baseline evidence

- The [imported checklist](../launch-checklist-delve-together.md) describes
  Delve Together's local Docker verification and a planned GamePix release.
  Its title and candidate identity belong to the earlier phase. Its upload
  and hosted checks were still open.
- The skill directed a concrete source handoff and current platform review.
  The resulting [checklist](../launch-checklist.md) records one portable
  constraint clearly: a green desktop browser pass accompanies a current
  client that needs its server's `/ws` and `/rules.js` routes. The public
  GamePix documentation checked November 19 covered iframe, assets and SDK
  rules while leaving this particular WebSocket route and dashboard package
  format open.
- [Local browser handoff](../release/local-browser-review.md) contains the
  current copy and references the actual screenshots and notices.

## Candidate and comparison

- **Checks** — `npm test` passed 68/68. `npm run test:browser`,
  `npm run test:ui`, and `npm run test:audio:browser` passed on
  Chrome 157.0.8103.80. The separate normal-start pass exercised a natural
  crew loss, retry, peer reload, regroup and return to entry with four
  clients. It observed audio start, pause, resume and mute transitions and
  generated four traceable screenshots. The first normal-start probe timed
  out after targeting the old hidden Leave button in the interrupted view.
  Updating the harness to use the visible Leave Room control produced the
  passing replay without a runtime change. [Manifest and check paths](../../evidence/skill-trials/launch/candidate.json),
  [probe retry note](../../evidence/skill-trials/launch/probe-retry.txt).
- **Review** — Self-review of the actual local runtime and captures. The
  ordinary play pass was agent-operated with passive peers, using snapshots to
  verify actions. Diagnostic rescue and final clear use constructed states.
  There was no human session or processed GamePix preview.
- **Candidate skill** — The trial surfaced no reusable skill failure. There was
  no changed skill candidate or same-input repeat. The manual checklist
  preparation does not establish platform acceptance, physical device
  behavior, cross-device LAN play or unfamiliar-player comprehension.

## Contribution

- The scope, current copy, credits reconciliation and review evidence are in
  this launch commit. The installed upstream pin, skill source and game
  runtime are unchanged by this trial.
