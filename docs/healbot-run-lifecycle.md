# Healbot run isolation

Every new pull must have both fresh combat state and fresh rendered results. `createPull` owns per-pull healing, overhealing, spell meters, mana gained/sources, mana spent, cooldowns, and effects. Never reuse these containers across pulls.

The shared `reset()` path calls `resetHealingReport()` before creating the new pull. This hides and clears spell totals/details, closes expanded spell rows, removes every mana-source row and its row cache, clears fight totals and score text/tooltips, and restores empty-state labels. Boss and difficulty changes, Start/Reset, gear/buff/talent/custom changes all use this path. The visual generation advances on every reset so delayed heals from an old pull cannot draw into a new one.

Healer/spec navigation unmounts the previous healer and restores a pristine `.healing-score` section along with the other class-specific regions. Reset the entire report, not just `[data-meter]`: leaving `[data-mana-meter]` in place caused the prior healer's potion, Innervate, and duplicate regeneration rows to remain visible despite fresh combat totals.

Validation: `node --test tests/pull-reset.mjs` checks fresh accounting across encounter/configuration changes. DOM regression checks reproduced the old Druid-to-Shaman stale rows and verified the fixed navigation, plus repeated clearing of expanded rows, totals, and tooltips.


## Reset character

The Character tab has a separate Reset character action, disabled during combat. It replaces only the current healer/spec's saved configuration with the existing sound, boss, and difficulty preferences, then reloads the current route. Gear, talents, buffs, selected spell ranks, selected ability, and all Additional stats initialize from defaults; other healer/spec settings remain untouched. This is distinct from Reset on the battlefield, which restarts combat with the current character configuration.
