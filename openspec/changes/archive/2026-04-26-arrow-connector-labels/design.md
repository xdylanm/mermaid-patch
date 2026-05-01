## Context

patchDiagram diagrams are defined in a Nearley grammar (`patchDiagram.grammar.ne`), compiled to `patchDiagram.grammar.js`, parsed by `patchDiagramParser.js`, and rendered to SVG by `renderPatchDiagram.js` via ELK layout.

Connections today come in two grammar shapes:
- `connection`: `sourceId:Port --> destId:Port` — a full wire between two ports
- `danglingConnection`: `sourceId:Port -->|label|` — a stub originating from a port with a label at the open end

Neither `connection` supports inline labels, and there is no grammar rule for a dangling arrow that terminates at a port (`-->|label| destId:Port`).

## Goals / Non-Goals

**Goals:**
- Parse `-->|label|` between source and destination in a full connection (`src:Port -->|label| dst:Port`).
- Parse a new dangling-to form: `-->|label| dst:Port` (open end at start, terminates at a port).
- Render label text on full connection wires (midpoint of the routed polyline).
- Render label text at the open end of dangling stubs.
- Preserve all existing connection behavior when no label is present.

**Non-Goals:**
- Multi-segment or multi-label connectors.
- Label styling beyond plain text (no font size, color, or weight overrides per label).
- Editing labels interactively in the rendered SVG.
- Mermaid compatibility beyond this specific pipe syntax.

## Decisions

### 1 — Extend the grammar with two new shapes; keep the old rules

Rather than modifying `connection` and `danglingConnection` in place with optional label segments (which would require nullable productions that risk Nearley ambiguity), we add two sibling rules:

- `labeledConnection`: `identifier portSpec _ "-->" _ "|" pipeLabel "|" _ identifier portSpec`
- `danglingToConnection`: `"-->" _ "|" pipeLabel "|" _ identifier portSpec`

All four rules are listed under `statement`. The parser returns `type: 'connection'` for both connection shapes (with an optional `label` field) and `type: 'dangling'` for both dangling shapes, with a `direction` field (`'from'` or `'to'`) so the renderer knows which end is open.

**Alternatives considered:**
- Making the label optional in existing rules with `("|" pipeLabel "|"):?` — rejected because Nearley's optional productions can produce ambiguous parses when combined with `_` whitespace tokens.
- A single catch-all connection rule with regex — rejected because Nearley is PEG-like in its rule ordering; a unified rule would require careful ordering and reduce clarity.

### 2 — Label placement: midpoint for full connections, open-end for dangling stubs

For full connections the label is drawn at the midpoint of the ELK-routed polyline. For dangling stubs the label is drawn at the free (non-port) end of the stub line, offset slightly outward.

Connector labels SHALL use the same font as port badge labels: `Arial, sans-serif`, `font-size: 15`, `font-weight: bold`. This keeps connector annotations visually consistent with the rest of the diagram.

**Alternatives considered:**
- Always placing the label at one-third of the wire — rejected because it would be hard to read on long diagonal routes.
- SVG `<textPath>` following the wire path — rejected because it complicates hit-testing and isn't needed for the current use case.

### 3 — Dangling-to stubs use a fixed stub length and are colored by destination port type

Consistent with the existing dangling-from style: the stub is `STUB` px long (36 px), colored by the port type of the connected port, and terminates with an arrowhead pointing at the port badge.

## Risks / Trade-offs

- [Grammar ambiguity] Adding four parallel statement alternatives increases grammar complexity → Mitigation: compile grammar after each change and run `nearleyc` to catch shift/reduce conflicts early; add targeted parser tests for each new shape.
- [ELK port handling] Dangling-to connections have no source node and must be excluded from ELK edge definitions (same pattern as existing dangling-from connections) → Mitigation: filter by `type === 'dangling'` before building ELK edges, which already handles dangling-from connections.
- [Label collision] Labels may overlap with badges or other labels on dense diagrams → Mitigation: accepted as a known limitation for this iteration; users can adjust module layout.
