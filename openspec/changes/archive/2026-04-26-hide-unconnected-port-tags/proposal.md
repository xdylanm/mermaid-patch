## Why

Module definitions often declare a complete port roster for reuse, but a given diagram only uses a subset of those ports. Rendering all declared ports clutters nodes with unused badges, making the diagram harder to read.

## What Changes

- The renderer SHALL skip drawing port tag badges for any port on a node that has no connection (full wire or dangling stub) in the diagram.
- Port labels from a module definition that are not referenced by any connection or dangling stub are excluded from both layout and rendering.
- Ports that are referenced in connections (including dangling stubs) continue to render exactly as before.

## Capabilities

### New Capabilities
- `unconnected-port-hiding`: Controls which port badges are rendered — only ports with at least one connection (full wire or dangling stub referencing that port) are included in layout and drawn on the node.

### Modified Capabilities
- `diagram-schema`: The rendering contract for module ports changes — not all declared ports must be rendered; only connected ports appear in the visual output.

## Impact

- `patchDiagram/renderPatchDiagram.js` — port filtering logic in `buildElkLayout` and the SVG drawing pass
- `patchDiagram/__tests__/patchDiagramParser.test.js` — may need render-level tests or visual regression cases
- No parser changes required; the schema syntax is unchanged
