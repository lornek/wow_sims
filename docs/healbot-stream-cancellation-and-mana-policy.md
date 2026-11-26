# Healing Stream, cancellation and mana conservation

## Own-group Healing Stream

Healing Stream is now self-group-only in the engine, incoming-heal forecast, compiled player/companion spell, hotbar/keybinding targeting and AI decision. A remote group cannot be selected by passing its member as the target. Wild Growth/Prayer/Chain Heal retain their selected-group rules; Healing Stream uses its Shaman's own group. The ability tooltip and Raid Setup description make this exception explicit.

## Cast cancellation

The previous cancel operation removed the pending cast, but the shared cast bar immediately displayed the remainder of the GCD. Cancellation now hides that animation too and stops the casting audio loop immediately. The GCD itself remains enforced; cancellation does not permit faster casting. Esc/Space during an instant spell's GCD can also clear the bar, without playing a false interruption sound.

The stock sound listfile identifies Nature fizzle 569774 (`sound/spells/fizzle/fizzlenaturea.ogg`) and Holy fizzle 569772 (`fizzleholya.ogg`). These are now cancellation cues for Nature and Holy healers respectively. The chosen mapping is explicitly marked custom; the filenames are sourced stock assets, not a claim that every WoW cancellation plays exactly this cue. Browser audio mocks verify dispatch on actual cast cancellation; muted sound settings remain respected.

## Water Shield audit

The pinned WoWSims Forever spell-store row **408510** has `AuraOptions.ICDMs = 3500`. `sim/shaman/shields.go` uses a single cooldown shared by hits taken and eligible spell crits. Refreshing the shield refills three globes without resetting that cooldown. Each spent globe restores 2% maximum mana.

The existing **3.5-second shared ICD is correct and retained**. Three globes can be consumed over seven seconds after the first eligible event when triggers keep arriving. A new regression test verifies rapid crit/damage events and a mid-ICD refresh. The ability tooltip now states the exact shared interval.

Source: [wowsims/forever 6fdf218, shields.go](https://github.com/wowsims/forever/blob/6fdf2180b86b67b2589b43294308e90194240f5c/sim/shaman/shields.go).

## Companion mana policy

This is a practice AI heuristic, not a verified optimal WoW rotation:

- Mana reserve pressure increases with boss health and depleted mana. Companions now receive the current boss health rather than retaining their own initial health copy.
- Non-emergency casts wait for more of their expected heal to fit. Crit-healing modifiers and Illumination influence efficiency estimates.
- Single-target direct choices include Healing Wave and Heal, alongside the existing spells, ranked by useful healing per expected mana.
- Expensive group spells and HoTs require more useful healing opportunity; Vigil is held for larger group injuries and sufficient mana. Penance/shield thresholds tighten with reserve pressure.
- Emergency healing, assignments, dispels, Water Shield upkeep and mana tools remain available. Early-fight conservation does not impose a fixed spell blacklist or prevent urgent healing.

Across the same 90 standard scripted scenarios, completion remains **90/90**, mean overhealing drops from 23.5% to **15.3%**, and the automated player-policy caster averages about **8,218** mana remaining versus 7,137 previously. These are seeded policy results, not human results. The Legendary batch completes 57/90 with 33 losses; it now runs to each encounter's actual time limit instead of stopping at an arbitrary 400 seconds. No scenario remains artificially marked active at that cutoff.

## Shared presentation

Requested class darkening uses relative HSL lightness: Warrior/Paladin 5%, Warlock/Hunter 8%, Shaman 10%. Hunter also shifts ten degrees greener. Matching fixed frame gradient endpoints and generated class colors are updated together.

Companion buff icons are reduced to 20px on desktop, smaller responsively on phones; they stay centered on the left half. Player-applied buffs stay centered on the right half. Existing duration sweeps remain. Oath now uses `spell_holy_greaterblessingoflight.jpg`, matching the Paladin spell catalog instead of the hard-coded Wisdom icon.

## Verification

Build succeeds; **241 tests pass**. New coverage verifies own-group Healing Stream forecasts/healing, reserve-pressure decisions and efficient direct spell selection, plus Water Shield's shared ICD and refresh behavior. The previous target-group Stream assertion was replaced because that behavior was incorrect.

Browser checks at desktop and phone widths verify Esc/Space immediately clear the bar, fizzle audio dispatch, no instant-GCD animation after cancellation, own-group Stream icons, the correct Oath artwork, left/right buff alignment and no horizontal overflow. A narrow left-layout check covers reduced buff sizing where the party column is constrained. Sound playback beyond dispatch depends on the browser/network as in the existing audio system.
