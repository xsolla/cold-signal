# Skill trial: chain sound can overrun the rescue mix

Status: observed. Game candidate tested.

## Reproduction

- Date and reviewer: 2026-11-19, Codex subagent.
- Skill name, metadata version and Git commit: `generative-sound-design`,
  `1.3.0`, `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`.
- Skill dirty diff or patch path: clean at start. No skill patch.
- Cold Signal Git commit and dirty diff or patch path:
  `24fd042e63691ef93a5c5013b080ee6eb8bcc4c5`, clean at start. The candidate
  game diff is in the commit that adds this record.
- Model, effort/settings and agent version: `gpt-6.2-sol`, high, Codex desktop
  subagent in an isolated worktree.
- Exact request and supplied inputs: “TEST THE SKILL ON REAL COLD SIGNAL:
  develop its existing tight percussive synth identity, preserve accepted game's
  rules and visuals, produce bespoke audible artifacts and a concrete bounded
  runtime improvement based on observed audio behavior.” The trial assignment
  specified a comparable, seeded baseline/candidate reel, actual playback-path
  verification, no additional service or dependency, and no interview while the
  user was away. Inputs were the current game design, audio source, existing
  full-population cascade fixture, and the candidate problem of simultaneous
  kill voices crowding a rescue. The established palette and bounded problem
  guided a single controlled comparison.
- Expected behavior and acceptance criteria: reproduce the issue before tuning.
  Keep the isolated kill, pulse, ability and rescue gestures. Bound kill voices
  in the live client, show headroom on the same scripted overlap, and deliver a
  local player with both clips and a reproducible recipe.

## Baseline evidence

- Actual artifact, capture or transcript path:
  [A reel](../../evidence/skill-trials/sound/reel-a.wav),
  [signal report](../../evidence/skill-trials/sound/signal-report.json),
  [browser report](../../evidence/skill-trials/sound/browser-report.json).
- Observed behavior (with location or timestamp): the constructed four-player,
  half-speed fixture emitted 48 kill events and one rescue from an actual rules
  step. The baseline client started 48 voices at the same 440 Hz starting pitch
  plus both rescue notes. At 2.77 seconds in the offline reel, the shared pulse
  and those cues reached 1.0573 before conversion, with three samples above
  unity. A 0.8 gain shared by both WAVs avoids PCM overload.
- Impact on developing Cold Signal: the stress case exceeded the output's
  full-scale range and scheduled 48 voices for one cluster. Perceived masking
  of the rescue is a listening hypothesis.
- Hypothesis about the skill instruction responsible: the v1.3.0 workflow
  prompted the reproduction and controlled comparison. The observed fault is
  in Cold Signal's per-event mix, and the trial exposed no reusable instruction
  failure.

## Candidate and comparison

- Candidate skill commit or patch: none. Variant B is a game patch.
- Reusable instruction change: none.
- Same-input comparison and unaffected regression request: both audio graphs
  receive [the same sequence](../../evidence/skill-trials/sound/recipe.json)
  at the same preview gain and rules seed `17321`. An isolated kill is the
  unaffected sound control. The browser also exercises a real keyboard
  Shockwave without relying on the constructed snapshot.
- Outcome against each acceptance criterion: bounded kill scheduling reduces
  48 oscillator starts to three at maximum load. The routine excerpt through
  2.24 seconds is bit-identical at export. The rescue starts both notes in both
  live variants. B reaches 0.1028 before conversion and has zero samples above
  full scale. Both local files decode and the audition controls switch between
  them. [Audition](../../evidence/skill-trials/sound/index.html).
- Checks run and actual results: 62 Node tests passed, including three new
  audio cases and the existing deterministic server replay. Chromium
  `157.0.8103.80` passed the instrumented Web Audio scheduling check and the
  standard four-client browser suite. The offline renderer measured float
  peaks, DC, edges and timings. The skill's WAV inspector verified 182,400
  samples per clip and zero full-scale samples. Chromium loaded and played
  both local PCM files.
  [Detailed results](../sound-design.md).
- Review type: agent self-review using constructed fixtures, headless browser
  automation and offline signal inspection.
- Remaining uncertainty and untested cases: no listening judgments or physical
  speaker checks. The test established event routing and signal headroom in the
  supplied scenario. Natural chain frequency and rescue recognition in a busy
  four-human match remain open.

## Contribution

- Upstream branch / PR: none.
- Portable scenario added upstream: none.
- Cold Signal evidence / implementation commit: the commit that adds this record.
- Adopted Pocket Studio pin: `3f8b752cd6bd03ee5d719ceac2e37f5c7c3da7d4`.
