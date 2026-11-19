# Healer enchant selection and Forever audit

The picker shows a reviewed set of strong healer enchants: healing, Intellect,
Spirit, MP5, crit, casting haste, and endgame defensive alternatives. It removes
leveling and melee choices, and suppresses stat-only choices strictly dominated
by another compatible option. Unique proc effects are never removed by that
stat comparison. Some unique endgame-useful proc recipes are learnable at lower
levels; recipe level alone does not determine whether their effect is useful.
Old applied enchants remain valid in saved/imported sets even when filtered out
of the picker. The Remove enchant action remains available.

## Fresh audit

Scanned all 248 entries in WoWSims Forever's `assets/database/db.json` at
`e2b55ab20e8a21291d35dd7ba4c05500c1effbe2`. Per-entry decisions and the nine
additions are in `healer-enchant-audit.json`. Supporting spell rows come from
`sim/core/spelldata/spells_auto_gen.go`; proc behavior is checked against
`sim/common/forever/enchants.go` and `enchants_auto_gen.go` at the same revision.
Re-run the catalog scan with:

```
node scripts/audit-healer-enchants.mjs /path/to/forever-db.json SOURCE_SHA
```

The previous stat importer omitted proc-only entries and pseudo-stat crit/haste.
The new entries are:

- Shield Critical Strike: +1 percentage point of spell crit.
- Gloves Minor Haste: +1% casting haste (despite its name, this is the unique
  supported glove casting-speed alternative). Existing 1.5-second GCD floor
  and unchanged HoT tick intervals remain enforced.
- Grand Arcanist: direct heals can proc 300–500 mana and +140 healing for
  20 seconds, 7% chance, 0.1-second ICD; two-handed weapons only.
- Grand Sorcerer: the same mechanism with +70 healing on a weapon.
- Insight: direct heals have a 35% chance to double Spirit for 10 seconds;
  45-second ICD. Affects Spirit regeneration, Priest Spiritual Guidance and
  Druid Bloom, with mana credited after the cap under its own source.
- Revelation: noncritical direct heals can grant a 15-second charge forcing
  the next covered healing spell's direct healing to crit. Class coverage is
  taken from the class spell-family masks (including upstream's Regrowth
  exception). Periodic healing does not roll this proc or inherit the forced
  crit; covered Penance bolts retain the channel's critical bonus.
  **Unresolved:** the upstream model uses an 8% fallback and explicitly marks
  the server's crit-dependent rate as unknown. This simulator does the same,
  with the upstream rank-level penalty. It does not claim an exact server fit.
- Chest Absorption: melee hits on the healer can grant a 50-point physical
  shield, 25% chance, 5-second ICD. The triggering hit is not retroactively
  absorbed. Actual absorption appears in healing reports.
- Boots Speed: +8% movement speed, exposed as a 1.08 movement-speed multiplier. Current encounters have no player
  movement mechanic, so this has no combat advantage here.
- Cloak Subtlety: 2% threat reduction, exposed as a 0.98 healing-threat multiplier. Current encounters use scripted
  targets, so there is no threat-based target change to alter.

Spell-heal procs listen to direct healing, not HoT applications or periodic
healing ticks. Passive secondary heals (Mending, Vigil, Bloom, Holy Binding)
do not recursively roll weapon enchants. An aura refreshes rather than stacks.
Temporary +healing is evaluated on subsequent direct heals and at HoT
application; existing HoT snapshots remain unchanged. Insight's exact duration
is included in mana integration boundaries and capped correctly.

Melee-only procs (including Recovery's heal on the wearer's own dodged/parried
attacks), gathering, elemental-damage-only, and low-rank enchants stay outside
this healer picker. Resistance and avoidance formulas require systems not
currently modeled and are not exposed as working choices. No proc rates are
invented for entries the source marks unsupported, such as Grand Inquisitor.

## Item tooltips

Item titles use the standard quality palette. Paper-doll tooltips read raw
item stats, followed by a separate Enchantment section with its stats and/or
proc description. Character totals and combat profiles use effective equipment
including the enchant exactly once. Exported/saved raw items stay unmodified.
