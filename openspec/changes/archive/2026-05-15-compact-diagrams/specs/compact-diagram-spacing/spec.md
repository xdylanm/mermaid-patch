## ADDED Requirements

### Requirement: Diagram padding is compact
The layout engine SHALL use an SVG padding value (`SVG_PAD`) of no more than 40 px around the diagram bounding box. This padding is added to each side of the node bounding box when computing the SVG `viewBox`.

#### Scenario: Padding does not exceed 40 px
- **WHEN** any diagram is rendered
- **THEN** the distance from the outermost node edge to the SVG viewport edge SHALL be ≤ 40 px on all sides

#### Scenario: Dangling connectors remain within viewport
- **WHEN** a diagram has a dangling connector stub on a node at the leftmost or rightmost column
- **THEN** the stub SHALL still be fully visible within the SVG viewport (i.e. `SVG_PAD` ≥ `DANGLING_LEN` is not required; the viewBox SHALL expand to encompass stubs)

### Requirement: Column gap is compact
The horizontal gap between adjacent node columns (`LAYER_GAP`) SHALL be no more than 18 px. This value is passed to ELK as `elk.layered.spacing.edgeNodeBetweenLayers`.

#### Scenario: Column gap does not exceed 18 px
- **WHEN** any diagram with at least two columns is rendered
- **THEN** the pixel distance between the right edge of a node in column N and the left edge of any node in column N+1 SHALL be ≤ 18 px (excluding connector stubs)

#### Scenario: Connector stubs do not overlap adjacent nodes
- **WHEN** `LAYER_GAP` is reduced to 17–18 px
- **THEN** connector stubs (`STUB = 36 px`) SHALL extend into the gap without visually merging with the adjacent node's bounding box, because the stub is anchored to the node tab and the gap provides clearance for the connector line segment
