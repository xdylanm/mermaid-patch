## MODIFIED Requirements

### Requirement: Module Definition

A patchDiagram document SHALL support module definitions that declare reusable port templates. Each module MUST have a unique name and an optional list of typed ports. Modules are referenced by node definitions.

**Syntax:** `module <Name> { <portList> }`

Each port in the list is declared on its own line as `+<signalType> <portLabel>`.

- `<Name>` — identifier (`[A-Za-z_][A-Za-z0-9_]*`)
- `<signalType>` — identifier describing signal type (e.g. `audio`, `cv`, `gate`, `voct`, `any`)
- `<portLabel>` — one or more non-whitespace, non-bracket characters

The port list may be empty.

#### Scenario: Parse module with ports

- **WHEN** the diagram text contains:
  ```
  module VCA {
      +audio In
      +cv CV
      +audio Out
  }
  ```
- **THEN** the parser SHALL produce `{ type: 'module', name: 'VCA', ports: [{type:'audio', label:'In'}, {type:'cv', label:'CV'}, {type:'audio', label:'Out'}] }`

#### Scenario: Parse module with empty port list

- **WHEN** the diagram text contains `module Empty {}`
- **THEN** the parser SHALL produce `{ type: 'module', name: 'Empty', ports: [] }`

#### Scenario: Parse module with `any`-typed port

- **WHEN** the diagram text contains:
  ```
  module Mixer {
      +any In1
      +any In2
      +any Out
  }
  ```
- **THEN** the parser SHALL produce `{ type: 'module', name: 'Mixer', ports: [{type:'any', label:'In1'}, {type:'any', label:'In2'}, {type:'any', label:'Out'}] }`
