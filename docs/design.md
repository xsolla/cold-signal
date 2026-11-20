# Delve Together — one-page design

**Status:** Local 0.3 tunnel experiment following the creator's positive play report.
**Constraints:** One creator with Codex, ten planned weekend hours. Browser
keyboard co-op in Docker; AGS/Extend and GamePix deployment remain deferred.
Candidate target remains November 22, 2026, at 8 p.m. Pacific.

**Player promise.** Read a dangerous arena, cover threats the crew cannot safely
reach, and risk a desperate rescue when someone goes down. The creator called
the first local prototype “incredibly fun” and requested automatic shooting,
character abilities, four players, and a globally slower simulation. Enemy
variety, risky positioning, fast pattern reading, and stark audiovisual
intensity remain the creative priorities. Rescue is a dangerous comeback gamble;
clearing the run should take an arcade-minded group several learning attempts.

**Core loop.** Create or join a private room, select a pilot, and ready up with
the crew. Four ships orbit three shared rails with immediate A/D start, stop, and
reversal. Tap W/Up inward or S/Down outward, one rail per press. Every
active ship fires inward automatically from its actual depth. Read approaching enemy
and gap patterns, divide coverage, and choose when to spend a Space ability.
Staying to clear a threat can help everyone while increasing personal exposure.

**A moment of play.** A crew member goes down beside an approaching hazard.
You can clear the dangerous route first or approach immediately and use an
ability to buy a rescue window. Matching the marker’s ring and staying near it revives them while
normal fire continues. Any active pilot can rescue any downed pilot. Range,
progress, ability effects, and the next hazard should remain readable together.

**Characters — first implementation.** All pilots share basic fire, movement,
and rescue. Mara's Bulwark wards nearby crew against a hit. Ivo's Shockwave
blasts a sector, clears marked danger, and opens a wall gap. Sana's Rally boosts
nearby automatic fire and proximity rescue. Rook's Slipstream boosts nearby
movement and gives brief cover. Names, personality lines, silhouettes, and
abilities distinguish them; their offensive, defensive, and rescue utility
overlaps. Duplicate picks are allowed and no healer or party composition is
required. Ability values remain provisional.

**Rules and pacing.** A direct rusher, lateral flanker, and suppressor create
different positional problems. Skimmers patrol the middle rail and stalkers
pursue pilots on the inner rail, with marked local danger. Incoming wall rings
leave gaps and travel through every depth; short pressure
dips separate surges. Rescue normally takes 1.65 simulation seconds; leaving
range resets progress, and revival grants brief protection. All crew down loses.
The default 0.5× pace scales the entire simulation, including movement, shots,
fire cadence, warnings, rescue, buffs, and cooldowns. A 90-second gauntlet takes
roughly three real minutes; the HUD displays real seconds. Input/network sampling
stays responsive. Room creation also offers two players and full speed for tests.

**Goal and return.** Everyone must be active when the final surge is cleared.
If someone is down at the time limit, overtime continues until rescue or team
wipe. Show the shared result, allow new character choices, and ready up for a
clean retry. Pause affects the whole room; disconnect interrupts it truthfully.

**Presentation and scope.** Keep high-contrast shapes, tight percussion, visible
rescue progress, clear cooldowns, mute, and reduced motion. One tunnel, five
enemy behaviors, four compact abilities, private rooms, and a complete outcome/
retry loop form this experiment. Extra arenas, upgrades, persistence, public
matchmaking, and a separate boss remain deferred. Objects shrink into the vanishing point and grow toward the outer rim;
hit detection uses the same perspective. The small central bullseye blocks
every player bullet and protects emerging enemies from all player damage.
Enemies remain visible inside and pass through it. The original Docker build
is preserved on port 5174; pre-tunnel 0.2 images also remain available.

**Weakest assumption and next test.** Do three depths add readable positional
choices without turning the inner rail into a safe refuge or making distant
threats impossible to read? The creator called 0.2 “super fun”; that supports
continuing its direction, not a claim about this new tunnel. Try changing depth
under pressure, then rescue a crew member on an inner rail. Ask which threat
prompted the jump and what made staying for rescue feel possible or dangerous. Agent checks can
verify function and shared state; four-human coordination and taste need human
play. These coupled changes do not establish a single cause of any preference.
