## Why

Port tabs on the bottom edge of a node are rotated 180° to orient the tab outward, but this rotation also flips the label text, making it appear upside down to the reader. The label should always be legible regardless of which edge the tab is on.

## What Changes

- Counter-rotate the label text element for bottom-edge tabs so it renders upright despite the parent group's 180° rotation.

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `node-port-tab-style`: Add requirement that the tab label text SHALL always render upright (readable), regardless of the tab's rotation angle.

## Impact

- `src/renderer.ts`: The tab rendering function must apply a counter-transform to the label `<text>` element when `side === 'bottom'`.
- `openspec/specs/node-port-tab-style/spec.md`: The label rendering requirement gains an upright-text clause and a bottom-tab scenario.
