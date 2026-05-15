## Why

`docs/config.md` describes node boxes and port tabs using the old two-rectangle header/body design, but the renderer now uses a unified banded-frame design for both. The themes table, the `themeVariables` mapping table, and the accompanying code example are all out of date, which will mislead users trying to customise colours.

## What Changes

- Update the **Themes** table to describe banded-frame node boxes and correct canvas background colours for all three themes (`default`, `dark`, `neutral`).
- Update the **Mermaid theme variables** table to reflect the new `themeVariables` → `PatchConfig` mappings: `primaryColor` → node background fill, `primaryBorderColor` → outermost band colour, `secondaryTextColor` → node label text.
- Remove the `secondaryColor` row — port tab colours are now derived from the signal type's HSL formula, not from a Mermaid theme variable.
- Update the `themeVariables` code example to remove the obsolete `secondaryColor` key and update inline comments.

## Capabilities

### New Capabilities

_(none — documentation only)_

### Modified Capabilities

- `node-box-style`: Documentation now correctly describes the banded-frame appearance, greyscale defaults, and `themeVariables` integration.
- `node-port-tab-style`: Documentation now correctly states that port tab colours are HSL-derived from signal type, not sourced from `themeVariables.secondaryColor`.
- `dark-theme`: Documentation now correctly describes the dark node box palette (dark background, lighter bands, light text).
- `neutral-theme`: Documentation now correctly describes the neutral palette (near-white background, single visible outer band, white canvas).

## Impact

- `docs/config.md`: Themes table, Mermaid theme variables table, and `themeVariables` code example updated.
- No code changes — documentation only.
