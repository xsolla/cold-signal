> Imported planning record from the Delve Together phase. See [Cold Signal](../README.md) for current run instructions.

# Delve Together

Status: local 0.3 three-depth tunnel is running. The creator called 0.2 “super
fun” and requested inner rings, depth controls, rail enemies, and perspective.

**[Play the tunnel](http://localhost:5173)** · [Original 0.1](http://localhost:5174) · [Run instructions](../README.md) ·
[Verification and limits](verification-v03-delve-together.md)

Branch: `codex/tempest-hexagon-jam`.

## Creative direction

Create a weekend game jam project with the depth the creator associates with
classic Tempest and the speed and intensity they associate with Super Hexagon.
Use those references to discuss the intended experience and develop an original
game. The title is Delve Together. Tuning, cross-device play, and future hosted integration remain open.

Confirmed by the creator:

- Victory: clear the final surge with every crew member active.
- Submission-candidate deadline: Sunday, November 22, 2026, at 8 p.m. Pacific.
- Tempest reference: enemy variety and risky positioning.
- Super Hexagon reference: pattern reading at speed and audiovisual intensity.
- Real-time cooperative PvE.
- Four players share one arena and cover different threats; a two-player room
  option remains available for comparison.
- A surviving player must reach an exposed position to rescue a downed partner.
- Smooth continuous orbit on three playable rings. Tap W/Up inward; S/Down outward.
- Immediate start, stop, and reversal with no drift.
- Stark high-contrast shapes with tight percussive pulses.
- Create or join a private room using a short code.
- Rescue by staying near the downed partner's marker briefly; shooting remains
  available during rescue.
- A 90-second simulation gauntlet with a final surge. Global 0.5× pace makes
  this about three real minutes, including slower rescue and cooldown timing.
- Initial character implementation: Mara, Ivo, Sana, and Rook, with different overlapping abilities with shared
  basic gun, movement, and rescue. Duplicate character picks are allowed.
- Current backend: local Docker containers, with no AGS dependency.
- AccelByte Extend integration is deferred until access is available.
- Center bullseye previews emerging enemies while absorbing all player shots.
- Tunnel perspective scales objects and hitboxes with depth; inner rail enemies add positional threats.
- Keyboard controls: A/D or Left/Right orbits; W/Up and S/Down change depth; everyone shoots automatically; Space activates
  the selected character's special ability.
- Team: the creator and Codex; ten focused hours over the weekend.
- Intended release platform: GamePix.
- The creator currently has no AccelByte/AGS access. GamePix remains the intended
  release platform; the local prototype is the current test target.
- First playtest focus: whether rescue creates a readable, tense choice.
- Next human tester: the creator, with three controlled crew clients.
- Difficulty target: an arcade-minded new group needs several learning attempts
  before a clear.
- Rescue target: a dangerous comeback gamble that often fails.
- Design inspiration: Left 4 Dead's cooperative design philosophy. Research
  notes and original arena proposals are in the balance plan.

See [the design brief](design-delve-together.md),
[the ten-hour plan](prototype-plan-delve-together.md),
[game-feel preparation](game-feel.md), [playtest preparation](playtest.md),
[balance preparation](balance-plan.md), [launch checklist](launch-checklist.md),
and [platform notes](platform-notes.md).

## Guided skill walkthrough

Use the repository's six skills through short interviews. Record the creator's
answers separately from proposed defaults and untested hypotheses. Keep project
artifacts here rather than changing the reusable skills.

| Skill | Project output | Current state |
| --- | --- | --- |
| game-design-doc | One-page design, core decision, explicit scope, first experiment | Core loop retained; creator-requested four-player characters, auto fire, and global half speed retained; three-depth tunnel and patrol enemies added |
| prototype-plan | Bounded first-playable milestones and acceptance checks | Local two-container first playable implemented and verified; cloud integration deferred |
| game-feel | Review of controls, feedback, readability, and rhythm | Chosen presentation implemented; agent controls/readability checks passed; human A/B comparison pending |
| playtest | Neutral session guide, actual observations, prioritized fixes | Agent four-browser functional pass completed; creator/controlled-crew comparison ready |
| time-bandits-game-balance | A focused question about the game's actual rules, then a reproducible experiment if useful | 42 rule/network checks and four-browser pass verified; original baseline preserved; character tuning pending |
| launch-checklist | Candidate checks, release copy, credits, and remaining release actions | Local candidate paths verified; GamePix SDK/hosting, promotional assets, and release approval remain unverified |

The order of later reviews can follow the evidence available. Simulations and
technical checks cannot establish human enjoyment. Launch preparation is in
scope. GamePix is the selected destination; an upload, submission, or public
publication has not been performed or separately authorized.

## Current implementation

The creator described the 0.1 prototype as “incredibly fun” and requested the
0.2 experiment: automatic fire, Space abilities, character selection, four
players, and a global half-speed clock. This is an attributed human reaction,
not evidence of a broad player preference. The creator then called 0.2 “super fun”
and asked for more depth; 0.3 implements that request. No detailed natural
rescue or full-run account was supplied with either reaction.

Create a room at port 5173 (defaults: four players, 0.5×), choose a pilot, and
join with the room code. For one-human testing, **Local test tools → Add
controlled crew member** opens one real browser client per click; use it three
times, then ready up. Every pilot can rescue any downed crew member. Victory
requires the whole crew active; last-stand overtime preserves a final rescue.

The original 0.1 images run independently on port 5174. Main-room options allow
two/four players and half/full speed while retaining the character abilities and auto
fire. The pre-tunnel 0.2 images are also preserved for an optional port-5175
comparison. See the run guide and verification record for exact checks and limits.
AGS/Extend remains deferred. Neither local stack performs live AGS calls.

## Scope constraint

Ten hours is an aggressive budget for a new browser co-op game, Extend
integration, and a GamePix candidate. The plan starts with a bounded connection
and platform feasibility check, then protects the shared arena, enemy variety,
pattern reading, audiovisual feedback, and exposed rescue. If feasibility
fails, report the release blocker; do not quietly substitute a single-player
game. A weekend candidate is the target; platform approval is unverified.
