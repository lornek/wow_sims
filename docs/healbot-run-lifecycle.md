# Healbot run isolation

Every new pull must have both fresh combat state and fresh rendered results. `createPull` owns per-pull healing, overhealing, spell meters, mana gained/sources, mana spent, cooldowns, and effects. Never reuse these containers across pulls.

The shared `reset()` path calls `resetHealingReport()` before creating the new pull. This hides and clears spell totals/details, closes expanded spell rows, removes every mana-source row and its row cache, clears fight totals and score text/tooltips, and restores empty-state labels. Boss and difficulty changes, Start/Reset, gear/buff/talent/custom changes all use this path. The visual generation advances on every reset so delayed heals from an old pull cannot draw into a new one.

Healer/spec navigation unmounts the previous healer and restores a pristine `.healing-score` section along with the other class-specific regions. Reset the entire report, not just `[data-meter]`: leaving `[data-mana-meter]` in place caused the prior healer's potion, Innervate, and duplicate regeneration rows to remain visible despite fresh combat totals.

Validation: `node --test tests/pull-reset.mjs` checks fresh accounting across encounter/configuration changes. DOM regression checks reproduced the old Druid-to-Shaman stale rows and verified the fixed navigation, plus repeated clearing of expanded rows, totals, and tooltips.
