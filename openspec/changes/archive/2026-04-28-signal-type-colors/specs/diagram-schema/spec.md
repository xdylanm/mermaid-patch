## MODIFIED Requirements

### Requirement: Signal Type Coloring

Each port SHALL carry a signal type declared in its module definition. The renderer MUST use that signal type to determine the color of port badges and connector wires.

| Signal type | Color     |
|-------------|-----------|
| `audio`     | `#F07BAB` |
| `cv`        | `#51A4DB` |
| `voct`      | `#8BC640` |
| `gate`      | `#F9AF3C` |

#### Scenario: Audio port color
- **WHEN** a port has type `audio`
- **THEN** the renderer SHALL color its badge and connected wires `#F07BAB`

#### Scenario: CV port color
- **WHEN** a port has type `cv`
- **THEN** the renderer SHALL color its badge and connected wires `#51A4DB`

#### Scenario: V/oct port color
- **WHEN** a port has type `voct`
- **THEN** the renderer SHALL color its badge and connected wires `#8BC640`

#### Scenario: Gate port color
- **WHEN** a port has type `gate`
- **THEN** the renderer SHALL color its badge and connected wires `#F9AF3C`
