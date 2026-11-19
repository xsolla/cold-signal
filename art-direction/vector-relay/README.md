# Vector Relay — motion and visual development

The creator selected **Vector Relay** from the earlier art-direction proposals and asked for more motion graphics and visual variations that feel dynamic and dramatic. This is a focused development pass using art-direction v1.1.0, not another broad art-direction interview.

Open [the motion viewer](http://localhost:5186/vector-relay/). The parent local server serves it:

```sh
python3 -m http.server 5186 --bind 127.0.0.1 --directory projects/arcade-jam/art-direction
```

Choose a treatment, choose a moment, and play or scrub it. **Sequence** advances through all six clips. **Motion poster** explores cinematic scale and composition; **Arena context** checks the same fixed rescue fixture. **Reduced motion** starts enabled when the browser requests it, pauses at a representative frame, and reduces movement if the user chooses to play. Hidden tabs pause automatically.

## Preserve the identity, develop the treatment

The original forked pilot and revised circular rescue marker are drawn with the existing `pilotGlyph` helper. Enemy motifs, depth projection, fixed rescue state, and HUD copy/positions are shared across the arena previews. No source game file or original comparison file was changed. The original close-rescue label overlap and tiny inner-rail bodies remain visible; this pass does not claim to solve them.

| Treatment | Visible decisions | Motion grammar | Useful next step |
| --- | --- | --- | --- |
| **Black Signal** | Dark field, segmented instruments, open radial lines, mint/paper focal information, precise supporting type | Long anticipation and short radial release; settles into open space | Best starting point for a readable in-match presentation |
| **Red Shift** | Warm red field, blunt opposing masks, solid angular planes, black/cream contrast, compressed display type | Opposing shutters and a small overshoot; strong held poses | Strongest candidate for surge intros and end cards; calibrate bright-body contrast before gameplay use |
| **Cold Front** | Deep blue field, layered prismatic sheets, violet/cyan edge relationships, outlined headline against filled secondary type | Staggered sheet motion, slow compression and broad smooth release | Strongest route to more atmospheric title and transition graphics; keep refraction out of active targets |

These are related treatments of the selected identity. Sharing its exact craft contour is intentional here. They are not presented as three unrelated world concepts. `concepts.html` provides the environment/object/UI boards used for initial visual calibration; they were inspected before constructing the full viewer and context preview.

## Six original motion examples

1. **Link established:** four separated signals arrive and align as one crew.
2. **Surge incoming:** an iris compresses, holds, and releases radially.
3. **No one left behind:** two signals connect while a rescue circuit resolves.
4. **Make a way:** a compact wedge releases across a sector.
5. **One remains:** three subdued downed signals frame a single active pilot.
6. **All make it out:** four signals move outward/upward as the structure opens.

The editorial durations (4.5–5.5 seconds) serve comparison, not gameplay tuning. Poster staging may enlarge, position, and crop graphic elements. Arena context leaves the original constructed rescue state at 50%; motion effects sit behind gameplay marks at low opacity. The cinematic last-stand/victory examples are concept scenes, not events observed in a running match.

## Reference roles

- [iQOO — Artists Motions](https://www.behance.net/gallery/77323971/iQOO-Artists-Motions): the collection trailer and Hiraoka sequence inspected in the previous pass inform contained energy and strong silhouette transformation. The new motion paths and relay forms are original.
- [Michael Rigley — Marathon announcement trailer](https://www.michaelrigley.com/work/marathon/): the artist's process text and actual screen-study images were inspected for contrast between fine operational layers and bold forms. Its film was not played during this pass. Signal degradation is a reference quality, not a reason to disrupt essential game labels.
- [Antibody — Marathon context](https://antibody.tv/works/marathon-context/): the studio's written description supplies a reference for bolder scale and graphic mass. Its film was not played or analyzed here. The link is provided as further viewing.

No source images, characters, logos, custom typefaces, or video frames are bundled or traced. Fonts are local system families. The reusable skill remains unchanged.

## Recommendation and evidence

Use **Black Signal** as the gameplay anchor and **Red Shift** as the first dramatic transition calibration. **Cold Front** is a coherent alternate if depth and atmosphere matter more than hard cuts. These are producing-agent recommendations; the creator has selected Vector Relay, not one of these treatments yet.

Produced: native Canvas boards, six parameterized motion clips across three treatments, and a fixed-state arena comparison. Checks are recorded in [verification.json](evidence/verification.json). This is visually inspected and technically checked concept work; no human recognition test or playable art integration is claimed.
