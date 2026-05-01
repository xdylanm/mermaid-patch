## Why

Arrow connectors in patchDiagram diagrams currently carry no text. Users need a way to annotate connections with labels (e.g., signal names, port descriptions) using the familiar Mermaid pipe syntax `-->|label|`, making diagrams more self-documenting without requiring extra node definitions.

## What Changes

- Arrow connector syntax is extended to support an optional `|label|` segment between the arrow and the destination, following Mermaid convention.
- Full connections (`source:Port -->|label| dest:Port`) display the label along the connector line.
- Dangling connections with no source port (`-->|label| dest:Port`) render as a short stub arrow terminating at the destination port, with the label at the open end.
- Dangling connections with no destination port (`source:Port -->|label|`) render as a short stub arrow originating from the source port, with the label at the open end.
- The label is optional; omitting it preserves existing behavior exactly.

## Capabilities

### New Capabilities

- `connector-labels`: Text label support on arrow connectors using Mermaid pipe syntax (`-->|text|`), including full connections and dangling stubs with labels at the open end.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. -->

## Impact

- `patchDiagram.grammar.ne` — grammar rules for connection and danglingConnection updated to parse the optional `|label|` segment.
- `patchDiagram.grammar.js` — regenerated compiled grammar.
- `renderPatchDiagram.js` — rendering logic updated to draw label text on connectors and position it at the open end for dangling connections.
- `patchDiagramParser.js` — connection objects now carry an optional `label` field.
- Tests in `patchDiagram/__tests__/` updated to cover labeled connections.
