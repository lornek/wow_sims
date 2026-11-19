# Omen of Clarity model

Omen is enabled by default for the level-60 Druid. The top-corner Omen icon is
also a setup toggle, allowing comparisons without it. It lights up and shows
a countdown while Clearcasting is available.

## Evidence and assumptions

Imported Forever spell records identify Omen (16864) triggering Clearcasting
(16870), with a 15-second aura and a -100% cost modifier. Omen is a trained
ability in the imported dataset, not a selectable node in the current talent
tree. The normal spell icon is `spell_shadow_manaburn`.

Proc rates come from the user's pasted pooled-log analysis dated 2026-10-05:
12,310 eligible spell events, 657 procs, excluding the 10-second internal
cooldown; non-Regrowth spells roughly 5%, Regrowth 8%. The provided analysis
reported zero procs in 10,152 events within the cooldown. Its underlying logs
have not been independently audited here.

The simulator uses 5% per completed eligible spell, 8% for Regrowth, a
10-second cooldown starting at proc time, and the proposed downrank factor
`min(1, (spellLevel + 11) / 60)`. Highest action-bar ranks have no penalty.
Rates are estimates, not a verified server formula. Regrowth's higher rate
could reflect pooled-log attribution rather than a distinct server chance.

Each cast rolls once, including a HoT application and an overheal. HoT ticks,
bloom heals, and extra party targets do not roll. Healing Touch, Rejuvenation,
Regrowth and poison removal are represented in the supplied table. Swiftmend,
Wild Growth and Tranquility use the same default chance as an explicit
extrapolation; the supplied Swiftmend sample is too small to establish a rate.
Potions, Innervate and Nature's Swiftness activation neither roll nor consume
Clearcasting. The next eligible mana-cost spell consumes the nonstacking
charge at cast acceptance and stays free even if the aura would expire during
the cast. A rejected cast does not consume it. A new proc can refresh it after
the internal cooldown. Melee PPM is not modeled: this healer does not swing.

This is not a timer that forces two procs per minute. Spell opportunities,
spell mix and cooldown exclusions determine realized proc frequency.

## Mana accounting

The triggering cast pays its ordinary cost. A later free cast pays zero, does
not restart the five-second rule, and records its actual saved cost under
`Omen of Clarity · spell cost`. Like Inner Focus's existing savings report,
this is mana saved, not mana added to the pool. Effective healing per mana
uses actual mana spent. Extra usable Spirit regeneration is attributed to
Omen during the five seconds after a free spell lands, relative to that spell
having cost mana; overlaps with Innervate and mana lost to the cap are excluded.

Tests cover proc boundaries, cooldown, expiry, zero-mana use, cast reservation,
HoT/party exclusions, saved mana, five-second rule, disabled state, rejected
casts and seeded chance sampling.
