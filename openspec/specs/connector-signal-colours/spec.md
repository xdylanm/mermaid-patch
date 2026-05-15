# Spec: Connector Signal Colours

## Purpose

Defines the visual colouring of connector wires and dangling stubs in patch diagrams. Connectors are stroked using the same signal-type HSL palette as port tabs (H per signal type, S=100%, L=40), and polyline bend points are smoothed with a 16 px quadratic arc for a rounded aesthetic consistent with node boxes and port tabs.

## Requirements

### Requirement: Connector wires are stroked with the signal-type HSL colour at L=40

Each connector wire (full connection) and dangling stub SHALL be stroked with a colour derived from the signal type using a fixed HSL formula: hue H is signal-type-specific (audio H=25, cv H=200, voct H=100, gate H=300), saturation S=100%, and luminance L=40. For unknown or unrecognised signal types, the stroke colour SHALL be `hsl(0, 0%, 40%)` (mid grey, S=0).

The colour is determined by the source port's signal type for `direction: 'from'` stubs and full connections (unless the source port is typed `any`, in which case the destination port type is used); and by the destination port's signal type for `direction: 'to'` stubs.

#### Scenario: Audio connector wire uses orange stroke

- **WHEN** a full connection routes from an `audio` port
- **THEN** the SVG polyline stroke SHALL be `hsl(25, 100%, 40%)`

#### Scenario: CV connector wire uses blue stroke

- **WHEN** a full connection routes from a `cv` port
- **THEN** the SVG polyline stroke SHALL be `hsl(200, 100%, 40%)`

#### Scenario: V/oct connector wire uses green stroke

- **WHEN** a full connection routes from a `voct` port
- **THEN** the SVG polyline stroke SHALL be `hsl(100, 100%, 40%)`

#### Scenario: Gate connector wire uses purple stroke

- **WHEN** a full connection routes from a `gate` port
- **THEN** the SVG polyline stroke SHALL be `hsl(300, 100%, 40%)`

#### Scenario: Unknown signal type wire uses grey stroke

- **WHEN** a full connection routes from a port with an unrecognised signal type
- **THEN** the SVG polyline stroke SHALL be `hsl(0, 0%, 40%)`

#### Scenario: Dangling-to stub uses destination port signal colour

- **WHEN** a `direction: 'to'` stub terminates at a `gate` port
- **THEN** the stub stroke SHALL be `hsl(300, 100%, 40%)`

---

### Requirement: Connector polyline corners use a quadratic arc with radius 16 px

Where the routed connector polyline changes direction (at each bend point), the corner SHALL be smoothed with a quadratic Bézier arc with nominal radius `CONNECTOR_CORNER_R = 16` px. The arc offset SHALL be clamped to `min(CONNECTOR_CORNER_R, halfA, halfB)` where `halfA` and `halfB` are half the lengths of the two segments meeting at the bend, so that the arc never overruns either segment. The first and last points of the polyline (at the port tips) SHALL remain sharp (no arc).

#### Scenario: Connector bend is smoothed with a 16 px arc

- **WHEN** an ELK-routed connector has a 90° bend with adjacent segments each longer than 32 px
- **THEN** the SVG path at that bend SHALL contain a quadratic Bézier curve (`Q`) with the arc offset equal to 16 px from the bend point on each adjacent segment

#### Scenario: Short segment clamps the arc radius

- **WHEN** an ELK-routed connector has a bend where one adjacent segment is 10 px long
- **THEN** the arc offset SHALL be 5 px (half of 10) rather than 16 px, preventing the arc from overshooting the segment midpoint
