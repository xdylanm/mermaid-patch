# Spec: Connector Labels

## Purpose

Defines the requirements for labeled arrow connectors in Monotrail diagrams. Connectors (full connections and dangling stubs) MAY carry a text label using Mermaid pipe syntax (`-->|label text|`), rendered along the connector wire or at the open end of a stub.

## Requirements

### Requirement: Full connection with label
A Monotrail arrow connector MAY include a text label using Mermaid pipe syntax. When a label is present in a full connection (`sourceId:Port -->|label text| destId:Port`), the diagram SHALL render the label string along the connector wire.

#### Scenario: Parse labeled full connection
- **WHEN** the diagram text contains `vca1:Out -->|my note| mix1:In1`
- **THEN** the parser SHALL produce a connection object with `type: 'connection'`, `from: 'vca1'`, `fromPort: 'Out'`, `to: 'mix1'`, `toPort: 'In1'`, and `label: 'my note'`

#### Scenario: Render label on connector wire
- **WHEN** a connection object has a non-empty `label` field
- **THEN** the renderer SHALL display the label text at the midpoint of the routed connector polyline using the same font as port badge labels (`Arial, sans-serif`, size 15, bold)

#### Scenario: Unlabeled full connection unchanged
- **WHEN** the diagram text contains `vca1:Out --> mix1:In1` with no pipe segment
- **THEN** the parser SHALL produce a connection with `label` absent or `null`, and the renderer SHALL draw it identically to the current behavior

### Requirement: Dangling-to connection with label
A Monotrail diagram SHALL support dangling arrows that terminate at a port with a label at the open end, using the syntax `-->|label text| destId:Port`.

#### Scenario: Parse dangling-to labeled connection
- **WHEN** the diagram text contains `-->|keyboard| mix1:In1`
- **THEN** the parser SHALL produce a connection object with `type: 'dangling'`, `direction: 'to'`, `to: 'mix1'`, `toPort: 'In1'`, and `label: 'keyboard'`

#### Scenario: Render dangling-to stub with label
- **WHEN** a dangling connection has `direction: 'to'`
- **THEN** the renderer SHALL draw a short stub arrow (length equal to `STUB` px) pointing toward the destination port badge, colored by the destination port's signal type, with the label text at the open end of the stub

### Requirement: Dangling-from connection with label
The `sourceId:Port -->|label|` syntax SHALL produce a dangling stub originating from the source port with the label at the open end.

#### Scenario: Parse dangling-from labeled connection
- **WHEN** the diagram text contains `vca1:Out -->|audio out|`
- **THEN** the parser SHALL produce a connection object with `type: 'dangling'`, `direction: 'from'`, `from: 'vca1'`, `fromPort: 'Out'`, and `label: 'audio out'`

#### Scenario: Render dangling-from stub with label at open end
- **WHEN** a dangling connection has `direction: 'from'`
- **THEN** the renderer SHALL draw a short stub originating from the source port badge with the label at the free end, colored by the source port's signal type
