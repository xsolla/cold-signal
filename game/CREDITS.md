# Delve Together — asset and dependency inventory

Game direction: the project creator, through the recorded Pocket Studio
interviews. Implementation and original procedural visuals/audio: created in
this repository with Codex assistance.

All current game graphics are code-drawn geometry or the original `icon.svg`.
Music/percussion and cues are synthesized with Web Audio; no external music,
fonts, artwork, character models, or sampled audio are loaded.

Cold Signal combines the approved Cold Front palette and Black Signal geometry
from the local art-direction trial. Its forked craft, rescue marks, tunnel lines,
particles, and cues are original procedural assets. Marathon and the iQOO Artists
Motions reference informed the exploration; no assets or branding from either
are included in the game.

Repository code follows the root Apache-2.0 license and notices. Retain the
root LICENSE and NOTICE when distributing repository-derived source.

Backend dependency: `ws` 8.23.0, MIT license (the installed package contains its
LICENSE). Browser verification dependency: `playwright-core` 1.65.1, Apache-2.0
(development only). Base images and their bundled components retain their own
notices. The npm lockfile pins installed JavaScript dependencies; Dockerfiles
pin the tested image manifests.

Tempest, Super Hexagon, and Left 4 Dead are design references only. No source,
assets, music, characters, or branding from those games are included. The
GamePix listing, promotional assets, hosted integration, and final attribution
review remain pending a release candidate.
