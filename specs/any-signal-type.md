# Spec: Any Signal Type

## Purpose

Defines the `any` signal type for use in patch diagram module port declarations. An `any` port defers its rendered signal type to its connected counterpart at render time, enabling reusable utility modules that work across audio, CV, gate, and v/oct signals without declaring a fixed type.

## Requirements

### Requirement: `any` is a valid signal type identifier

A patch diagram module port SHALL accept `any` as a valid `<signalType>` value. The parser SHALL treat it identically to other signal type identifiers (e.g., `audio`, `cv`), producing a port object with `type: 'any'`.

#### Scenario: Parse module with any-typed port

- **WHEN** the diagram text contains:
  ```
  module Passthrough {
      +any In
      +any Out
  }
  ```
- **THEN** the parser SHALL produce `{ type: 'module', name: 'Passthrough', ports: [{type:'any', label:'In'}, {type:'any', label:'Out'}] }`

---

### Requirement: Resolve `any` port type from connected counterpart

Before rendering, the renderer SHALL perform a type resolution pass. For each connection where one port has `type: 'any'` and the other has a concrete type, the `any` port SHALL resolve to the concrete type of its counterpart.

#### Scenario: `any` output connected to concrete input

- **WHEN** a port with `type: 'any'` on node A is connected to a port with `type: 'audio'` on node B
- **THEN** the `any` port on node A SHALL resolve to `audio` for rendering (badge color and wire color)

#### Scenario: Concrete output connected to `any` input

- **WHEN** a port with `type: 'cv'` on node A is connected to a port with `type: 'any'` on node B
- **THEN** the `any` port on node B SHALL resolve to `cv` for rendering

---

### Requirement: `any`-to-`any` connection resolves to CV

When both ends of a connection have `type: 'any'`, both ports SHALL resolve to `cv` for rendering purposes.

#### Scenario: Both ends are `any`

- **WHEN** a port with `type: 'any'` on node A is connected to a port with `type: 'any'` on node B
- **THEN** both ports SHALL render with the `cv` signal color and the wire SHALL be colored as `cv`

---

### Requirement: Fan-out from `any` port with uniform destination types

When an `any` output port fans out to multiple input ports that all resolve to the same concrete type, the output port SHALL resolve to that concrete type, and all wire segments SHALL be colored by that type.

#### Scenario: Fan-out to uniform type

- **WHEN** an `any` output port on node A is connected to two input ports both with `type: 'audio'`
- **THEN** the output port on node A SHALL resolve to `audio`, and both wire segments SHALL render with the `audio` signal color

---

### Requirement: Fan-out from `any` port with mixed destination types

When an `any` output port fans out to multiple input ports that resolve to different concrete types, the output port badge SHALL render as `cv`, and each wire segment SHALL be colored by the resolved type of its specific destination port.

#### Scenario: Fan-out to mixed types

- **WHEN** an `any` output port on node A is connected to one input with `type: 'audio'` and one input with `type: 'cv'`
- **THEN** the output port badge on node A SHALL render with the `cv` signal color
- **AND** the wire to the `audio` input SHALL render with the `audio` signal color
- **AND** the wire to the `cv` input SHALL render with the `cv` signal color

---

### Requirement: `any` port with no connections renders with default color

An unresolved `any` port (one with no connections) follows the unconnected port hiding rules and is not rendered. If for any reason an `any` port is rendered without a resolved type, it SHALL use the `default` (gray) color.

#### Scenario: Unconnected `any` port is hidden

- **WHEN** a port with `type: 'any'` has no connections or dangling stubs referencing it
- **THEN** the port badge SHALL NOT be rendered (per unconnected port hiding rules)
