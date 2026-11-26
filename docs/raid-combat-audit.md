# Shared Healbot combat/UI audit — November 26, 2026

Shared changes ship in Healbot 5 and Raid 10/20. Companion configuration applies only to Raid.

## Presentation and controls

Druid is deeper orange (#d8670b), Warlock deeper purple (#7440b5). Frame/meter bevels now derive their highlight and shadow from the class hue and saturation. The three role badges are re-extracted from `reference/ui/healbot_ui_ref_001.png` with a supersampled circular alpha mask; borders and shadows are rendered by CSS. `scripts/extract-role-emblems.py` reproduces the crops.

Boss names use the title's display font, larger type and a layered soft shadow. Cast-bar text is centered. Mute and keyboard buttons are equal 34px squares, side by side; keyboard opens bindings directly. Their hints are “Mute Sounds” / “Unmute Sounds” and “Edit Keybindings”.

Desktop meters are up to 330px wide, include spec-associated ability artwork, and show `42.2K (423, 12.3%)`. Ability breakdowns use the same format. The healing list has four visible row slots with internal scrolling for expanded spells. The left-frame Raid layout puts both meters below the portrait to avoid covering it. Fixed frame/panel geometry prevents expansion from moving the battlefield.

Opening a healing row forces a refresh, including after combat time freezes. Previously the 100ms render throttle returned forever at the final timestamp. The Raid “Co-healer Setup” dialog uses the site's class portraits, separate Holy/Discipline options, focus selectors, and a visible limit warning (3 companions in 20m, 1 in 10m). Closing discards changes; Apply saves and resets. Fewer companions are supported.

## Healer policies

The compiler now sorts spell ranks by level before selecting one. Previously Holy Shock selected its level-30 rank because its new spell ID appeared last. Holy and Discipline companions compile separate talent presets.

AI subtracts the full incoming-heal forecast before deciding to heal and generally waits for 85% of an expected direct heal to fit. Emergency casts override the efficiency threshold. Direct spell selection considers useful healing per expected mana, including Illumination; cooldowns, focus assignments and group restrictions remain enforced.

- Druid: maintain useful HoTs without refreshing active copies, Swiftmend emergencies, and use group Wild Growth/own-group Tranquility for multiple injuries. Healing Touch is the larger direct option.
- Shaman: maintain Water Shield; cover sustained group damage with Healing Stream, use Riptide and group-restricted Chain Heal, and reserve fast direct healing for urgent single targets. Mana tools support long pulls.
- Paladin: keep Oath on a living tank; use Holy Shock when its expected heal fits, exploit emergency Divine Favor, and prime Light's Vigil then consume it with Holy Shock when the group needs it. Light's Vigil costs 1,340 mana at the selected rank, so mild damage does not justify using it on cooldown. Flash of Light remains the economical filler; Holy Light is available for larger deficits.
- Discipline: PI a live Mage at pull; subsequent available uses choose the live damage caster with most recorded output. Use Penance for substantial deficits, emergency shields and appropriate direct/group healing. PI affects native raid caster damage as well as the original Mage.
- Holy: Prayer of Mending for damaged groups, Holy Binding through Flash Heal, and group/direct heals as appropriate. It does not inherit Discipline's Penance/PI unlocks.

These are tested practice policies, not proven optimal rotations. At standard pressure some expensive spells correctly remain unused. Reducing overheal does not mean every spec's measured percentage always decreases.

## DPS audit and source boundaries

Pinned upstream: [wowsims/forever 6fdf218](https://github.com/wowsims/forever/tree/6fdf2180b86b67b2589b43294308e90194240f5c). Existing spell snapshots and all ten priority references remain in `raid-dps-sources.json`.

Corrections from the source comparison:

- Enhancement's default build uses **The Blackrock Slicer**, a 4.0s two-handed axe, with no off hand. Stormstrike now produces one weapon strike. Shock abilities share a 6s cooldown. Own Windfury emits two separate extra attacks with +333 AP at the existing 20%/3s model; missed autos no longer generate Maelstrom.
- Balance follows `ui/specs/druid/balance/defaults.siml`: maintain Moonfire/Insect Swarm, use Wrath to grant two Eclipse charges (cap four, 15s), spend charges on Starfire. Wrath has the sourced +20% crit bonus; the triggered Eclipse row supplies the additional 500ms Starfire reduction. Missed Starfires still consume a charge. See `sim/druid/talents_balance.go` and spell rows 408248/408255.
- Shadow keeps DoTs up and prioritizes Mind Blast. Improved Mind Blast rank 5 (15273) reduces the raw 8s cooldown by 2.5s. Mind Flay finishes its current tick before yielding to a ready Mind Blast, rather than delaying it through a full filler channel. See `ui/specs/priest/dps/apls/default.apl.siml`.
- Ret now visibly contributes both Seal of Command and Righteousness in its reduced twist profile. Command uses 7 PPM, 70% weapon damage + .29 SP. Righteousness uses 17.86 × speed × hand multiplier + its hand-specific SP coefficient, with crit-only procs on landed autos. See `sim/paladin/seal_of_command.go`, `seal_of_righteousness.go`, spell 20286, and the Ret default APL. This is an approximation of seal/echo uptime; stack-by-stack twisting, swap timing and proc-chain interactions are not fully simulated.
- Raid-wide Windfury Totem (10614/10612) grants melee main-hand hits a 20% chance at **one** extra attack with +246 AP. The Shaman's own weapon proc takes precedence. Original Warrior/Rogue and new melee profiles receive separate damage events and meter entries. It is a selectable buff in both versions, default enabled in Raid, including migration for existing Raid settings. Ranged/caster attacks do not trigger it.

Fury/rogue/elemental/warlock/protection priority lists were checked against the pinned references. Existing profiles remain reduced single-target models: representative gear/AP/SP/resources, simplified pet/poison/Overload/Maelstrom behavior and omitted item procs. This audit does not make them equivalent to executing the upstream Go simulator.

## Tank damage

`defenses.mjs` models a one-roll miss/dodge/parry/block/hit table before armor. Armor uses the upstream `sim/core/spell_resistances.go` formula: 400 + 85 × attacker level, capped at 75% reduction. A level-63 boss gives a 5,755 constant.

The Warrior reference uses a cached pre-bis balanced kit: 6,132 armor plus 80 bonus armor and 109 block value before Strength. Its practice profile is 6,212 armor, 125 block value, 4.5% miss, 12% dodge, 10% parry and 20% block. Paladin uses a representative plate/shield profile: 5,900 armor, 120 block, 4.5% miss, 9% dodge, 10% parry and 15% block, with additional Holy Shield blocks/charges/reflection. Avoidance percentages are practice estimates including talents and boss skill, not exact reconstructions of tank loadouts. Non-tanks have class-appropriate representative armor and much less avoidance.

For a nominal old melee hit B, raw boss damage is `(B − 11.25 + .20 × 125) / (.735 × armorTaken(6212))`. The 11.25 term preserves the old Warrior's 25% × 45 flat block. Over 100,000 seeded swings the tank's mean remains within 4 damage of that baseline, while landed hits are larger and cloth hits exceed tank hits by over 60%. Ordinary players therefore take much more damage when a tank dies. Inspiration and Holy Shield integrate with the new table. Boss swings and Hateful Strike use this calibration; scripted raid-wide damage is not inflated. Five-player Patchwerk retains Illidan's existing practice off-tank role for Hateful Strike.

## Verification and next evidence

`node --test tests/*.mjs`: 230 passing tests. `node build.cjs` succeeds. New tests cover mean mitigation/spikes, highest-rank compilation, priest build separation, PI targeting, Vigil/Shock sequencing, Eclipse/DoTs/seals/Windfury and two-handed attacks.

`node scripts/healer-audit.mjs` runs five healer specs × 5/20 players × three bosses × three seeds. Standard pressure: 90/90 complete with every player alive. The 2.5× stress batch completes 79/90; failures are retained as pressure evidence rather than tuning every spec to win artificial overloads. Before/after summary and per-seed outcomes are in `healer-audit-results.json`. Baseline Holy actually compiled Discipline, so its percentage is not a like-for-like Holy comparison. Overall average overhealing falls from 29.6% to approximately 25.8%; individual specs vary.

Browser checks cover desktop and phone widths, direct keybinding entry, equal buttons, modal cancellation/caps, stable frame position, post-fight healing drilldowns, number formatting, missing artwork and horizontal overflow. Three Raid layouts are also checked at an intermediate width. These scripted runs establish functional behavior; human feel and actual Forever log calibration remain future work.

Next evidence to collect: actual tank swing/avoidance logs to replace practice percentages; seal/echo event traces to model full twisting; longer mixed-pressure pulls for healer mana priorities; human feedback on the four-row meter scroller and crowded phone layouts.
