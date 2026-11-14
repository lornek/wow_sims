# Healbot report icons and colors

`public/healing/report-style.mjs` is the shared registry for every healer. Use semantic source names, never row rank, class, insertion order, or amount, to choose an icon or color. Keep ability icons aligned with the spellbook, talent tree, and buff selector. Decorative icons have empty alt text because the adjacent source name supplies the label.

## Mana gained

Spirit regeneration is shallow tropical ocean turquoise (`#168f91`). Mana / 5 is deeper ocean blue (`#225c9a`). Other sources span turquoise through indigo.

| Source | Icon file under `public/healing/` | Bar color |
| --- | --- | --- |
| Spirit regeneration | report-icons/spirit.jpg | #168f91 |
| Mana / 5 | report-icons/mp5.jpg | #225c9a |
| Innervate | icons/spell_nature_lightning.jpg | #193b86 |
| Inner Focus · spell cost | icons/spell_frost_windwalkon.jpg | #51458f |
| Inner Focus · Spirit regeneration | icons/spell_frost_windwalkon.jpg | #4265a4 |
| Water Shield | icons/ability_shaman_watershield.jpg | #258dba |
| Illumination | icons/spell_holy_greaterheal.jpg | #4b58a3 |
| Litany | icons/inv_scroll_07.jpg | #397caf |
| Lay on Hands | icons/spell_holy_layonhands.jpg | #3d4695 |
| Mana Spring Totem | icons/spell_nature_manaregentotem.jpg | #197c99 |
| Mana Tide Totem | icons/spell_frost_summonwaterelemental.jpg | #3155a0 |
| Major Mana Potion | icons/inv_potion_76.jpg | #59479b |

## Expanded contributions

All currently generated non-ability sources are listed here. The custom report icons are the project’s existing icon-sheet tiles. Base Spirit and generic Spirit talents always use the custom Spirit tile, Gear uses the efficiency tile (equipment contribution), Human racial uses the character/survival tile, and Base regeneration uses the mana-gained tile. Named buffs, consumables, and talents use their own ability icons. Gear uses the same icon in both Spirit and MP5 breakdowns.

| Entry | Icon file under `public/healing/` | Spirit child color | MP5 child color |
| --- | --- | --- | --- |
| Base Spirit | report-icons/spirit.jpg | hsl(181 73% 33%) | hsl(211 64% 37%) |
| Base regeneration | report-icons/gained.jpg | hsl(177 65% 28%) | hsl(207 56% 32%) |
| Gear | report-icons/efficiency.jpg | hsl(185 67% 36%) | hsl(215 58% 40%) |
| Human racial | report-icons/survived.jpg | hsl(175 76% 30%) | hsl(205 67% 34%) |
| Spirit talents | report-icons/spirit.jpg | hsl(186 69% 31%) | hsl(216 60% 35%) |
| Living Spirit | icons/spell_nature_giftofthewaterspirit.jpg | hsl(186 76% 30%) | hsl(216 67% 34%) |
| Mark of the Wild | icons/spell_nature_regeneration.jpg | hsl(176 70% 37%) | hsl(206 61% 41%) |
| Divine Spirit | icons/spell_holy_divinespirit.jpg | hsl(184 78% 32%) | hsl(214 69% 36%) |
| Blessing of Kings | icons/spell_magic_magearmor.jpg | hsl(178 75% 35%) | hsl(208 66% 39%) |
| Blessing of Wisdom | icons/spell_holy_sealofwisdom.jpg | hsl(185 76% 35%) | hsl(215 67% 39%) |
| Mageblood Elixir | icons/inv_potion_45.jpg | hsl(176 69% 37%) | hsl(206 60% 41%) |

Child colors are keyed by contribution name: Spirit children stay within 175–186° hue, MP5 within 205–216°. Small saturation/lightness offsets retain the parent family even when sorting changes. Child bars use 16px icons, 2px vertical padding, and compact text; parent rows retain 22px icons. Parent and child bar fills share the same full-width track and use total mana gained as their denominator. Child amount = parent mana × contribution weight / sum of parent weights. Child width = child amount / total mana gained. For example, a 50% parent with a 50% child fills 25% of the track. Displayed percentages are shares of total mana gained; child tooltips also show the share of the parent.

