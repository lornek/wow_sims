# Shaman sound pilot

The existing sound toggle controls a Shaman-only remote-audio experiment. One sound plays per completed spell, including utility casts through keybindings. HoT ticks, totem pulses and Chain Heal bounces do not restart clips. Other classes retain their synthesized healing tones. Failed remote clips fall back to a tone, and reset/mute/unmount stop active playback. No audio choices consume simulator RNG.

This is **stock client reference audio, not verified Forever audio**. The execution environment blocks the audio CDN, so the actual recordings and browser delivery must still be auditioned on the published site. Files are streamed from `https://wow.zamimg.com/sound-ids/live/enus/<FileDataID % 256>/<FileDataID>/<filename>.ogg`; no recordings were downloaded, bundled, or claimed as newly licensed assets. A blocked CDN/ad blocker leaves the game playable with tones. Replacing these URLs with locally supplied, authorized Forever assets is the preferred follow-up if the pilot sounds right.

## Traceable mappings

Spell → SpellVisual → SpellVisualKit → SoundEntries was traced using:
- https://github.com/Cosmurge/WoW12340_DBC/tree/e01460ba25c3ae602e138df784cbde7efefb4179 (visual/sound CSVs)
- https://github.com/domonic18/wow-dbc/tree/f356c9a8fbf734e10102d589c9460fa2162d994c (3.3.5 Spell.dbc; a community-modified reference, not a pristine Forever dump)
- https://github.com/wowdev/wow-listfile/tree/20d4429479dbc82fd8cd93a53512a9ee60b8dd6c (filename → FileDataID)

| Spell (reference ID) | Selected sound | FileDataID |
| --- | --- | --- |
| Healing Wave (331), Lesser Healing Wave (8004) | RestorationImpact | 568917 |
| Chain Heal (1064) | BlastedLandsLightningbolt01Stand-Bolt1 (cast kit) | 567124 |
| Riptide (61295) | Mage_Riptide_Impact | 568126 |
| Cure Poison (526) | NullifyPoison | 569632 |
| Water Shield (52127) | watershield_impact_base | 569207 |
| Healing Stream (5394), Mana Spring (5675), Mana Tide (16190) | TotemBirthGenericA | 562732 |
| Nature's Swiftness (16188) | NatureCast | 569767 |

Only the selected completion/impact clip is used for this first pass. Continuous precast sounds, Water Shield orb consumption and crit variants are deferred until listening feedback. The manifest and player live in `public/healing/shaman-audio.mjs`; removing the Shaman player restores synthesized audio without changing mechanics.

Try Healing Wave, Chain Heal, Riptide, Water Shield and a totem, then mute/reset during playback. Compare the sound timing and volume. A tone instead of a recording indicates unavailable remote media; it does not establish that the authentic clip worked.

## Delivery fix

