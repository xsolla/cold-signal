> Imported planning record from the Delve Together phase. See [Cold Signal](../README.md) for current run instructions.

# Delve Together — game-feel preparation

**Status:** Local playable implemented; agent browser input/rescue checks and
visual screenshots reviewed. The creator's quiet/effects comparison, physical
audio review, and measured input latency remain pending. The creator reported the original prototype was fun;
the creator then called the slower character variant “super fun” and asked for
more depth. The new tunnel’s human readability and feel remain untested.

**Evidence available:** The creator's chosen design: smooth orbit, A/D + Space,
four-player threat coverage, proximity rescue with shooting available, fast
pattern reading, audiovisual intensity, and a roughly 90-second gauntlet.
The creator selected automatic fire, Space abilities, global 0.5× pace, stark high-contrast shapes, tight percussive pulses, and
immediate start/stop/reversal with no drift.
The four-browser functional observations are recorded in `verification.md`;
human judgments of readability and tension remain pending.

## Selected targets

- Presentation: stark high-contrast shapes with tight percussive pulses.
- Movement response: immediate start, stop, and reversal without drift.
- Player entry: create or join a private room using a short code.

These are creator choices. Exact speeds, contrast values, sound timings, and
effect strength still need implementation and human comparison. Use distinct
ship/enemy outlines or symbols so color is optional rather than the only cue.

## Follow one action

| Action stage | Proposed player-facing target | Evidence needed |
| --- | --- | --- |
| Move | Immediate local start, stop, and reversal without drift; predictable A/D direction | Play the chosen response model; record configured parameters separately from measured input/render events |
| Depth jump | W/Up inward, S/Down outward; one rail per tap, smooth visible travel, no held-key cascade | Verify aliases, quick re-presses, endpoints, projected scale, and consistent crew depth |
| Automatic fire / Space | Ordinary shots need no button; a quick Space tap acknowledges one ability and exposes cooldown/result | Verify each power, rapid taps, held Space, and shared effect cues |
| Read danger | Enemy silhouette, movement, and a clear hazard boundary explain the safe route | Human attempt on the target browser and actual display, with effects on and quiet |
| Begin rescue | Depth, range, and progress cues make matching the partner’s rail and staying briefly understandable | Creator attempts rescue without a hint; record hints if needed |
| Finish rescue | All clients show the same revival, and the next threat remains visible | Four-client state check plus the creator's account of what changed |
| Lose or win | Outcome is recognizable and shared retry is available | Complete both paths and restart with no stale input |

No input-to-render latency or physical-device performance measurement exists. Avoid inventing a universal
response threshold or treating configured timings as observed latency.

## First useful comparison

Use the same starting positions, enemy/hazard script, rescue location, browser,
input device, and build revision for a quiet presentation and the intended
effects. Keep gameplay rules and timing fixed; change only presentation.

Ask after the attempt: "What were you watching? What made you move? What told
you the rescue was working?" Record a player's report separately from measured
events and the facilitator's interpretation.

The hypothesis is that audio and peripheral pulses increase perceived urgency
without hiding enemy, hazard, partner, or rescue cues. Revise the presentation
if the creator repeatedly attributes a hit or interrupted rescue to an obscured
cue. This is a future comparison, not a finding.

## Preserve and check

Preserve smooth steering, shooting during rescue, positional exposure, and
enemy variety. Suggested readability protections: stable playfield geometry,
effects behind threats, distinct shapes as well as colors, and visible rescue
progress. These are implementation proposals rather than observed defects.

Provide mute and reduced motion while retaining essential cues. Verify audio
starts after a player interaction, platform interruptions mute/pause correctly,
and performance remains acceptable in the target iframe. Distinguish a local
browser check from the GamePix hosted player. An agent-operated second client
can check consistency; it supplies no second human reaction.

## Tunnel readability pass

The renderer and authoritative collision share a depth projection. Physical
silhouettes, bullets, walls, warning arcs, and effects shrink toward the center;
HUD text remains legible at a fixed size. The player’s rail is highlighted and
crew chips name their depths. Skimmers use open diamonds; stalkers use double
triangles. Shapes remain distinct inside the protected preview bullseye.

Ask the creator to identify the next enemy before it emerges, change depth
without a prompt, and reach a downed pilot on another rail. Record any hint.
Check whether small inner targets are challenging for the intended aiming task
or unreadable on the actual display. Tune from that observation; automated
geometry checks alone cannot decide the right level of difficulty.
