# Chief state
Updated: 2026-10-30 (Claude → Codex baton)
Phase: Game redesign — layout decisions in progress; production implementation NOT started (user stopped it to review mockups first).
Branch: design/neon-plaza-handoff (prototype + mockups only; no production changes). Design issue: https://github.com/thomas-tahk/portfolio/issues/40
Base design (approved, unchanged): neon Arcade Night signs on raised bases, bright cores + floor spill + deep shadows; human streetwear pixel character; kickable balls. See frontend/neon-plaza-prototype.html.
DECIDED this session: Option A — name + GitHub/LinkedIn/Email/Plain version in a slim neon top bar; world holds only Projects / Experience / Skills + balls. In-world About square, social circles and intro text get removed (About covered by plain page).
  Reason: user said B's About sign looked "dragged and dropped" and made the world layout pointless; he wants visual unity (everything in one neon language).
  Mockup: frontend/neon-plaza-scope.html (A vs B side by side).
REJECTED: the two wide crossing lanes from the prototype ("lanes look kinda weird"). User leans toward A3 = thin neon floor lines from a centre hub to each sign.
OPEN — user to pick a floor variant: frontend/neon-plaza-floor.html shows A3a thin square-corner lines / A3b circuit board (thick lines, corner nodes, glowing hub ring) / A3c soft curves / A3d flowing dashes (animated). My earlier fallback A2 (no lines, open floor) is still possible.
Preview: cd frontend && npm run dev -- --host 127.0.0.1 --port 5174, then open http://127.0.0.1:5174/portfolio/neon-plaza-floor.html (and neon-plaza-scope.html). Mockups are static, throwaway.
Next action: user reviews floor mockups in Codex and picks one (or asks for changes). THEN plan + build the real /play game.
Build plan (agreed shape, not started): 1) npm ci (qrcode missing locally — done once this session) 2) floor: navy grid + light pools + chosen lines, replacing the tiled shader background 3) signs: rebuild Section.js as neon sign + base, glow drawn as layered fading shapes in kaplay (crisp at any zoom) 4) character: new 8-direction × 4-frame sheet in the same layout as public/sprites/player.png so Player.js anims stay; wrist-light glow 5) balls: keep kick logic, neon restyle 6) top bar React component replacing PlainPageLink; remove About/social/intro from initGame + LAYOUT; update tests (hud/play/socials/modals/content reference about + socials) 7) lint + Playwright + manual desktop/phone check.
Done-gate: on desktop and phone, walk the plaza, open Projects, follow a real project link, close the panel, kick a ball; plain page still works.
Baseline test run was NOT done (user stopped it). Run `npx playwright test` before changing production code.
Do not ship prototype/mockup HTML as production. Production merge/deploy needs the user's explicit word; one PR from this branch to main.
Unrelated untracked .claude/ in repo root predates this work; leave it out of commits.
User is new to Codex: give exact steps.
