# Cold Signal desktop browser review

Cold Signal 0.3.0 uses the source snapshot and local environment in the
[candidate manifest](../../evidence/skill-trials/launch/candidate.json).
Use the [current checklist](../launch-checklist.md) for verification limits
and later GamePix requirements.

## Listing copy

**Cold Signal**

Choose your depth. Read the surge. Go back for your crew.

Cold Signal is a cooperative vector arcade game for two or four pilots.
Orbit a three-ring tunnel and aim your automatic fire into enemy packs to
start chain reactions. Pick a pilot with an ability to shield the crew,
open a gap, speed up rescue, or cover a risky move. When someone goes down,
match their ring and stay close until they recover. Every pilot must be
active to clear the surge.

Play with a keyboard in a desktop browser. All players connect to the same
running room server and enter the host's six-character code. The default
four-pilot gauntlet lasts about three minutes at half speed before any
overtime. Two-pilot and full-speed rooms are available. Use **Reduce Motion**
or the sound toggle as needed. Run state lives in the room. A disconnect
interrupts the attempt and the crew can form a fresh room. There is no
mid-run save or persistent progression.

| Action | Input |
| --- | --- |
| Orbit | A/D or Left/Right |
| Move in or out one ring | Tap W/Up or S/Down |
| Shoot inward | Automatic |
| Use the selected pilot's ability | Space |
| Pause the crew | Escape during play or the Pause button |
| Rescue a downed pilot | Match their ring and stay close |

## Run the reviewed source

Use Node.js 20+ and the recorded revision. From the repository root:

```sh
npm ci
PORT=5188 npm start
```

Open [the local review](http://127.0.0.1:5188) in desktop Chrome. Create a room
with the intended crew size and pace. Use one browser client per pilot, enter
the same code on the other clients, choose pilots, and ready up. Leave each
client visible while playing, since a hidden participating page pauses the
crew. Loopback is accessible only from the host machine. Separate devices and
internet-hosted play require a reachable server and their own verification.

`npm start` provides the normal local player path. The local diagnostic
mode described in [verification](../verification.md) adds controlled crew
and scenario controls and was used for repeatable path checks. The Node
server is part of the source handoff. A static copy of `public/` omits its
WebSocket rooms and shared rules route.

## Review images

The files are captured from the verified local desktop flow. Use the gameplay
image for the primary review visual and the lobby image to show pilot selection.
The entry and compact pause frames document launch and layout.

| Image | Alt text and capture context |
| --- | --- |
| [Gameplay](../../evidence/skill-trials/launch/gameplay.jpg) | Four pilots and enemy formations occupy the glowing three-ring tunnel during ordinary play. |
| [Pilot lobby](../../evidence/skill-trials/launch/lobby.jpg) | Four pilot cards sit above the ready control. Ivo is selected and the full crew is connected. |
| [Entry](../../evidence/skill-trials/launch/entry.jpg) | Cold Signal's entry screen offers room creation and code entry, with crew size and pace controls. |
| [Compact pause](../../evidence/skill-trials/launch/reduced-pause.jpg) | A paused run with reduced motion enabled in a 640 × 480 viewport. |

GamePix cover and icon dimensions, formats and acceptance remain unverified.
The runtime [icon vector](../../public/icon.svg) is a source asset.

## Credits and notices

The [credits inventory](../../CREDITS.md) records direction, implementation,
procedural graphics and Web Audio. The browser loads the original icon and
first-party code for the arena, effects and synthesized sound. The captured
images represent that same geometry and interface. The npm lockfile records
`ws` for the authoritative server and `playwright-core` for development.
Retain the root [LICENSE](../../LICENSE), [NOTICE](../../NOTICE), and linked
historical notice when distributing this source. Retain the applicable
dependency notices with any bundled dependencies. The checked-in captures
use the game's own visuals. GamePix rights acceptance and any portal-specific
credits fields still need review against the actual export.
