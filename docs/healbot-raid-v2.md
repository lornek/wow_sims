# Raid and five-player UI refinement

## Visible changes

Healing now uses the same expandable `meter-row`/`damage-breakdown` structure as DPS. Open a healer to inspect the spells used, their effective output/HPS, and cast/hit/crit/overheal tooltip information. Raid healing is on the battlefield's left; DPS remains right with a dedicated panel. Five-player Healbot gets its own healing meter below DPS. Panels have fixed dimensions and internal scrolling, including expanded breakdowns.

Shared class colors live in `class-colors.json`: copper Warrior, rose Paladin, cyan Mage, marigold Druid, pearl Priest, spring-green Hunter, royal-blue Shaman, purple Warlock and lively yellow Rogue. Illidan is Rogue yellow. Raid frames and meters have restrained gradients, bevel highlights, bolder names and softer shadows. Role emblems are actual circular crops from the user-uploaded `reference/ui/healbot_ui_ref_001.png`; all damage frames use crossed swords. The role icon registry/review data includes the source and alternatives. `scripts/extract-role-emblems.py` reproduces the crops. The original reference file's bytes were preserved when moved from the root.

Raid-only action-bar overrides were removed: both modes use the same action-bar UI. Cooldown text space, cast bars, aura areas, frame heights and meter dimensions are reserved to prevent changing combat text/auras from shifting the page. On phones, the two Raid meters sit beside one another below the boss, with healing left/DPS right.

## Buff and targeting rules

New/old Raid settings migrate once to all buffs selected; subsequent saved choices remain respected. Fortitude is available in both modes and grants **70 Stamina**, matching the cached Forever rank-6 tooltip. Selected Mark/Kings/Intellect/Spirit/Wisdom/Moonkin/Fortitude/Distilled Wisdom/Greater Mageblood selections are passed to every companion profile. Mageblood is no longer silently forced on a companion when the player deselects it. Ordinary raid members receive modeled stat/resource benefits as well; DPS baseline gear statistics are still representative profiles, not reconstructed item loadouts. Fortitude affects everyone, with Kings applied to Stamina before converting to health.

Wild Growth, Prayer of Healing, Chain Heal, Healing Stream and Light's Vigil are restricted to the selected target's five-player group, for both actual output and incoming predictions. Wild Growth no longer picks the most wounded members across the raid. Prayer of Mending alone retains raid-wide bouncing. Raid group spells require a target; five-player group spells preserve the existing no-mouseover activation convenience because there is only one group. Mana Spring from multiple Shamans does not double-stack on a healer already covered by a healing Shaman's Spring.

## Diverse DPS roster and sources

The 20-player default includes the original Protection Warrior, Combat Rogue, Hunter and Mage, plus all requested additions: Fury Warrior, Mutilate Rogue, Enhancement Shaman, Elemental Shaman, Balance Druid, Shadow Priest, Affliction Warlock, Destruction Warlock, Retribution Paladin and a Protection Paladin off-tank. Additional/no-companion slots retain varied ranged specs.

`raid-dps-sources.json` pins the WoWSims Forever revision, ten priority references and 39 selected spell IDs. `raid-dps-data.mjs` records imported cost, cooldown, cast time, duration, school and effects. Import from a fetched upstream checkout with `python scripts/import-raid-dps.py --source <checkout> --ref <revision>`.

These are reduced single-boss training rotations, **not the upstream Go simulator or complete APL execution**. They retain distinct cooldown priorities, refreshable DoTs, cast times, resources, melee/off-hand attacks, pets, combo finishers, and mana recovery. Current Forever priorities are used instead of substituting generic Wrath spells: e.g. Stormstrike/shocks/Lightning Bolt for Enhancement; Immolate/Conflagrate/Incinerate for Destruction. Shadow Word: Death creates backlash, and Protection Paladin Holy Shield blocks and reflects damage with charges. Multi-hit actions emit separate damage events.

Limitations: representative AP/SP/weapon/resource baselines, fixed proc assumptions (Windfury 20%/3 sec, Overload 20% at half damage, simplified Maelstrom generation), reduced single-target armor/mitigation, simplified poison/pet output and Life Tap, omitted item procs and advanced seal twisting. Bloodthirst, Mutilate and combo-ability special formulas use the sourced fields with explicit reduced-model handling. DPS stat buffs affect the modeled profiles; these are not full itemized DPS gear sims. Those boundaries should guide future validation against logs, not be mistaken for verified optimal rotations.

## Verification

- Unit checks cover group targeting and incoming forecasts; Chain Heal isolation and Mending's exception; the Paladin burst's group; Fortitude/consumable propagation for each healer; roster diversity; and finite/bounded resource/damage outcomes for every new spec.
- The full suite has 225 tests. The original party-combat/class tests remain included.
- Seeded raid replay and stress batches cover 72 scenarios each; these are scripted policy runs, not human win-rate evidence.
- Browser checks at 1440px and 390px cover all three Raid layouts, expandable spell breakdowns, default buffs, exact role images, healing-left/DPS-right placement, and five-player compatibility. Frame position remained unchanged when expanding the meters.
