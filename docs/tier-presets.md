# Reviewed healer tier presets

Rebuilt Shaman, Druid and Paladin T1–T4. Priest presets, including the uploaded T4 items and enchants, remain unchanged. Fresh 60, dungeon and ungeared presets also remain unchanged.

## Progression limits

- T1: Molten Core/Onyxia and earlier verified dungeon, world, crafting and reputation sources. Silithus Windstone bosses are explicitly excluded.
- T2: adds Blackwing Lair; no Zul’Gurub, AQ, Naxxramas or later raid sources.
- T3: adds Zul’Gurub, AQ and Naxxramas; no Karazhan Crypts or Scarlet Enclave.
- T4: current SoD phase-8 pool, including Scarlet Enclave and Karazhan Crypts.

Both item acquisition and enchant acquisition are gated. This replaces the former reliance on item level or phase alone. Unknown acquisition paths are excluded below T4. Known raid-token exchanges and Atiesh’s Naxxramas/AQ quest requirements are recorded.

The catalog lacks many original Forever MC raid items, so T1 can supplement its Forever dungeon/crafted pool with source-verified SoD MC/Onyxia records. Later tiers retain their SoD raid pool, with source-verified Forever relic fallbacks. Ruleset labels remain on individual items. These presets are static-stat choices for this simulator, not a claim that different game versions have identical item tuning.

## Selection method

For each class, maximize average normalized healing potential over 60-, 90- and 120-second budgets, using default talents and no external buffs. Shaman uses Healing Wave and full-target Chain Heal; Druid uses Healing Touch; Paladin uses Holy Light and Flash of Light. The estimate includes starting mana, casting Spirit regeneration, MP5, crits, cast haste, the fixed GCD and Paladin Illumination. Item/weapon combinations and enchants are compared on the resulting character.

This favors sustainable, high-rank casting. It is a coordinate search of the source-verified pool, not an exhaustive proof of universal BiS. It does not value overheal, incoming damage, active mana cooldowns, item procs or set bonuses. A burst-healing or raid-buff-specific set can differ. Useful healing relics break static-stat ties, but their unmodeled spell-specific effects are not credited as generic +healing.

## Enchants

Compatible slots are enchanted. T1/T2 shoulders deliberately remain unenchanted because the supported healer shoulder enchants require Zul’Gurub or Naxxramas; necks, waists, rings, trinkets and relics have no compatible supported enchant. Classic cloak +70 armor is retained as a defensive tie-break, not credited as extra healing. Enchant IDs shared by boots and weapons now resolve against the actual item type and survive saved-set reloads.

## Unbuffed summary (default talents; enchants included)

| Class | Tier | Gear +healing | Mana | MP5 | Crit | Haste |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| shaman | T1 | 705 | 7345 | 34 | 21.84% | 0.00% |
| shaman | T2 | 821 | 7405 | 43 | 21.91% | 0.00% |
| shaman | T3 | 1142 | 8365 | 46 | 24.33% | 4.00% |
| shaman | T4 | 1233 | 9520 | 16 | 36.63% | 14.00% |
| druid | T1 | 596 | 7219 | 27 | 12.43% | 0.00% |
| druid | T2 | 679 | 7054 | 36 | 17.25% | 0.00% |
| druid | T3 | 1268 | 7264 | 34 | 19.81% | 0.00% |
| druid | T4 | 1465 | 7639 | 9 | 26.23% | 0.00% |
| paladin | T1 | 703 | 6572 | 32 | 22.45% | 0.00% |
| paladin | T2 | 815 | 6827 | 36 | 24.40% | 0.00% |
| paladin | T3 | 1051 | 7802 | 34 | 30.48% | 2.00% |
| paladin | T4 | 1381 | 7817 | 5 | 39.50% | 7.00% |

Full item, source and enchant details: [tier-preset-review.json](tier-preset-review.json). Item tooltips display the acquisition labels too. Raw source database SHA-256 digests are recorded in the report.

## Reproduce

Fetch source database snapshots matching the report’s hashes, then run:

```sh
node scripts/rebuild-tier-presets.mjs /path/to/forever-db.json /path/to/sod-db.json
node --test tests/*.mjs
node build.cjs
```

Review the diff before publishing. Ordinary builds do not reselect presets. The normalizer only refreshes catalog values and validates enchants; it no longer silently replaces Paladin weapons using phase/item-level heuristics.
