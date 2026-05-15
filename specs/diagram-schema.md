# Spec: patch diagram Schema

## Purpose

Defines the text syntax (schema) for the patch diagram type — a domain-specific diagram language that extends Mermaid conventions to describe modular signal-flow graphs, such as synthesizer patch bays. A diagram describes modules (reusable port templates), node instances of those modules, and the connections (wires) between ports.

Every patch diagram begins with the keyword `patch diagram` on the first line.

## Statement Types

A patch diagram document is a sequence of newline-separated statements. Blank lines and leading/trailing whitespace are ignored. There are five statement types: module definitions, node definitions, full connections, labeled dangling-from stubs, and labeled dangling-to stubs.

---

## Requirements

### Requirement: Module Definition

A patch diagram document SHALL support module definitions that declare reusable port templates. Each module MUST have a unique name and an optional list of typed ports. Modules are referenced by node definitions.

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

---

### Requirement: Node Definition

A patch diagram document SHALL support node definitions that instantiate a module and assign it a unique local identifier. A node MAY include an optional display label in bracket-quote syntax.

**Syntax:** `<ModuleName> <nodeName>` or `<ModuleName> <nodeName>["<label>"]`

- `<ModuleName>` — must match a declared module name
- `<nodeName>` — unique identifier used to reference this instance in connections
- `<label>` — optional display string; any character except `"` and `]`

#### Scenario: Parse unlabeled node
- **WHEN** the diagram text contains `VCA vca1`
- **THEN** the parser SHALL produce `{ type: 'node', function: 'VCA', name: 'vca1', label: null }`

#### Scenario: Parse labeled node
- **WHEN** the diagram text contains `Oscillator osc1["Waveshape"]`
- **THEN** the parser SHALL produce `{ type: 'node', function: 'Oscillator', name: 'osc1', label: 'Waveshape' }`

---

### Requirement: Full Connection

A patch diagram document SHALL support full connections that route a wire from one node's port to another node's port. Ports MUST be referenced by the node identifier and port label separated by `:`. A connection MAY include an optional inline label using Mermaid pipe syntax.

**Syntax (unlabeled):** `<from>:<fromPort> --> <to>:<toPort>`

**Syntax (labeled):** `<from>:<fromPort> -->|<label>| <to>:<toPort>`

Port specifiers are required.

#### Scenario: Parse unlabeled full connection
- **WHEN** the diagram text contains `osc1:Out --> vca1:In`
- **THEN** the parser SHALL produce `{ type: 'connection', from: 'osc1', fromPort: 'Out', to: 'vca1', toPort: 'In', label: null (or absent) }`

#### Scenario: Parse labeled full connection
- **WHEN** the diagram text contains `env1:decay -->|env mod| vca1:CV`
- **THEN** the parser SHALL produce `{ type: 'connection', from: 'env1', fromPort: 'decay', label: 'env mod', to: 'vca1', toPort: 'CV' }`

---

### Requirement: Dangling-From Stub

A patch diagram document SHALL support dangling-from stubs representing a wire originating from a source port with no declared destination. The renderer MUST draw a short stub arrow extending from the source port badge with the label at the open end.

**Syntax:** `<from>:<fromPort> -->|<label>|`

#### Scenario: Parse dangling-from stub
- **WHEN** the diagram text contains `vca1:Out -->|Out|`
- **THEN** the parser SHALL produce `{ type: 'dangling', direction: 'from', from: 'vca1', fromPort: 'Out', label: 'Out' }`

#### Scenario: Parse dangling-from with multi-word label
- **WHEN** the diagram text contains `vca1:Out -->|audio out|`
- **THEN** the parser SHALL produce `{ type: 'dangling', direction: 'from', from: 'vca1', fromPort: 'Out', label: 'audio out' }`

---

### Requirement: Dangling-To Stub

