## ADDED Requirements

### Requirement: fontFamily theme variable applies to all rendered text

The renderer SHALL read `themeVariables.fontFamily` from the Mermaid config and apply it as the font family for all SVG text elements, including node names, node labels, port badge labels, connection labels, and dangling stub labels. The default SHALL be `'Arial, sans-serif'`.

#### Scenario: Custom fontFamily applies to node name

- **WHEN** `mermaid.initialize({ themeVariables: { fontFamily: 'monospace' } })` is called
- **THEN** the node name text element SHALL have `font-family: 'monospace'`

#### Scenario: Custom fontFamily applies to port badge labels

- **WHEN** `mermaid.initialize({ themeVariables: { fontFamily: 'Georgia, serif' } })` is called
- **THEN** all port badge label text elements SHALL have `font-family: 'Georgia, serif'`

#### Scenario: Custom fontFamily applies to connection labels

- **WHEN** `mermaid.initialize({ themeVariables: { fontFamily: 'monospace' } })` is called
- **THEN** connection label and dangling stub label text elements SHALL have `font-family: 'monospace'`

#### Scenario: Default fontFamily is Arial

- **WHEN** no `themeVariables.fontFamily` is set
- **THEN** all text elements SHALL use `font-family: 'Arial, sans-serif'`

#### Scenario: Explicit monotrail.fontFamily overrides themeVariables.fontFamily

- **WHEN** `mermaid.initialize({ themeVariables: { fontFamily: 'monospace' }, monotrail: { fontFamily: 'serif' } })` is called
- **THEN** all text elements SHALL use `font-family: 'serif'`

---

### Requirement: fontSize theme variable sets the base text size

The renderer SHALL read `themeVariables.fontSize` from the Mermaid config and use it as the base font size for node name and node label text. Other text sizes SHALL be derived from this base:

- Port badge labels and stub labels: `max(10, fontSize - 3)`
- Connection (edge mid) labels: `max(10, fontSize - 5)`

The default base `fontSize` SHALL be `18` (matching the current hardcoded values).

#### Scenario: Custom fontSize applies to node name

- **WHEN** `mermaid.initialize({ themeVariables: { fontSize: '20px' } })` is called
- **THEN** the node name text element SHALL have `font-size` equal to the numeric value `20`

#### Scenario: Derived sizes scale with fontSize

- **WHEN** `fontSize` resolves to `20`
- **THEN** port badge label font-size SHALL be `17` (`max(10, 20 - 3)`) and edge label font-size SHALL be `15` (`max(10, 20 - 5)`)

#### Scenario: fontSize has a minimum floor of 10 for derived sizes

- **WHEN** `fontSize` resolves to `12`
- **THEN** edge label font-size SHALL be `10` (clamped: `max(10, 12 - 5) = 10`)

#### Scenario: Default fontSize is 18

- **WHEN** no `themeVariables.fontSize` is set
- **THEN** node name font-size SHALL be `18`, port badge font-size SHALL be `15`, edge label font-size SHALL be `13`

#### Scenario: Explicit monotrail.fontSize overrides themeVariables.fontSize

- **WHEN** `mermaid.initialize({ themeVariables: { fontSize: '16px' }, monotrail: { fontSize: 22 } })` is called
- **THEN** node name font-size SHALL be `22`
