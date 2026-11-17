# Main development and deployment

`main` is the active source of truth for the site and Healbot. GitHub Pages builds, tests, and deploys main through `.github/workflows/pages.yml`. The public `version.json` reports `branch: main` and the exact deployed source commit. A successful push does not prove a successful deployment; verify the workflow and deployed manifest.

The finished icon-library navigation and infinity home button are retained. `/icons/` contains 541 original bundled icons, 600 custom spell/healing/mana icons, and 400 custom equipment icons. The underlying reviewed catalogs, mappings, and existing download pages remain intact.

`healbot/expansion` is an archived development branch, preserved at `5650c6d78160a67f7114fcb9843c7cd73c23849e`. Do not use it as the development or deployment baseline. The abandoned combat-feedback experiment is not included in main. This migration copies only the reviewed finished changes onto the existing main history rather than merging the experimental ancestry.

Local worktrees retained for recovery:

- `/workspace/wow_sims-recovered`: active main checkout.
- `/workspace/wow_sims-expansion`: archived expansion checkout with its paused uncommitted gallery changes preserved.
- `/workspace/wow_sims`: original checkout, unchanged.

Build with `node build.cjs`; run `node --test tests/*.mjs`. Existing Sites identity and audience must remain unchanged. Sites deployment requires its authenticated publishing tools and is separate from GitHub Pages. Do not claim Sites matches main solely because GitHub Pages was updated.
