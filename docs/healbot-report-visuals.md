# Healbot report icons and colors

`public/healing/report-style.mjs` is the shared registry for every healer. Use semantic source names, never row rank, class, insertion order, or amount, to choose an icon or color. Keep ability icons aligned with the spellbook, talent tree, and buff selector. Decorative icons have empty alt text because the adjacent source name supplies the label.

## Mana gained

Spirit regeneration is shallow tropical ocean turquoise (`#168f91`). Mana / 5 is deeper ocean blue (`#225c9a`). Other sources span turquoise through indigo.

| Source | Icon file under `public/healing/` | Bar color |
| --- | --- | --- |
| Spirit regeneration | report-icons/spirit.jpg | #168f91 |
| Mana / 5 | report-icons/mp5.jpg | #225c9a |
| Innervate | icons/spell_nature_lightning.jpg | #3375b2 |
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
