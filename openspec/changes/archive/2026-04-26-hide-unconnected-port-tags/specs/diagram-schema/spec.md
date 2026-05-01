## ADDED Requirements

### Requirement: Port rendering limited to connected ports

The renderer SHALL only produce a visual port badge for a port that is referenced by at least one connection (full wire or dangling stub) in the diagram. Ports declared in a module definition but not referenced in any connection of the current diagram SHALL NOT appear in the rendered output.

#### Scenario: Declared-but-unused port omitted from render

- **WHEN** a module definition declares a port that no connection or dangling stub references on a given node instance
- **THEN** the rendered diagram SHALL NOT include a port badge for that port on that node