## Healing done

The fixed spell-key palette ranges from lemongrass to Douglas fir green. Shared keys keep their color across characters.

| Spell key | Bar color |
| --- | --- |
| wave | #648c27 |
| lesser | #4d962d |
| chain | #258451 |
| riptide | #187b60 |
| stream | #285c42 |
| touch | #718b26 |
| regrowth | #488837 |
| rejuvenation | #268353 |
| growth | #286446 |
| swiftmend | #57912d |
| tranquility | #1f6c4d |
| holyLight | #728b25 |
| flash | #4f9135 |
| shock | #26864e |
| beacon | #196750 |
| shield | #758c25 |
| renew | #458f38 |
| penance | #28824f |
| prayer | #1d7054 |
| greater | #648c27 |
| heal | #5b9130 |
| nova | #3d8b47 |
| desperate | #287552 |
| hands | #326543 |
| aegis | #225e46 |
| mending | #285c42 |
| bloom | #3b7948 |
| vigil | #316c4c |

## Adding sources

Add each new mana source to `manaVisuals`; add each new stat contribution to `contributionIcons` and `contributionOffsets`. Use an existing ability icon for named abilities and the documented custom tiles for generic concepts. Add new healing spell keys to `healingColors`. Unknown mana entries fall back to the custom mana-gained icon and `#3d669e`; unknown contributions use the custom mana-gained icon and parent color; unknown healing keys use `#397b42`. These are defensive fallbacks, not mappings for new features.

## Bar shading

Healing, mana, and expanded contribution fills share the party-frame vertical shading: `linear-gradient(#fff2, transparent 48%, #0004)`. Size the shading layer to `--share` so the unfilled track stays dark. Keep the registered source color underneath; shading must not change the semantic palette or contribution scale.

## Spirit and Innervate grouping

Spirit regeneration and Innervate share one expandable row, ranked by their combined mana. Keep the Spirit icon/name/normal amount on the left and the existing Innervate icon/name/incremental amount on the right. Never sort these segments by magnitude. With no Innervate mana, hide its heading. Both retain their individual total-mana percentages.

Expanded Spirit entries split at the normal contribution: normal turquoise first, incremental Innervate deep blue (`#193b86`) second, then the dark unfilled track. Allocate both sources using the same Spirit weights, including Base regeneration. Each child displays its combined amount and total-mana percentage; its tooltip reports normal and Innervate amounts separately. All widths use total mana gained, even when Innervate dominates. Grouping changes presentation only; combat accounting still credits normal Spirit and incremental Innervate separately and excludes capped mana.

## Healing event bars and standard sheet icons

`public/healing/healing-events.mjs` is the shared site-wide definition of event keys, labels, and icon-sheet tiles. All healer reports must use this mapping:

| Key | Label | Sheet tile under `public/healing/report-icons/` | Treatment |
| --- | --- | --- | --- |
| `d_hits` | Direct hits | `healing.jpg` | Green healing cross; non-critical direct events |
| `d_crits` | Direct crits | `crit.jpg` | Blue critical star |
| `p_hits` | Periodic hits | `hps.jpg` | Hands receiving repeated healing |
| `p_crits` | Periodic crits | `crit.jpg` + `hps.jpg` | Critical star with a small periodic-healing tile badge at bottom right |

Keep the order direct hits, direct crits, periodic hits, periodic crits. Display both hit/crit bars for every event type present, including zero-count critical bars. Pure direct heals show two direct bars; pure HoTs/totems show two periodic bars; hybrid spells such as Regrowth show all four after ticking. Channel ticks, including an immediate channel tick, count as periodic events for this breakdown. Absorbed damage events are recorded in the direct/non-critical bucket of the absorb meter.

Bar lengths represent effective healing, using the same scale as their parent spell, and tooltips show effective healing and overhealing. The right-hand value is event count. Critical bars append their critical percentage within that event type, not within all spell events: 4 direct hits and 6 direct crits display `4` and `6 (60%)`. Periodic crit percentages use only periodic events. Fully overhealing events still count. Keep the existing Casts, Healing events, Normal hits, Critical hits, Overhealing, and Healing per mana metric tiles below these bars.