A patch diagram document SHALL support dangling-to stubs representing a wire arriving at a destination port with no declared source. The renderer MUST draw a short stub arrow pointing toward the destination port badge with the label at the open end.

**Syntax:** `-->|<label>| <to>:<toPort>`

#### Scenario: Parse dangling-to stub
- **WHEN** the diagram text contains `-->|MIDI| sq1:sync`
- **THEN** the parser SHALL produce `{ type: 'dangling', direction: 'to', label: 'MIDI', to: 'sq1', toPort: 'sync' }`

---

### Requirement: Port Label Case-Insensitive Resolution

Port labels in connections SHALL be matched case-insensitively against the module definition. The renderer MUST use the canonical casing from the module definition for rendering and layout.

#### Scenario: Case-insensitive port lookup
- **WHEN** a module declares `+voct V/oct` and a connection references `:V/Oct`
- **THEN** the renderer SHALL resolve the port to the canonical label `V/oct` from the module definition

---

### Requirement: Signal Type Coloring

Each port SHALL carry a signal type declared in its module definition. The renderer MUST use that signal type to determine the color of port badges and connector wires.

| Signal type | Default color |
|-------------|--------------|
| `audio`     | `#F07BAB`    |
| `cv`        | `#51A4DB`    |
| `voct`      | `#8BC640`    |
| `gate`      | `#F9AF3C`    |

Colors are configurable — see [config.md](config.md).

#### Scenario: Audio port color
- **WHEN** a port has type `audio`
- **THEN** the renderer SHALL color its badge and connected wires with `audioColor` from config (default `#F07BAB`)

#### Scenario: CV port color
- **WHEN** a port has type `cv`
- **THEN** the renderer SHALL color its badge and connected wires with `cvColor` from config (default `#51A4DB`)

---

### Requirement: Port Side Assignment

The renderer SHALL assign each port to a side of its node box (left, right, top, bottom) based on whether the port appears as a source, destination, or both across all connections.

- Ports used only as **outputs** (source) are assigned starting from the right side.
- Ports used only as **inputs** (destination) are assigned starting from the left side.
- Ports that are both input and output default to the output preference.
- Side preference order: outputs → right, bottom, top, left; inputs → left, top, bottom, right.

#### Scenario: Output port on right side
- **WHEN** a port only appears as `fromPort` across all connections
- **THEN** the renderer SHALL assign it to the right side of the node box

#### Scenario: Input port on left side
- **WHEN** a port only appears as `toPort` across all connections
- **THEN** the renderer SHALL assign it to the left side of the node box

---

### Requirement: Port rendering limited to connected ports

The renderer SHALL only produce a visual port badge for a port that is referenced by at least one connection (full wire or dangling stub) in the diagram. Ports declared in a module definition but not referenced in any connection of the current diagram SHALL NOT appear in the rendered output.

#### Scenario: Declared-but-unused port omitted from render
- **WHEN** a module definition declares a port that no connection or dangling stub references on a given node instance
- **THEN** the rendered diagram SHALL NOT include a port badge for that port on that node

---

## Key Scenarios: Full Diagram Examples

### Scenario: Simple two-node patch

```
patch diagram
module Oscillator {
    +voct V/oct
    +audio Out
}
module VCA {
    +audio In
    +cv CV
    +audio Out
}

Oscillator osc1
VCA vca1

osc1:Out --> vca1:In
vca1:Out -->|Out|
```

### Scenario: Diagram with dangling-to, labeled connections, and multiple modules

```
patch diagram
module Sequencer {
    +gate sync
    +voct pitch
    +gate gate
}
module VCO {
    +voct V/oct
    +audio tri
}
module VCF {
    +audio In
    +cv freq
    +audio LP
}

Sequencer seq1
VCO osc1
VCF lpf1

--> |MIDI clock| seq1:sync
seq1:pitch --> osc1:V/oct
osc1:tri --> lpf1:In
seq1:gate -->|gate| lpf1:freq
lpf1:LP -->|Out|
```
