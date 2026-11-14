# WoW Forever Sims

Run `node build.cjs` to generate the static site in `dist/`. Serve that directory with any static HTTP server.

The build shares the site shell and class navigation across all nine class routes. Add calculators under `sims/` and wire them into their class page in `build.cjs`.

Visual reference: https://wowforevertalents.com/. World of Warcraft artwork and class icons are Blizzard Entertainment assets. Class icon images are sourced from the Wowhead CDN.

## Healing practice

The Shaman page uses the reusable encounter engine in `public/healing/engine.mjs`. The class adapter supplies stats, spell ranks and bindings. A new healer can provide a different profile and spell set without changing the encounter state machine.

Spell effect data was extracted from WoWSims Forever commit `9f254e8d87569c9ec5c7968a25b55afb9176c68b`. Display ranges and icon names come from the Forever Talents Shaman spellbook. Effects in the data file include raw client coefficients, including inert effects that the simulator does not apply. The naked character profile combines WoWSims Shaman class stats, Dwarf racial offsets and stat dependencies. Riptide and Healing Stream apply their per-tick coefficients. The encounter uses a five-player practice damage script, assumes all players are in range, and models no gear, passive talents or raid buffs by default. Selecting Riptide assumes it has been learned.

## Healing Score

The single Healing Score frame shows the fight totals, ranked effective healing
(including absorbs), and ranked mana gains. Bars scale to the leading entry;
percentages show each entry's share of the total. Expand Spirit regeneration or
Mana / 5 to see gear and buff contributions. Spirit contributions assign additive
stats first, followed by Human racial, Spirit talents, and Kings increments;
rounding is distributed proportionally. Base regeneration is listed separately.

Mana accounting excludes regeneration lost at maximum mana. Simultaneous Spirit,
MP5, and Innervate gains share available headroom proportionally. Innervate gets
only its increase over ordinary Spirit regeneration. Inner Focus has separate
entries for saved spell costs and extra Spirit regeneration; its regeneration
window runs from the free spell landing until the next paid spell lands, as the
minigame scoring convention, and excludes overlap with Innervate. Saved costs
count toward total mana gained without being added to the mana pool.

The uncapped score is `(effective healing + 2 × mana gained) × healing efficiency
× (0.5 + 0.5 × average living party fraction) × victory bonus`. Healing efficiency
is effective healing divided by effective healing plus overhealing. The victory
bonus is 1.10 for a kill and 1 otherwise. Scores reward raw healing, mana recovery,
and efficiency; compare runs with the same encounter, difficulty, and loadout.

Run `node --test tests/healing-score.mjs` for accounting and scoring checks.

Report icon assignments, fixed healing/mana palettes, and contribution colors are documented in [Healbot report visuals](docs/healbot-report-visuals.md). The shared registry keeps all healer classes consistent.
