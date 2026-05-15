## Why

Patch diagrams use colour-coded connector wires to distinguish signal types, but readers unfamiliar with the colour convention have no in-diagram reference. A legend embedded directly in the SVG removes the need for external documentation and makes diagrams self-explanatory at a glance.

## What Changes

- Add an opt-in `legend` config key to the `patch` Mermaid config block that enables a signal-type legend overlay on the rendered SVG.
- The legend renders four rows — one per concrete signal type (`audio`, `cv`, `voct`, `gate`) — each showing a horizontal coloured line (2× the connector stroke width) followed by the signal type label.
- The legend defaults to the top-right corner of the diagram; a `legendPosition` config key accepts `top-left`, `top-right`, `bottom-left`, or `bottom-right`.
- The legend has no border and no title.

## Capabilities

### New Capabilities

- `diagram-legend`: In-diagram legend overlay that maps signal-type colours to their labels, configurable via the `patch` Mermaid config.

### Modified Capabilities

<!-- none -->

## Impact

- `src/config.ts` — new `legend` (boolean, default `false`) and `legendPosition` (enum, default `'top-right'`) config fields.
- `src/renderer.ts` — legend SVG group injected into the rendered output when `legend` is enabled.
- `src/types.ts` — config type extended with the new fields.
- No breaking changes; existing diagrams without the config key are unaffected.
