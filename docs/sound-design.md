# Cold Signal sound design

## Adaptive techno score

The score takes its steady forward motion from the user’s reference, “Giza,”
by Anyma and 19:26. Cold Signal uses an original eight-bar composition in F-sharp
minor. The four-on-the-floor kick settles into a low fundamental with a separate
midrange attack. Offbeat bass leaves room for each kick, and a detuned,
brass-like lead opens its filter over long notes. Bowed-style pads and brushed
percussion feed a synthesized stereo room. The kick and sub-bass stay dry.
[Official track credit](https://www.youtube.com/watch?v=rZpWnMHBYbg).

The audio clock holds 132 BPM at both simulation paces. Breath drops to quiet
pads and occasional distant phrases. Final Surge brings the full low end,
offbeat hats, and an octave against the lead. Overtime narrows the harmony to
an F-sharp pedal. Changes land on the next scheduled beat. Down and rescue
cues briefly lower both the score and its reverb, and a 48-kill cascade uses
at most three short taps. Each pilot’s ability has its own cue. Clear and wipe
fade the room into a short ending, and pause and mute cut suspended tails.
[Score](../public/audio-score.js) · [Mixer and cues](../public/audio.js).

Run `node scripts/audio-score-audition.mjs` to render
`artifacts/audio/expanded.wav` and its signal report from the runtime code in
Chromium. The first mix is retained locally as `artifacts/audio/preview.wav`.
Both reels use the same event timings and their respective runtime gains.
The RMS level difference between Breath and Final Surge is about 21 dB in the
expanded mix and 6 dB in the first mix. The 48 kHz, 16-bit stereo export peaks
at −3.3 dBFS. A separate constructed overlap of Final Surge, four abilities,
and a maximal chain peaks at −1.5 dBFS. Both renders stay below clipping.
The percussion noise uses the fixed audio seed `0x2c4b19`. The room uses
`0x293918` and `0x6d2b79` for its two channels. The 32.5-second constructed reel
moves through Ingress, Pressure,
Breath at 0:14.5, Final Surge at 0:18.2, a rescue over a full cascade at 0:21.8,
and a team clear at 0:31.0. Run `npm run test:audio:browser` for the live room
probe at both paces. The reel and probes verify signal and playback behavior.
Player listening and physical speaker balance remain open.

## Finale synchronized to the encounter

The last Breath begins at 70 seconds of simulation. The score strips back to
strings and a short swell. The first squad actually revealed in Final Surge
starts a fresh downbeat and brass pickup. The rules stamp that reveal in match
elapsed time, and both paces keep 132 BPM. Half pace develops the harmony over
more bars. The drum and formation cues keep their scheduled beats while
individual parts follow the crew's condition. In overtime a low pulse holds
the suspended chord until the last rescue or a wipe. The final rescue cue
precedes the resolution.

For a playable comparison, open the solo build with `?finale=synced` or
`?finale=original`. Both start in the last Breath and use the same seed each
attempt. Choose the same pilot and pace for a paired run. The rehearsal starts
with a fresh crew and arena so it is a constructed slice of the gauntlet.

Run `node scripts/audio-score-audition.mjs --finale` to render both mixes from
the same full-pace action tape to `artifacts/audio/`. This constructed take
contains the first squad reveal, a rescue during Final Surge, and a rescue
that clears the run in overtime.

## Breath into Pressure rehearsal

Open the solo build with `?pressure=synced` for a 16-bar encounter at 0.5×
pace with three AI wingmates. The first four bars strip the score back to
strings and a distant synth phrase. At 7.27 seconds the first squad appears
in the bullseye on the kick and brass downbeat. Three four-bar Pressure
phrases follow with alternating attack angles, wall pickups, and space for the
combat cues. The last phrase layers a suppressor squad against a rush pack
before settling on a suspended chord. The crew can clear at 29.09 seconds or
continue the rescue in overtime.

The [bar chart](../public/audio-chart.js) gives both the score and the solo
encounter their timing. Wall arrivals get an ascending noise pickup in the
previous beat. The pilot's own warning cue still depends on whether the wall
is in their path. Retries use the same seed. The original-score option plays
the same encounter with the adaptive loop. Run
`node scripts/audio-score-audition.mjs --pressure` to render both mixes from
one scripted keyboard input sequence through the solo rules.

## Three-minute synced run

The default 0.5× solo run uses a [99-bar chart](../public/audio-chart.js) in
4/4 at 132 BPM. Each bar contains harmony, arrangement choices, and any
squads and walls that appear on it. The match uses elapsed time to reveal
those threats, and the score schedules ahead on the Web Audio clock. Pause
holds match time. The music rejoins the current beat after pause or mute.

| Bars | Match time | Key | Encounter and score |
| --- | --- | --- | --- |
| 1–16 | 0:00–0:29 | F♯ minor | Ingress starts with strings and widely spaced squads. The kick and bass arrive with the first wall. |
| 17–32 | 0:29–0:58 | G minor | Crosscurrent introduces split-angle reinforcements and displaced hats. |
| 33–36 | 0:58–1:05 | E♭ major | Breath leaves room for recovery with strings and a swell into Pressure. |
| 37–56 | 1:05–1:42 | A♭ minor | Pressure overlaps patrols with a syncopated second bass voice. |
| 57–60 | 1:42–1:49 | E major | A second Breath sets a low pulse under the strings. |
| 61–76 | 1:49–2:18 | B♭ minor | Convergence stacks beam lanes and faster, tighter walls against a higher synth response. |
| 77–80 | 2:18–2:25 | D♭ major | Final Breath keeps the low pulse on every beat and pivots to F♯ suspended for the last reveal. |
| 81–99 | 2:25–3:00 | B minor | Final Surge brings back the opening motif above rolling percussion and the highest enemy density, then holds a three-bar cadence. |

Pitched gameplay cues take their notes from the active chord. At 3:00 an
all-active crew gets a B minor clear chord voiced by all four instruments. Overtime
holds the suspended dominant until the last rescue or a wipe. Run
`node scripts/audio-score-audition.mjs --sortie` to render a complete scripted
solo attempt through the runtime mixer to `artifacts/audio/cold-signal-ensemble-run.wav`.

### Pilot instruments

| Pilot | Part |
| --- | --- |
| Mara | Pulse bass in the low register |
| Ivo | Synth brass carrying the melody and answers |
| Sana | Bowed synth strings carrying the chord |
| Rook | Metallic plucks between the beats |

A knockdown fades the assigned part and its reverb send. The room can carry
the short tail of notes already played. Rescue fades the part in on the next
beat, including when a note is already in progress. The drum groove,
formation accents, and harmony run on the existing timeline. In a multiplayer
room with duplicate pilots, the shared instrument's level follows the
proportion of its pilots still active. In a two-player room the picked pilots
provide the two crew parts.

Run `node scripts/audio-score-audition.mjs --crew` for a constructed
listening pass that drops each instrument in turn over the real Pressure
arrangement.

### Formation accents

The chart uses one grid for enemy launches, gap previews, and synth accents.
A sweep gets a sliding note panned to its launch angle. A pincer gets a paired
horn hit. Staggered rail attacks climb through the chord as the stalker,
skimmer, and suppressor arrive. Walls have an entrance tone and a second hit
when their center crosses the outer rail. The personal hazard cue still
responds to each pilot's actual position. These accents share beats with the
score, leaving space in the lead and percussion at busy entrances.

The reference is Beat Saber's use of beat subdivisions, directional arcs, and
authored lighting. Cold Signal applies those ideas to its own tunnel, enemy
paths, and original score. [Beat Saber note and arc editor](https://beatsaber.com/documentation/placing-notes/index.html)
· [Group lighting documentation](https://beatsaber.com/documentation/the-group-lighting-event-system/index.html)

## Musical gameplay cues

Guitar Hero gave the player an audible part in the track. The guitar stayed
present on a correct performance and dropped out on a missed note. Cold Signal
uses that relationship for the rescue hold. Contact strikes the first synth
hit. Each beat in range adds a two-voice pulse that rises in register and opens
its filter with progress. Breaking the hold cuts its active and queued voices.
Completion answers with a wider chord and a short room tail.
[WaveGroup and Harmonix accounts](https://www.vice.com/en/article/the-oral-history-of-guitar-hero/).

Rail hops use short filter sweeps with a midrange impact. Ability readiness
has a clipped two-part stab. Incoming walls and warning arcs sound a pair of
metallic synth pulses for the pilot in their path, with one cue per threat.
Kill chains use one impact transient and at most three pitched hits from the
chord at playback. Abilities, rescues, and outcomes combine detuned layers
with filtered noise. Larger hits use a separate short stereo room. The mixer
briefly gives important cues room in the score and reduces the level of
overlapping abilities.

The first impact transient fires on the gameplay event. Pitched effects land
on the score's next 32nd note, within about 57 ms at 132 BPM at either pace.
Follow-up hits use whole subdivisions, including 32nd-note kill rolls and
sixteenth-note warning and readiness pairs. The same scheduling clock drives
the music and the cues, including when the finale starts a new phrase.

The combat hits follow a two-bar pattern of chord tones. Offbeats use a softer,
metallic patch, and longer chains play ascending inversions from the current
note. Movement, readiness, and the longer ability and rescue phrases use
different voicings in the second bar. Warnings keep their recognizable pulse.

Run `node scripts/audio-score-audition.mjs --feedback` for the constructed
`artifacts/audio/cue-variations.wav` reel and signal report. It uses the runtime
mixer and the same full-pace action tape as the previous
`artifacts/audio/beat-aligned.wav` reel. The tape includes depth changes,
a recharged ability, warnings, a broken rescue hold, and the overtime rescue.
The browser probe checks keyboard input, hazard audio, and cue subdivisions
against the live score in both paces.

## Historical kill-chain comparison

[Open the audio audition](../evidence/skill-trials/sound/index.html) or play the
[baseline WAV](../evidence/skill-trials/sound/reel-a.wav) and
[chain-roll WAV](../evidence/skill-trials/sound/reel-b.wav). At 2.77 seconds, listen
for the two-note rescue and how much weight the chain keeps in each reel.

The earlier audio follows a dry, percussive synth palette. The pulse keeps
time, the Shockwave sweeps up from a low tone, and the rescue answers with an
octave. In a constructed encounter, one snapshot contained all 48 kill events
and a rescue. The original client sent 48 copies of the same short triangle
pulse to Web Audio, with a float peak of 1.057 in the matched reel. The revised
client plays the original pulse for a single kill. An event batch with two to
five kills adds a higher tap. Six or more add a third. The largest roll fits
within 63 ms. Later kill batches arriving before the active cue ends are
suppressed; they do not extend or upgrade that cue. This trades one audible
notification per kill for bounded overlap. The visuals and score retain every
kill. Rescue and ability cues have their own scheduling.

| Check | A | B |
| --- | ---: | ---: |
| Kill voices started in Chromium for 48 kills | 48 | 3 |
| Rescue notes started in Chromium | 2 | 2 |
| Raw float peak | 1.0573 | 0.1028 |
| Raw samples above unity | 3 | 0 |
| Preview WAV peak (dBFS) | −1.45 | −21.70 |
| Whole-reel oscillator starts | 66 | 20 |

The two 3.8-second WAVs are mono, 48 kHz, 16-bit PCM. Both apply the same 0.8
gain before conversion so the audition can compare the mix without clipping
the file. Routine excerpts up to 2.24 seconds have identical PCM. The WAV
inspector found zero-valued boundaries, no full-scale samples, and the same
largest adjacent-sample step in both takes (0.059). In one offline Chromium
run, graph scheduling and rendering took 24.7 ms for A and 7.1 ms for B.
[Recipe](../evidence/skill-trials/sound/recipe.json),
[float measurements](../evidence/skill-trials/sound/signal-report.json),
[WAV inspection](../evidence/skill-trials/sound/wav-report.json).

Headless Chromium played the local WAV previews and verified the actual game
routing from keyboard input and WebSocket events. The maximum cascade and
overlapping rescue were constructed. How clearly players hear the rescue in a
busy run, the weight of the chain, and comfort on physical speakers remain open.
[Browser routing check](../evidence/skill-trials/sound/browser-report.json).

## Reproduce

With dependencies installed, render both WAVs and rerun the game probe from
the repository root. The probe starts and stops its own loopback server on port
5184. Set `CHROME_PATH` to use a different Chrome installation.

```sh
node scripts/audio-audition.mjs
node scripts/audio-browser-check.mjs --historical
python3 .agents/skills/create-game-sounds-and-music/scripts/inspect_wav.py \
  evidence/skill-trials/sound/reel-a.wav evidence/skill-trials/sound/reel-b.wav
```
