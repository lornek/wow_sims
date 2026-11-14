# Healing tooltip amounts

Action-bar tooltips and expanded spellbook entries lead with calculated non-critical healing for the current gear, custom healing bonus, selected rank, and talents. Base healing, coefficient details, and the original base spell description remain below. Spellbook costs and cast times use the configured spell rather than the base tooltip text.

The headline excludes overhealing, critical multipliers, temporary effects, and target-specific bonuses. HoTs show their calculated tick and full-duration amount. Hybrid heals show the direct amount and HoT separately. Chain Heal also shows its Riptide primary-hit bonus. Absorbs show their final configured amount.

Swiftmend shows separate non-critical amounts for the currently selected Regrowth and Rejuvenation ranks in its action tooltip, spellbook entry, and inspector. It follows the engine: use the unrounded HoT tick amount times its full tick count, then round once. Include talent healing multipliers and talent-extended durations, even when some ticks have already elapsed. Regrowth contributes its HoT only. If both effects are present, the engine selects the one expiring first; neither is consumed.

Run `node --test tests/healing-preview.mjs` to check power/multiplier calculations, Swiftmend rounding, and both talent-adjusted HoT sources.

# Cast pushback

Sapphiron's Frost Aura uses the same damage handler as other incoming hits. Positive damage remaining after absorbs can delay a non-channel cast by 0.5 seconds, at most twice per cast. The healer's pushback talent rolls independently on each eligible hit: Healing Focus and Twilight Focus give 23/46/70% resistance; Nature's Focus and Spiritual Focus give 14% per rank, up to 70%. Shaman's Healing Focus is mapped into the profile through the `pushback` talent key. Missing resistance defaults to zero, not immunity.

`node --test tests/healing-pushback.mjs` checks the real Frost Aura path with profiles from all four healer adapters, including successful/failed resistance, the two-hit cap, and full absorbs. Channels currently do not lose duration or ticks from incoming damage; this verification covers cast-time spells.
