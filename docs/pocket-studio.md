# Use Cold Signal to improve Pocket Studio

`tools/pocket-studio` is a Git submodule of
[xsolla/xsolla-pocket-studio](https://github.com/xsolla/xsolla-pocket-studio).
Cold Signal pins an exact upstream commit. Relative links in `.agents/skills/`
expose entire canonical skill folders, including references, assets and helpers.
Editing either path edits the same source. Codex supports these
[repo-scoped skill links](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills).
The separate sibling Pocket Studio checkout is independent of this one.

## Set up

From the Cold Signal root:

```sh
npm run skills:setup
npm run skills:status
npm run skills:check
```

Setup initializes a missing submodule at Cold Signal's pinned commit, creates any
missing skill links, and installs Pocket Studio's pinned development dependencies
in `tools/pocket-studio/.venv/`. It requires Git, Python 3.9+ and network access.
It preserves an initialized checkout's current branch and local changes. Clone
with `git clone --recurse-submodules` to initialize it during cloning instead.
Git access to Pocket Studio is required wherever setup runs, including CI.

Use `npm run skills:status` to read the recorded pin and the checked-out
revision. The [November 27 update](skill-trials/2026-11-27-pocket-studio-update.md)
selects upstream `main` at `0775494`, with eighteen skills.
`.gitmodules` tracks `main` as the update target. Ordinary setup uses Cold
Signal's exact recorded commit, which is fetchable from upstream. The
[November 22 migration record](skill-trials/2026-11-22-pocket-studio-update.md)
maps the retired skill names to their replacements. Cold Signal's root
`art-direction/` folder contains game art studies and evidence.

After switching Pocket Studio revisions, inspect the installed links and run
`npm run skills:link` to expose the skills present in that checkout. The helper
reports stale links before writing anything. Remove a retired link only after
checking that it is a relative symlink into `tools/pocket-studio/skills/`;
preserve local copies or customizations for review. `skills:link` and `skills:setup`
preserve unrelated skills and report conflicting destinations.

`skills:check` verifies the links, runs upstream metadata/resource/demo checks and
unit tests, and packages every skill. ZIPs and the virtual environment stay ignored
inside the submodule. These checks validate tooling and portability; they do not
establish skill quality or player enjoyment. `npm test` also covers the link helper
without requiring a downloaded submodule. Live model comparisons and browser
evaluation runs are separate, explicit operations described in
[the upstream evaluation guide](../tools/pocket-studio/evals/README.md).

Codex discovers the project skills from `.agents/skills/`. If discovery looks
stale, start a fresh session. Keep a single installed copy of each skill for this
project; another personal copy with the same name can also appear in selectors.
On Windows, enable Git symlink support and the permissions needed to create
directory symlinks before setup; existing regular-file link placeholders are
reported as conflicts for review.

## Recover the local trial pin

These instructions apply to a **separate historical Cold Signal checkout** at
`c1a92de` (or the original autonomous trial revision), whose recorded submodule
pin and skill links still use the old names. The current pin uses ordinary setup.

The autonomous review branch pinned Pocket Studio `3f8b752`, assembled locally
from the recorded upstream skill sources. It has not been pushed. The
[Git bundle](../evidence/skill-trials/pocket-studio-trials.bundle) preserves
that candidate relative to the original `8ccab1c` baseline. An independent
baseline-plus-bundle recovery produced the identical source tree and all
eleven skills; [recovery evidence](../evidence/skill-trials/skill-bundle-recovery.json)
records its checksum and limits.

For an initialized checkout missing the candidate commit, fetch the bundle,
then return to Cold Signal's recorded pin:

```sh
git -C tools/pocket-studio fetch ../../evidence/skill-trials/pocket-studio-trials.bundle refs/heads/codex/autonomous-skill-trials
git submodule update -- tools/pocket-studio
npm run skills:setup
```

For a **fresh clone only**, initialize the fetchable upstream update target
before those commands:

```sh
git submodule update --init --remote -- tools/pocket-studio
```

This temporary upstream checkout supplies the bundle's prerequisites; the
ordinary update above restores the exact trial pin. Save contributor work
before changing an existing submodule checkout. The bundle recovery check was
local; it did not exercise a new network clone.

## Choose a skill

Use the request that matches the task; these are independent specialists:

| Skill | Example request |
| --- | --- |
| `pocket-studio-help` | Use $pocket-studio-help to check the installed skills and choose the next useful request. |
| `write-ai-project-guide` | Use $write-ai-project-guide to reconcile Cold Signal's agent guide with the runtime and verify two common change paths. |
| `write-game-brief` | Use $write-game-brief to review Cold Signal's current design against our latest decisions. |
| `plan-game-prototype` | Use $plan-game-prototype to scope the next two-hour Cold Signal experiment with a baseline and acceptance checks. |
| `build-game-prototype` | Use $build-game-prototype to implement the approved next milestone and verify a complete attempt and retry. |
| `plan-game-project` | Use $plan-game-project to scope the remaining work for the next Cold Signal update and compare cuts. |
| `develop-game-art-style` | Use $develop-game-art-style to review Cold Signal's approved visual language and current gameplay captures, then propose a bounded readability experiment. |
| `create-2d-game-art` | Use $create-2d-game-art to produce a matching icon set using the approved visual guide and check it at HUD size. |
| `design-game-interfaces` | Use $design-game-interfaces to check the ready room, HUD, and keyboard flow. |
| `create-levels-and-scenes` | Use $create-levels-and-scenes to build a bounded encounter using the game's existing mechanics. |
| `create-game-sounds-and-music` | Use $create-game-sounds-and-music to review how ability, warning, and rescue cues compete in combat. |
| `review-controls-and-feedback` | Use $review-controls-and-feedback to review Cold Signal's pacing evidence and reduced-motion behavior. Keep the camera locked. |
| `fix-game-bugs` | Use $fix-game-bugs to reproduce a reported defect, fix its cause, and verify the affected path. |
| `playtest` | Use $playtest to prepare a four-human session and turn my observed findings into a retest plan. |
| `track-playtest-data` | Use $track-playtest-data to inspect an available playtest event export and identify what it can measure. |
| `prepare-game-release` | Use $prepare-game-release to identify the next release evidence we need for Cold Signal. |
| `test-game-balance` | Use $test-game-balance to inspect src/rules.js and the existing balance and pacing checks, then propose the next bounded experiment. |
| `pocket-studio-feedback` | Use $pocket-studio-feedback to draft feedback about an observed Pocket Studio workflow problem, with evidence and a success check. |

Copy [the trial template](skill-trials/TEMPLATE.md) to a dated file alongside it.
Record the original request, game revision and dirty diff, skill version and commit,
model/settings, actual outputs and observed failure before editing the skill.
Use `git -C tools/pocket-studio rev-parse HEAD` for the skill commit and
`git rev-parse HEAD` for the game commit; retain diffs when either tree is dirty.
Keep raw captures in ignored `artifacts/skill-trials/` and link to the useful
review evidence in the trial record. The template is an empty form, not a result.

For a candidate, rerun the same task on an unchanged copy of the game with a fresh
agent session. Use separate temporary game workspaces if the task mutates game
files. Preserve failures as well as successes. Compare actual artifacts against
the observed problem and an unaffected request. Label self-review, independent
agent review and human playtests accurately. For broader comparisons, use
[upstream behavioral scenarios](../tools/pocket-studio/tests/skill-scenarios.md)
and the evaluation guide rather than treating a single trial as a benchmark.
Art style has its own [document-based trials](../tools/pocket-studio/tests/skill-scenarios.md#develop-game-art-style);
the browser comparison suite covers the six original capabilities under their
current names. Use the art-style trials and actual Cold Signal outputs when
assessing its behavior. Historical trial files retain the names and versions
used when they ran.

## Make an upstream improvement

Keep the skill fix on its own branch inside the submodule. From the Cold Signal
root, after checking `npm run skills:status` for existing work:

```sh
git -C tools/pocket-studio fetch origin
git -C tools/pocket-studio switch -c codex/cold-signal-skill-fix
```

This branches from the version you tested, which also works after a submodule
checkout leaves a detached HEAD. Edit `tools/pocket-studio/skills/<skill-name>/`
and follow [upstream CONTRIBUTING.md](../tools/pocket-studio/CONTRIBUTING.md),
including version metadata and visible version updates. Generalize the instruction
that failed; keep Cold Signal's game implementation and trial results here. Add a
portable regression scenario upstream when it helps others reproduce the failure.

Target upstream `main` with fixes based on the installed version. If upstream
has advanced, use a separate checkout based on `origin/main` and rerun the
reproduction there so the PR contains only the relevant fix.

```sh
npm run skills:check
git -C tools/pocket-studio diff --check
git -C tools/pocket-studio diff
git -C tools/pocket-studio add skills/<skill-name>/
git -C tools/pocket-studio commit -m "fix: clarify the observed skill behavior"
git -C tools/pocket-studio push -u origin codex/cold-signal-skill-fix
```

Replace `<skill-name>` and use a new descriptive branch name for each improvement.
Stage any deliberate upstream scenario changes explicitly too. To open a PR with
the GitHub CLI, write its exact description to `artifacts/skill-trials/upstream-pr.md`
and run:

```sh
gh pr create --repo xsolla/xsolla-pocket-studio --base main \
  --head codex/cold-signal-skill-fix \
  --title "Fix the skill behavior observed in Cold Signal" \
  --body-file artifacts/skill-trials/upstream-pr.md
```

Explain the triggering request, old and candidate behavior, reproduction evidence,
checks and remaining limits. Link the Cold Signal finding where available. If you
cannot push to upstream, add your fork as a submodule remote, push there, and use
`--head YOUR_LOGIN:codex/cold-signal-skill-fix`. Cold Signal's `origin` stays its
own repository; Pocket Studio's `origin` is scoped to the submodule.

## Adopt a skill revision in Cold Signal

After the upstream change merges into `main`, first commit or save
local submodule work, then:

```sh
git -C tools/pocket-studio fetch origin main
git -C tools/pocket-studio switch --detach origin/main
npm run skills:link
npm run skills:check
npm test
git add tools/pocket-studio .agents/skills docs/skill-trials
git diff --cached --submodule=log
git commit -m "chore: adopt tested Pocket Studio improvements"
```

Review the staged files and remove links to any retired upstream skills when
`skills:link` reports them. Cold Signal records the selected submodule SHA, not the
skill files themselves. For a pre-merge trial pin, push its Pocket Studio commit
first so other clones can fetch it; return to the merged branch commit after review.
The submodule's `branch = main` is an update target, not an automatic updater.
An ordinary `git submodule update --init` checks out the recorded pin and may move
away from a contributor branch, so use the preserving setup command during work.

When changing the update branch, review the destination's skill catalog first
and record `.gitmodules` alongside the selected submodule pin and link migrations.
