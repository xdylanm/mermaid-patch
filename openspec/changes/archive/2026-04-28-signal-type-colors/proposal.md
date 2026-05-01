## Why

The signal type colors in patchDiagram need to align with the Monotrail color palette for visual consistency. The current colors diverge from Monotrail's established design language.

## What Changes

- Update `audio` port badge and wire color from `#e0607a` to `#F07BAB`
- Update `cv` port badge and wire color from `#4a9fd4` to `#51A4DB`
- Update `voct` port badge and wire color from `#72b83e` to `#8BC640`
- Update `gate` port badge and wire color from `#e09030` to `#F9AF3C`

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `diagram-schema`: Update Signal Type Coloring requirement to reflect new Monotrail-aligned color values

## Impact

- `patchDiagram/renderPatchDiagram.js` — color lookup table for signal types
- Rendered diagram output — visual appearance of port badges and connector wires
