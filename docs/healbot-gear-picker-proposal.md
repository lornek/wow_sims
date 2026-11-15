# Gear picker and healing averages: proposal

These features are proposed, not implemented by this change.

## Expanded healing averages

Reuse the four event bars rather than add more metric tiles. Keep the icon, type label, event count, and crit percentage together on the left. Add right-aligned `Avg effective` and `Avg overheal` columns. Both use all events in that category as the denominator, including fully overhealing events. A zero-event category displays a dash rather than an artificial zero average. Generated healing per event is the sum of those two averages; this avoids ambiguity around an “average heal” that already includes overhealing.

On mobile, put the two averages on a compact second line beneath the label/count rather than shrinking every column to illegibility. Preserve existing Casts, Normal hits, Critical hits, Overhealing, and Healing per mana tiles below. The Healing events tile is removed.

## Gear selection UI

Click an equipment slot to open a slot-specific dialog (full-screen sheet on mobile). Show search, the current item, an Unequip option, and a filtered list of compatible items with icon, quality-colored name, item level, source, and concise stat differences from the equipped item. Support name search and optionally item-ID or Wowhead-link lookup. Apply selection immediately, persist by item ID per slot, and recalculate through the existing raw gear stat pipeline. Picking any item changes the preset selection to Custom.

Filter compatible slots, class/armor/weapon requirements, level cap, and uniqueness. Handle paired ring/trinket slots and two-handed/off-hand conflicts explicitly. Do not accidentally enable dual wield for Shaman. Preserve item tooltips and use the existing popup styling. Gear changes remain disabled during combat.

## Data and performance recommendation

Use a versioned local JSON item index, loaded lazily when the picker first opens and optionally split by slot or armor category. Search/filter that data in the browser; do not make a network request on every keypress. Cache item details and icon URLs, lazy-load visible images, and render a bounded list. This keeps the existing static Sites architecture and gives fast repeated searches.

Before selecting a provider, validate a sample across all slots against current Forever items. Normalize Intellect, Spirit, MP5, +healing, critical-strike rating versus percentage, and class-specific requirements. Item IDs may exist in multiple WoW versions with different stats: always use Forever data. Keep build/source metadata so updates are deliberate. Mark effects that the simulator does not model, including unsupported procs and set bonuses, rather than treating the entire item as fully simulated.

Candidates checked:

- [TheWoWDB developer documentation](https://thewowdb.com/developers/): documents free no-key Forever JSON search/details, open CORS, ETags, caching, and required attribution. This is the lowest-friction API candidate, but current-build coverage and completeness must be validated before adoption. The documentation still references beta client data for Forever records; the direct item endpoint was not verifiable with the web reader in this session.
- [ForeverDB developer documentation](https://foreverdb.net/developers): documents item-name search, slot/quality/level filters, detailed stats/effects and build metadata. Requires account approval and an API key, with usage limits and attribution requirements. A build-time import avoids exposing keys and avoids adding a server dependency to user searches; permitted caching/redistribution terms must be checked before shipping the catalog.
- Wowhead is useful as a reference/external item link. This proposal does not assume it offers a supported public API for live search and stat ingestion.

The first implementation should cover verified equippable items with complete stats, not promise every database record. Keep the source adapter independent of the picker UI so providers can change. The existing curated preset items can seed a preview, but are not an all-items catalog.

## Character reset

Reset character is implemented separately in the Character tab. It restores current healer/spec defaults and preserves encounter, difficulty, and sound preferences. When custom equipment is added, its saved slot choices should be cleared by the same reset action.
