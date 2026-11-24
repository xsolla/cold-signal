# Cold Signal design

Four pilots hold a three-ring tunnel in a desktop browser. They share the
pressure of reading enemy patterns, opening gaps in crowded waves, and getting
every ship home. A pilot can leave a useful firing position to save a crew
member, but reaching the marker is only the first part of the rescue.

## One run

In multiplayer, create or join a private room by code, choose a pilot, and ready
up together. In solo, choose a pilot and pace, then launch with the other
three pilots as AI wingmates. Wingmates spread out, aim at nearby enemy packs,
and choose a rescuer for fallen crew. Everyone uses the same combat and rescue rules.
Start on the outer rail. Read emerging squads and incoming wall gaps, split
coverage, then orbit or change depth when an opening appears. An inner rail
shortens the shot path and puts different threats in reach, while enemies
farther out are already behind your gun. The bullseye absorbs shots and
protects enemies until they emerge. Hitting an exposed pack can start a chain
of death blasts through nearby enemies and clear room to move. The initiating
pilot gets the kill credit, and crew are safe from the blasts.

A/D or Left/Right orbits. Tap W/Up for one rail inward or S/Down for one rail
outward. Active pilots fire inward automatically. Space casts the selected
pilot's ability when ready. Mara's Bulwark wards nearby crew against a hit.
Ivo's Shockwave clears threats in a sector and opens a wall gap. Sana's Rally
speeds up fire and rescue. Rook's Slipstream gives nearby crew speed and
brief cover. All pilots can rescue, and duplicate picks are allowed.

When a crew member goes down on the middle rail just ahead of a warning arc,
you can leave your firing line and try to reach them while another pilot
covers the approach, or dodge and circle back. Match the downed pilot's rail
and stay near their open marker until the progress ring fills. Your gun keeps
firing while you hold position. Progress resets if nobody stays in range. A
missed window can leave the crew with two pilots down.

The gauntlet builds through waves, lulls, and a final surge. At the time limit,
the crew clears only if everyone is active. Any remaining downed pilot sends
the team into overtime, and a full crew wipe ends the attempt. After a clear
or wipe, choose pilots and ready up again. The default room is four pilots
at 0.5× simulation pace. Two-pilot and 1× rooms are available. Shared pause
freezes the run, and a disconnect interrupts it. Solo supports both paces, pauses
when the game loses focus, and offers a fresh attempt after each clear or wipe.

Each pilot has a part in the score. Their instrument drops out when they fall
and returns on the next beat after a rescue. The same beat still drives the
enemy waves, so the crew can hear who is missing while the run continues.

The [three-minute solo chart](sound-design.md#three-minute-synced-run) adds
reinforcements on separate beats and attack angles so covering one lane leaves
another exposed. Wall gaps tighten through Pressure and the later stages.
The chart calls for 60, 91, 170, 142, and 208 enemies respectively across the
five combat stages. Shorter later stages increase the enemy rate from 3.75
per bar in Ingress to 10.95 in Final Surge. Three Breath sections suspend
new threats for recovery.

Four formations recur across the run. Sweeps carry curved rush packs around
the tunnel. Pincers attack from two sides and bend toward the same sector.
Staggered rail attacks bring an inner stalker, a middle-rail skimmer, and a
suppression lane into play on different beats. Alternating wall gaps make the
crew orbit between openings while other waves approach. The finale combines
those phrases across neighboring bars.

## Presentation

Keep the camera locked in both motion settings, with zero translation and
roll and a zoom of 1. The decision followed [reports of nausea with the
earlier camera response](../evidence/cold-signal-pacing/README.md). Full motion
uses streaming lines, trails, fragments, and links between chained kills.
Reduced motion suppresses decorative effects. Both settings keep warning,
ability, and rescue cues, with pilots and rescue progress above the large
effects.

The chart shows each formation's route or wall gaps a beat ahead. Dashed
previews become solid on the reveal and subside behind the combat silhouettes.
The preview follows the same projected curve as the rush formation and stays
visible with reduced motion.

## Scope and next test

The implemented scope is one tunnel, four selectable pilots, enemy patterns
and hazards, and the shared room-to-retry loop. Additional arenas, public
matchmaking, and persistent progression are deferred. Exact tuning lives in
[the rules](../src/rules.js). [Local verification](verification.md) covers the
mechanics, with four-human coordination, difficulty, and comfort still open.

The weakest assumption is that players can read the rescue position and its
danger quickly enough to make a deliberate choice. Give a four-human crew an
unprompted rescue opportunity with a warning closing in. Record where players
stop, what they are reacting to, and why they stay or leave. Knowing where to
hold and declining because of danger supports the intended choice. Repeatedly
stopping short while expecting progress points to a cue problem.
