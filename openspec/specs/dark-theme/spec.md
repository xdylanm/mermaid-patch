# Spec: Dark Theme

## Purpose

Defines the built-in dark palette that is applied automatically when Mermaid's `theme` option is set to `'dark'`. Covers signal colours, node chrome, and canvas background behaviour.

## Requirements

### Requirement: Dark theme signal colours match the default palette

When the Mermaid `theme` option is set to `'dark'`, the signal colours used for port badges and wires SHALL be identical to the default (light) palette values. The dark theme SHALL NOT alter `audioColor`, `cvColor`, `voctColor`, or `gateColor` from their default values.

#### Scenario: Dark theme audio colour matches default

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** `audioColor` SHALL be `#F07BAB` (same as default)

#### Scenario: Dark theme CV colour matches default

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** `cvColor` SHALL be `#51A4DB` (same as default)

---

### Requirement: Dark theme node body renders dark text on light-grey background

When the Mermaid `theme` is `'dark'`, the lower half (body) of each node block SHALL use a light-grey fill with dark text, while the header retains dark chrome. This preserves the two-tone block appearance against a dark canvas.

#### Scenario: Dark theme node body fill is light grey

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** `nodeBodyFill` SHALL be `#e8e8e8` and `nodeBodyText` SHALL be `#111111`

#### Scenario: Dark theme node header remains dark

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** `nodeHeaderFill` SHALL be a dark colour and `nodeHeaderText` SHALL be a light colour

---

### Requirement: Dark theme canvas uses a dark-grey background

When the Mermaid `theme` is `'dark'`, the SVG canvas background colour SHALL be dark grey by default.

#### Scenario: Dark theme default canvas background

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called with no `monotrail.background` or `themeVariables.background` override
- **THEN** `background` SHALL be `#1e1e2e`

#### Scenario: User background override respected in dark theme

- **WHEN** `mermaid.initialize({ theme: 'dark', monotrail: { background: '#0d1117' } })` is called
- **THEN** the canvas SHALL render with background `#0d1117`
