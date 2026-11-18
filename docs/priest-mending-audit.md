# Priest healing report and Prayer of Mending audit

## Rule reference

The imported WoW Forever Priest talent tooltip in
`public/healing/priest-talents.mjs` says Prayer of Mending triggers on damage
**or non-periodic healing**, jumps to another party/raid member within 20 yards,
and lasts 30 seconds after each jump. Holy Binding heals the caster for 50%
when Flash Heal heals somebody else.

The live ability site could not be reached from this environment (HTTP 403).
The imported tooltip does not establish an internal proc cooldown or a jump
travel time; this fix adds neither. The existing five-heal charge budget and
most-injured-other-ally targeting approximation remain unchanged.

## Simulator correction

Frost Aura and Blade Flurry are party-wide damage pulses. Previously, they
processed each party member sequentially, allowing a newly moved Mending aura
to trigger again on the same pulse when the next member was processed.
Each pulse now captures its starting Mending holder. Only that holder can
trigger Mending from that pulse. Separate subsequent damage or direct-healing
events can still trigger it immediately; periodic healing cannot. This is an
explicit simultaneous-event simulation rule, not a verified Forever cooldown.

Regression tests cover all five starting-holder positions, five successive
Frost Aura pulses, direct versus periodic healing, expiry, absorbed damage,
and prevention of self-trigger recursion.

## Detailed report

With Holy Binding talented, post-fight detailed split separates Flash Heal into
`Flash Heal (direct)` and `Flash Heal (holy binding)`. Components record actual
hits, crits, effective healing and overhealing without modifying aggregate
fight totals. Both display the whole spell's effective healing per mana and
cast count. Self-targeted Flash Heal produces no Holy Binding copy. Tests
cover normal and guaranteed-critical events with overhealing.
