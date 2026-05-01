# Spec: Unconnected Port Hiding

## Purpose

Defines the requirement that port badges are only rendered for ports that have at least one connection (full wire or dangling stub). Module definitions may declare more ports than a given diagram uses; those unused ports SHALL be excluded from both layout and visual rendering.

## Requirements

### Requirement: Render only connected ports

The renderer SHALL include a port badge on a node only when that port label appears in at least one connection or dangling stub referencing that node in the same diagram. Ports declared in the module definition but not referenced by any connection or dangling stub SHALL be omitted from the rendered diagram and from ELK layout.

#### Scenario: Unused declared ports are hidden

- **WHEN** a module declares ports `[In, CV, Out]` and a node instance of that module has only `Out` referenced in a connection
- **THEN** the renderer SHALL draw only the `Out` port badge on that node; `In` and `CV` SHALL NOT appear

#### Scenario: All ports connected are rendered

- **WHEN** all ports declared by a module are referenced by at least one connection or dangling stub on a node instance
- **THEN** all port badges SHALL be rendered as normal with no change in appearance

#### Scenario: Dangling stub counts as a connection

- **WHEN** a port label appears only in a dangling stub (e.g., `nodeA:Out -->|label|`) and not in a full wire
- **THEN** that port badge SHALL still be rendered on the node (it has a connection)

#### Scenario: Node with no connections renders no port badges

- **WHEN** a node instance has no connections or dangling stubs referencing any of its ports
- **THEN** the node SHALL render with no port badges
