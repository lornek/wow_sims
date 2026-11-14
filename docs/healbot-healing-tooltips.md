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


# Healing amount rows

Use `tooltipValue()` to place healing labels on the left and numeric amounts in a right-aligned tabular column. All HoTs and channels show two leading periodic rows: `Heal over time (21sec)` with full-duration healing, then `Healing per tick (7 ticks)` with the tick amount. Hybrid spells show direct healing first, followed by the same periodic rows. Immediate channel ticks count toward the displayed tick total. Decaying HoTs display first → last tick values. Totals are per target, non-critical, and computed before overhealing; retain party/target descriptions where relevant.

Use the same right column for direct healing, Swiftmend's two source values, absorbs, crit chance, and base healing/tick values. Keep base values in the muted reference section. Omit the previous “Includes gear and talents” information line.


# Periodic base reference and Regrowth components

Replace the base-tick reference with `Base heal over time (21sec)` and the full base periodic amount. Compute it from the configured pre-talent spell at zero healing power and multiplier 1, using its original duration and tick count (including any immediate channel tick). This distinguishes the base duration from a talent-extended final duration. Hybrid spells retain a separate Base healing row for the initial heal.

Regrowth uniquely shows `Scaling (direct)`, `Scaling (HoT)`, `Talent multiplier (direct)`, and `Talent multiplier (HoT)`. Read each component's actual coefficient and multiplier. Gift of Nature 5/5 and Genesis 5/5 produce ×1.1 direct and ×1.21 HoT; Improved Rejuvenation does not apply. Keep all values in the shared right-aligned column.


# Full-duration scaling

HoT/channel scaling is the per-tick bonus-healing coefficient times the actual tick count, including talent-extended durations and immediate channel ticks. Show two decimal places. Do not multiply by the talent healing multiplier or number of party targets; those are separate factors. Regrowth keeps `Scaling (direct)` unchanged and shows this duration-adjusted coefficient under `Scaling (HoT)`. A hypothetical 100% over 7 ticks becomes 128.57% over 9 ticks. Preserve the actual data coefficients rather than replacing them with this example.

Healing Stream Totem is the exception: both tooltip and inspector explicitly show `Scaling (per tick)`. Its long duration is not multiplied into the displayed coefficient. Other periodic spells use `Scaling (full duration)`. The inspector follows the same conventions.


# Healing Stream and Chain Heal exceptions

Healing Stream Totem omits full-duration totals and tick counts from its tooltip. Show `Healing per tick`, `Base heal per tick`, and `Scaling (per tick)`; keep the existing healing multiplier and crit details. Chain Heal shows `Healing (primary)`, `Healing (1st bounce)`, and `Healing (2nd bounce)` using the configured falloff once and squared respectively, applied to the unrounded configured heal before final rounding. Its base section shows only primary base healing. The Riptide bonus remains primary-only.
