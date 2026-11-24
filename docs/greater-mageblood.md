# Greater Mageblood Elixir

Replaces the Healbot Mageblood consumable with Greater Mageblood Elixir: **20 mana per 5 seconds**, icon `inv_potion_168`. The saved `mageblood` toggle remains unchanged, so existing player selections carry over. Profiles for all four healer classes and mana-report attribution share one definition in `public/healing/consumable-buffs.mjs`.

User reference: https://www.wowhead.com/forever/spell=1250790/greater-mageblood-elixir (recipe). Direct Wowhead access was blocked in this environment. Corroborating Forever data: https://github.com/wowsims/forever/blob/7cf865cb291b552a33c3165f3292bee958bd18b4/assets/database/db.json — consumable item 250341, buff spell 1250948, MP5 stat index 31 = 20; item icon entry `inv_potion_168`.

Local icon source: https://github.com/Myhed/WOW_WOTLK_ICONS/blob/a4aa62181c891f250ea67870df8728e9e9d48236/public/assets/png/INV_Potion_168.png — converted to JPEG to match the bundled icon format. Original World of Warcraft artwork belongs to Blizzard Entertainment.
