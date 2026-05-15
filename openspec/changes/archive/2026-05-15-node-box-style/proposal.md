## Why

The current node box uses a plain two-rectangle design (white header / dark-grey body with a black border) that looks generic and does not give the diagram a distinctive visual identity. Replacing it with a banded-frame style creates a recognisable, professional look that feels more like physical hardware module panels while remaining legible at a range of sizes.

## What Changes

- Replace the two-rectangle header/body node box with a banded-frame design: a light-grey background with three concentric band pairs (one for each edge pair: left/right and top/bottom) whose luminance decreases from 60 → 40 → 20 as they step outward, all using an achromatic HSL palette (H=0, S=0).
- Change the node box aspect ratio from approximately 3:2 to **16:9** to give more horizontal room for the module name while keeping nodes compact.
- Revise text layout: the node name (bold, all-caps, sans-serif) is centred horizontally and placed at the vertical centre when no label is present, but shifts above centre when a label is present; the label (normal weight, smaller, sans-serif) appears below centre.
- Remove the existing `nodeHeaderFill` / `nodeBodyFill` / `nodeBorderColor` config keys (which map to the two-rectangle design) and introduce HSL-based band-colour config in their place.

## Capabilities

### New Capabilities

- `node-box-style`: Visual geometry and rendering of the banded-frame node box, including band shape construction (thin top/bottom edges, thick left/right edges, arc at top-right and bottom-left corners, sharp corner at top-left and bottom-right), aspect ratio, and text placement rules.

### Modified Capabilities

- `theme-variables-node-chrome`: The existing node-chrome colour model (header fill, body fill, border colour) maps to the two-rectangle design and must be replaced. Requirements will change to describe how Mermaid `themeVariables` keys map to the new HSL band-colour parameters.

## Impact

- `src/renderer.ts` — `renderNodeBox()` function rewritten to emit the banded-frame SVG paths instead of two `<rect>` elements.
- `src/layout.ts` — `BOX_W` / `BOX_TOP_H` / `BOX_BOT_H` constants updated to reflect the 16:9 ratio and the elimination of the header/body split.
- `src/config.ts` — `PatchConfig` interface and default palettes updated: remove `nodeHeaderFill`, `nodeBodyFill`, `nodeBorderColor`, `nodeHeaderText`, `nodeBodyText`; add band-colour and text-colour fields.
- Theme palettes (default, dark, neutral in `config.ts`) will need updated defaults for the new colour keys.
- `src/__tests__/` — snapshot / geometry tests will need updating to match the new box shape and dimensions.
