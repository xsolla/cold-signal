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
outward. Active pilots fire inward automatically. The outer rail itself shows
the team's 100-point hull. A rush that reaches the rail costs
one hull point. A flanker costs three. Rail patrols and suppressors threaten
pilots from inside the hull.

Each pilot starts with an empty power meter. Credited kills fill it, including
enemies destroyed in a chain. Space spends a full meter on that pilot's ability
and starts Overdrive. Rook charges in 25 kills and gives nearby crew speed and
brief cover. Mara charges in 28 and wards nearby crew against a hit. Sana charges
in 30 and speeds up fire and rescue. Ivo charges in 35 and can clear threats in a
sector and open a wall gap. Overdrive shields the hull for three seconds of active play at
either pace. The meter drains over that window and can earn
power again once it empties. A cast persists if its pilot is downed. Overlapping
casts run on their own timers, so spacing them out can protect the hull longer.
All pilots can rescue, and duplicate picks are allowed.

When a crew member goes down on the middle rail just ahead of a warning arc,
you can leave your firing line and try to reach them while another pilot
covers the approach, or dodge and circle back. Match the downed pilot's rail
and stay near their open marker until the progress ring fills. Your gun keeps
firing while you hold position. Progress resets if nobody stays in range. A
missed window can leave the crew with two pilots down.

The gauntlet builds through waves, lulls, and a final surge. At the time limit,
the crew clears only if everyone is active. Any remaining downed pilot sends
the team into overtime. A hull breach that exhausts the shared health pool or a
full crew wipe ends the attempt. A retry restores the hull and empties all power
meters. The default room is four pilots
at 0.5× simulation pace. Two-pilot and 1× rooms are available. Shared pause
freezes the run, and a disconnect interrupts it. Solo supports both paces, pauses
when the game loses focus, and offers a fresh attempt after each clear or loss.

Each pilot has a part in the score. Their instrument drops out when they fall
and returns on the next beat after a rescue. During Overdrive, the pilot's
instrument adds a distinct phrase to the score. The same beat still drives
the enemy waves, so the crew can hear who is missing or shielding the hull.

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

Hull damage gives the full-motion camera a short directional shake. The exact
lost segment detaches from the outer rail, drifts outward, and fades. Reduced
motion keeps the camera stationary and flashes the segment in place, following
[earlier feedback about motion comfort](../evidence/cold-signal-pacing/README.md).
The remaining hull turns white during Overdrive in either setting. In full
motion, kills, abilities, rescues, and hull impacts launch colored debris and
send ripples through a polar lattice. Chains build up the distortion, and
Overdrive sends a rotating glow around the hull. Both settings keep warning,
ability, and rescue cues above the decorative shader layer.

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
