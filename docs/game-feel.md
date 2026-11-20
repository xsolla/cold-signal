# Cold Signal game-feel review

Cold Signal aims for responsive orbiting and deliberate depth changes, with strong audiovisual payoffs for coordinated actions. The camera stays fixed in both motion settings following a report of nausea. [Design](design.md), [earlier game-feel plan](game-feel-delve-together.md), [camera decision](../evidence/cold-signal-pacing/README.md).

A four-client Chromium keyboard pass covered the opening at the default 0.5× pace, at 1440×1000 with sound muted. A/D steered in both directions, holding W moved one rail, and the W/S and arrow aliases reached all three rails. Natural enemies emerged while the clients exercised the controls. A diagnostic wipe supplied the retry, and W worked on the fresh run. Escape paused all four clients and the Resume button restored play. Paused screenshots 180 ms apart had identical bytes in every run. The transform stayed at zero translation, zero rotation, and 1× zoom in all sampled frames. [Baseline measurements](../evidence/skill-trials/feel-art/baseline-feel.json), [candidate measurements](../evidence/skill-trials/feel-art/candidate-feel.json).

## Follow a depth tap

| Stage | What the player sees and what drives it |
| --- | --- |
| Intent | W or Up requests the next inward rail. The browser sends the key edge and the server queues quick taps between ticks. |
| Acknowledgment | The first frame with the new authoritative ring highlights the destination in cyan, and the footer names it. That frame followed the first W keydown by 26/22 ms in baseline full/reduced motion and 45/20 ms in the candidate. |
| Travel | The fork travels toward the destination while automatic fire continues. One rail is 64 simulation units at 320 units per simulation second, about 400 ms at 0.5×. The sampled full/reduced arrivals were 408/405 ms in baseline and 429/454 ms in the candidate. |
| Result and next choice | The fork settles on the named rail. A fresh tap can request the next rail, and the next tested Up tap reached inner. A held W stayed on middle. |

These are single loopback runs sampled at the renderer call from the browser's DOM key event. They measure when a new state reached the draw path. The configured travel time, display scanout, frame pacing, and perceived response are separate questions. [Input and HUD](../public/main.js), [tap queue](../server/index.mjs), [depth rules](../src/rules.js), [rail and fork rendering](../public/renderer.js).

## Prioritized findings

1. **Show the reduced-motion Shockwave footprint.** In the baseline, Space started Ivo’s cooldown and drew a single cyan arc over Ivo’s cyan rail. From middle, the renderer used only the projected middle radius, 145.05. The initial Shockwave targets exposed enemies within ±0.8 radians across depths. The candidate draws a thin outline at that angle between the protected core and outer playable rail. Its shape stays fixed as opacity fades. It shows the direct cast sector across the playable rails. Death chains can reach exposed targets beyond its edges. The existing full-motion sweep still expands across the arena. Both runs registered `28s` on the default-pace cooldown after the accepted press. The baseline and candidate traces confirmed the reduced geometry at 41 and 40 sampled effect frames respectively. [Baseline reduced](../evidence/skill-trials/feel-art/baseline-reduce-shockwave.jpg), [candidate reduced](../evidence/skill-trials/feel-art/candidate-reduce-shockwave.jpg), [candidate full](../evidence/skill-trials/feel-art/candidate-no-preference-shockwave.jpg).
2. **Keep the depth jump timing for the next playtest.** The keyboard sequence resolved consistently, the selected rail acknowledged the jump before travel finished, and held keys moved one rail. Ask a fresh player which rail is selected and when they feel in position to rescue during a hop. Compare their answer with the first highlighted frame and the fork’s arrival.

For the first human comparison, place Ivo on middle at the same angle in two equivalent encounters. After Space, ask which depths the cast directly targeted and where a chain might continue. Run both reduced-motion cues at the same viewport, sound level, pace, and enemy layout. A human session can establish whether the fixed outline communicates the sector and feels comfortable. This trial establishes draw geometry and keyboard behavior in headless Chromium.
