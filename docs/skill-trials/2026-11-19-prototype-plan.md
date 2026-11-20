# Skill trial — isolate the rescue-position decision

Status — observed

## Reproduction

- **Date and reviewer** — November 19, 2026 Pacific. Dedicated Codex subagent
  on `codex/trial-design-plan`.
- **Skill** — `prototype-plan` v1.0.0 at Pocket Studio
  `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`. The skill worktree was clean.
- **Cold Signal** — `0e630145778e802343829af26ba2db88a3df91dd`. The game
  worktree and submodule were clean. That design rewrite has the same runtime
  as the experiment baseline `dac1c9027cead078768573d03bdf65e436ffa176`.
- **Model and settings** — GPT-6.2 Sol (`gpt-6.2-sol`), high reasoning,
  Codex desktop subagent.
- **Exact delegated task** — “prototype-plan: read its SKILL + refs; use that
  brief and checked existing implementation to replace docs/prototype-plan.md
  with an actionable bounded next two-hour experiment addressing a real
  uncertainty (best judgment), not a rebuild list. Name baseline, single
  reversible candidate, fixed conditions, reset, dependency order, completed
  vs proposed vs deferred, timeboxed milestones, cuts preserving playable
  loop, acceptance checks, and neutral human test. Plan only is valid output;
  don't invent human evidence or implement unsound tuning. Preserve old doc as
  explicitly historical if useful and fix any historical overview link
  affected.”
- **Inputs and acceptance** — The revised [design brief](../design.md),
  the original ten-hour plan, [verification](../verification.md), existing
  [browser script](../../scripts/browser-check.mjs), and source for the
  [renderer](../../public/renderer.js), [rules](../../src/rules.js), and
  [diagnostic](../../server/index.mjs). The parent assigned an autonomous
  planning task and delegated the choice of experiment.

## Baseline evidence

- The existing [ten-hour plan](../prototype-plan-delve-together.md) was
  marked as an imported record. Its platform and scope work made sense for
  the first playable. Leaving it as the only plan made the next experiment
  hard to find. That was a project planning gap.
- The existing middle-rail diagnostic downed a pilot at a fixed offset with
  a timed warning. The renderer showed the downed pilot, depth, and progress,
  while the rule checked a same-ring angular window. Captured verification
  demonstrated mechanical recovery with four clients. It did not answer
  whether players knew where to hold or whether they knowingly retreated.
- The skill's existing-game path supported a new plan around one change to
  the feedback. No reusable instruction defect surfaced.

## Candidate and comparison

- **Delivered artifact** — [Two-hour plan](../prototype-plan.md) for a pair
  of static ticks marking the angular window. It specifies a pinned
  baseline, four-client fixed conditions, fresh generation-one rooms,
  ordered work, mechanical proofs, a cut point, and a neutral human
  comparison. The [development history](../project-overview.md) still
  links to the historical plan.
- **Checks** — Compared runtime paths between the experiment baseline and
  trial input; no differences. Checked the first-room seed, LAN bind option,
  and rescue diagnostic against the server. An inline constructed replay
  through the authoritative rules confirmed wrong-rail rejection, progress
  reset after leaving range, and a middle-rail rescue with auto fire before
  the fixture warning activates. The archived plan was byte-identical to
  the input. Resolved the changed documents' local links and ran
  `git diff --check`.
- **Review and limits** — Documentation self-review and a constructed
  rules check. The renderer candidate and human comparison are proposed.
  The drill starts the helper on the correct rail and clears natural waves,
  so it cannot answer questions about finding the right depth or reading a
  rescue in dense combat. No browser or LAN pass was run for this trial.

## Contribution

- No skill candidate, upstream branch, portable scenario, or pin change.
  The plan, archived plan, history pointer, and this record share one
  Cold Signal commit on `codex/trial-design-plan`.
