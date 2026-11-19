# Delve Together — art-direction application trial

**Status:** Proposed visual exploration and a bounded refinement, self-reviewed.
**Requested task:** Create a branch from `codex/tempest-hexagon-jam` and test the art-direction skill from PR #12 on a real example.
**Skill:** v1.1.0, copied byte-for-byte from PR head `802bf75a14984adcc51c7409aee9a0e86bb8df79`.

## Supplied preferences and inspected evidence

The existing project brief names Tempest for enemy variety and risky positioning, and Super Hexagon for rapid pattern reading and audiovisual intensity. It asks for stark high-contrast shapes and a tense cooperative rescue. Those earlier preferences were read as descriptions; their source images were not inspected.

The source renderer, authoritative perspective functions, design brief, project README, and actual local entry/lobby screen were inspected. The live project runs on port 5173; an entry screenshot is saved in `evidence/runtime-entry.jpg`. Existing project files were untracked before the trial; they were preserved. The branch itself starts at `531c486a7a66bc991ca6d5c9aca3f4315ab698ef`.

The user answered the short intake: **explore three distinct looks within the current stark arcade direction**, look to **Marathon by Bungie while staying visually distinct**, and especially consider **iQOO — Artists Motions**. Early provisional boards were authored while the optional questions were pending. They were revised after those answers; they were not treated as approved concepts.

The actual [Marathon official homepage](https://www.marathonthegame.com/) was inspected in the browser, including its hard-edged graphic framing, sparse operational text, vivid accents, and dark gameplay imagery. The [Bungie art-team introduction](https://magazine.artstation.com/2026/06/bungie-marathon-art-blast/) supplied additional first-party explanation of its functional graphic hierarchy. The actual [iQOO Behance project](https://www.behance.net/gallery/77323971/iQOO-Artists-Motions) was read and viewed in the browser: its collection trailer and Masanobu Hiraoka animation were played, with observed ivory/lavender/coral masses, black negative space, and fluid changes of silhouette. These observations support a design interpretation, not a claim to have analyzed every artist's film.

Use purposeful hierarchy and graphic restraint from Marathon. Use contained energy, deformation, and strong silhouette transitions from iQOO. Make original circular rescue forms, craft silhouettes, palettes, and motion paths. No source artwork, logos, characters, custom typefaces, or animation frames are incorporated into the project.

## Product constraints and visual freedoms

Keep the three-depth circular tunnel, authoritative radius projection, object positions and depth scaling, four pilots and character names, five enemy roles, automatic fire, approaching wall gaps, inner-ring rescue, and information placement. Local ownership, threat, and rescue progress retain their separate meanings. The prototype uses a keyboard-first browser layout; small-screen and thumbnail views are stress checks, not a claim of mobile controls.

Explore craft silhouette, large background masses, edge treatment, palette relationships, supporting type, and abstract world personality. Use native Canvas forms because the actual game is procedural vector art. New bitmap textures or painted characters would add a production pipeline the current game does not use.

| Direction | Original visual anchors | Shape, value and personality | Avoid | Production burden |
| --- | --- | --- | --- | --- |
| Vector Relay | Open forked connectors and sparse navigation instruments; designed in the concept board | Split, angular craft; thin environmental vectors below bright threats; mint signal and cream information | Neon bloom, dense grid, polygonal rescue body | Low to moderate: existing primitives fit; inner-scale stroke calibration needed |
| Pressure Hull | U-shaped salvage clamps, pressure-shaft plates, and the collection's contained-energy idea; designed independently | Blunt filled craft; broad dark plate masses; bright moving wall; peach and warm paper | High-contrast scenery, misleading extra wall gaps, rust texture | Moderate: new silhouettes and plate backdrop; check wall competition |
| Elastic Current | Swept fins, interrupted wave arcs, and the inspected iQOO cel-motion sequence | Curved open craft against filled ink threats; ivory field; violet signal; smooth gathered/released bands | Source letterforms, particles, glow, active-looking scenery | Moderate: more custom paths; greatest small-size symbol convergence risk |

Each proposal uses a different part of the shared inspiration pool. Relay emphasizes operational hierarchy; Hull emphasizes contained mechanical release; Elastic Current emphasizes organic silhouette transformation and light/dark inversion. The frozen renderer controls the baseline; the shared fixture controls layout. Neither acts as a finished illustration style master for all options. See `evidence/reference-sources.json` for reference roles and inspection limits.

## Concrete comparison and refinement

The concept boards contain an environmental crop, active/downed pilot, enemy triad, and ability-label treatment. Compare shape, large value organization, and world personality before reading the direction names. A manually playable/scrubbable motion study compares modular separation, clamp tension/release, and fluid bands at one shared phase. It starts paused, stops when hidden, and never moves the game fixture. These are original abstract motion studies, not a gameplay replay.

The full comparisons use exactly one constructed fixture: P1 and a downed P2 on the inner rail, 50% rescue progress, all five threat types, a sanctuary preview, an approaching wall, and a warning zone. Object positions, projection, HUD wording, score and clock remain the same. Concept and context views were implemented in a single small native prototype; their review order is concepts first, context second. This did not exercise a separate concept-approval gate before screen authoring.

The Relay correction replaces the original diamond/cross rescue body with two open circular brackets and separated internal bars. The old diamond's outer extent is 15 units; the revised 13-unit arc with 2.5-unit stroke fits inside it. The progress arc stays at radius 23 with the same 50% state. Actual scene position and depth scale do not change. The revision is a visual hypothesis, not evidence of improved player recognition.

Calibration shows a nominal 26-unit body at the game's outer, middle and inner depth scales, without enlarging it to hide failure; glyph extrema and progress arcs are separate. At the inner rail that nominal body is 6.96 CSS pixels in a 690px scene. Full-screen context, 320×200 previews, grayscale, and browser width checks challenge both attractive concepts and the existing projection limit. Nearby P1/P2 labels overlap in this deliberately close rescue fixture, including the unchanged baseline. That failure remains visible because information placement was fixed for the art comparison.

## Recommendation and next decision

Start further calibration with **Vector Relay**: its friendly craft contours differ from solid threat wedges, and its sparse environment leaves attention for rescue. Pressure Hull offers a stronger physical setting with greater background competition risk. Elastic Current most directly explores the motion reference, and its ivory/ink value system is visibly different, but its open curves need more work as they shrink. These are the author's creative judgments; no option is selected on the user's behalf.

First human task: at the intended browser size, without explaining symbols, ask the creator to find the downed partner, name its rail, and point to the approaching wall's gap. Ask which direction feels like this game's crew. Record the person's words separately from technical checks. If they choose a look, revise only their stated weakness and retain the comparison fixture.

**Evidence stages:** proposed, authored in native Canvas, visually inspected in browser, technically checked. No generated raster assets, production export, playable integration, unfamiliar-player recognition test, or multiplayer playtest is claimed.
