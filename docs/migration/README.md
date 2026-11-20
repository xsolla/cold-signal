# Standalone repository migration

Cold Signal became an independent game repository on November 19, 2026.
It began as the Delve Together project and art-direction trial in
[Xsolla Pocket Studio](https://github.com/xsolla/xsolla-pocket-studio).

The source was extracted from `codex/tempest-art-direction-evaluation` at
`e2f196f40c1b01888c6ab4edd1a9aea0eb18c246`. Only the history under
`projects/arcade-jam` was carried over: seven game/art-direction commits, with
their original authors, dates and messages. The [commit map](commit-map.json)
records the original and extracted IDs. Pocket Studio's unrelated history and
reusable skills remain in its own repository.

## Layout

| Pocket Studio location | Standalone location |
| --- | --- |
| `projects/arcade-jam/game/` | Repository root |
| `projects/arcade-jam/art-direction/` | `art-direction/` |
| `projects/arcade-jam/*.md` | `docs/` (`README.md` became `project-overview.md`) |
| Root duplicate `cold-signal-overdrive.mp4` | Already preserved byte-for-byte in `art-direction/vector-relay/arcade/evidence/` |

The previously untracked design, playtest, platform and historical verification
notes were imported together with the executable game. Their historical titles,
paths, port numbers and status claims describe the build they recorded; the
root README documents the current standalone build.

[The source manifest](source-files.json) records every migrated source path,
destination and original SHA-256. Original tracked versions remain available
in the extracted history before the root-layout commit. The gameplay rules,
renderer, audio and controls retain their accepted behavior. Root package/run
paths, the Cold Signal title, local server defaults and the pacing baseline
loader were adapted for independence.

`npm run pacing` reads [a versioned baseline](../baselines/README.md), rather
than trying to read a Pocket Studio commit from a different repository.
The Apache-2.0 license, applicable attribution, and historical notices are
retained. Historical Docker comparison images still require the existing
machine-local image aliases described in the run guide.

## Verification

The independently installed game passed all **55** rules/network tests, and its
pacing report is identical to the accepted Pocket Studio build. Docker Compose
configuration was validated. An HTTP/WebSocket smoke check confirmed the served
rules, Cold Signal title and developer controls. The browser showed the new
[entry screen](standalone-menu.jpg) and a [four-client ready room](standalone-ready.jpg).
The primary server at port 5176 now runs from this checkout. Source hashes and
verification outcomes are in [verification.json](verification.json).

Pocket Studio removal is committed as `16786c4`; the original working directory
was preserved as a recoverable local migration backup. Local environment files
and ignored caches were excluded from this repository. The public canonical repository is [xsolla/cold-signal](https://github.com/xsolla/cold-signal).
