# Skill trial — explain the current Cold Signal loop

Status — observed

## Reproduction

- **Date and reviewer** — November 19, 2026 Pacific. Dedicated Codex subagent
  on `codex/trial-design-plan`.
- **Skill** — `game-design-doc` v1.0.0 at Pocket Studio
  `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`. The skill worktree was clean.
- **Cold Signal** — `dac1c9027cead078768573d03bdf65e436ffa176`. The game
  worktree and submodule were clean.
- **Model and settings** — GPT-6.2 Sol (`gpt-6.2-sol`), high reasoning,
  Codex desktop subagent.
- **Exact delegated task** — “game-design-doc: read .agents/skills/game-design-doc/SKILL.md
  + relevant refs, then rewrite docs/design.md into a concise current Cold
  Signal design brief (roughly 400–600 words) preserving accepted private-room
  four-pilot browser co-op, three depths, auto-fire, abilities, dangerous
  proximity rescue, chains, locked camera, full/reduced motion and
  outcome/retry. Code is implemented baseline, subjective quality unverified.
  Preserve #presentation anchor used by AGENTS-linked architecture and README.
  State weakest assumption and discriminating next test. Keep actual numeric
  tuning in src/rules.js authoritative. No speculative integrations.”
- **Inputs and acceptance** — The previous `docs/design.md` at the input revision,
  the implemented game and [verification](../verification.md), the
  [Delve Together design](../design-delve-together.md), and the
  [pacing record](../../evidence/cold-signal-pacing/README.md). The assignment
  called for an autonomous rewrite after the agent-scaffolding trial.

## Baseline evidence

- The input design covered core mechanics and the camera decision. It left
  the player promise, a concrete choice during play, and an actionable
  uncertainty implicit. That was a project documentation gap. The compact rule list
  left the cost of giving up a good firing position to hold an exposed
  rescue implicit.
- The [revised brief](../design.md) follows one attempt from private room to
  retry. Its middle-rail rescue is an illustrative scene. The pacing record
  used one manually controlled pilot and three controlled clients. Four-human
  rescue decisions remain an open question.
- The skill's guidance to distinguish implementation from intent and show the
  next decision surfaced the gap. The trial found no instruction defect
  requiring a reusable change.

## Candidate and comparison

- **Delivered artifact** — [Cold Signal design](../design.md), 582 words
  counting Markdown tokens, with the existing
  [Presentation](../design.md#presentation) anchor. It puts exact timing and
  tuning in [the rules](../../src/rules.js) and ends with an unprompted rescue
  test that distinguishes misunderstanding from deliberate retreat.
- **Checks** — Read the rules, room/input flow, renderer, and presentation
  state against the brief. Checked outgoing local links and incoming
  presentation-anchor links. `git diff --check` passed.
  `node --test tests/rules.test.mjs tests/presentation.test.mjs tests/pacing.test.mjs`
  passed 48 of 48.
- **Review and limits** — Documentation self-review with focused automated
  regression checks. The four-browser pass in the agent-scaffolding record
  is prior evidence. This trial added no browser or human observations.

## Contribution

- No skill candidate, upstream branch, portable scenario, or pin change.
  The brief and this record share one Cold Signal commit on
  `codex/trial-design-plan`.
