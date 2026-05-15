## 1. Layout Constants

- [x] 1.1 In `src/layout.ts`, update `BOX_W` to `144` and `BOX_H` to `81`
- [x] 1.2 Remove `BOX_TOP_H` and `BOX_BOT_H` constants and all their usages
- [x] 1.3 Add exported constants `BAND_STEP_H` (≈ `BOX_W × 0.05`, approx 7 px) and `BAND_STEP_V` (≈ `BOX_H × 0.02`, approx 1.6 px, minimum 1 px) for band thickness per step; keep these as top-level named exports so values can be tuned without touching renderer logic
- [x] 1.4 Update all `layout.ts` exports to remove `BOX_TOP_H` / `BOX_BOT_H` and add `BAND_STEP_H` / `BAND_STEP_V`

## 2. Config Interface and Palettes

- [x] 2.1 In `src/config.ts`, remove `nodeHeaderFill`, `nodeHeaderText`, `nodeBodyFill`, `nodeBodyText`, `nodeBorderColor` from the `PatchConfig` interface
- [x] 2.2 Add `nodeBgColor`, `nodeBandLight`, `nodeBandMid`, `nodeBandDark`, `nodeNameColor`, `nodeLabelColor` to the `PatchConfig` interface
- [x] 2.3 Update the default palette defaults: `nodeBgColor: '#cccccc'`, `nodeBandLight: '#999999'`, `nodeBandMid: '#666666'`, `nodeBandDark: '#333333'`, `nodeNameColor: '#111111'`, `nodeLabelColor: '#333333'`
- [x] 2.4 Update the dark palette defaults with appropriate values
- [x] 2.5 Update the neutral palette defaults with appropriate values
- [x] 2.6 Update the `themeVariables` mapping: `primaryColor → nodeBgColor`, `primaryTextColor → nodeNameColor`, `primaryBorderColor → nodeBandDark`, `secondaryTextColor → nodeLabelColor`; remove mappings for `secondaryColor` and the old node keys

## 3. Band Path Renderer

- [x] 3.1 In `src/renderer.ts`, implement a `bandPath(x, y, w, h, outerH, innerH, outerV, innerV, side: 'r' | 'l'): string` helper that returns an SVG path `d` string for one half of a band pair
- [x] 3.2 The `'r'` path covers the top edge + right edge with arc at top-right, sharp corner at bottom-right; the `'l'` path covers the left edge + bottom edge with arc at bottom-left, sharp corner at top-left
- [x] 3.3 Implement `renderNodeBox(nl, config)` to emit: one `<rect>` background (nodeBgColor), then three band pairs (6 `<path>` elements) from innermost (nodeBandLight) to outermost (nodeBandDark)
- [x] 3.4 Remove the old two-rect header/body rendering code and all references to old config keys in the renderer

## 4. Text Placement

- [x] 4.1 Update node name text placement: when no label, position at `y + BOX_H / 2`; when label present, position at `y + BOX_H × 0.42`
- [x] 4.2 Update label text placement to `y + BOX_H × 0.62` when present
- [x] 4.3 Set label font size to `config.fontSize - 2` and ensure it uses `nodeLabelColor`
- [x] 4.4 Ensure node name uses `nodeNameColor`, bold, `font-family: config.fontFamily`

## 5. Renderer Import Cleanup

- [x] 5.1 Update imports in `renderer.ts` to remove `BOX_TOP_H` / `BOX_BOT_H` and add `BAND_STEP_H` / `BAND_STEP_V` from `layout.ts`
- [x] 5.2 Remove any remaining references to old config keys (`nodeHeaderFill`, `nodeBodyFill`, `nodeBorderColor`, `nodeHeaderText`, `nodeBodyText`) across the codebase

## 6. Tests

- [x] 6.1 Update snapshot/geometry tests in `src/__tests__/` that reference old box constants (`BOX_TOP_H`, `BOX_BOT_H`, `BOX_W=140`, `BOX_H=84`, or the old 160×90 values)
- [x] 6.2 Add unit tests for the `bandPath()` helper verifying arc/sharp corner placement and band boundary positions at default dimensions
- [x] 6.3 Run the full test suite and confirm all tests pass
