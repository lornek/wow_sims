# Healing tooltip amounts

Action-bar tooltips and expanded spellbook entries lead with calculated non-critical healing for the current gear, custom healing bonus, selected rank, and talents. Base healing, base HoT ticks, scaling, and talent multipliers remain in a compact muted reference section below. Repeated base spell descriptions and intermediate gear/custom/talent result lines are omitted for healing spells; the inspector retains detailed calculations. Spellbook costs and cast times use the configured spell rather than the base tooltip text.

The headline excludes overhealing, critical multipliers, temporary effects, and target-specific bonuses. HoTs show their calculated tick and full-duration amount. Hybrid heals show the direct amount and HoT separately. Chain Heal also shows its Riptide primary-hit bonus. Absorbs show their final configured amount.

Swiftmend shows separate non-critical amounts for the currently selected Regrowth and Rejuvenation ranks in its action tooltip, spellbook entry, and inspector. It follows the engine: use the unrounded HoT tick amount times its full tick count, then round once. Include talent healing multipliers and talent-extended durations, even when some ticks have already elapsed. Regrowth contributes its HoT only. If both effects are present, the engine selects the one expiring first; neither is consumed.

Run `node --test tests/healing-preview.mjs` to check power/multiplier calculations, Swiftmend rounding, and both talent-adjusted HoT sources.

# Cast pushback

Sapphiron's Frost Aura uses the same damage handler as other incoming hits. Positive damage remaining after absorbs can delay a non-channel cast by 0.5 seconds, at most twice per cast. The healer's pushback talent rolls independently on each eligible hit: Healing Focus and Twilight Focus give 23/46/70% resistance; Nature's Focus and Spiritual Focus give 14% per rank, up to 70%. Shaman's Healing Focus is mapped into the profile through the `pushback` talent key. Missing resistance defaults to zero, not immunity.

`node --test tests/healing-pushback.mjs` checks the real Frost Aura path with profiles from all four healer adapters, including successful/failed resistance, the two-hit cap, and full absorbs. Channels currently do not lose duration or ticks from incoming damage; this verification covers cast-time spells.


# Druid critical healing

Improved Regrowth adds 10 percentage points of crit per rank to both Regrowth's direct heal and each periodic tick, on top of the character healing crit chance. The initial heal and individual ticks roll independently. Gift of Nature modifies direct and periodic healing; Genesis modifies the HoT, and Nature's Splendor adds HoT duration/ticks.

The stored HoT amount is pre-crit. Swiftmend multiplies that amount by the full tick count before any critical multiplier; it never includes a source spell's direct crit, periodic crit, or expected healing from crit chance. Swiftmend then rolls independently using the character healing crit chance, without Improved Regrowth's bonus. Its own crit multiplies the unrounded base once and rounds the final heal. This applies to both Regrowth and Rejuvenation sources. `tests/druid-healing-crits.mjs` verifies actual engine events as well as agreement with the non-critical tooltip previews.


# Shared tooltip presentation

All ability, talent, equipment, buff, aura, report, gearing, resource, score-factor, and sound tooltips use `game-ui.mjs`. Use a gold title, current/key information first, short effect descriptions next, and muted base/reference information last. Native `title` popups are removed when the shared tooltip is attached. Keep channel durations distinct from instant cast times. Preserve Swiftmend's separate source amounts and healing abilities' target/trigger rules.

`attachGameTooltip()` supports hover and focus, one active tooltip, an accessible `aria-describedby` link, Escape/outside-click dismissal, an 8px viewport margin, side flipping, and scrolling for unusually long content. A short hover grace period lets users move onto the tooltip to read/scroll it. `setGameTooltip()` updates dynamic content without adding duplicate handlers. Use `hideGameTooltip()` on every pull reset and class unmount; hide tooltips inside a region before replacing its contents. Stable final-report rows are retained between frames so their tooltips and keyboard focus do not flicker.

Equipment uses the same popup as abilities. Talent tooltips show rank 1 when unlearned, the final rank when maxed, and available reference descriptions for intermediate ranks; combat-lock status replaces editing instructions during a pull. Report and gearing tooltips use short numeric lines with explicit units. Detailed formula explanations remain accessible without repeating the displayed healing result.
