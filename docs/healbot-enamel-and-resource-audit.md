# Healbot shared presentation and resource corrections

This batch applies to Healbot 5 and Raid 10/20; the Healing Team Setup dialog remains Raid-only.

## Presentation

Class colors were compared again with `reference/ui/healbot_ui_ref_001.png`. Paladin pink is softer, Druid orange lighter, Priest a beige cream, and Rogue saturation is reduced by 5% relative to its prior HSL saturation. Frame faces now stay mostly flat, with narrow edge bevels instead of a broad rounded gradient. Text shadows are smaller and biased downward; labels have padding for their shadow rather than clipping it at the text span's horizontal edges.

Meter spec icons begin at the left edge of each bar. Expanded damage and healing rows include a visible spell name as well as the icon and numbers; long names retain their full tooltip. On phones the numbers sit below the name to preserve readable space. The Raid healing panel matches the DPS panel height and top alignment (280px desktop, 240px phone), with full-width rows and an internally scrolling list. Scrollbars are thin and their arrow buttons are hidden where supported. The setup button/dialog are renamed **Healing Team Setup**.

Wild Growth aura badges now respect each effect's `members` list. Its healing and forecasts were already group-restricted, but the player's aura renderer previously treated every group effect as raid-wide. Browser casting checks confirm five visible Wild Growth badges in the targeted Raid group.

## Resources and rotations

Upstream project: [WoWSims Forever](https://wowsims.com/forever), source [wowsims/forever](https://github.com/wowsims/forever/tree/6fdf2180b86b67b2589b43294308e90194240f5c). The batch retains this pinned snapshot; it does not execute the full upstream simulator.

- Shadowform (15473) supplies a 50% reduction to shadow spell mana costs. The NPC damage model previously omitted it. Shadow's damage multiplier is also corrected to the row's 10% bonus.
- Percent-cost DPS spells now use **base mana**, not maximum buffed mana. Stormstrike's 8% of Shaman base mana is 121.6 before rounding, rather than 8% of a pool inflated by Intellect/Flask.
- Enhancement includes Shamanistic Focus's 45% shock-cost reduction (1223030), Maelstrom's 20% cost reduction per stack, and a 50% casting-Spirit-regeneration practice profile. Its unbuffed Spirit reference is 99 (Dwarf base 100−1; the selected gear adds no Spirit). Totem/other mana buffs still contribute separately. Stormstrike-triggered regeneration uptime remains simplified as continuous coverage rather than a complete talent proc simulation.
- Searing Totem is maintained for its 55-second duration, costs 170 mana and attacks every 2.425s after a 2.2s first cast. Source: `sim/shaman/fire_totems.go`, spell rows 10438 and 10436.
- Native mana DPS use Major Mana Potions and Dark Runes when enough mana is missing, on separate 120-second cooldowns. Dark Rune applies 600–1,000 self-damage and is not used at unsafe health. Gains are tracked separately from damage. Warlock Life Tap and Mage Evocation remain available.
- Mage rotation choice no longer switches to Frost on Rend/Patchwerk while retaining a Fire icon. The current Mage roster uses Fire on all three encounters; an explicit Frost spec can still select Frost behavior/artwork.
- Combat Rogue now procs Instant Poison from landed weapon attacks. Mutilate uses main-hand Instant and stacking off-hand Deadly Poison instead of an invented “Venom” damage event. Source: `sim/rogue/poisons.go`: Instant 20% and 88 + .01 AP; Deadly 30%, capped at five stacks, 23 + .009 AP per stack per 3s tick. Mutilate's poison damage bonus requires an active poison DoT. Poison/auto crits no longer grant the Mutilate model's bonus combo point. Full hand-specific poison interaction with every extra attack remains a reduced-model limitation.

## Health and encounter tuning

`raid-vitals.json` records preset paths, item IDs, database hash, class base health and equipment Stamina for fourteen NPC profiles. `raid-vitals.mjs` applies `base health + 10 × max(0, Stamina − 20) + flat gear health`; selected raid Stamina buffs apply afterward. Healers continue to use their actual selected/matched healer gear profiles.

These are **equipment-derived estimates**, not complete upstream character sheets: enchant/set/racial/talent health effects are not fully reconstructed. The Protection Paladin preset's `horn_of_veho` alias could not be resolved in the pinned item database and is explicitly listed as unresolved; no Stamina is invented for it. Most other profiles resolve every equipped item. Unbuffed examples: Protection Warrior 4,179; Fury 3,239; Combat Rogue 3,213; Hunter 2,747; Fire Mage 2,530; Shadow Priest 2,337.

Difficulty no longer increases player or NPC health, including removal of Patchwerk's special off-tank HP multiplier. Higher difficulties increase boss health/damage only. The old HP inflation made tank bars look unusually safe even on Legendary. Raid melee/Hateful pressure is additionally scaled 1.5× for 10m and 2.5× for 20m; avoidance remains unchanged. This is an encounter practice tuning decision, not a claim about real Forever bosses.

All boss base health is increased 50%: Rend 42,000, Patchwerk/Sapphiron 45,000, before the existing raid/difficulty multipliers. `encounterTuning` is now shared by browser setup and the deterministic replay tool so verification uses the same boss pressure as the game.

## Verification

- Build succeeds; full Node suite: **234 passing tests**. Added cases cover spell cost reductions, independent consumable cooldowns/rune damage, Fire casts and Rogue poison output on every boss, equipment-derived health variation, and boss tuning.
- Desktop/phone browser checks cover unchanged health across difficulty selection, group-limited Wild Growth badges, visible expanded spell names, full panel alignment, and no horizontal overflow. All three Raid layouts also pass at 1440, 1000 and 390 pixels.
- Repeated policy runs use five healer specs, 5/20 players, three bosses and seeds 17/91/503. Standard and Legendary result summaries are recorded in `healbot-enamel-replay-results.json`. These are scripted policy checks, not human win rates or calibration against live WoW logs.
- A separate 180-second, fully buffed resource check exercises Shadow and Enhancement with healing available for Rune self-damage; both maintain their rotation without reaching 100 mana, and consume mana items as needed. This demonstrates the corrected model's resource flow, not a promise that they cannot run out under other buffs or fight conditions.

Remaining accuracy work: complete upstream character stat reconstruction, exact Enhancement regen proc uptime, full seal/poison/extra-attack interactions, and validation against real encounter logs. See `raid-combat-audit.md` for the earlier batch and its model boundaries.
