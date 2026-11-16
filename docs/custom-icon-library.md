# Custom healing and mana icon atlases

Six user-supplied 10×10 atlases are included:

- **Neon Nature:** `neon-nature`, 100 icons.
- **Mystical Nature:** `mystical-nature`, 100 icons.
- **Luminous Healing:** `luminous-healing`, 100 icons.
- **Arcane Vitality (original set):** `arcane-vitality`, 100 icons.
- **Mana Springs of Renewal:** `mana-renewal`, 100 icons.
- **Mystical Healing Magic Icon Atlas:** `mystical-healing`, 100 icons.

Original source PNGs and reviewed seam coordinates live in `assets/icon-atlases/`. Five sources are 1254×1254 PNGs. The original set is a 2048×2048 JPEG, archived as `arcane-vitality.jpg`. Its decoded pixels are cropped into lossless PNGs without another JPEG encoding step. The painted cells have uneven boundaries, especially the final rows of the healing atlas, so crops use the explicit boundaries in `catalog.json`, not an assumed 125-pixel grid. Crops preserve the complete cell, its original pixel dimensions, colors and aspect ratio. No regeneration, upscaling or stretching is applied. Some cells are rectangular because that is how the supplied artwork is divided.

Run `python scripts/split-icon-atlases.py` from the repository root (requires Pillow) to regenerate the lossless PNG tiles, manifests, CSV catalog, numbered contact sheets and ZIP bundle. To verify full source coverage and exact pixel reconstruction, run `python scripts/verify-icon-atlases.py`.

## Organization and lookup

Public assets live under `public/healing/custom-icons/`, independently of Blizzard ability icons and the existing `report-icons` folder. Each set has:

- `001-description.png` through `100-description.png`, ordered left to right then top to bottom.
- `contact-sheet.jpg`, with all 100 icons labelled by number and row/column.
- `catalog.json`, containing descriptions, search tags, source crop rectangles, dimensions, stable IDs and source SHA-256.

The shared `catalog.json`/`catalog.csv` cover all six sets. The `index.html` gallery searches descriptions, IDs and coordinates and links to individual icons. `healing-and-mana-icons.zip` contains all 600 PNGs, contact sheets and catalogs. Source atlases stay in the repository rather than the public download bundle.

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
