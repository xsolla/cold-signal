# Skill trial — reconcile agent context with the current game

Status — observed

## Reproduction

- **Date and reviewer** — November 19, 2026 Pacific. Dedicated Codex
  agent-scaffolding subagent in `codex/trial-agent-scaffolding`.
- **Skill** — `agent-scaffolding` v1.0.0 from Pocket Studio
  `04551fb4d9d1d799c659817f9b2a8e0e7c8e7cb4`. The skill worktree and its
  installed symlink target were clean. The skill folder has the same Git tree
  `a93cd03b8cb164a4effc5a363d2ec5097ac2798c` in the assembled suite revision
  `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`.
- **Cold Signal** — `2dc76b3332d50846a410bcfa1e0361ef3edde6d5`. Clean on
  entry, including the submodule. Local dependencies came from the adjacent
  checkout's existing install via a temporary symlink.
- **Model and settings** — GPT-6.2 Sol, high reasoning, Codex desktop subagent.
  Also followed the workspace's writing-for-agents skill for the entry guide.
- **Exact delegated request** — “Use agent-scaffolding to make this existing
  repository safe and efficient for a fresh coding agent: reconcile active
  context, keep lean task-triggered AGENTS pointers, capture actual
  architecture/state ownership and bounded runnable workflows, preserve prior
  skill contribution rules and explicit locked camera decision; trace two
  real tasks through entry docs to governing code and verification.”
- **Supplied inputs** — Existing project and documentation, isolated worktree,
  an autonomous handoff with no interview, and responsibility for the agent
  scaffold before the other skill trials. The parent asked for documentation
  improvements, preservation of earlier evidence, and a game commit on the
  trial branch.
- **Acceptance** — Route both tasks from `AGENTS.md` to current rules, source
  owners, and existing checks. Preserve the earlier records and camera
  decision. Exercise the documented local workflow with safe checks.

## Baseline evidence

- Before the trial, `AGENTS.md` sent gameplay changes to the imported Delve
  Together design and verification documents. The verification record described
  an uncommitted prototype in `projects/arcade-jam/game` on port 5173.
  `README.md`, [the migration record](../migration/README.md), and the
  [server entry point](../../server/index.mjs) describe the standalone game on
  port 5176.
- The imported documents are retained byte-for-byte as
  [Delve Together design](../design-delve-together.md) and
  [0.3 verification](../verification-v03-delve-together.md). The
  [development history](../project-overview.md) still reaches both.
- The old Pocket Studio introduction also described a previous seven-skill pin.
  The updated contribution guide points to the installed pin through
  `npm run skills:status` and states the combined trial pin's availability.
- A fresh agent could have reused the wrong port, directory, or evidence claim.
  The scaffold skill already directed the reviewer to compare current commands
  and instructions and retire obsolete pointers. The issues were in the project
  documentation.

## Candidate and comparison

- **Game outputs** — [Agent guide](../../AGENTS.md), [current design](../design.md),
  [architecture and workflows](../architecture.md),
  [current verification](../verification.md), and
  [Pocket Studio contribution workflow](../pocket-studio.md).
- **Task 1, preserve brief depth taps** — Follow the gameplay and runtime
  pointers to the one-hop-per-press rule and input ownership. Trace
  [keyboard sampling](../../public/main.js#L132) into the
  [server's pending input](../../server/index.mjs#L99) and
  [fixed-step match updates](../../src/rules.js#L184).
  The [rule test](../../tests/rules.test.mjs#L234) covers a release and a new
  press between ticks. The [WebSocket test](../../tests/server.test.mjs#L112)
  requires all four clients to see the tap and a retry to reset to the outer
  rail. The browser pass also drove the actual keyboard aliases and checked
  one hop per hold and both end stops.
- **Task 2, adjust feedback during dense combat** — Follow the presentation
  pointer to the [locked camera rule](../design.md#presentation) and
  [pacing evidence](../../evidence/cold-signal-pacing/README.md).
  The [renderer](../../public/renderer.js#L297) consumes coordinates from
  [`Presentation.camera()`](../../public/cold-signal.js#L67) and keeps
  pilots and rescue progress above effects. The [locked camera test](../../tests/presentation.test.mjs#L66)
  checks zero translation and roll and zoom of 1 during stacked events and
  pause. The same test file covers effects across pause, retry, and reduced motion.
- **Checks** — `npm test` passed 59 of 59 on Node 20.11.0. The focused
  presentation and pacing run passed all 13. `npm run test:browser` passed
  against an isolated diagnostics-enabled server at `127.0.0.1:5186` in
  Chrome 157.0.8103.80 with four clients and zero browser errors. The
  observed simulation-to-wall-time ratio was 0.508 at 0.5× pace. Generated
  screenshots and `artifacts/browser-check-v03.json` stayed in the trial
  worktree. `npm run skills:links` verified the eight links installed at the
  tested game revision. Local links, historical byte equality, and
  `git diff --check` passed.
- **Review and limits** — Self-review of the documentation and a scripted
  local browser check. The browser check drove live keyboard input and
  constructed scenes. It leaves four-human play, camera comfort, hosted
  packaging, and cross-device behavior unverified. No clean-session
  onboarding comparison was run.

## Contribution

- The skill produced the expected scaffold and handoff. This run made no
  reusable skill change, started no same-input candidate comparison, and
  added no upstream scenario.
- The game documentation and this record are in the same game commit on
  `codex/trial-agent-scaffolding`. The trial does not change the tested
  Pocket Studio pin.
