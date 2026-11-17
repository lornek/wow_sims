# Additional character stats

The Custom tab has four nonnegative integer fields (0–5000), saved per healer with the other settings:

| Label | Raw gear stat | Icon under `public/healing/` |
| --- | --- | --- |
| Additional +healing | `power` | `report-icons/healing.jpg` |
| Additional Intellect | `intellect` | `icons/spell_holy_magicalsentry.jpg` (Arcane Intellect) |
| Additional Spirit | `spirit` | `report-icons/spirit.jpg` |
| Additional Mana / 5 | `mp5` | `report-icons/mp5.jpg` |

Spirit and MP5 reuse the exact custom tiles from the Mana Gained graph. Keep these assignments consistent across all healer pages.

`additional-stats.mjs` normalizes input and adds it to the raw gear bucket before profiles compute attributes. Apply existing racial, buff, and talent multipliers once, using normal profile rounding. Additional Intellect increases mana and spell crit after class Intellect talents and Kings; additional Spirit receives Human Spirit/Living Spirit/Kings where applicable and feeds regeneration, Spiritual Guidance, and Bloom. Additional MP5 behaves like gear MP5 and works while casting. Additional +healing receives each spell's normal scaling and healing multipliers.

The Spirit/MP5 source breakdown includes additional stats under Gear. Existing numeric custom +healing input and saved `power` are migrated to the new object; do not add this legacy value a second time. Lock all four inputs during combat; changing a field while out of combat uses the shared full-run reset path.

## Level-60 Intellect and spell crit

Use final Intellect, including base stats, gear, additional stats, buffs, talents, and racial modifiers. Spell crit contribution (fraction) = final Intellect × class coefficient / 100. The coefficients are percentage points per Intellect:

| Class | Coefficient | Approximately Intellect per +1 percentage point |
| --- | --- | --- |
| Druid | 0.0167 | 59.88 |
| Paladin | 0.0167 | 59.88 |
| Priest | 0.0168 | 59.52 |
| Shaman | 0.0169 | 59.17 |

These existing level-60 Forever coefficients agree with the PlayerExpectedStat-derived tables in [ForeverDB's stat documentation](https://foreverdb.net/stats) (client build 1.60.1.70862), including the class pages for [Druid](https://foreverdb.net/stats/druid), [Paladin](https://foreverdb.net/stats/paladin), [Priest](https://foreverdb.net/stats/priest), and [Shaman](https://foreverdb.net/stats/shaman). Do not substitute Classic Era's Paladin conversion. Class base crit, gear crit, racial crit, and applicable talent crit are added separately.

`tests/additional-stats.mjs` verifies exact equivalence to actual gear additions for all four adapters, Intellect's crit/mana delta after multipliers, source-breakdown reconciliation, and legacy input normalization.
