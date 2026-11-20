> Historical visual exploration. The standalone playable game is documented in [Cold Signal](../README.md).

# Delve Together — art-direction skill trial

An application of [art-direction v1.1.0](https://github.com/xsolla/xsolla-pocket-studio/blob/802bf75a14984adcc51c7409aee9a0e86bb8df79/skills/art-direction/SKILL.md) from [PR #12](https://github.com/xsolla/xsolla-pocket-studio/pull/12) to the existing Delve Together tunnel game. This is a real-project exploration, not the PR's Signal Harbor teaching demo.

From the repository root:

```sh
python3 -m http.server 5186 --bind 127.0.0.1 --directory art-direction
```

Open [the local comparison](http://localhost:5186). ES modules require a local HTTP server. No build, package installation, backend, or API key is needed. The current playable game is available separately at port 5176.

1. Compare the three concept boards: environment, pilot, threats and ability UI.
2. Play or scrub the three abstract motion studies, then switch the large scene between the original renderer and three proposals. Each uses the same constructed rescue state and HUD.
3. Inspect grayscale, 320×200 previews, and the bounded Relay rescue-marker revision at actual depth scales.
4. Optionally record a preference and note. Saving uses only this browser's local storage. Export downloads a JSON review. The form starts without an answer.

The comparison is a static visual artifact. It does not run the simulation or change the playable renderer. `baseline/` contains unchanged snapshots of the real game's renderer and authoritative rules. `scene.js` uses those rules for projection and the constructed fixture; new art remains separate.

Read [the brief](brief.md), [evaluation](evaluation.md), and [source manifest](evidence/source-manifest.json). The original game inputs and exact skill hashes are recorded. Browser evidence and technical outcomes are in `evidence/verification.json` and the adjacent screenshots.

Changes live on `codex/tempest-art-direction-evaluation`, branched directly from `codex/tempest-hexagon-jam` at `531c486a7a66bc991ca6d5c9aca3f4315ab698ef`. The game files already existed as untracked workspace files; the trial did not retroactively treat them as tracked branch history.
