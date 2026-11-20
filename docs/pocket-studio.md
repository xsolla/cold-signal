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
revision. The autonomous trial branch assembles eleven skills from the original
suite and upstream feature branches. Its combined Pocket Studio commit is
local. Setup from a fresh clone needs a copy of that commit or a fetchable pin.
The upstream update target in `.gitmodules` still points to `codex/art-direction`.
Cold Signal's root `art-direction/` folder contains game art studies and
evidence. After switching Pocket Studio revisions, run `npm run skills:link`
to expose the skills present in that checkout.

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

## Try a skill on real development work

Use the request that matches the task; these are independent specialists:

| Skill | Example request |
| --- | --- |
| `agent-scaffolding` | Use $agent-scaffolding to reconcile Cold Signal's agent guide with the runtime and verify two common change paths. |
| `game-design-doc` | Use $game-design-doc to review Cold Signal's current design against our latest decisions. |
| `prototype-plan` | Use $prototype-plan to scope the next two-hour Cold Signal experiment with a baseline and acceptance checks. |
| `game-feel` | Use $game-feel to review Cold Signal's pacing evidence and reduced-motion behavior. Keep the camera locked. |
| `art-direction` | Use $art-direction to review Cold Signal's approved visual language and current gameplay captures, then propose a bounded readability experiment. |
| `ui-ux-design` | Use $ui-ux-design to check the ready room, HUD, and keyboard flow. |
| `generative-sound-design` | Use $generative-sound-design to review how ability, warning, and rescue cues compete in combat. |
| `playtest` | Use $playtest to prepare a four-human session and turn my observed findings into a retest plan. |
| `chatgpt-playtest-analytics` | Use $chatgpt-playtest-analytics to inspect an available playtest event export and identify what it can measure. |
| `launch-checklist` | Use $launch-checklist to identify the next release evidence we need for Cold Signal. |
| `time-bandits-game-balance` | Use $time-bandits-game-balance to inspect src/rules.js and the existing balance and pacing checks, then propose the next bounded experiment. |

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
Art direction has its own [document-based trials](../tools/pocket-studio/tests/skill-scenarios.md#art-direction);
the browser comparison suite covers the six original skills. Use the art-direction
trials and actual Cold Signal outputs when assessing its behavior.

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

While art direction is on its development branch, target `codex/art-direction`
with fixes based on this installed version, as below. After that skill merges to
`main`, use `main` as the PR base. For an independent change to a main-only skill,
start from `origin/main` in a separate checkout so its PR contains only that fix.

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
gh pr create --repo xsolla/xsolla-pocket-studio --base codex/art-direction \
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

After the upstream change merges into `codex/art-direction`, first commit or save
local submodule work, then:

```sh
git -C tools/pocket-studio fetch origin codex/art-direction
git -C tools/pocket-studio switch --detach origin/codex/art-direction
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
The submodule's `branch = codex/art-direction` is an update target, not an automatic updater.
An ordinary `git submodule update --init` checks out the recorded pin and may move
away from a contributor branch, so use the preserving setup command during work.

Once art direction is merged into `main`, move the update target and pin together:

```sh
git -C tools/pocket-studio fetch origin main
git -C tools/pocket-studio cat-file -e origin/main:skills/art-direction/SKILL.md
git submodule set-branch --branch main tools/pocket-studio
git -C tools/pocket-studio switch --detach origin/main
```

Then run `npm run skills:link`, `npm run skills:check` and `npm test`, and stage
`.gitmodules` alongside the submodule pin. The existence check ensures the switch
keeps the art-direction skill available.
