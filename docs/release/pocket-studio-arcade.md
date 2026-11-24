# Cold Signal for Pocket Studio Arcade

The Arcade build is a desktop-keyboard solo game with three AI wingmates.
It includes four pilots, the three-minute synced score, a 90-second pace,
rescue, pause, clear and wipe outcomes, and retry. Reloading starts a fresh
session.

Pocket Studio Arcade is private. The public source is
[xsolla/cold-signal](https://github.com/xsolla/cold-signal). The gallery
collects its signed-off export from the existing internal
[xsolla/cold-signal-arcade](https://github.com/xsolla/cold-signal-arcade) mirror.
The [Arcade workflow](https://github.com/xsolla/pocket-studio-examples#adding-a-game)
was checked on November 23, 2026.

## Build and preview

```sh
npm run build:arcade
python3 -m http.server 5177 --bind 127.0.0.1 --directory dist/arcade
```

Open [the static preview](http://127.0.0.1:5177). The export starts at
`dist/arcade/index.html`. It includes the root license and notice, credits,
and the Pocket Studio history notice.

## Candidate checks

| Check | Status | Evidence |
| --- | --- | --- |
| Game and rules | Pass locally | All 87 Node tests passed, including the chart's 3:00 deadline and overtime rescue. |
| Three-minute run in a nested iframe | Pass locally | Chromium 158 reached all eight phases in real time, cleared, and retried. The scheduled drops for Pressure, Convergence, and Final Surge were within 5 ms of their phase changes. |
| Focus, settings, and compact layout | Pass locally | The Arcade browser check exercised pause on focus loss, keyboard recovery, audio, reduced motion, and a 390 px layout. |
| Full runtime mix | Pass locally | A scripted solo attempt cleared at 3:00. The stereo render peaked at −2.51 dBFS. |

## Publish an update

1. Commit the source to public `main` and copy the release changes to
   internal mirror `main`. Keep the mirror's **Web game checks and export**
   workflow and record the public source SHA in the mirror commit.
2. Dispatch that mirror workflow with an unused version. It tests the game
   and publishes `web-build.zip`, its SHA-256, and the `web-builds` export.
3. Run [Refresh and publish arcade](https://github.com/xsolla/pocket-studio-examples/actions/workflows/pages.yml).
   Confirm the updated Cold Signal version in `games.lock.json` and launch it
   from the private gallery. The catalogue and read-only collector key are
   already configured for the mirror.
