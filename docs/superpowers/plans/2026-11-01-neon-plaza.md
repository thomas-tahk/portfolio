# Neon Plaza Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task by task.

**Goal:** Replace the fantasy grid with the approved neon plaza and animated lanes.
**Architecture:** Kaplay retains movement, camera, collisions and kicks. SVG world art supplies neon bloom; small Kaplay lane markings animate toward destinations. React supplies the persistent top bar and existing content panels.
**Tech Stack:** Existing Vite, React, Jotai, Kaplay, Playwright; no new dependencies.
**Spec:** `frontend/neon-plaza-lanes-prototype.html`, approved in chat 2026-11-01.

## Global Constraints
- Projects / Experience / Skills only in world; name and real contact links in top bar.
- Dark navy grid, open raised platforms, bright neon cores, layered bloom and floor spill.
- Visible-face human character in asymmetric streetwear; directional walking frames.
- Preserve mouse / touch-hold / WASD / arrows, kicks, camera, map wrap, panels, plain page.
- Preserve pre-existing content.json edits and untracked .claude/.
- Keep work on design/neon-plaza-handoff; no merge/deploy.

## Review Focus
- Phone portrait and landscape: header must not cover destinations or intercept walking.
- Closing panels: movement resumes, no immediate reopening; Skills resets balls.
- Keyboard: top links reachable, focus must not move avatar.
- Reduced motion: lane animation stops; movement remains controlled by user.
- Real outbound project links work; no mocked content in the acceptance flow.

### Task 1: Plaza and header
Files: `frontend/src/constants.js`, `frontend/src/initGame.js`, `frontend/src/components/Section.js`, new `frontend/src/components/Plaza.js`, new `frontend/src/reactComponents/GameHeader.jsx`, `frontend/src/ReactUI.jsx`, `frontend/style.css`, new `frontend/public/sprites/neon-plaza.svg`.
- [x] Baseline: 96 passed; one pre-existing recent-work fixture failure (Dormant removed by local content edit).
- [x] Replace obsolete social-circle checks with real top-bar checks; assert only three destinations. Watch new requirements fail.
- [x] Set layout positions and zoom for new composition. Replace shader/intro/social circles with floor + animated lanes. Draw neon platforms with matching collision bounds.
- [x] Add name, real links and Plain version in persistent header. Keep Tab access and adapt modal/hint colours to plaza.
- [x] Verify desktop/phone header, navigation, content and controls tests.

### Task 2: Character and balls
Files: new `frontend/public/sprites/arcade-explorer.svg`, `frontend/src/entities/Player.js`, `frontend/src/initGame.js`.
- [x] Add original 8-direction / 4-frame walking sheet based on approved human prototype. Preserve animation names.
- [x] Give tech balls neon housings; preserve drift, kick and reset behavior.
- [x] Update coordinate-dependent kick tests; execute real keyboard/phone kick and movement checks.

### Task 3: Acceptance and review
Files: layout-dependent `frontend/tests/*.spec.js`, `docs/chief/STATE.md`.
- [x] Walk into Projects using real keyboard and real touch, open a real outbound project link, close panel, kick a ball on desktop/phone.
- [x] Inspect desktop/phone/short-landscape renders; lint/build pass; full suite executed (baseline feed fixture + subsequently corrected touch test failure).
- [x] Independent review approved after fixes for mouse release over header and narrow landscape layouts.
- [x] Update handoff state with evidence and limitations; leave branch reviewable.

## Execution evidence
- New requirements failed before implementation: seven old zones instead of three; missing real header links.
- Phone clipping reproduced: Projects left edge -136.5px; fixed fit-to-width, minimum readable title and player sizes.
- 33 movement/panel/kick/layout checks passed; six plaza checks passed, including full desktop and real-touch journeys with no teleporting.
- External project site returned HTTP 200; acceptance opens its real link and verifies its title.
- Lint/build pass; independent review approved. Full suite 98/100 before the final test-only correction; revised desktop/phone journeys 4/4 under parallel load.
- Unrelated content.json feed-list edits stay outside the redesign commit.
- Review regressions reproduced before fixes: labels hidden below a 93px header at 667/568/480/320 widths; releasing mouse over header left walking active.
- Compact header verified at 320×320: no horizontal overflow; all four links retain 44px height.
- Phone journey test now aims at the ball centre and stops inside kick range; no teleports, state writes or mocked project navigation.
- Ruling: acceptance kicks any reachable ball, matching the user gate; watching only the original ball was wrong after steering finished beside a neighbor. Batch touch-start/end as the existing kick tests do, preventing slow CDP round trips from turning a tap into a hold.

## Final pass and production release (authorized 2026-11-02)
- [x] Add a visible Reset plaza control: clear held input, close panels, restore player spawn/direction/camera and all icon positions/drift/velocity; retain kick strength and avatar size.
- [x] Place 3×3 tech icons below Skills (relative offsets -150,+300); no fourth destination/road. Update coordinate-dependent input tests.
- [x] Verify desktop/touch walk→kick→reset and small screens; review approved; 27 final release checks pass. Full CI uses committed content (existing feed edits excluded).
- [ ] Push PR, wait for green checks, mark ready and merge (explicit user authorization), wait for Pages deployment, verify same transaction on live site and plain-page link.
