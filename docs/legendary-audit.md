# Legendary encounter balance audit

Tested source: `233223ad0d422fffcdce911bf372b531948a158a`. 5,400 seeded runs: 180 scenarios × 30 seeds. No gameplay or balance changes were made.

## Findings and priorities

- **Rend is forgiving with a full healing team.** Default Tier 2 setups won 150/150 at each size with every member alive. In 20-player tests, three co-healers won 118/150 even with the player completely idle, though only 35 were deathless. This is the strongest evidence that Rend can be carried.
- **Patchwerk is the outlier.** Across every tested 20-player composition, policy, and gear scenario, it won **0/1,500**. The first death occurs at a median 8.1 seconds. Default team wipes end around 46 seconds with the player averaging 91.8% mana, so this is not primarily a mana shortage. A nonblocked Hateful Strike deals about 5,307 damage to the roughly 5,531-HP buffed Protection Paladin. The fixed second-slot targeting and three-second strike interval leave very little recovery margin. More gear on healers does not increase this NPC tank's HP. Fix or validate tank burst survivability and proactive healing before increasing general healing throughput.
- **Sapphiron rewards composition and mana efficiency.** Default 20-player teams won 100/150, but only 63 were deathless. A Paladin + Druid + Holy Priest support team won 150/150 (139 deathless), compared with 41/150 for three support Paladins and 62/150 for three support Priests. This result includes fixed groups and current AI decisions; it is not an intrinsic class ranking.
- **Player spec differences are largest on Sapphiron.** Default-team wins: Druid 30/30 (29 deathless), Shaman 30/30 (30), Holy Priest 24/30 (3), Paladin 10/30 (1), Discipline 6/30 (0). Shaman ended with 43.5% mana on average; Druid 3.2%. Both won, but with very different reserve margins.
- **Fast reactive single-target casting underperforms triage.** On 20-player Sapphiron, efficient triage won 100/150, tank-priority triage 123/150, and the fast-heal preference just 9/150. Tank priority produces more wins but slightly fewer deathless kills (60 versus 63), so winning and preserving the whole raid are different optimization targets.
- **Tier 4 smooths Sapphiron but does not solve Patchwerk.** Default teams with Tier 4 healers won all 150 Sapphiron tests with everyone alive; Patchwerk remained 0/150. NPC DPS/tank equipment is unchanged in this experiment.

Recommended next balance work: (1) Patchwerk burst/tank recovery; (2) Sapphiron Priest/Paladin policy and group coverage; (3) Rend mechanics that require player participation. Keep encounter tuning unchanged until those causes are separated and any proposed changes are compared against these seeds.

## Conditions and limits

- Current game engine, Legendary difficulty 3, current boss HP/damage scaling and mitigation, 0.1-second steps, decisions every 0.2 seconds.
- All available buffs enabled; automatic consumables and mana cooldowns through the current healer policy. Default groups remain unchanged.
- Baseline uses each spec’s nearest Tier 2 preset to average item level 75. The gear comparison selects the nearest Tier 4 preset to item level 95. Co-healers match that target gear level.
- Five player specs: Restoration Druid, Restoration Shaman, Holy Paladin, Discipline Priest, Holy Priest. Default 20-player team adds tank-priority Paladin, raid Shaman, raid Discipline Priest. Default 10-player team adds only the Paladin.
- All co-healers use the current in-game AI. The controlled player uses that AI too unless testing another policy. These are automated engine benchmarks, not human success rates or live WoW validation. They omit input errors, network delay, and visual cue comprehension.
- A win means boss dead and player alive; other raid members can have died. Perfect wins have every member alive. A mana-pressure run means the player fell below 10% mana at least once.
- Identical initial seeds make runs reproducible, but different actions consume RNG differently. Thirty seeds per scenario can expose large differences; 30/30 does not establish a guaranteed win rate.

## Default team: encounter and mode

