# WoW Forever Sims

Run `node build.cjs` to generate the static site in `dist/`. Serve that directory with any static HTTP server.

The build shares the site shell and class navigation across all nine class routes. Add calculators under `sims/` and wire them into their class page in `build.cjs`.

Visual reference: https://wowforevertalents.com/. World of Warcraft artwork and class icons are Blizzard Entertainment assets. Class icon images are sourced from the Wowhead CDN.

## Healing practice

The Shaman page uses the reusable encounter engine in `public/healing/engine.mjs`. The class adapter supplies stats, spell ranks and bindings. A new healer can provide a different profile and spell set without changing the encounter state machine.

Spell effect data was extracted from WoWSims Forever commit `9f254e8d87569c9ec5c7968a25b55afb9176c68b`. Display ranges and icon names come from the Forever Talents Shaman spellbook. Effects in the data file include raw client coefficients, including inert effects that the simulator does not apply. The naked character profile combines WoWSims Shaman class stats, Dwarf racial offsets and stat dependencies. Riptide and Healing Stream apply their per-tick coefficients. The encounter uses a five-player practice damage script, assumes all players are in range, and models no gear, passive talents or raid buffs by default. Selecting Riptide assumes it has been learned.
