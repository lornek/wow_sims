# Shared icon registry and review table

`public/healing/custom-icons/icon-purposes.json` is the authored source of truth for all 28 generic icon purposes, current choices, usage descriptions and three alternatives. The user's 27 selected replacements/retentions are applied there; Base regeneration retains its original Arcane Vitality 037 icon because it was not included in the selections. Intellect retains the chosen existing WoW ability art. Named spell, buff and talent icons are unchanged.

`node build.cjs` runs `scripts/sync-icon-purposes.cjs`, which validates every assignment against actual files and generates:

- `public/healing/purpose-icons.mjs`: live semantic icon lookup used by the simulator and review page.
- `public/healing/custom-icons/icon-review.json`: review rows with matching registry version.
- `public/healing/custom-icons/available-icons.json`: all 600 custom tiles plus all local WoW ability and legacy report icon files.
- `docs/current-icon-purposes.md`: complete current ID/path table.

Do not hand-edit the generated outputs. Change the authored registry, update usage metadata when a purpose moves or is added, and rebuild. Tests ensure generated data and the shared live registry agree, all paths exist, alternatives remain distinct, and all local icon files appear in the picker. `AGENTS.md` makes this workflow persistent for future work.

The registry supplies fight-report metrics, spell-report metrics, direct/periodic event bars, mana sources and contribution breakdowns, Spirit/MP5 gearing buttons, Additional stat inputs, character-sheet stats, the Healing Score heading, and the score factors. Mana spent is now a fight-report metric using its selected icon. Score factor icons scale in em units along with the responsive formula. Periodic crits now use the selected single icon instead of the old composite badge.

The review page at `/healing/custom-icons/review.html` imports the same live registry and labels its Current column accordingly. Every row has Browse all icon files, opening a searchable dialog with previews, descriptive names, IDs, filenames and collection filters. It lists all custom, WoW ability and legacy report files. Search happens locally and rendering is limited to 60 results at a time, with Show more.

New review picks are local drafts, not global changes. Current/A/B/C and arbitrary file selections save actual icon IDs, rather than positions that could become stale. The localStorage key includes the registry version, preventing old A/B/C choices from being mistaken for selections against new mappings. A custom draft appears in the Current column below the live icon; the live value remains visible. Copy/download exports purpose names and stable IDs to send in chat for publication. No review choice silently changes other users' settings or the shared site configuration.
