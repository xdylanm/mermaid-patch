## Why

The current diagram renderer produces good, readable layouts, but leaves a significant amount of unused whitespace — both around the diagram perimeter and between columns of nodes. Reducing this waste makes diagrams feel tighter and more professional, and allows larger diagrams to fit on screen without scrolling.

## What Changes

- Reduce the SVG padding around the diagram from 80 px to approximately 40 px.
- Reduce the horizontal gap between node columns (`LAYER_GAP`) by approximately 30% (from 25 px to approximately 17–18 px).

## Capabilities

### New Capabilities

- `compact-diagram-spacing`: Configurable diagram padding and column-gap constants, with reduced defaults that eliminate excess whitespace around and between nodes.

### Modified Capabilities

- `compact-diagram-layout`: Existing layout spec requirements around spacing constants (`SVG_PAD`, `LAYER_GAP`) will gain concrete minimum/maximum values to constrain future changes.

## Impact

- `src/layout.ts` — `SVG_PAD` and `LAYER_GAP` constants updated.
- `openspec/specs/compact-diagram-layout/spec.md` — spacing requirements updated.
- Visual output of all rendered diagrams will change (tighter layout). No API or schema changes.
