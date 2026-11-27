# Pocket Studio update

November 27, 2026

Cold Signal at `b1f233a67edd2507e5214b01b5eb344412e0f7aa` pinned Pocket Studio
at `c5dbe959f2a16b18d395e86f4181af7d62e44085`. The update selected
`0775494c76a10717aeb70b8b8b5fac01d7510438`, the tip of upstream `main` on
November 27. Both revisions are in upstream `main` history.
[Upstream comparison](https://github.com/xsolla/xsolla-pocket-studio/compare/c5dbe959f2a16b18d395e86f4181af7d62e44085...0775494c76a10717aeb70b8b8b5fac01d7510438)

The update changes 13 skill versions, including guidance for playable
checkpoints, mobile controls, repeatable feedback checks, timed encounters and
adaptive scores, and saved progress after a hosted listing rename. All 18 skill
names and their repository links carry forward.

| Check | Result |
| --- | --- |
| `npm run skills:link` and `npm run skills:links` | All 18 repository skill links verified. |
| `npm run skills:check` | All 63 upstream unit tests passed and all 18 skills packaged. |
| `npm test` | All 95 Cold Signal tests passed. |
| Fresh Codex app server | Listed all 18 Pocket Studio skills from the Cold Signal checkout. |
