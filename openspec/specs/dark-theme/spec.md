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

### Requirement: Dark theme node box uses a dark banded-frame palette

When the Mermaid `theme` is `'dark'`, the node box SHALL use the banded-frame dark palette. The node background fill (`nodeBgColor`) SHALL be `#2a2a2a` (near-black), with three band pairs in ascending luminance: inner band (`nodeBandLight`) `#3c3c3c`, middle band (`nodeBandMid`) `#555555`, outer band (`nodeBandDark`) `#6e6e6e`. Node name text (`nodeNameColor`) SHALL be `#eeeeee` and node label text (`nodeLabelColor`) SHALL be `#cccccc`. The previous two-tone header/body split (`nodeBodyFill`, `nodeHeaderFill`) is eliminated.

#### Scenario: Dark theme node background fill is near-black

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** the node background rectangle fill SHALL be `#2a2a2a`

#### Scenario: Dark theme band colours form a dark greyscale gradient

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** `nodeBandLight` SHALL be `#3c3c3c`, `nodeBandMid` SHALL be `#555555`, `nodeBandDark` SHALL be `#6e6e6e`

#### Scenario: Dark theme node name text is near-white

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** the node name text fill SHALL be `#eeeeee`

#### Scenario: Dark theme signal colours match the default palette

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** `audioColor`, `cvColor`, `voctColor`, `gateColor`, `anyColor`, and `defaultColor` SHALL be identical to the `DEFAULT_CONFIG` values (dark theme does not change signal wire colours)

---

### Requirement: Dark theme canvas uses a dark-grey background

When the Mermaid `theme` is `'dark'`, the SVG canvas background colour SHALL be dark grey by default.

#### Scenario: Dark theme default canvas background

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called with no `patch.background` or `themeVariables.background` override
- **THEN** `background` SHALL be `#1e1e2e`

#### Scenario: User background override respected in dark theme

- **WHEN** `mermaid.initialize({ theme: 'dark', patch: { background: '#0d1117' } })` is called
- **THEN** the canvas SHALL render with background `#0d1117`
