## Why

The neutral theme currently uses signal-type-derived grayscale colours for bands and connectors, resulting in diagrams that are visually complex and inconsistent when printed. A simplified flat rendering — dark grey outer bands, light grey backgrounds, dark grey connectors, and a white canvas — produces clean, print-ready output with minimal visual noise.

## What Changes

- The neutral theme's node boxes and port tabs SHALL render only the outer band (dark grey `hsl(0,0%,20%)`), suppressing the inner and middle bands
- The node box and port tab backgrounds SHALL use a very light grey (`hsl(0,0%,95%)`) instead of the current mid-grey defaults
- Connector wires in the neutral theme SHALL be stroked dark grey (`hsl(0,0%,20%)`) regardless of signal type (signal-type colour matching is suppressed)
- The canvas background SHALL be white (`#ffffff`) in the neutral theme instead of light grey `#f5f5f5`

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `neutral-theme`: Requirements are changing to specify simplified band rendering (outer band only, dark grey), very light grey node/tab backgrounds, flat dark grey connector strokes, and a white canvas background for the neutral theme

## Impact

- `src/renderer.ts` — neutral theme rendering paths for node boxes, port tabs, and connectors
- `src/styles.ts` or `src/config.ts` — neutral theme config values or rendering flags
- `openspec/specs/neutral-theme/spec.md` — requirements updated to reflect new simplified visual rules
