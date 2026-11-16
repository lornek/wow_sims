# Spellbook UI

The Healbot spellbook follows the structure of [WoW Forever Talents’ Shaman spellbook](https://wowforevertalents.com/shaman/): icon school tabs, search and all-ranks controls, a school/count heading, two columns containing six spell rows each, page arrows, and Forever change markers/filters. Each school has its own browsing view; a search spans schools. Level filtering shows the highest learned rank by default, or all available ranks when selected. Search, school, rank and status changes reset pagination; page numbers are clamped after filtering. The two columns stack on narrow screens.

Rows show an icon, spell name, change marker and rank (or level/passive status). Hover, keyboard focus or tap opens the shared game tooltip. Healing tooltips retain final healing, scaling and talent calculations. Page/filter changes destroy the previous tooltip handles; class unmount cleans up remaining handles. Navigation has accessible previous/next labels, disabled end controls and a page-status announcement.

Changed/new/removed/unchanged indicators use existing catalog metadata. Missing comparison metadata is labelled Other rather than asserted identical to Classic. This change rearranges the existing spell catalog; it does not update combat formulas or spell data to match the reference site’s latest patch notes.

The reference’s text structure was readable, but cloud-browser navigation failed, so exact visual equivalence could not be verified. Local browser preview was also unavailable because the Sites relay could not open port 4173. Validation includes Node pagination/filter tests, DOM interaction checks, syntax checks and the static build.
