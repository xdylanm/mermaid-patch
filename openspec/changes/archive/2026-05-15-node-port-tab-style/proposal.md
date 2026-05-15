## Why

The banded-frame node box introduced a distinctive visual identity for patch diagrams, but the port tabs (badges) still use the legacy trapezoid fill-with-white-text style, creating an aesthetic mismatch. Replacing the port tabs with a complementary banded-frame style — using the same band geometry as the node box but coloured by signal type — unifies the diagram's visual language and gives each port a clear, recognisable identity.

## What Changes

- Replace the filled-trapezoid port badge (`trapPoints` / `badgeLabel`) with a new banded-frame port tab whose background and three concentric bands are coloured using an HSL palette with a signal-type-specific hue (S=100) and luminance levels L=80/60/40/20.
- The new tab is a rectangle (rather than a trapezoid) with an open attachment edge (the side connecting to the node box) and banded frame on the remaining three sides: thin bands on the two "inner" sides (along the node edge and the far end), and thicker bands on the outer edge (away from the node), matching the node-box band thicknesses (`BAND_STEP_H` / `BAND_STEP_V`).
- The tab length (dimension along the node edge) is fixed at `BOX_H − 2 × CORNER_R_OUTER = 49` so that a centered tab sits fully within the straight portion of the node edge.
- Tab label text changes from white bold to dark-coloured sans-serif text centred both horizontally and vertically within the tab.
- Four new config keys provide the per-hue background and band colours for each signal type, or a single shared set when signal-type colouring is disabled.

## Capabilities

### New Capabilities

- `node-port-tab-style`: Visual geometry and rendering of the banded-frame port tab, including band shape construction (thin top/inner-edge bands, thick outer-edge bands, arc blending at the outer corner, open attachment edge), HSL signal-type colour palette, tab dimensions, text placement, and orientation rules for each of the four port sides.

### Modified Capabilities

- `theme-variables-node-chrome`: The port tab colour model (previously solid fill derived from `audioColor` / `cvColor` etc.) maps to the new HSL band-colour parameters; requirements change to describe how signal-type hues map to the tab's background and band colours.

## Impact

- `src/renderer.ts` — `renderNodeBadges()` rewritten: `trapPoints()` and `badgeLabel()` replaced by a new `renderPortTab()` function that emits the background rect and three band paths, plus a centred text label.
- `src/layout.ts` — `TAB_W` and `TAB_D` constants added for tab length along the edge and depth perpendicular to the edge; existing `BADGE_D` / `BADGE_SLOPE` can be retained for any remaining trapezoidal use or deprecated.
- `src/config.ts` — New per-signal-type tab colour keys (`tabBgColor`, `tabBandLight`, `tabBandMid`, `tabBandDark`) for each signal type, or alternatively a function that derives colours from signal type hue and the four luminance levels. Signal-type colour keys (`audioColor` etc.) remain unchanged.
- Theme palettes updated with tab-colour defaults that reflect the HSL signal-type palette.
- `src/__tests__/` — Tests updated to cover the new `renderPortTab()` function and tab geometry at default dimensions.
