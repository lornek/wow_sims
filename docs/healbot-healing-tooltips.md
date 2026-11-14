# Healing tooltip amounts

Action-bar tooltips and expanded spellbook entries lead with calculated non-critical healing for the current gear, custom healing bonus, selected rank, and talents. Base healing, coefficient details, and the original base spell description remain below. Spellbook costs and cast times use the configured spell rather than the base tooltip text.

The headline excludes overhealing, critical multipliers, temporary effects, and target-specific bonuses. HoTs show their calculated tick and full-duration amount. Hybrid heals show the direct amount and HoT separately. Chain Heal also shows its Riptide primary-hit bonus. Absorbs show their final configured amount.

Swiftmend shows separate non-critical amounts for the currently selected Regrowth and Rejuvenation ranks in its action tooltip, spellbook entry, and inspector. It follows the engine: use the unrounded HoT tick amount times its full tick count, then round once. Include talent healing multipliers and talent-extended durations, even when some ticks have already elapsed. Regrowth contributes its HoT only. If both effects are present, the engine selects the one expiring first; neither is consumed.

Run `node --test tests/healing-preview.mjs` to check power/multiplier calculations, Swiftmend rounding, and both talent-adjusted HoT sources.
