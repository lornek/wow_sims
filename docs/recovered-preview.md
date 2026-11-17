# Recovered main baseline and icon library

This build restores the source tree from GitHub main `d36e2802287c81ce607621acaf3ce1eb14350811`. The merge records both main and the former expansion history while deliberately taking main's game code. No engine, class adapter, gear, report, spellbook, or combat-template files were changed from that baseline.

The previous expansion work and paused gallery edits remain in `/workspace/wow_sims-expansion`. Active recovery work is in `/workspace/wow_sims-recovered`. Remote `healbot/expansion` receives the recovery as a fast-forward; GitHub main is not reset or force-pushed.

`/icons/` provides three searchable libraries:

- 541 bundled original icons from `public/healing/icons/`.
- 600 custom spell/healing/mana icons from the existing reviewed master catalog.
- 400 custom equipment icons from the same catalog.

The existing custom set galleries, catalogs, contact sheets, downloads, semantic icon assignments, and URLs are retained. The gallery adds links to them rather than rebuilding those systems. It does not alter gameplay icon choices. Search matches names, stable IDs, filenames, tags, set names, and equipment types. Healbot opens the library in a new tab to preserve an active fight.

Build: `node build.cjs`. Tests: `node --test tests/*.mjs` (86 tests). Browser verification covered all three section counts, every local asset path, search and reset, full image responses, query persistence, no horizontal overflow, and initialization/pull/reset on all five healer specs at 1440px and touch 390px under the `/wow_sims/` project path.

GitHub Pages workflow builds the recovered branch on pushes to `healbot/expansion`, tests the existing suite, and writes `version.json` with the deployed source SHA. A pushed workflow is not by itself proof of a successful deployment. Sites publishing requires its existing authenticated deployment capability; do not infer a Sites update from a GitHub push.
