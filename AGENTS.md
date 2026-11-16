# Project workflow

This project targets WoW Forever, including the Healbot minigame.

After completing changes, push them to GitHub and publish the matching build to the existing Sites project by default. The user wants to work with the online version. Preserve the existing Site identity and audience.

# Icon consistency

All generic report/stat/score icons must use semantic keys from `public/healing/custom-icons/icon-purposes.json` through `purposeIconPath`. Update purpose/usage metadata in that source whenever adding or changing an icon use. `node build.cjs` generates the live registry, current-purpose documentation, review table data, and searchable file inventory; do not hand-edit generated copies. Keep the icon-purpose review sheet synchronized with every icon change. Named spells, buffs and talents keep their ability icons unless the user explicitly chooses otherwise.
