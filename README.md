# Cold Signal

A standalone cooperative vector arcade game, originally developed as Delve Together.

[Design brief](docs/design.md) · [Development history](docs/project-overview.md) ·
[Repository migration](docs/migration/README.md) · [Credits](CREDITS.md)

Four-player real-time cooperative PvE. Everyone fires automatically and can
rescue any downed crew member. A/D or Left/Right orbits; W/Up jumps inward,
S/Down jumps outward between three rings. Press Space for your
character's special ability. Every pilot must be active at the final clear.

The visual direction combines Cold Front's navy/cyan/violet
palette with Black Signal's forked ships, open rescue markers, radial instruments,
and angular geometry. Streaming tunnel lines, projectile and movement trails,
36-shard explosions, rescue bursts, and linked chain detonations respond to live play.
The amplified effects use longer luminous trails and retain a readable burst size
at inner depths. Pilots and rescue markers render above the large effects.
The original motion studies remain in `art-direction/`.
The camera is now **locked** in every motion setting: no shake, roll, or zoom
pulses. This replaces the amplified camera response after player reports of nausea.

## Play without Docker

From the standalone checkout, install the pinned dependencies and start development mode:

```sh
npm ci
npm run dev
```

Open [Cold Signal](http://localhost:5176). For one human,
create a room, open **Local test tools**, add three controlled crew members,
and ready up. Keep their tabs open. **Reduce motion** removes streaming depth,
speed lines, luminous trails, movement ghosts, and fragmentation while retaining
ability, warning, and rescue feedback. The initial setting respects the OS preference;
click **Motion reduced** to enable the full arcade effects.

Ships use the original perspective scale and fit the original painted envelope.
Presentation effects use
real time, stop during a shared pause, and reset when a room or run restarts.
See [integration verification](evidence/cold-signal/README.md) for runtime captures
and [the amplified-effects check](evidence/cold-signal-overdrive/README.md) for the
preceding visual revision. [The current pacing check](evidence/cold-signal-pacing/README.md)
records the combat changes and stationary camera.

## Arcade combat pacing

At **1× pace**, each active pilot fires about **15 shots per second**, compared
with about 8.6 previously. Squads arrive every 0.9–0.75 simulation seconds,
growing from three to five enemies as the gauntlet advances. Two-player squads
contain two or three enemies. Population is capped at 48 enemies for four pilots
and 24 for two. Existing breathing phases, wall timing, movement, rescue timing,
and the 90-second gauntlet remain in place.

Squads have a behavior leader and light rush escorts. Outlined triangular escorts
take one hit and threaten contact; they leave no lingering danger when they escape.
Leaders retain their original behaviors and warning zones. The short center preview
still protects every emerging enemy until it leaves the bullseye.

Destroying an enemy deals one splash damage to nearby exposed enemies. Aim into
a pack to start a chain; armored leaders may need several overlapping blasts.
Chains never damage crew or protected preview enemies. The initiating pilot gets
the normal per-enemy kill credit, with no score multiplier. Violet links show real
chain connections and the clear count reports actual kills.

Ivo initiates Shockwave inside its original sector. Resulting enemy explosions can
propagate beyond that sector. Bullets themselves only travel inward from the ship's
depth; nearby death blasts can reach other targets within their splash range.

## Run with Docker

```sh
docker compose up --build -d --wait
```

Open [Cold Signal](http://localhost:5176). Docker with Compose is the only
required local runtime. The running game needs no AGS, account, or cloud access.

1. Create a room. Defaults are **four players** and **0.5× pace**. You can choose
   two players or full speed before creating another room.
2. Choose a character in the lobby. Share the six-character room code with the
   other players, who join at the same local server address.
3. For the one-human playtest, expand **Local test tools** and click **Add
   controlled crew member** once for each empty slot: three times for a crew
   of four. Each click opens a separate browser client; keep those windows open.
   They choose their default characters and ready automatically.
4. Ready up. Orbit with A/D or Left/Right. Tap W/Up to jump one ring inward
   or S/Down to jump one ring outward; holding does not keep jumping. Firing is automatic. Press and release Space to
   activate your special when its cooldown is ready. Escape pauses.
5. To rescue, match the open circular crew marker’s ring, then stay close until its progress ring
   completes. Any active pilot can do this while continuing to fire.

## Three depths and the bullseye

Players start on the outer ring. Middle and inner rings trade a shorter shot
path for smaller targets and new rail hazards. Ships, enemies, shots, barriers,
and effects shrink toward the center using one shared perspective model.
Collision uses those same projected sizes; fast shots sweep their path so tiny
far targets remain hittable. Bullets travel only inward from the ship’s actual
depth, so an inner pilot cannot shoot enemies already behind them.

The center bullseye **absorbs every player bullet**. Enemies are visible inside
it and can pass outward through it. They cannot take player damage until their
center emerges, including from Ivo’s Shockwave. This is a preview window.

- **Skimmer:** an open diamond reaches the middle rail, circles it, and marks
  short warning arcs ahead of itself.
- **Stalker:** a double triangle reaches the inner rail, then pursues active
  pilots there and marks local danger.
- Rushers and flankers can collide with pilots at any depth. Suppressor beams
  threaten the middle/outer region; diving inside gets behind that beam.
- Incoming wall rings continue through all three rails. Jumping through a
  solid section is dangerous; aim for a gap.
- Rescue requires the same ring and close angular position. Mara, Sana, and
  Rook support nearby crew on the same or adjacent rail, within angular range.
  Ivo blasts a sector across depths, respecting the protected center.

The HUD lists each pilot’s depth; the active rail is highlighted. **Local test
tools → Tunnel scenario** constructs a protected preview and two rail arrivals
for a quick mechanic check. Enemy mix, speed, and danger timings are provisional.

## Four humans on a local network

The default binds only to this computer. To let other computers on the same
local network join the Docker host, opt into a LAN listener:

```sh
COLD_SIGNAL_BIND=0.0.0.0 docker compose up -d
```

Other players open `http://<Docker-host-LAN-IP>:5176` in their desktop browser,
then enter the same room code. This is a local prototype without account auth;
keep this listener on your intended local network. Return to loopback with
`docker compose up -d` without that variable. Cross-device LAN play has not been
verified; the four-client acceptance pass uses separate local browsers.

## Characters and overlapping roles

All four share the same basic movement, gun, and proximity rescue. Duplicate
character choices are allowed so no composition is mandatory.

| Character | Space ability | How it helps the crew |
| --- | --- | --- |
| Mara / Anchor | Bulwark | Nearby crew gain a one-hit ward; absorbing a hit gives brief repeat-hit protection |
| Ivo / Breaker | Shockwave | Damages a sector, clears marked danger, and opens a gap in incoming walls |
| Sana / Beacon | Rally | Nearby crew gain faster automatic fire and faster proximity rescue |
| Rook / Runner | Slipstream | Nearby crew gain faster movement and brief cover for repositioning |

These are initial experimental abilities and timings. The selection cards
show each pilot's name, role, ability, personality line, and ship symbol. The
HUD shows all crew, the current ability, and its remaining cooldown.

**Half speed scales the whole simulation:** ships, enemies, shots, hazards,
warning periods, fire rate, rescue progress, protection, buffs, cooldowns, and
pacing. The 90-second simulation gauntlet takes about **three minutes of active
real time** at 0.5×. The clock and cooldown HUD show real seconds. Input sampling
and network updates continue at their normal rate. A quick Space, W, or S tap is queued
until the next authoritative tick; holding Space does not repeatedly cast and holding W/S does not chain jumps.

At the time limit every active ship wins together. If anyone is still down,
last-stand overtime continues until everyone is rescued or the whole crew is
lost. One client's pause/visibility interruption freezes the crew's run; a
socket disconnect interrupts it and players form a fresh room. There is no
mid-run save or host migration.

## Compare with the original build

The preserved 0.1 Docker images run separately at
[localhost:5174](http://localhost:5174): two players, original speed, and Space
to shoot. The first prototype's source/evidence is documented in
[the original verification](docs/verification-v01.md). The stored images must
remain on this Docker host; they are not downloaded or rebuilt by this file.

```sh
docker compose -f compose.baseline.yaml up -d
docker compose -f compose.baseline.yaml down
```

Use the new build's crew-size and pace selectors to compare those settings
while keeping its automatic fire and character abilities. Comparing 0.1 and
0.3 changes several variables together; it cannot isolate one change's effect.

The previous four-player flat arena is also preserved in local image aliases
`delve-together-backend:pre-tunnel-0.2` and `delve-together-web:pre-tunnel-0.2`.
To run that optional comparison on port 5175 in its own network:

```sh
docker compose -f compose.previous.yaml up -d
docker compose -f compose.previous.yaml down
```

It is not running by default. See [the 0.2 verification](docs/verification-v02.md)
for that build’s identity and scope. These image aliases exist on this host only.

## Local diagnostics and operations

**Rescue scenario** constructs one exposed downing and resets current threats.
**Final-clear check** advances to the last moment; **Team-wipe check** forces
loss. These fixtures and the controlled clients are development tools rather
than natural play or human acceptance evidence. The controlled pilots read
current visible state, use their abilities, and can fail.

```sh
docker compose ps
docker compose logs --tail=60
docker compose down
```

The web port is bound to loopback. In-memory rooms reset when the backend
restarts. Change the port with `COLD_SIGNAL_PORT=5177 docker compose up -d`. Disable
diagnostics with `DEV_TOOLS=0 docker compose up -d --force-recreate`.

## Architecture and verification

`web` serves HTML/CSS/Canvas/Web Audio through unprivileged Nginx and proxies
`/ws` to `backend`. The Node backend owns room capacity, character selection,
ready/retry, simulation, abilities, damage, rescue, score, and outcomes. The
shared `src/rules.js` runs both live and in headless rule/replay checks.

This local Node service is not an AGS emulator or a verified Extend deployment.
Room/transport code remains outside the rules; eventual AGS/Extend integration
still needs its own verified auth, transport, and runtime design.

```sh
npm ci
npm test
npm run test:browser
npm run balance
npm run pacing
```

Node.js 20+ is sufficient for these developer commands. Browser verification
uses four installed Chrome processes by default on macOS; set `CHROME_PATH` or
`COLD_SIGNAL_URL` for another installed Chromium executable or local URL. It records
actual input/state plus labeled constructed scenarios to ignored `artifacts/`.
The balance command retains a narrow two-pilot, full-speed rescue fixture; it
is not a four-player character-balance claim. The pacing check compares fixed
diagnostics against an exact, versioned copy of the rules from origin commit `222834b`;
its controlled traces are not human difficulty or comfort evidence. See [verification](docs/verification.md)
and [the human playtest guide](docs/playtest.md) for evidence and remaining questions.
