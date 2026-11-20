# Skill trial — compare rescue decisions at the first down

Status — observed

## Reproduction

- **Date and reviewer** — November 19, 2026 Pacific. Dedicated Codex subagent
  in the isolated `codex/trial-playtest-balance` worktree.
- **Skill** — `time-bandits-game-balance` v1.0.0 at Pocket Studio
  `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`; clean. Followed `SKILL.md`,
  `references/experiments.md`, `references/examples.md`, and both record templates.
- **Game** — Cold Signal `134d3c2c414a39421cc9112abb32a7e83b76fd8d`, the prior
  playtest commit on this branch. Tracked game files and submodule were clean
  on entry. The temporary untracked dependency symlink supported local tests.
  The new runner did not modify the runtime. `src/rules.js` SHA-256
  `241c7f54afba9e84d7809d951665198df9bbf9ba40bc5aa99b4751151355c3c4`.
- **Model and settings** — GPT-6.2 Sol, high reasoning, Codex desktop subagent.
- **Exact delegated request** — “Run a SMALL reproducible diagnostic batch
  addressing a meaningful balance uncertainty (best judgment; e.g. rescue
  viability by depth and ordinary policy exposure across 2/4 pilots), using
  same JS rules and seeded inputs; label policies, profiles, grants, limits.
  Keep src/rules.js tuning unchanged absent a clear verified functional bug;
  do not tune to bot win rate. Compare contrasting policies under fixed seeds
  and rules; record seed/time step/stop conditions/code hashes, denominators,
  crashes vs losses. Produce useful machine-readable report + concise current
  docs/balance-plan.md and appropriate reusable runner command. A small offline
  HTML explorer is useful if warranted, but don't build huge dashboard.”
- **Supplied inputs** — Current design and verification, the earlier balance
  plan, existing `balance.mjs` and `pacing-check.mjs`, the pacing evidence,
  the pre-arcade rules reference, and the previous trial’s normal rescue loss.
- **Acceptance** — Exercise current shared JS rules from normal openings.
  Compare contrasting legal input policies at the same seed and checkpoint,
  record exclusions, bounds and failures, and use results for a concrete
  follow-up with no speculative tuning.

## Baseline evidence

- [Balance decision record](../balance-plan.md), [runner](../../scripts/balance-rescue-windows.mjs),
  and [JSON report](../../evidence/skill-trials/playtest-balance/balance-rescue-windows.json).
  The retained [historical balance plan](../balance-plan-delve-together.md) and
  [arcade pacing results](../../evidence/cold-signal-pacing/README.md) support
  the prior narrow fixtures and pacing claims.
- Two capacity profiles and eight seeds produced sixteen normal openings. One
  opening had no down by the cap. Thirty cloned windows ran from the fifteen
  first-down checkpoints with survivors. No new Space inputs were sent in
  the windows. Natural opening effects and threats came from the actual rules.
- For two pilots, rescue now restored the target in `0/7`; wall first did so in
  `2/7`. For four pilots the counts were `5/8` and `7/8`. Both restored in
  five cases, wall first alone in four, neither in six. Checks distinguish
  restoring this target, wiping the active crew, and reaching the horizon.
  The study covered one inner target and stopped at recovery, before any
  possible all-crew clear. Existing coverage is too narrow for a depth ranking.
- The skill's paired-checkpoint guidance fit the rescue timing question, and
  its instructions to verify tracing and distinguish incomplete runs from
  losses made the report interpretable. The comparison supports watching wall
  anticipation and stalled progress in human play. It leaves human behavior and
  exact sources of individual hits unresolved.

## Candidate and comparison

- **Check commands** — `node scripts/balance-rescue-windows.mjs` with Node
  `v20.11.0`, no environment overrides. Identical command reruns produced
  byte-for-byte JSON. The runner reproduces each branch without capture and
  checks the shared checkpoint and final-state hashes. `node --check` and
  `git diff --check` passed. `npm run balance` and `npm run pacing` still
  ran. `npm test` passed 59/59, including the tick-by-tick live server/headless
  replay. No batch crashes or elapsed-time tool interruptions occurred.
- **Review** — Self-review of a bounded diagnostics study. No tuning candidate
  or held-out validation cohort was selected. All seeds are exploratory. The
  comparison varies only branch policy after the split within each seed and
  crew count. The two profiles have different rosters and encounter scaling.
  No human trials or endgame difficulty measurements ran. The compact per-case
  results and summaries fit the JSON and Markdown, so no explorer was created.
- **Candidate** — No reusable skill failure surfaced. No skill candidate or
  same-input fresh-agent comparison was needed. Game rules stayed unchanged.

## Contribution

- The current balance record, runner, and machine-readable results are in the
  balance game commit on `codex/trial-playtest-balance`. The Pocket Studio pin
  remains the trial's input. No upstream scenario was added.
