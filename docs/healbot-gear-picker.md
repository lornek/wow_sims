# Healbot equipment v1

Click any paper-doll slot to search compatible items by name or numeric ID, equip or unequip an item, and apply/remove a compatible permanent stat enchant. Items apply immediately and change the preset label to Custom. Search is local, sorted by +healing, with 50 results per page. Item level, ruleset, stats and differences from the equipped item appear in each result. Normal weapon enchants, two-handed, shield, staff, held-offhand and armor-kit restrictions are checked separately.

The centered character panel is capped at 780 CSS pixels, with paper doll and stats side by side above 700 pixels and stacked below. Centered talent trees are capped at 380 pixels each, with 56-pixel icons and 84-pixel rows; narrow phones use 48-pixel icons and 74-pixel rows. Trees wrap when needed. Talent mouse tooltips close immediately on leaving their icon; keyboard tooltips retain normal focus behavior.

## Local data and caching

`public/healing/catalog/items.json` bundles 7,363 Forever records and 10,082 Season of Discovery records from the MIT-licensed [WoWSims Forever](https://github.com/wowsims/forever) and [WoWSims SoD](https://github.com/wowsims/sod) repositories. These are simulator database snapshots, not a live Wowhead mirror. Their SHA-256 digests and repository paths are stored in the JSON metadata; the upstream license is included beside it. SoD data remains explicitly labelled and is separate from Forever in search. Existing presets use SoD records for later tiers, including the existing “Tier 4 raid · SoD” preset; these are not represented as verified current Forever versions of those items.

`equipment.mjs` lazily fetches the static catalog, shares one in-memory request, and keeps a versioned copy in browser Cache Storage when available. Changing the normalized catalog content changes `catalog/version.mjs`; old catalog caches are removed after loading the replacement. There are no per-keystroke API calls, credentials, third-party search requests, or runtime database dependencies. Equipment icons use the same-origin bundled art first. `gear-images.mjs` normalizes icon names and consults `bundled-icon-files.mjs`, regenerated from local files on every build. Unbundled icons may use the Wowhead CDN; failures fall back to a local equipment-slot image and finally an embedded placeholder. Both the paper doll and gear/enchant picker use this loader. No request is made for an undefined icon name. Search works after the catalog loads even if the external database is unavailable. Cache Storage failure falls back to the same-site fetch and memory cache.

To refresh, download each repository’s `assets/database/db.json` into a temporary directory as `db.json` (Forever) and `sod.json` (SoD), and its MIT license as `license.txt`. Review schema changes and the source-linked corrections in `scripts/gear-catalog-overrides.json` first, then run:

```
python scripts/import-gear-catalog.py /path/to/snapshots
node scripts/normalize-gear-presets.mjs
node --test tests/*.mjs
node build.cjs
```

The importer normalizes each source’s separate stat and class/relic enums, selects the base scaling variant, and converts Forever crit rating into percentage points at level 60 (14 rating per 1%). SoD’s percentage-based crit values stay percentages. Catalog base stats, including verified tooltip overrides, are authoritative for saved-set resolution; saved copies cannot inject stats. Attribute bonuses from enchants go into the gear bucket before Kings, class talents, Spirit-to-healing and Intellect-to-crit calculations. Flat Health and Mana bonuses apply too.

## Equipment rules and presets

The picker enforces level 60, slot, armor proficiency, class allowlist, weapon proficiency, class relic/wand type and unique-item duplication. Healer off-hands are shields or held items; dual wield is not enabled. Equipping a two-hander removes the off-hand, and equipping an off-hand removes a two-hander. Saved gear is resolved against catalog identity and validated again before use. Enchants are removed when replacing gear and must be reapplied.

All presets are normalized against the bundled records and checked by tests. Paladin staff presets have been replaced with compatible one-handed healing weapons plus shields. T4 now has Spire of Sacrifice (+317 passive healing, +106 spell damage) and Malistar’s Defender (+42 healing), instead of Mirage or the damage-oriented Tyr’s Fall. A verified override preserves the mace’s separate healing bonus, which the DPS-oriented source snapshot omits. Its sacrifice toggle (+200 healing with health loss and healing restrictions) is not simulated; its verified passive 2% casting haste now applies to cast time, with the fixed GCD and periodic-tick rules. The T4 healing mace is a reviewed selection rather than an automatic generic-spell-power ranking. Other preset weapon replacement considers tier/phase and item level, and T1 retains its valid existing healer weapon and shield. These are playable presets, not a claim of mathematically optimized BiS.

Only the simulator’s existing static stats are applied: attributes, +healing, spell damage, crit, MP5, armor, Health, Mana and verified casting haste. Item procs, on-use effects, set bonuses, weapon damage, spell hit, resistance and profession requirements are not simulated by this v1. The dialog states this limitation; only enchants with supported static stats are offered. Additional item effects are flagged where the upstream catalog describes them.

## Browser saves, undo and reset

Current custom gear and named sets live under `wow-forever-sims.gear.<class>.v1` in localStorage, separate from encounter/talent settings. Named sets contain item identities and enchant IDs, scoped to each class and this site/browser. Saving an existing name replaces that set; Undo can restore the previous version. Load, equipment/enchant changes, preset changes, save/overwrite and delete support up to 50 undo snapshots during the current page session. Undo restores both gear and the named library. Saves are not account-based and do not sync between browsers.

During combat gear editing is locked. A pending saved-gear restore disables Pull until the catalog is resolved, preventing a run with the wrong gear. Class navigation cancels delayed UI work. Reset character clears active custom equipment with the other character settings, preserving the named gear library, encounter, difficulty and sound preference. Storage errors are shown instead of falsely reporting a successful save.

## Equipment image integrity

The prior paper doll bypassed bundled item art and requested every image from the external CDN. Local-first loading avoids that dependency for bundled gear. Missing icon fields for Living Crown (252561), Martyr’s Legplates (250600), and Swarmtender’s Footpads (275609) are restored from the project’s pre-normalization curated presets in `gear-images.mjs`. A generation token prevents a stale image error handler from changing a newly equipped item. The slot placeholder retains the actual item’s tooltip and quality border; it does not unequip the item.

`tests/gear-images.mjs` checks local paths, restored metadata, missing/unsafe icon names, CDN failures, slot placeholders, terminal fallback, and stale error handlers. Adding a bundled icon automatically includes it in both the equipment loader index and the searchable icon-file picker on the next build.

See [the Priest T4 and healing-stat audit](priest-t4-audit.md) for the corrected SoD healing bonuses, shared Priest preset and enchant handling.
