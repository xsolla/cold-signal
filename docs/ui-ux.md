# Cold Signal room and keyboard flow

Cold Signal supports desktop browsers with a keyboard for play and a keyboard or pointer for room setup. This iteration makes room options clickable, keeps all four ability descriptions visible in a 640×480 browser pane, and gives each session state a keyboard starting point. The interface keeps explicit Sound and Motion choices across the room, the run, and retries in the same browser tab. [Current rules and controls](design.md), [visual direction](art-direction.md).

| State | Player decision | Visible action and focus |
| --- | --- | --- |
| Entry | Create with the selected crew size and pace, or join by code. | Crew Size and Pace are native selects. Enter submits the room code. A rejected code leaves the input available for correction. |
| Selecting | Compare four abilities and choose a pilot. | The picker focuses the chosen pilot. Arrow keys move and select. Space can activate the focused choice. Tab goes to Ready. |
| Waiting | See who has joined or readied, or change pilot. | The overlay shows the ready count and the HUD identifies joined and ready crew. Focus stays on Ready as it becomes unavailable. Shift+Tab returns to the selected pilot. Changing pilot clears readiness. |
| Run | Orbit, change rings, use an ability, or pause. | Arena focus activates gameplay input. Hold A/D or Left/Right to orbit. Tap W/Up to hop inward or S/Down to hop outward. Space casts. Escape pauses. Fire is automatic. |
| Paused | Resume your pause or wait for a crewmate. | Your client focuses Resume. Space or Escape resumes your pause. The other clients focus the paused heading and get a waiting message. The arena receives gameplay input after play resumes. |
| Clear or wipe | Pick a pilot and ready up again. | The outcome and next action share a panel. Focus returns to the selected pilot. |
| Interrupted | Leave and form a fresh crew. | The interrupt panel focuses Leave Room. Leaving returns focus to Create a Room and retains the entry options. |

## Browser evidence

The 640×480 measurements use CSS pixels at device scale 1 in Chrome 157. The room selectors passed hit testing at both sizes. A mouse click focused either selector at 640×480. The compact candidate showed 11 CSS px ability descriptions for all four pilots, and the Ready control stayed visible without overlay scroll. The scripted pass drove the normal browser entry and real room state. Existing developer tools constructed the clear and wipe after the run began. Peer disconnect used a real browser client closing its socket. [Baseline and candidate checks](skill-trials/2026-11-19-ui-ux-design.md).

| State | Capture |
| --- | --- |
| Entry at 640×480 | [Entry](../evidence/skill-trials/ui-ux/candidate-entry-640.jpg), [invalid code](../evidence/skill-trials/ui-ux/candidate-room-error-640.jpg) |
| Pilot selection at 1440×1000 and 640×480 | [Desktop](../evidence/skill-trials/ui-ux/candidate-lobby-1440.jpg), [compact before](../evidence/skill-trials/ui-ux/baseline-lobby-640.jpg), [compact after](../evidence/skill-trials/ui-ux/candidate-lobby-640.jpg), [waiting](../evidence/skill-trials/ui-ux/candidate-waiting-640.jpg) |
| Run, pause, and outcome at 640×480 | [Run](../evidence/skill-trials/ui-ux/candidate-run-640.jpg), [shared pause](../evidence/skill-trials/ui-ux/candidate-paused-640.jpg), [clear and retry](../evidence/skill-trials/ui-ux/candidate-clear-640.jpg), [interruption and recovery](../evidence/skill-trials/ui-ux/candidate-interrupted-640.jpg) |

To repeat the focused check, start `PORT=5187 npm run dev` in one terminal and run `node scripts/ui-ux-check.mjs candidate` in another. The check writes images and measurements under `artifacts/skill-trials/ui-ux/`. It uses installed Chrome and honors `CHROME_PATH` and `COLD_SIGNAL_URL`. [Full four-client regression](verification.md#run-local-checks).

An unaided human test remains open. Give a newcomer a room code and ask them to choose the pilot who opens a wall gap, ready up, cast the ability, then resume after pausing. Record the visible cue they used and where they needed help. Screen-reader use, physical-device readability, and touch interactions remain untested.
