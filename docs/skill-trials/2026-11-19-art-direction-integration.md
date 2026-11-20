# Art-direction installation verification

Status: integration verified. Behavioral testing on Cold Signal remains open.

## Revisions and request

- Date: November 19, 2026, America/Los_Angeles.
- Reviewer: the installing Codex agent; self-reviewed integration check.
- Request: install editable Pocket Studio art direction for Cold Signal trials
  and upstream contributions, removing a previous skill installation if present.
- Cold Signal base: `752efefd6f9317a41ce9417ca8ce9887fb615c56`.
  The Pocket Studio integration was already uncommitted; this installation updates
  its pin, skill links and documentation. Gameplay files were not changed.
- Pocket Studio baseline: `d28ba40be39dea63c7945001ca89af617ffa75e5` (`main`, six skills).
- Installed revision: `8ccab1cb03ea6b8311d6d6e09fa25db2751fe56a`
  (`codex/art-direction`, art-direction v1.1.0 plus the six existing skills).
- The Pocket Studio submodule has no source edits. No separate model evaluation
  was run; model snapshot and generation settings are not part of these checks.

## Observed results

- No previous art-direction `SKILL.md` or installed skill link existed in this
  repo. The root `art-direction/` directory contains game studies and evidence.
- `.agents/skills/art-direction` is a relative link to the entire canonical folder
  at `tools/pocket-studio/skills/art-direction`.
- The installed revision descends from the baseline; all six previous skill
  folders are unchanged.
- `npm run skills:link`: verified seven links.
- `node --test tests/pocket-studio.test.mjs`: four link-helper tests passed.
- `npm run skills:check`: all seven skills passed structural/resource checks,
  22 upstream unit tests passed, and all seven release ZIPs and checksums were built.
- Upstream contribution instructions target `codex/art-direction` while it remains
  unmerged, then return to `main` once that branch includes the skill.

## Next behavioral trial

Use the trial template for a bounded art-direction task on Cold Signal, preserving
the actual request, references, output and acceptance criteria. Compare a proposed
skill fix against this installed baseline. The structural checks above do not
establish visual quality, skill judgment, or player readability. No skill behavior
fix or upstream PR resulted from this installation.
