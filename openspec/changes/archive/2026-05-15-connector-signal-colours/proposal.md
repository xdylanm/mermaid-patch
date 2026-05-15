## Why

The signal-type HSL colour palette introduced for port tabs has not yet been applied to connector wires, stubs, or their labels, so connections in the diagram are visually disconnected from the ports they join. Additionally, the default background colour does not harmonise with the warm vintage aesthetic of the banded node style.

## What Changes

- Connector wires (full connections) and dangling stubs are coloured by signal type using the same HSL H/S values as port tabs, with L=40 (a mid-dark tone that reads clearly on the light diagram background)
- Connector polyline corners use a quadratic arc with radius 16 px, matching the rounded style of the node boxes and port tabs
- Labels on connector wires and at the open ends of dangling stubs are coloured with the same signal-type hue (H, S=100%, L=40)
- The default palette background colour changes from the current neutral grey-brown to `hsl(50, 100%, 90%)` — a very pale warm yellow that complements the vintage aesthetic

## Capabilities

### New Capabilities

- `connector-signal-colours`: Defines the HSL colouring formula for connector wires and dangling stubs (H from signal type, S=100%, L=40), the 16 px corner arc radius, and the rule that connector labels adopt the same colour

### Modified Capabilities

- `connector-labels`: Labels on connector wires and dangling stubs now have an explicit colour requirement: the signal-type HSL colour (H, S=100%, L=40) matching the wire/stub colour
- `theme-variable-background`: The built-in palette default background colour changes to `hsl(50, 100%, 90%)`

## Impact

- `src/renderer.ts` — connector and stub rendering (stroke colour, polyline corner arcs, label fill)
- `src/styles.ts` or `src/config.ts` — default palette background value
- `openspec/specs/connector-labels/spec.md` — updated label colour requirements
- `openspec/specs/theme-variable-background/spec.md` — updated palette default background scenario
