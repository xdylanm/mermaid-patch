## MODIFIED Requirements

### Requirement: Full connection with label
A patch diagram arrow connector MAY include a text label using Mermaid pipe syntax. When a label is present in a full connection (`sourceId:Port -->|label text| destId:Port`), the diagram SHALL render the label string along the connector wire. The label text fill SHALL match the connector wire stroke colour for that connection (i.e., `hsl(H, 100%, 40%)` for the signal type, or `hsl(0, 0%, 40%)` for unknown types).

#### Scenario: Parse labeled full connection
- **WHEN** the diagram text contains `vca1:Out -->|my note| mix1:In1`
- **THEN** the parser SHALL produce a connection object with `type: 'connection'`, `from: 'vca1'`, `fromPort: 'Out'`, `to: 'mix1'`, `toPort: 'In1'`, and `label: 'my note'`

#### Scenario: Render label on connector wire with signal-type colour
- **WHEN** a connection from an `audio` port has a non-empty `label` field
- **THEN** the renderer SHALL display the label text at the midpoint of the routed connector polyline using the same font as port badge labels, with fill `hsl(25, 100%, 40%)`

#### Scenario: Unlabeled full connection unchanged
- **WHEN** the diagram text contains `vca1:Out --> mix1:In1` with no pipe segment
- **THEN** the parser SHALL produce a connection with `label` absent or `null`, and the renderer SHALL draw it identically to the current behavior

---

### Requirement: Dangling-to connection with label
A patch diagram SHALL support dangling arrows that terminate at a port with a label at the open end, using the syntax `-->|label text| destId:Port`. The label text fill SHALL match the stub stroke colour (`hsl(H, 100%, 40%)` for the destination port's signal type).

#### Scenario: Parse dangling-to labeled connection
- **WHEN** the diagram text contains `-->|keyboard| mix1:In1`
- **THEN** the parser SHALL produce a connection object with `type: 'dangling'`, `direction: 'to'`, `to: 'mix1'`, `toPort: 'In1'`, and `label: 'keyboard'`

#### Scenario: Render dangling-to stub with signal-type coloured label
- **WHEN** a dangling connection has `direction: 'to'` and the destination port is type `cv`
- **THEN** the renderer SHALL draw a short stub arrow pointing toward the destination port badge, stroked `hsl(200, 100%, 40%)`, with the label text filled `hsl(200, 100%, 40%)`

---

### Requirement: Dangling-from connection with label
The `sourceId:Port -->|label|` syntax SHALL produce a dangling stub originating from the source port with the label at the open end. The label text fill SHALL match the stub stroke colour (`hsl(H, 100%, 40%)` for the source port's signal type).

#### Scenario: Parse dangling-from labeled connection
- **WHEN** the diagram text contains `vca1:Out -->|audio out|`
- **THEN** the parser SHALL produce a connection object with `type: 'dangling'`, `direction: 'from'`, `from: 'vca1'`, `fromPort: 'Out'`, and `label: 'audio out'`

#### Scenario: Render dangling-from stub with signal-type coloured label
- **WHEN** a dangling connection has `direction: 'from'` and the source port is type `audio`
- **THEN** the renderer SHALL draw a short stub originating from the source port badge, stroked `hsl(25, 100%, 40%)`, with the label at the free end filled `hsl(25, 100%, 40%)`
