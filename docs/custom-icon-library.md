# Custom icon library

The library contains 1,000 icons: 600 spell/healing icons and 400 equipment icons. Six spell/healing atlases are included:

- **Neon Nature:** `neon-nature`, 100 icons.
- **Mystical Nature:** `mystical-nature`, 100 icons.
- **Luminous Healing:** `luminous-healing`, 100 icons.
- **Arcane Vitality (original set):** `arcane-vitality`, 100 icons.
- **Mana Springs of Renewal:** `mana-renewal`, 100 icons.
- **Mystical Healing Magic Icon Atlas:** `mystical-healing`, 100 icons.

Original source PNGs and reviewed seam coordinates live in `assets/icon-atlases/`. Nine sources are 1254×1254 PNGs. The original set is a 2048×2048 JPEG, archived as `arcane-vitality.jpg`. Its decoded pixels are cropped into lossless PNGs without another JPEG encoding step. The painted cells have uneven boundaries, especially the final rows of the healing atlas, so crops use the explicit boundaries in `catalog.json`, not an assumed 125-pixel grid. Crops preserve the complete cell, its original pixel dimensions, colors and aspect ratio. No regeneration, upscaling or stretching is applied. Some cells are rectangular because that is how the supplied artwork is divided.

Run `python scripts/split-icon-atlases.py` from the repository root (requires Pillow) to regenerate the lossless PNG tiles, manifests, CSV catalog, numbered contact sheets and ZIP bundle. To verify full source coverage and exact pixel reconstruction, run `python scripts/verify-icon-atlases.py`.

## Organization and lookup

Public assets live under `public/healing/custom-icons/`, independently of Blizzard ability icons and the existing `report-icons` folder. Each set has:

- `001-description.png` through `100-description.png`, ordered left to right then top to bottom.
- `contact-sheet.jpg`, with all 100 icons labelled by number and row/column.
- `catalog.json`, containing descriptions, search tags, source crop rectangles, dimensions, stable IDs and source SHA-256.

The shared `catalog.json`/`catalog.csv` cover all ten sets. The `index.html` gallery searches descriptions, IDs and coordinates and links to individual icons. The library is downloadable as `healing-and-mana-icons.zip` (part 1, 300 icons) and `nature-icons.zip` (part 2, 300 icons), each with its own contact sheets and filtered catalogs. Source atlases stay in the repository rather than the public download bundle.

A stable icon ID is `mana-renewal-001` or `mystical-healing-001`. Within a set, icon number is `(row - 1) * 10 + column`, with one-based rows/columns. Paths are relative to `/healing/custom-icons/`. For example, `mana-renewal-001` is `mana-renewal/001-dewdrop-leaf.png`. Descriptions are visual labels, not claims that the art represents a particular game ability.

## Consistent use throughout the site

The full original set is now cataloged alongside the two newer sets; existing report, Spirit, MP5, healing-event and ability icon mappings are preserved. Continue using `report-style.mjs` and `healing-events.mjs` as the shared semantic registries described in `healbot-report-visuals.md`. When choosing a new icon for a concept, document its stable ID there and use the same icon across classes. Named WoW abilities continue to use their ability icons. Do not select custom icons by report rank or class.

For small UI images, use explicit width/height and `object-fit:contain` to preserve a rectangular tile’s full art, or consciously use `cover` for a square slot. Use empty alt text where adjacent text already names the concept; use descriptive alt text for standalone informational icons. The catalog gallery uses descriptive link labels and empty image alt text to avoid duplicate announcements.

## Original report icon cross-reference (legacy files)

Existing 96×96 report JPEGs are preserved at their existing URLs. Their matching tiles in the recovered original atlas are documented below and linked by `legacyReportPath` in the JSON catalog.

| Existing report file | Arcane Vitality ID | Description |
| --- | --- | --- |
| healing.jpg | arcane-vitality-009 | Golden healing cross |
| survived.jpg | arcane-vitality-010 | Luminous spirit shield |
| hps.jpg | arcane-vitality-022 | Golden light offering |
| overheal.jpg | arcane-vitality-034 | Protective healing bubble |
| gained.jpg | arcane-vitality-037 | Tiered mana fountain |
| crit.jpg | arcane-vitality-047 | Radiant spirit star |
| efficiency.jpg | arcane-vitality-054 | Leaf and water crest |
| mp5.jpg | arcane-vitality-058 | Spiraling water fountain |
| spirit.jpg | arcane-vitality-066 | Spirit meditation |
| remaining.jpg | arcane-vitality-086 | Round blue mana potion |

The current live purpose choices and the interactive review sheet are now generated from `public/healing/custom-icons/icon-purposes.json`. See [Current icon purpose mappings](current-icon-purposes.md). The legacy report files listed above are retained for compatibility; their presence does not mean they remain the current selected art.

## Build output and publishing

The downloadable ZIP parts are generated by `node build.cjs` using `scripts/package-icon-library.cjs` and Node built-ins. They remain available on the site but are excluded from Git source to avoid large binary history uploads. All original atlases, individual PNGs, contact sheets and catalogs remain tracked. The Sites source mirror uses the same source tree as GitHub main, with a separate fast-forward publication history; see `scripts/sync-sites-source.py` and `AGENTS.md`.

Sites limits each hosted file to 25 MiB. The packager groups three spell/healing sets or four equipment sets per ZIP and rejects an oversized ZIP before publishing. `downloads.json` supplies the gallery’s part links and counts; future sets generate additional numbered parts.

## Equipment collections

Equipment art is stored separately under `public/healing/custom-icons/equipment/`:

- `armor-wardrobe`: Armor Wardrobe, 100 icons.
- `druidic-relics`: Druidic Relics, 100 icons.
- `relics-accessories`: Relics and Accessories, 100 icons.
- `weapon-arsenal`: Weapon Arsenal, 100 icons.

The equipment gallery at `/healing/custom-icons/equipment/` searches names, IDs, filenames and tags, and filters by collection or equipment type. Its `catalog.json` and `catalog.csv` contain only equipment; the root `spells-catalog.json` and `spells-catalog.csv` contain only spell/healing art. The master catalogs retain all 1,000 entries with explicit category metadata. Equipment downloads are separate (`equipment-icons-part-1.zip`, 400 icons), with contact sheets and filtered catalogs.

Stable IDs use the collection and row-major number, such as `armor-wardrobe-001`. Equipment paths are relative to the library root, such as `equipment/armor-wardrobe/001-cloth-hood.png`. The icon review picker exposes Equipment as a separate category. Importing these collections does not replace existing purpose assignments or actual item artwork; these are available library options, not item database mappings.
