# Healbot Raid v1

Entry points: `/healbot-raid/` (Shaman), `/healbot-raid/druid/`, `/healbot-raid/paladin/`, `/healbot-raid/priest/` (Holy/Discipline links retain spec query). The existing `/healbot/` experience stays five-player. Raid encounter/buff/keybinding preferences use separate `.raid` settings; character gear and saved gear sets remain shared by class.

## What to try

Start with the 20-player default: you plus up to three selected companions. Raid setup expands to change size, companion classes, tank/raid/own-group focus, or frame layout. Apply raid resets the pull. Choosing No companion fills that slot with DPS. Ten-player mode allows one companion. Groups always have five members; changing a group swaps another member back. Put yourself with a healing Shaman for Mana Tide, or with a DPS Shaman for the modeled Mana Spring benefit.

Bottom groups-of-five, two columns of ten (five in 10m), and desktop left frames are available. Phones use bottom frames when left is selected. Hunter bows and caster staves distinguish DPS frames. Healer incoming casts/next ticks share the green health forecast. Other healers' HoTs, shields, Mending and totems have frame icons, with a four-icon limit. The healing meter sits under DPS, showing effective healing and HPS; companion gear/mana/focus is available in its row title, and selected gear is listed in Raid setup.

Companion equipment picks the nearest average item level among that class's existing presets, recalculated when your equipped gear changes. It is an approximate preset match, not a generated per-slot item-level clone. Companions use the existing Forever spell profiles, default talent builds (Discipline for companion Priests), separate mana/casts/cooldowns, and shared raid health. They account for predicted incoming healing, avoid low-value direct top-ups, reserve fast spells for emergencies, dispel, use class tools and mana cooldowns, and respect their focus. Their decisions are tested heuristics, not certified optimal rotations.

## Rules and boundaries

Boss health is exactly 4× the selected encounter/difficulty health in 10m and 12× in 20m. The practice time limit is 2×/4× respectively. Existing damage patterns are expanded to the raid; this is invented raid practice scaling, not a claim to reproduce authentic 10/20-player bosses. Party-limited Prayer of Healing, Holy Nova, Tranquility, Light's Vigil and totems use the caster's five-player group; Wild Growth picks up to five wounded raid members. Chain Heal retains its three-target raid bounce model.

DPS members reuse the tested Warrior/Rogue/Hunter/Mage combat templates under curated Warcraft hero names; DPS Shamans currently use a caster proxy, with modeled Mana Spring (20 mana per two seconds to grouped healer actors). These are not complete class-specific DPS rotations. Companion shields credit their caster's effective healing. One simultaneous AoE pulse can trigger each companion Mending aura only once. Healer death stops their subsequent actions. Raid outcome currently follows player death/boss death/time limit, as in original Healbot.

## Iteration evidence

1. Foundation: shared health, independent healer states, group semantics. The original 194 checks passed after fixing a caster-reference regression during generalization.
2. First playtest/revision: 72 seeded Tier-2-average scenarios (20m/10m × four player classes × three encounters × seeds 17/91/503). Fixed missing companion consumables, shield healing attribution, caster mana displays, group-restricted pending-heal forecasts, and the Frost Aura/Mending batch interaction.
3. Rotation revision: enabled Penance, Divine Favor, group Tranquility and situational Healing Stream; increased the threshold for low-value HoTs. Normal-difficulty scripted-player runs remained 72/72 wins. Mean 20m team overhealing with a Druid player fell from 38.1% to about 33.5%; Priest remains the tightest mana case. This measures a scripted player following the same decision policy, not human completion rates or proof of optimal play.
4. Browser pass: 1440px and 390px for all three layouts; no overlapping frames or horizontal overflow after fixing the Raid header. Confirmed 20/10/5 frames on raid20/raid10/original paths. Manual spell interactions across four classes, live incoming overlays, companion meters, and a persisted player group swap were exercised with headless browser input. Remote audio availability was not part of these checks.

Reproduce simulation evidence: `node scripts/raid-playtest.mjs`. Individual results and timings are emitted as JSON. Raid invariants are covered by `tests/raid.mjs`; the full original suite must also pass.

## Prioritized next experiments

- Hard/Legendary balance and lower-gear human trials: collect deaths, OOM timing and player contribution before changing damage or healing throughput. Normal scripted Tier-2 wins are only the initial usability baseline.
- Companion Priest spec selection and per-cast explanations: add if players cannot understand why AI delayed a heal or exhausted mana. Compare cast efficiency and overhealing on identical seeds.
- True DPS-Shaman/other DPS models: replace proxies only with verified spell/rotation data and measured encounter-duration comparisons.
- Companion spell drilldowns and configurable group damage: add if current effective-healing/HPS totals do not explain outcomes.
- More raid aura prioritization and compact mobile layouts: use phone playtests to determine whether four visible auras and the current frame height hide actionable information.

Final validation is summarized in `docs/raid-v1-validation.json`: 205 checks pass, 72 normal and 72 2.5×-damage stress scenarios complete, with desktop/phone layout and group-apply checks. The stress set includes deaths and near-empty mana; successful scripted outcomes are not a balance guarantee. Pure-engine 72-run batches take roughly 1–2 seconds in this environment, excluding rendering. Setup edits are drafts until Apply; dead companions clear pending casts/effects so they cannot leave phantom incoming healing. Multiple Priest Aegis contributors retain separate absorption credit. Companion audio stays quiet; the player's existing sound system remains in control.
