# Mana consumables

Major Mana Potion and Dark Rune are always present on every healer's hotbar.
The old potion pre-fight buff toggle is removed; old saved toggle values have
no effect on item availability. Both are self-targeted, instant, off the global
cooldown, and have independent 120-second cooldown timers.

## Sources

- Major Mana Potion, item 13444: WoWSims Forever database at commit
  `aee4e832dd9aa3f92f9f973bda7126c66a8c56fc`,
  `assets/database/db.json`: category 4, categoryCooldownMs 120000. Mana range
  1350–2250 matches the existing simulator and Classic consumes source.
- Dark Rune, item 20520 / spell 27869: cached imported Classic item tooltip
  (`sod-item-tooltips.csv`, item 20520) explicitly lists 900–1500 mana,
  600–1000 life, and “2 Min Cooldown.” Icon: `spell_shadow_sealofkings`.
  This is a Classic tooltip reference; no separate Forever override has been
  independently verified. Classic WoWSims also separates the conjured-item
  cooldown timer from the potion timer for rune-equivalent consumables.

Dark Rune rolls mana and self-damage independently. The self-damage uses the
simulator's nonphysical damage path (including existing absorption/reactive
rules, with no armor mitigation). The healer pays the damage even when at the
mana cap; a lethal hit ends the pull immediately. There is no simulated item
inventory or stock limit.

Both sources appear separately in the mana gained report, capped to usable
mana. Dark Rune joins mana potions in being excluded from Healing Score's mana
factor, preserving its existing exclusion of external consumable mana.