Healing Stream Totem ticks can critically heal using the current healing crit chance. Its crits remain excluded from Water Shield activation. Run `node --test tests/healing-events.mjs` to verify category totals, crit denominators, hybrid overhealing, and Healing Stream/Water Shield behavior.

## Mana total and gearing indicators

The Mana gained section heading is a full-width blue mana bar using the existing main-mana vertical gradient. Its right edge shows `state.manaGained`, and resets to zero for each new run.

Place a compact gearing button immediately before the right-aligned numeric columns of the Spirit regeneration and Mana / 5 summaries. Use the standard custom `spirit.jpg` and `mp5.jpg` tiles respectively. Display `state.manaPerSpirit` as mana per +1 base Spirit and `state.manaPerMp5` as mana per +1 mana / 5, to one decimal place. The Spirit value includes raw-Spirit multipliers, casting regeneration, and Innervate. Both values use the engine's marginal-regeneration headroom calculation and freeze when combat ends. The accessible name and hover tooltip explain the units; clicking the button must not toggle the parent breakdown. When Innervate is present, place the Spirit indicator after its heading and before its numeric columns; otherwise place it before the Spirit numeric columns.

## Water Shield uptime

Label the mana source `Water Shield (73% Uptime)`, rounded to a whole percent. Uptime is combat seconds with at least one unexpired charge divided by elapsed combat time; the 3.5-second internal proc cooldown does not interrupt uptime. Stop counting on the final charge's consumption or buff expiry, resume on reapplication, and freeze at encounter end. Pre-pull Water Shield counts from combat start. A learned Water Shield gets a zero-mana row even if unused, so 0% upkeep remains visible. The label tooltip reports active/total combat seconds. `state.waterShieldUptime` is fresh for each pull; `tests/water-shield-uptime.mjs` covers the lifecycle boundaries.

## Numeric column alignment

All healing, mana, expanded event/contribution, DPS summary, and DPS ability bars use `setBarNumbers()` from `public/healing/bar-numbers.mjs`. Render the amount/event count, separator, and percentage/DPS value in separate right-aligned grid cells. Use the current proportional typeface with `font-variant-numeric: lining-nums tabular-nums`; never concatenate the full pair into a single text node or align values with spaces. Shared column widths keep one-, two-, three-, and four-digit DPS values aligned. Hit-count rows reserve the empty percentage cell so their counts line up with crit-count rows. Gearing buttons precede these numeric columns. Responsive widths may shrink together, not independently per row.

## Victory score and sound control

Victory only: `(effective healing × 0.1) × (non-potion mana gained × 0.1) × efficiency × (final survivors / party size)`. Round the final result to the nearest integer. Efficiency is effective / (effective + overhealing). No additive mana term, time-averaged survival multiplier, or victory bonus remains. `healingScore()` returns `total: null` for failed and unfinished runs; hide the score heading and formula for those phases while retaining the fight report.

Center the large Healing Score title and gold total on one heading row. Place the bold, shadowed formula directly below, before the fight-total tiles. Healing is green, eligible mana blue, efficiency purple, and survivors orange. Potion restoration stays in the mana report for accounting, but subtract mana-potion sources when calculating the scoring mana factor. The formula's mana tooltip makes this exclusion explicit.

The speaker/mute icon lives directly below Pull/Reset on the battlefield. It is a native keyboard-accessible toggle button with `aria-pressed`, a changing accessible label/title, and distinct speaker/waves versus speaker/crossed-out glyphs. The saved sound preference and existing healing audio behavior are preserved. No separate sound-effects checkbox is displayed.

### Score typography and control alignment

The score title and final score use the original `--display` typeface (Metamorphous), with matching size and weight. Formula text remains bold in `--ui`, sized at exactly 110% of the effective-healing report value: both derive from `--report-value-size` (1.15rem). Formula text reads `(healing × 0.1) × (non-potion mana × 0.1) × (efficiency%) × (survivors/party survived)` and the calculation applies both 0.1 factors.

Rows containing a gearing button use a three-column grid: flexible label, fixed button, protected numeric grid. The button is immediately before the numeric columns with an 8px gap, never distributed across spare row space. Apply the same layout inside the rightmost visible Spirit/Innervate heading.
