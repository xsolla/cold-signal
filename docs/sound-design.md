# Cold Signal sound design

[Open the audio audition](../evidence/skill-trials/sound/index.html) or play the
[baseline WAV](../evidence/skill-trials/sound/reel-a.wav) and
[chain-roll WAV](../evidence/skill-trials/sound/reel-b.wav). At 2.77 seconds, listen
for the two-note rescue and how much weight the chain keeps in each reel.

The audio follows the existing dry, percussive synth palette. The pulse keeps
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
[Runtime implementation](../public/audio.js).

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
node scripts/audio-browser-check.mjs
python3 .agents/skills/create-game-sounds-and-music/scripts/inspect_wav.py \
  evidence/skill-trials/sound/reel-a.wav evidence/skill-trials/sound/reel-b.wav
```
