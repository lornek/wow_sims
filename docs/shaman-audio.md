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
