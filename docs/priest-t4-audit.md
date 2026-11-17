# Priest T4 preset and passive healing audit

The uploaded Priest gear export now supplies `Tier 4 raid · SoD` for both Holy and Discipline. All 16 selected items and all six enchant assignments were validated against the catalog and retained. The two-handed Priest Atiesh leaves no off-hand. No talent, buff, spell, proc or set-bonus implementation was changed.

## Corrected items in the supplied set

| Item | Previous healing | Corrected healing | Spell damage |
| --- | ---: | ---: | ---: |
| Bindings of Revelation | 19 | 55 | 19 |
| Gloves of Revelation | 25 | 73 | 25 |
| Belt of Revelation | 25 | 73 | 25 |
| Leggings of Revelation | 36 | 108 | 36 |
| Sandals of Revelation | 27 | 79 | 27 |
| Ring of Resurrection | 28 | 84 | 28 |
| Stiltz's Standard | 30 | 88 | 30 |
| Atiesh, Greatstaff of the Guardian (Priest) | 150 | 362 | 169 |

Atiesh totals include its passive 300 healing / 150 damage plus its always-on party aura's 62 healing / 19 damage once for the wielder. The simulator assumes party members are in range. No additional Atiesh aura is applied elsewhere.

The supplied items total **1,332 raw +healing**, compared with **750** using the stale exported numbers. With the six supplied enchants, gear contributes **1,570 +healing** before buffs, custom stats and Spirit-derived talent healing. Doan's Mantle also supplies 4% casting haste and Barthalomew's Promise 1%, recovered from their explicit passive tooltip lines.

## Source and broader correction

WoWSims SoD's DPS database snapshot retains many damage values where a healer needs a separate, larger healing bonus. We compared the normalized SoD catalog against WoWSims' cached Wowhead tooltips, pinned to upstream commit `0e3f6eff5fa3ad356664a1c2abbd02903d4cc97e`, file `assets/db_inputs/wowhead_item_tooltips.csv`. Direct Wowhead access was blocked in this execution environment; these are verified cached SoD tooltips, not a live Forever database assertion.

The conservative parser recognizes only unconditional flat `Equip:` healing/damage bonuses and explicit casting-speed percentages. It does not include Use effects, proc healing, school-specific damage or set bonuses. It corrected healing on **377 SoD records**, and recovered explicit casting haste on **133**; overlap gives **461 updated items**. Existing Forever records are unchanged. Unrecognized tooltip forms are left unchanged rather than estimated with a multiplier.

Every correction is retained in `scripts/gear-catalog-overrides.json`, with source revision and tooltip excerpts, so a normal catalog regeneration preserves it. `docs/healing-stat-audit.json` records before/after values and the tooltip-cache SHA-256. The catalog version was advanced to invalidate browser caches. Existing preset item selections in other classes were retained, with corrected stats synchronized from the same catalog; existing saved custom sets resolve against that corrected catalog too.

To reproduce from an uncorrected normalized snapshot, download the pinned cache and run:

```
python3 scripts/audit-healing-stats.py /path/to/wowhead_item_tooltips.csv 0e3f6eff5fa3ad356664a1c2abbd02903d4cc97e
```

The audit report is a record of this correction pass. Keep it when rerunning against already corrected data. Standard catalog imports read the persistent overrides without needing a network fetch.
