# Spec: Theme Variable — Background

## Purpose

Defines how the `themeVariables.background` Mermaid config key is consumed to set the SVG canvas background colour, and how it fits into the three-tier precedence model (palette default → themeVariables → patch user key).

## Requirements

### Requirement: themeVariables.background is used as the canvas background colour

The renderer SHALL read the `background` key from the Mermaid `themeVariables` config object and apply it as the SVG canvas background colour. This value SHALL take precedence over the built-in palette default but SHALL be overridden by an explicit `patch.background` user key.

#### Scenario: themeVariables.background sets the canvas colour

- **WHEN** `mermaid.initialize({ themeVariables: { background: '#fdf6e3' } })` is called with no `patch.background` key
- **THEN** the SVG canvas SHALL render with background colour `#fdf6e3`

#### Scenario: Explicit patch.background wins over themeVariables.background

- **WHEN** `mermaid.initialize({ themeVariables: { background: '#fdf6e3' }, patch: { background: '#ffffff' } })` is called
- **THEN** the SVG canvas SHALL render with background colour `#ffffff`

#### Scenario: themeVariables.background wins over palette default

- **WHEN** `mermaid.initialize({ theme: 'dark', themeVariables: { background: '#002b36' } })` is called with no `patch.background` key
- **THEN** the SVG canvas SHALL render with background colour `#002b36`, not the dark palette default

#### Scenario: Missing themeVariables.background falls back to palette default

- **WHEN** `mermaid.initialize({ theme: 'default' })` is called with no `themeVariables.background` and no `patch.background`
- **THEN** the SVG canvas SHALL render with the default palette background colour `#f0ede8`

#### Scenario: Non-string themeVariables.background is ignored

- **WHEN** `mermaid.initialize({ themeVariables: { background: null } })` is called
- **THEN** the renderer SHALL ignore the value and use the palette default background colour
