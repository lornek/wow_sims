# Shared frame, healing team and cast controls update

## User CSS and shared visuals

The user-uploaded `reference/ui/warcraft_unit_frame_css_showcase.html` was preserved from GitHub commit `31dabad`. Its gradient endpoints and class colors are the basis of the frame treatment: a shallow 165-degree gradient plus edge bevels. Warrior uses darker brown endpoints than the showcase; Rogue has a separately chosen darker yellow; Priest retains the requested cream/beige adjustment. Names and health text have a crisp dark outline and a soft downward shadow.

Expanded meter entries return to thin, faded class-colored bars and normal-weight type, retaining the dark 1px text outline. Damage and healing headings sit outside the scrolling list, so scrolling entries does not move their titles. The player's frame and healing-meter name identify them with `(You)`; the frame suffix has a separate element to remain visible when a long name truncates on phones.

Companion buffs are 30×30px, versus the old 15px artwork, with clockwise elapsed-duration shading and a remaining-time label. Oath/Vigil, shields and Mending get priority when the four-icon limit is reached. Narrow frames reserve two rows; phone frames use tighter horizontal padding so two 30px badges fit without clipping. Reduced-motion users receive a static low-mana warning; otherwise companion mana below 20% has a pulsing red glow.

## Casting and healing team setup

Esc and Space cancel a pending cast by default. Keybindings includes a Cancel Cast assignment button; a custom key/chord replaces Space while Esc remains available. A deliberate spell assignment to Space takes precedence over its default cancel action. Cancel assignments persist per character/spec alongside spell bindings, and Restore Defaults restores Esc/Space. Mouse side-button cancellation reserves the relevant button against browser navigation like other custom side-button bindings.

Cancelling an unfinished direct cast prevents its healing and mana expenditure. Cancelling a channel removes future ticks; already-spent channel mana is retained. The global cooldown is retained. Pending Clearcasting/Inner Focus/Infusion bonuses restore only their original expiry when the cast is cancelled, so cancelling does not lose or extend an unconsumed proc.

Healing Team Setup uses large 28px themed native checkboxes, preserving keyboard/checked semantics. Apply updates storage and remounts the Healbot component to rebuild the party and reset the fight; it does not reload the document, change the URL or discard browser state. The broader Raid Setup Apply action uses the same path. Size/layout/group changes continue to work through this reset.

Wild Growth now has a Nature casting loop and layered landing cues (Flourish plus Nature Release) instead of relying only on the Flourish file. Browser checks verify that casting and landing audio are dispatched; external playback availability still depends on the user's browser/network and sound settings. Mana Spring/Tide report sources with group suffixes now resolve to the corresponding named spell icons, including DPS Shaman Mana Spring.

## Companion policy corrections

Tank focus is a preference rather than a hard target filter. A tank receives additional priority when enough unreserved damage exists to fit a useful heal; healthy tanks or tanks covered by incoming healing leave the healer free to triage the raid. Dead tanks do not leave Tirion idle. Oath is maintained on a living tank before damage is required, and its mark is visible among companion buffs.

Vigil now requires four injured group members and substantial aggregate damage, reducing expensive group-heal use by tank-focused Paladins. Holy Priests cast Mending when available and useful, maintain Renew, and mainly pair Prayer of Healing with Inner Focus for a significantly injured group. Prayer is no longer a general group-heal filler. Priest talent/spec selection remains authoritative: a Discipline companion keeps Penance/PI and cannot cast the Holy-only Mending spell unless its build knows it.

## Tank health check

The earlier health figures omitted tank enchant stats and Cairne's racial health effect. The correction adds 38 Stamina from chest/bracer/boots/shield enchants and 200 flat HP from the head/leg enchants, matching the Warrior preset's effect IDs `1503,1503,1892,1886,929,7663`. The Paladin uses this same modeled tank enchant template, explicitly an assumption beyond its unenchanted SIML preset.

Cairne also receives the Tauren +2 base Stamina offset and Endurance's 5% multiplier to all health, including later Stamina buffs. Sources: pinned `wowsims/forever` `sim/core/base_stats.go`, `sim/core/racials.go`, preset equipment and the item/enchant database. Unbuffed modeled HP changes from 4,179 to **5,018** for Cairne and from 3,721 to **4,301** for Gavinrad. Raid buffs apply afterward; difficulty still never scales player health.

These remain pre-raid preset estimates, not a full execution of the WoWSims character builder. The unresolved Paladin neck alias and omitted full talent/set/item/racial reconstruction remain documented in `raid-vitals.json` and the prior audit. No arbitrary difficulty HP bonus was reintroduced.

## Verification

- Build passes; Node suite: **239 passing tests**.
- New checks cover tank-focus raid triage and fallback, Oath maintenance, Mending/Inner Focus priorities, direct/channel cancellation, preserved free-cast expiry, group totem report icons and Wild Growth audio mappings.
- Desktop and phone browser flows cover document-preserving team Apply, themed checkbox sizing, fixed meter titles, 30px buff timers, the player label, default/custom cancel bindings, and Wild Growth casting/landing audio dispatch. A phone check explicitly verifies that badges fit within their two-row holder.
- Three Raid layouts pass at 1440, 1000 and 390px without horizontal overflow or meter overlap. Narrow-phone visual checks caught and corrected a legacy 18px aura-container clip and a two-column gap that was too wide.
- Scripted all-spec replays: 90/90 standard completions; 58/90 Legendary completions. These are repeatable policy tests, not human win-rate estimates. Summary evidence is in `healbot-frame-team-results.json`.