The first pilot omitted the bucket and filename, causing remote playback to fail and leaving only fallback tones. URL construction now follows the FileDataID CDN layout also used by [Epsilook](https://github.com/Natans8/Epsilook/blob/main/src/app/tags.ts). Exact URL tests guard the directory and filename. The mute button tooltip reports when clip loading fails. Mocked playback checks do not establish that the remote media can be downloaded or played; real delivery remains pending while the environment blocks the CDN.

## Sound workshop

`/sounds/` adds a searchable catalogue of 30 stock client references and six local synthesized cues. Open it from the main navigation. Preview plays one sound at a time; Stop preview and leaving the page release playback. Client clips are streamed only on demand. Casting, direct hits, direct crits, ticks and critical ticks have independent browser-local assignments. Defaults restore the four feedback tones plus automatic Shaman nature/holy precast audio. Silent is available for each event. Casting assignments affect every spec; automatic casting currently supplies clips only for Shaman. Existing Shaman completion sounds remain in addition to these feedback layers.

Assignments use `wow-forever-sims.healing-sounds.v1`, separate from character/gear settings. Open game tabs receive changes through storage events. The casting layer follows the actual active cast object and stops on completion, interruption, reset, mute or class teardown. It loops client casting clips, including during pushback. Healing events mark periodic output independently of crit mechanics (including channeled/totem pulses), so tick classification never changes their healing calculations. Playback uses bounded voices and no simulation random numbers.

The CDN remains blocked from the execution environment. Desktop and phone-width checks use mocked media playback to verify URL choice, cancellation, filtering, assignments and persistence; those checks do not certify recordings or live media delivery. Existing user feedback confirms the corrected Shaman pilot is audible, but newly added catalogue clips still need listening review. Select a synthesized cue if a streamed entry cannot load. No audio was copied into the repository.

## Layering polish

Casting loops fade linearly over approximately 220 ms after the active cast ends or changes, overlapping the completion clip and healing feedback. Mute/reset/unmount still cancel immediately, including pending fade timers. Chain Heal starts its existing lightning and Nature Release together. Healing Stream starts Renew from the Totem Birth `ended` event rather than an assumed duration; a muted/reset/evicted clip cannot normally complete that sequence. Birth load failure uses the existing fallback rather than claiming Renew followed an unheard birth.

Possible additional catalog sources: [Kenney audio assets](https://kenney.nl/assets) (CC0 packs are a useful first choice), [OpenGameArt](https://opengameart.org/) (magic/game-audio packs; check the individual license), and [Freesound](https://freesound.org/) (filter for CC0, or retain attribution for CC BY recordings). These are candidates, not imported assets. Keep source URLs, author, license and attribution with any future local audio additions; avoid noncommercial-only entries when selecting a general-purpose catalog.

## All-healer rollout

Automatic casting now follows each active spell's stock precast kit for Shaman, Druid, Priest and Paladin. Penance and Tranquility use their channel-kit loops; the existing 220 ms fade and explicit saved casting overrides remain in place. Completion/activation sounds cover every action-bar spell, Major Mana Potion and Dark Rune. Penance bolts, Prayer of Mending procs and Druid Bloom have explicit effect sounds. Other periodic heals retain the player's assignable tick/crit-tick cues rather than repeatedly restarting full spell impacts. Holy Binding shares Flash Heal's cast sound while its individual healing events retain the selected feedback cues.

Additional traces use the same pinned sources above. Reference spell IDs: Druid Healing Touch 5185, Regrowth 8936, Rejuvenation 774, Abolish Poison 2893, Swiftmend 18562, Wild Growth 48438, Tranquility 740, Innervate 29166, Nature's Swiftness 17116; Priest Flash Heal 2061, Greater Heal 2060, Heal 2050, Renew 139, Abolish Disease 552, Power Word: Shield 17 (Divine Shield state kit used as its application sound), Prayer of Healing 596, Penance 47540/47750 (channel/bolt), Prayer of Mending 33076, Holy Nova 15237, Desperate Prayer 19236, Inner Focus 14751, Power Infusion 10060; Paladin Flash of Light 19750, Holy Light 635, Holy Shock healing trigger 25914, Cleanse 4987, Lay on Hands 633, Divine Favor 20216; consumables Major Mana Potion effect 17531 (drinking cast kit), Dark Rune 27869. Holy Shock's base spell has no visual sound kit, so the healing trigger supplies its impact.

Forever-only Light's Vigil uses Holy Cast and holy precast, Oath of Light uses Divine Shield, and Bloom uses Rejuvenation. These three are explicitly marked `custom` in `spell-sounds.mjs`: Blizzard recordings chosen to fit, **not verified Forever sound bindings**. Standard stock mappings are also reference data, not a claim that the installed Forever client is identical. The shared catalogue now includes 41 client recordings and six synthesized choices (47 total); all new client clips are available in the sound workshop. No downloaded audio files are bundled.

Greater Heal, Prayer of Healing and Holy Light use Holy casting · strong (568440) as a player-requested sound choice, overriding their stock low-kit reference. Saved custom casting assignments still take precedence.

## Buff audio

Clearcasting (reference spell 16870) resolves to SoundEntries 4874, `Clearcasting_Impact_Chest.wav` / FileDataID 569649. Druid Omen proc-count increases trigger this one-shot, including refreshed Clearcasting; rendering the same state does not replay it. Inner Focus (14751) has StateKit SoundEntries 3136, `PreCastMageLow.wav` / FileDataID 568938, played as a loop while the actual Priest buff is active. Consuming the buff, ending/resetting a fight, mute and class teardown stop it. Muted procs are not queued for later playback. Both recordings are now in the library (49 choices total).

Divine Favor (20216) shares Inner Focus's activation/impact reference, but has no StateKit sound in the pinned client data. Its existing activation sound is retained; no persistent loop is asserted or added for it. These are stock references rather than verification of the Forever client.
