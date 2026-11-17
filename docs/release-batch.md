# Anticipate the next hit

Work in `/workspace/wow_sims-expansion`, branch `healbot/expansion`. Original checkout `/workspace/wow_sims` stays untouched. Production baseline is owner-supplied v58 / deployment `appgdep_6af503b679b881918e73456aacdacc71`, commit `388a4db677b2b01e07d0e35991c18907cafb24bf`. Verified the uploaded complete Git bundle and worktree HEAD. The GitHub checkout lacked this object and Sites Git authentication failed; no independent current-production lookup was available. No push or production deployment was performed.

## Run and compare

```sh
cd /workspace/wow_sims-expansion
bash scripts/preview.sh
python3 -m http.server 8001 --bind 127.0.0.1 --directory dist
```

The development server is already running in this task on port 8001. `/release/` is the progress dashboard, with links to the release, the exact archived v58 at `/baseline/`, and `?cues=off` for a reversible presentation comparison. Build steps never modify the original worktree. Archive-based baseline build requires the imported production commit to remain in Git. Ordinary `node build.cjs` builds the release alone. No deployment capability is available in this session, so this is a local development preview, not a shared Sites preview.

## Release scope and findings

- Existing five-player practice encounters teach tank/off-tank preparation, party burst recovery and sustained party healing. Name their next ability and target before impact instead of adding a new boss. Final-two-second outlines supplement text; original icon clocks remain.
- Show accepted casts, busy/GCD/mana/cooldown rejection, critical/normal healing, absorption and target-death interruption. Rejected inputs are not queued. Healing sound remains optional and existing; new feedback is readable without sound. Text updates only when changed; no new motion.
- Reset clears pending desktop targeting and invalidates delayed bounce visuals. Fight state and rendering freeze at the terminal state. Reports add a bounded recent-decision list (last eight of at most 80 events), not a complete damage timeline.
- Loading has visible status and a retry link if initial class data fails. Existing routes, settings keys, spec selection and lazy imports remain.

User feedback: fights weren't frustrating; anticipated ability usage would add interest. Therefore no difficulty changes, no new boss and no invented class mechanics were added. Telegraphing remains a practice aid built on invented encounter scripts. Data provenance in README does not establish that every class mechanic is verified against current Forever.

## Validation

```sh
node --test tests/combat.test.mjs
node tests/replay-compare.mjs
NODE_PATH=/workspace/.setup-tools/node_modules node tests/browser.cjs
NODE_PATH=/workspace/.setup-tools/node_modules node tests/browser-edge.cjs
```

Browser checks require the preview server. Playwright 1.65.0 is installed outside the checkout; Chromium is `/usr/bin/chromium`. To reproduce the browser dependency without adding application dependencies:

```sh
npm install --prefix /workspace/.setup-tools --cache /workspace/.npm-cache --no-audit --no-fund --package-lock=false playwright@1.65.0
```

Engine tests cover cast acceptance/rejection, mana, actual crit healing, consumed absorption, target death, stable final state, bounded history and seeded repeatability. Seeded before/after full fights on all three bosses compare HP, damage, healing, overhealing, mana and end time. Sampling full simulated fights took milliseconds; timing is noisy and not evidence of improved performance.

Browser matrix: desktop 1440px and touch 390px; Shaman, Druid, Paladin, Discipline, Holy. Checks cover actual input, urgency/target, reset, saved encounter, no horizontal overflow, and in-page class switching. Edge checks cover 320px, stable frame position, failed-module retry, cue opt-out, exact baseline loading and terminal report. Browser tests emulate phones; real hardware, subjective learning, audio quality and all talent combinations remain unverified. Screenshots are written to `/tmp/phone-release.png` and `/tmp/desktop-release.png`.

## Prioritized backlog

1. Observe first-time players: do they start a heal before Hateful Strike after reading the tell? Compare with v58 before adding more coaching.
2. Damage-source timeline: gather deaths the recent-decision list fails to explain. Prototype one boss only and bound event storage.
3. Distinct phase pressure: justify with repeated mastery of current warnings, then compare seeded survival/mana curves. Clearly label new encounter rules.
4. Verify class-specific mechanics against pinned authoritative Forever source before balancing encounters around them. Regression equivalence is not external verification.

No experiment has been validated by a human playtest yet; “keep” in the dashboard means retained for review after functional testing. Shared preview publication remains unavailable here.
