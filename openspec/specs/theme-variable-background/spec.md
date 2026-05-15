# Spec: Theme Variable — Background

## Purpose

Defines how the `themeVariables.background` Mermaid config key is consumed to set the SVG canvas background colour, and how it fits into the three-tier precedence model (palette default → themeVariables → patch user key).

## Requirements

### Requirement: themeVariables.background is used as the canvas background colour on non-default themes

The renderer SHALL read the `background` key from the Mermaid `themeVariables` config object and apply it as the SVG canvas background colour **only when a non-default theme is active** (`dark` or `neutral`). Mermaid auto-populates `themeVariables` (including `background`) even for `theme: 'default'`, so for the default theme the palette value is always used unless explicitly overridden via `patch.background`. This value SHALL be overridden by an explicit `patch.background` user key.

#### Scenario: themeVariables.background sets the canvas colour on dark theme

- **WHEN** `mermaid.initialize({ theme: 'dark', themeVariables: { background: '#002b36' } })` is called with no `patch.background` key
- **THEN** the SVG canvas SHALL render with background colour `#002b36`

#### Scenario: Explicit patch.background wins over themeVariables.background

- **WHEN** `mermaid.initialize({ themeVariables: { background: '#fdf6e3' }, patch: { background: '#ffffff' } })` is called
- **THEN** the SVG canvas SHALL render with background colour `#ffffff`

#### Scenario: themeVariables.background wins over palette default on non-default theme

- **WHEN** `mermaid.initialize({ theme: 'dark', themeVariables: { background: '#002b36' } })` is called with no `patch.background` key
- **THEN** the SVG canvas SHALL render with background colour `#002b36`, not the dark palette default

#### Scenario: Missing themeVariables.background falls back to palette default

- **WHEN** `mermaid.initialize({ theme: 'default' })` is called with no `themeVariables.background` and no `patch.background`
- **THEN** the SVG canvas SHALL render with the default palette background colour `hsl(50, 100%, 95%)`

#### Scenario: Default theme ignores themeVariables.background auto-population

- **WHEN** `mermaid.initialize({ theme: 'default' })` is called (Mermaid auto-sets `themeVariables.background`) with no `patch.background`
- **THEN** the SVG canvas SHALL render with the palette default `hsl(50, 100%, 95%)`, not Mermaid's auto-populated value

#### Scenario: Non-string themeVariables.background is ignored

- **WHEN** `mermaid.initialize({ themeVariables: { background: null } })` is called
- **THEN** the renderer SHALL ignore the value and use the palette default background colour
