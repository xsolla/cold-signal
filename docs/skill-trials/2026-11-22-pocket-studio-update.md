# Pocket Studio update and skill-name migration

Status: adopted locally. November 22, 2026 Pacific.

This is an installation migration and technical verification record. The
November 19 behavioral trials remain recorded against their original inputs.

## Request and revisions

- Request: “Update Pocket Studio a make the necessary migrations”.
- Reviewer: Codex, self-review; no subagents or human playtest.
- Cold Signal base: `c1a92de41155be14caa68b7bc471558a989dfc0e` on `main`,
  with a clean working tree before this update.
- Previous Pocket Studio pin: `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`,
  the local eleven-skill assembly on `codex/autonomous-skill-trials`.
- Selected Pocket Studio pin: `c5dbe959f2a16b18d395e86f4181af7d62e44085`,
  upstream `origin/main` as fetched for this update. The submodule had no local
  edits before switching and has no source modifications afterward.
- `.gitmodules` update target: `codex/art-direction` → `main`.

The former feature skills have merged upstream. The current catalog uses
capability-based names, removes the old folders, and adds seven capabilities
to the eleven previously installed. No local skill customizations needed
porting; the old assembly's source instructions were unchanged imports.

## Existing skill migrations

Versions below come from each revision's `SKILL.md` metadata.

| Previous skill and version | Current skill and version |
| --- | --- |
| `agent-scaffolding` 1.0.0 | `write-ai-project-guide` 1.1.1 |
| `art-direction` 1.1.0 | `develop-game-art-style` 1.2.0 |
| `chatgpt-playtest-analytics` 1.0.1 | `track-playtest-data` 1.0.1 |
| `game-design-doc` 1.0.0 | `write-game-brief` 1.1.0 |
| `game-feel` 1.0.0 | `review-controls-and-feedback` 1.1.0 |
| `generative-sound-design` 1.3.0 | `create-game-sounds-and-music` 1.3.0 |
| `launch-checklist` 1.0.0 | `prepare-game-release` 1.1.0 |
| `playtest` 1.0.0 | `playtest` 1.4.1 |
| `prototype-plan` 1.0.0 | `plan-game-prototype` 1.1.0 |
| `time-bandits-game-balance` 1.0.0 | `test-game-balance` 1.1.0 |
| `ui-ux-design` 1.0.0 | `design-game-interfaces` 1.1.0 |

Newly installed: `build-game-prototype` 1.3.1, `create-2d-game-art` 1.0.0,
`create-levels-and-scenes` 1.0.0, `fix-game-bugs` 1.1.1,
`plan-game-project` 3.2.1, `pocket-studio-feedback` 1.0.0, and
`pocket-studio-help` 2.1.0.

Each of the ten retired links was checked to be the expected relative symlink
into the old canonical folder before removal. `skills:link` then installed the
seventeen new links and retained `playtest`, yielding eighteen complete skill
folders. The existing conflict and stale-link safeguards remain in place.

The agent guide and contribution workflow now route to the current catalog and
upstream `main`. The sound reproduction command uses the renamed WAV inspector;
both existing WAVs were inspected successfully. Historical trial names, source
revisions, recovery bundle, and captures are preserved. The old recovery
instructions are explicitly limited to historical game checkouts; the new pin
is available from upstream `main` and needs no bundle.

## Verification

Environment: Node.js 20.11.0, Python 3.9.6, PyYAML 6.0.3 on macOS.

| Check | Observed result |
| --- | --- |
| `PIP_DISABLE_PIP_VERSION_CHECK=1 npm run skills:setup` | Passed; eighteen links, pinned PyYAML dependency already satisfied. |
| `npm run skills:links` | Passed; all eighteen relative folder links verified. |
| `npm run skills:status` | Selected `c5dbe95`, detached HEAD, clean submodule. |
| `npm run skills:check` | Passed; eighteen metadata/resource/demo checks, 63 upstream unit tests, and all eighteen ZIP packages with checksums. |
| `npm test` | Passed; 68 tests, zero failures or skips. |
| Renamed WAV inspector on `reel-a.wav` and `reel-b.wav` | Passed; both 3.8-second mono 48 kHz files, zero full-scale samples. |
| `git diff --check` | Passed. |
| Runtime and dependency diff | No changes in `src/`, `public/`, `server/`, `package.json`, or `package-lock.json`. |

The initial sandboxed game-test attempt could not bind loopback sockets
(`listen EPERM`); it was stopped and rerun with localhost access. The successful
game and Pocket Studio checks used that access. This was an environment
restriction, not a game-test failure after migration.

These checks establish installation integrity, helper portability, packaging,
and the existing automated game contracts. Browser play, live model comparisons,
and human gameplay were not rerun for this tooling update. Start a fresh agent
session to refresh skill discovery; reading and validating the files in this
session does not establish automatic discovery in a new session.

No upstream source changes, pushes, issues, or PRs were made.
