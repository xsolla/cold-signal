# Cold Signal

Cold Signal is a cooperative vector arcade game for desktop browsers.

- **Gameplay and presentation:** Read the [current design](docs/design.md) and
  [verification](docs/verification.md), then inspect the affected source. Keep
  observed play, constructed scenarios, and hypotheses distinct.
- **Runtime changes and local checks:** Use [architecture and workflows](docs/architecture.md)
  to find the owner of state and the relevant test path.
- **Pocket Studio:** For agent scaffolding, game design, prototype planning,
  game feel, art direction, UI/UX, sound design, playtesting, playtest analytics,
  release preparation, or balance, read the matching
  `.agents/skills/<skill>/SKILL.md` and its relevant references.
  If the links are missing, run `npm run skills:setup`.
- **Skill trials and fixes:** Follow the [contribution workflow](docs/pocket-studio.md).
  Edit canonical skills in `tools/pocket-studio/skills/` and record the game and
  skill revisions in `docs/skill-trials/`. Commit reusable changes in the Pocket
  Studio submodule. Commit game changes, trial evidence, and the selected pin in
  Cold Signal.
