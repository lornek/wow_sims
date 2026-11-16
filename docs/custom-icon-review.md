# Custom icon choice table

`/healing/custom-icons/review.html` presents 28 purposes with their current art and three alternatives from the shared library. The table audits existing report metrics, healing-event rows, stat and mana contribution mappings, and Additional-stat fields in `healing-ui.mjs`, `healing-events.mjs`, `report-style.mjs` and `sims/healing.html`.

`icon-review.json` holds the stable purpose keys, purpose/usage descriptions, current legacy art and its Arcane Vitality cross-reference, plus the three proposed catalog IDs. Periodic crits preserve the current crit + HPS badge composite in the Current column. Borrowed Intellect art is marked separately from actual custom mappings. Different purposes that currently share art have separate rows; related Spirit uses and related MP5 uses are grouped to retain their shared cross-class identity.

Missing rows are proposals for the existing score formula and character attributes/resources; Mana spent is explicitly a possible future display of an already tracked quantity. The review does not add metrics, apply selected images to the simulator, or change named spell/talent/buff ability art. Strength/Agility alternatives are labelled symbolic because the sheets do not contain literal matching equipment/physical-stat symbols.

Selections persist in browser localStorage at `wow-forever-sims.icon-review.v1`. No choice is preselected. Current/A/B/C are only review preferences. Users copy or download their selected purpose names and stable icon IDs and send them in chat for implementation. The page cannot transmit selections to the assistant or change the shared site configuration. Missing rows have no Current radio option. Unknown/stale stored choices are discarded when loading the table.

Do not alter live icon mappings until the user chooses them. After implementation, update the shared registries and `healbot-report-visuals.md` rather than assigning icons by class, amount or bar order.
