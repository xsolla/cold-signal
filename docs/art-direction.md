# Cold Signal art direction

Four pilots read a shared instrument under pressure. The arena should make the safe gap, next target, and crew member in need visible through the surge. Cold Front supplies the palette. Black Signal supplies the forked craft, open radial instruments, circular rescue mark, and concise monospaced instrument labels. The current arena uses native Canvas and a locked viewpoint. [Accepted combination](../art-direction/vector-relay/arcade/README.md), [Cold Front palette study](../art-direction/vector-relay/evidence/cold-front-arena.jpg), [Black Signal structure study](../art-direction/vector-relay/evidence/black-signal-arena.jpg), [stationary camera decision](../evidence/cold-signal-pacing/README.md).

## Visual grammar

| Channel | Runtime use |
| --- | --- |
| Navy `#101A3A`, field `#182A51` | Background, depth fog, cutouts and the matte edge around rescue text. Keep most of the field dark so silhouette and warning edges lead. |
| Grid `#334678`, muted `#93A9D6` | Spokes, range marks, unselected labels and fine supporting type. Taper into the center and leave open space around the bullseye. |
| Paper `#EEF7FF` | Bright neutral silhouettes, crew type and live hit boundaries. A solid paper triangle is an active rush threat. |
| Cyan `#79E5FF` | Your fork, selected rail, progress and ability cues. Pair the accent with a distinct shape or wording. The rail is a full circle, the ability is a sector, and the rescue is a partial arc around a partner. |
| Peach `#FFAF91` | Threat marks, downed brackets and rescue wording. A dashed peach zone signals warning. Its live phase uses a solid paper arc. |
| Violet `#8D85FF` | Wall bodies, chain links and Sana’s support treatment. Wall openings have short cyan endpoints. Chain links run from one actual kill position to the next. |

Use fine radial structure under angular craft and distinct open or solid threat forms. Keep the masthead bold, the display headline condensed and the instrument labels monospaced. Preserve the diamond signal mark and original fork asset. At arena scale, a thin rail or spoke stays quieter than an open enemy contour. Decorative fields may move under the game in full motion. Lettering and collision-aligned shapes stay anchored to their roles. [Canvas palette and fork](../public/cold-signal.js), [Canvas layers](../public/renderer.js), [entry and HUD type](../public/style.css), [entry and HUD markup](../public/index.html), [original app icon](../public/icon.svg).

## Arena hierarchy

1. **Route and imminent threat.** Show the three projected rails, enclosed core and clean wall gaps. Use a solid rush wedge and hollow escort wedge. Give the flank a square and point, the suppressor a hexagonal shell and warm triangle, the skimmer an open diamond, and the stalker nested triangles. Both patrol silhouettes get a short rail arc. Use the authoritative `pointAt` and `depthScale` helpers to keep them registered to their positions. Preserve the shape difference at inner depth and inside the small preview bullseye.
2. **Crew and rescue.** The inward-facing two-pronged fork marks a pilot. Preserve its 13-unit painted envelope and interior role punch, which repeats the role’s polygon in the HUD. A downed body changes to split open brackets and two bars. A separate cyan progress arc and the peach pilot, rail and percentage text carry rescue information. The revised text draws above nearby effects with a dark outline and an 8 CSS px font floor. An overlapping active tag makes room horizontally. The HUD repeats the downed pilot and rail.
3. **Abilities and chain payoff.** Use event positions for the payoff. Full motion uses a short radial sweep, fading shot trails, fragments and links. The three-or-more-clear callout names a chain when the events carry chain depth. Keep the crew and rescue lettering above large effects. Reduced motion uses a still Shockwave outline from core to outer rail, short projectile heads, compact kill marks, and retains actionable warnings, ability confirmation, rescue progress and the chain callout. The Shockwave outline marks the initial sector across playable rails. Chain damage can propagate outside that sector. Camera translation, roll and zoom stay locked in both profiles.

[Enemy silhouettes, hazards, effects and crew labels](../public/renderer.js), [projection, cast and rescue state](../src/rules.js), [runtime Shockwave example](../evidence/skill-trials/feel-art/candidate-reduce-shockwave.jpg).

## Dense-scene calibration

The constructed snapshot puts a rescuer and downed partner on the inner rail at 50% progress, next to a dashed warning, three overlapping chain bursts, and a nearby Shockwave. It includes all enemy families, an escort, a sanctuary preview and a wall gap. The same snapshots go through the real browser entry, renderer and HUD. The driver holds effect age at 0.18 seconds. Use the same 1440×1000 and 640×480 CSS viewports at device scale 1, in both motion settings. At 640×480, keep the capture at its intended size when assessing legibility. [Calibration driver](../art-direction/skill-trial/dense-scene.mjs), [baseline readings](../evidence/skill-trials/feel-art/baseline-dense.json), [candidate readings](../evidence/skill-trials/feel-art/candidate-dense.json).

Run `PORT=5182 npm run dev` in one terminal and `node art-direction/skill-trial/dense-scene.mjs candidate` in another. The driver writes PNGs and measurements under `artifacts/skill-trials/feel-art/`. To replay the baseline on the same server, export `public/renderer.js` from `969bf62` to a temporary file, set `COLD_SIGNAL_RENDERER_PATH` to that file, and run the driver with `baseline`. That integrated ancestor contains the same renderer blob as the isolated trial's `19d8cfe`; the trial record retains the original provenance.

| View | Full motion | Reduced motion |
| --- | --- | --- |
| 1440×1000 | [Before](../evidence/skill-trials/feel-art/baseline-dense-1440-full.webp) · [After](../evidence/skill-trials/feel-art/candidate-dense-1440-full.webp) | [Before](../evidence/skill-trials/feel-art/baseline-dense-1440-reduced.webp) · [After](../evidence/skill-trials/feel-art/candidate-dense-1440-reduced.webp) |
| 640×480 | [Before](../evidence/skill-trials/feel-art/baseline-dense-640-full.webp) · [After](../evidence/skill-trials/feel-art/candidate-dense-640-full.webp) | [Before](../evidence/skill-trials/feel-art/baseline-dense-640-reduced.webp) · [After](../evidence/skill-trials/feel-art/candidate-dense-640-reduced.webp) |

At desktop scale the original `P1 YOU` ink bounds crossed `P2 / INNER` by 34.1 square CSS pixels. The compact view overlapped by 6.4 and drew the rescue at a 4.76 CSS px font size. Both overlaps are zero in the candidate and the compact rescue draws at 8 CSS px. Full motion still has more light around the rescue glyph than reduced motion. The ordinary player tag and chain count still draw small at 640×480. For a human check at intended size, ask the player to identify the downed pilot and rail amid the burst, find the wall gap, and report whether rescue progress advanced. Repeat with a separate moving encounter to test whether the relocated helper tag still reads as attached to the right pilot. [Trial record](skill-trials/2026-11-19-art-direction.md).

For the next native cue or art pass, use the current playable captures for context, Cold Front for palette roles, and Black Signal for shape hierarchy. Keep the original fork path, projected footprints and viewport layout registered, then change one cue under the same state. Deliver a Canvas or CSS diff with the relevant before and after captures. Inspect the smallest supported pane and the equivalent quiet cue before scaling the treatment to a family.
