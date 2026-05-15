## 1. Layout Constants

- [x] 1.1 In `src/layout.ts`, add exported constant `TAB_L = BOX_H - 2 * CORNER_R_OUTER` (currently 49 px) for the along-edge length of the port tab
- [x] 1.2 Rename `BADGE_D` to `TAB_D` across `layout.ts` and all usages in `renderer.ts`; remove `BADGE_SLOPE` and its usages
- [x] 1.3 Update all `layout.ts` exports to add `TAB_L` and rename `BADGE_D`→`TAB_D`, remove `BADGE_SLOPE`

## 2. HSL Colour Helper

- [x] 2.1 In `src/renderer.ts`, implement a `tabColors(type: string): { bg: string; light: string; mid: string; dark: string }` pure function that returns HSL colour strings using signal-type hues (audio=25, cv=200, voct=100, gate=300, fallback S=0) and S=100, L∈{80, 60, 40, 20}
- [x] 2.2 Verify that `tabColors` returns correct `hsl()` strings for all four named signal types and for an unrecognised type

## 3. Tab Band Path Builder

- [x] 3.1 In `src/layout.ts`, implement and export `tabBandPath(tl, td, outerH, innerH, outerV, innerV, rTR_outer, rTR_inner, rTL_outer, rTL_inner): string` — SVG `d` string for one ring-shaped band of the canonical tab (open=bottom, thick=right, thin=left+top), using quadratic bezier arcs with the same radius progression as `mixedCornerRect`
- [x] 3.2 Path traces outer boundary CW (sharp bottom-left → left thin edge → TL arc → top thin edge → TR arc → sharp bottom-right) then inner boundary CCW back to start
- [x] 3.3 Add unit tests in `src/__tests__/tabBandPath.test.ts` verifying arc control points, TL arc symmetry for all bands, dimension sanity, and closed path; 21 tests all passing

## 4. Tab Renderer

- [x] 4.1 In `src/renderer.ts`, implement `renderPortTab(bx, by, side, label, signalType, config): Element` — draws background solid shape + 3 band rings using `tabBandPath` + centred dark label text, all in canonical space
- [x] 4.2 Apply per-side SVG transform `translate(bx,by) rotate(angle) translate(-TAB_L/2,-TAB_D)` mapping the canonical open-edge midpoint to the port anchor: top→0°, bottom→180°, left→-90°, right→90°
- [x] 4.3 Replace `renderNodeBadges()` body to call `renderPortTab()` per port

## 5. Cleanup

- [x] 5.1 Remove `trapPoints()` from `renderer.ts`
- [x] 5.2 Remove `badgeLabel()` from `renderer.ts`
- [x] 5.3 Update imports: add `TAB_L`, `TAB_D`, `tabBandPath`; remove `BADGE_D`, `BADGE_SLOPE`
- [x] 5.4 No remaining references to `trapPoints`, `badgeLabel`, `BADGE_SLOPE`, or `BADGE_D` in codebase

## 6. Spec Sync: theme-variables-node-chrome

- [x] 6.1 Updated scenario "Port badge and signal colours are unaffected" → "Port tab and signal colours are unaffected" in `openspec/specs/theme-variables-node-chrome/spec.md`; body updated to reference HSL fills instead of polygon fills

## 7. Tests

- [x] 7.1 No existing tests referenced `BADGE_D`, `BADGE_SLOPE`, or trapezoid output — no updates needed
- [x] 7.2 Added `src/__tests__/tabBandPath.test.ts` with 21 unit tests covering `tabBandPath` structure, arc symmetry, and layout constant values
- [x] 7.3 Full test suite: 99 tests across 5 files — all passing