| Players | Boss | Wins | Perfect wins | Median duration | Avg survivors | Avg player mana left | Runs below 10% mana |
|---|---|---:|---:|---:|---:|---:|---:|
| 5 | Rend | 150/150 | 150 | 80.3s | 5 | 55.7% | 0 |
| 5 | Patchwerk | 43/150 | 31 | 70.5s | 1.34 | 53.5% | 0 |
| 5 | Sapphiron | 150/150 | 150 | 86.5s | 5 | 53.0% | 0 |
| 10 | Rend | 150/150 | 150 | 141.9s | 10 | 40.5% | 2 |
| 10 | Patchwerk | 5/150 | 1 | 66.0s | 0.3 | 53.7% | 5 |
| 10 | Sapphiron | 145/150 | 108 | 153.2s | 8.65 | 27.0% | 52 |
| 20 | Rend | 150/150 | 150 | 200.1s | 20 | 30.2% | 35 |
| 20 | Patchwerk | 0/150 | 0 | 46.0s | 0 | 91.8% | 0 |
| 20 | Sapphiron | 100/150 | 63 | 218.2s | 11.75 | 16.8% | 116 |

## 20-player healer spec

| Setup | Wins | Perfect wins | Avg survivors | Avg mana left | Mean overhealing |
|---|---:|---:|---:|---:|---:|
| druid | 60/90 | 59 | 13.32 | 47.3% | 9.0% |
| shaman | 60/90 | 60 | 13.33 | 65.1% | 5.3% |
| paladin | 40/90 | 31 | 8.17 | 45.7% | 4.7% |
| discipline | 36/90 | 30 | 7.23 | 34.0% | 6.7% |
| holy | 54/90 | 33 | 10.87 | 39.1% | 8.0% |

## 20-player team composition

| Setup | Wins | Perfect wins | Avg survivors | Avg mana left | Mean overhealing |
|---|---:|---:|---:|---:|---:|
| default | 250/450 | 213 | 10.58 | 46.3% | 6.7% |
| diverse | 300/450 | 289 | 13.25 | 46.3% | 12.0% |
| paladins | 191/450 | 158 | 8.31 | 47.1% | 6.0% |
| priests | 212/450 | 177 | 9.11 | 45.5% | 14.3% |
| two | 150/450 | 101 | 6.19 | 44.6% | 4.3% |
| solo | 0/450 | 0 | 0 | 62.3% | 2.6% |

## 20-player player strategy

| Setup | Wins | Perfect wins | Avg survivors | Avg mana left | Mean overhealing |
|---|---:|---:|---:|---:|---:|
| efficient | 250/450 | 213 | 10.58 | 46.3% | 6.7% |
| tank-priority | 273/450 | 209 | 10.84 | 47.0% | 6.8% |
| reactive-fast | 156/450 | 128 | 6.9 | 29.0% | 14.5% |
| idle | 119/450 | 35 | 5.18 | 100% | 3.2% |

## 20-player gear comparison

| Setup | Wins | Perfect wins | Avg survivors | Avg mana left | Mean overhealing |
|---|---:|---:|---:|---:|---:|
| 75 | 250/450 | 213 | 10.58 | 46.3% | 6.7% |
| 95 | 300/450 | 300 | 13.33 | 67.3% | 10.8% |

Team definitions: `diverse` = Paladin (tanks), Druid, Holy Priest; `paladins` = three Paladins; `priests` = Discipline (tanks), two Holy Priests; `two` = Paladin + Shaman; `solo` = no co-healers. Removing a healer restores that roster slot’s DPS, so these comparisons include the associated kill-speed tradeoff.

Policy definitions: `efficient` = current mana-conserving raid AI; `tank-priority` = same policy with tank priority; `reactive-fast` = prefer Regrowth/Lesser Healing Wave/Flash of Light/Flash Heal on the lowest-health ally below 95%, otherwise fall back to efficient policy; `idle` = player casts nothing. Co-healer policies stay unchanged.

## Reproduce and inspect

Run `node scripts/legendary-audit.mjs > /tmp/legendary-audit-results.json`. Full per-pull metrics and spell cast counts appear in that JSON. Committed evidence: [scenario aggregates](legendary-audit-summary.json), [per-run outcomes](legendary-audit-runs.csv).
