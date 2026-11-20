# Cold Signal balance — rescue after the first down

The current [browser playtest](playtest.md) ended an ordinary rescue approach
before it earned progress. This diagnostic asks whether handling an incoming
wall before joining a fallen pilot can change the result in the same starting
encounter. The creative target remains a dangerous comeback gamble. There is no
approved rescue percentage or completion rate. Keep the current tuning and use
the cases below to choose which rescue decisions to watch in human play.

## Run and scope

```sh
mkdir -p artifacts/skill-trials
node scripts/balance-rescue-windows.mjs > artifacts/skill-trials/balance-rescue-windows.json
```

The [runner](../scripts/balance-rescue-windows.mjs) and local room server import
[the same authoritative rules](../src/rules.js). The
[recorded JSON](../evidence/skill-trials/playtest-balance/balance-rescue-windows.json)
contains the source hashes, frozen seed list, per-case trace, and definitions.
The existing `npm run balance` still runs the two-pilot, full-speed outer-ring
fixture. `npm run pacing` still compares earlier and current combat cadence
and controlled traces. This diagnostic uses current rules throughout.

- **Openings** — Eight fixed seeds (`17`, `73`, `123`, `773`, `17321`, `17322`,
  `27182`, `31415`) for each of two profiles. Two pilots start Mara/Ivo. Four
  start Mara/Ivo/Sana/Rook. Both profiles use 0.5× pace and the usual spawn
  protection, enemy waves, walls, auto-fire and abilities. The existing
  `controlledInput` drives each pilot at every 1/60 second elapsed step, or
  1/120 second of simulation. An opening stops at first down or 20 simulation
  seconds. Only first-down checkpoints with a survivor enter the comparison.
- **Paired branches** — Clone the exact first-down state, including random
  state and active effects. If several pilots fall on the same step, use the
  first down event’s pilot as the indexed target. Every active pilot picks the
  nearest fallen teammate by angular gap plus number of rail hops. **Rescue
  now** moves toward the target’s angle and matches the rail. **Wall first**
  uses the same approach except when a wall is within 130 radius units of the
  farther ship and has a solid arc at the target angle. It holds the current
  rail and heads toward the nearest gap until that wall has passed both ships.
- **Control and stopping** — Neither branch presses Space, grants protection,
  changes spawn timing, or edits the checkpoint. Ability effects already active
  at the first down can carry into both branches. Both branches stop at the
  indexed target’s recovery, crew wipe, or eight simulation seconds. Restoring
  that pilot can leave other pilots down. The endpoint gives no team-clear
  result and follows no pilot after recovery.

## Results

| Crew | Policy | Compared windows | Indexed target gained progress | Indexed target rescued | Crew losses | Rescue horizon reached | Crashes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2 | Rescue now | 7 | 2 | 0 | 7 | 0 | 0 |
| 2 | Wall first | 7 | 2 | 2 | 5 | 0 | 0 |
| 4 | Rescue now | 8 | 7 | 5 | 3 | 0 | 0 |
| 4 | Wall first | 8 | 7 | 7 | 1 | 0 | 0 |

Fifteen of sixteen openings qualified. The two-pilot opening for seed `17321`
had no down at 20 seconds and was excluded. No opening wiped on the first
frame with a down. In the fifteen paired windows, both approaches rescued the
target in five, wall first alone did in four, rescue now alone did in zero,
and neither did in six. `With progress` means the target had any positive
rescue progress, including on the down tick. Across qualified cases, first
falls were outer/middle/inner in 3/4/0 two-pilot and 2/5/1 four-pilot openings.
One inner case cannot support a depth ranking.

- **Two pilots, seed 17** — The outer target began receiving help 0.950 seconds
  after going down in the rescue-now branch. Progress lasted 0.075 seconds
  before the crew fell. Wall first reached the marker later, at 1.767 seconds,
  and restored the target at 3.408 seconds.
- **Four pilots, seed 27182** — Both policies started middle-ring target
  progress 0.442 seconds after the down. Both had a reset. Rescue now ended in
  a wipe. Wall first restored the target at 3.900 seconds.
- **Four pilots, seed 123** — The only inner checkpoint ended in a crew loss
  at 0.850 seconds under both policies, before progress. Five of the seven
  qualifying two-pilot windows also ended before either policy started progress.

These comparisons implicate approach timing and continued exposure as things to
observe. The traces time down and rescue events without identifying the damage
source for each hit. Exact snapshot geometry, fixed-step responsiveness and
coordinated policies idealize human perception. A wall arc can also be partially
outside a player’s view. Neither branch actively avoids enemies or local zones.
With different combat after a split, the same seed can lead to different later
random draws. Crew size also changes encounter scaling and roster. This small
exploratory set had no tuning selection or held-out candidate validation.

## Next decision

Use the [human retest](playtest.md#ready-to-run-human-retest) to watch one outer
and one middle down with a wall in view. Let players choose a route or wait.
Record whether they notice the gap, can explain the tradeoff, and keep their
bearings after a reset. Compare the same encounter separately from a fresh
one. Revisit tuning only if the replay and playtest agree on a specific problem.

Each branch repeated without trace collection and reached the same final state
hash. Two command runs produced identical JSON. `npm test` passed 59 tests,
including the live-server input tape replay. The
[Delve Together balance notes](balance-plan-delve-together.md) retain earlier
fixtures, creative targets and background research.
