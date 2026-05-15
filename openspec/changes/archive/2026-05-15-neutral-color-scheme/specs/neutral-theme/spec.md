## MODIFIED Requirements

### Requirement: Neutral theme palette is applied when Mermaid theme is neutral

When the Mermaid `theme` option is set to `'neutral'`, the renderer SHALL apply a built-in neutral palette designed for clean, print-ready output: uniform dark-grey signal colours, simplified node chrome with very light grey backgrounds and a single dark outer band, and a white canvas background. The default palette SHALL remain unchanged.

#### Scenario: Neutral theme applies uniform dark-grey signal colours

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called
- **THEN** the renderer SHALL apply identical dark-grey signal colour values for all types: `audioColor`, `cvColor`, `voctColor`, `gateColor`, `anyColor`, and `defaultColor` SHALL all be `hsl(0,0%,20%)`

#### Scenario: Neutral theme applies white canvas background

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called with no `patch.background` override
- **THEN** the diagram canvas SHALL render with background colour `#ffffff`

#### Scenario: Neutral theme node box uses very light grey background and dark outer band only

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called
- **THEN** `nodeBgColor` SHALL be `hsl(0,0%,95%)`, `nodeBandDark` SHALL be `hsl(0,0%,20%)`, and `nodeBandLight` and `nodeBandMid` SHALL equal `nodeBgColor` so that only the outermost band is visually distinct

#### Scenario: User overrides apply on top of neutral palette

- **WHEN** `mermaid.initialize({ theme: 'neutral', patch: { background: '#f0f0f0' } })` is called
- **THEN** `background` SHALL be `#f0f0f0` and all other keys SHALL use the neutral palette defaults

#### Scenario: Default theme is unaffected

- **WHEN** `mermaid.initialize({ theme: 'default' })` is called
- **THEN** the renderer SHALL use the original default palette with no changes

## ADDED Requirements

### Requirement: Neutral theme port tabs use simplified single-band rendering

When the Mermaid `theme` is `'neutral'`, port tabs SHALL suppress signal-type-derived HSL colouring and instead render using node chrome colours: very light grey background and inner bands, and a dark-grey outer band. This is controlled by the `simplifiedTabs` flag in `PatchConfig`, which the neutral theme sets to `true`.

#### Scenario: Neutral theme port tab outer band is dark grey

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called and a port tab is rendered for any signal type
- **THEN** the tab's outer band fill SHALL be `hsl(0,0%,20%)` (matching `nodeBandDark`)

#### Scenario: Neutral theme port tab background is very light grey

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called and a port tab is rendered
- **THEN** the tab background fill and inner band fills SHALL be `hsl(0,0%,95%)` (matching `nodeBgColor`), producing a single-band visual appearance

#### Scenario: Neutral theme port tab label uses dark grey text

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called and a port tab is rendered
- **THEN** the tab label text SHALL be coloured `hsl(0,0%,20%)` (matching `nodeBandDark`)

#### Scenario: Default theme port tabs retain signal-type HSL colouring

- **WHEN** `mermaid.initialize({ theme: 'default' })` is called
- **THEN** `simplifiedTabs` SHALL be `false` and port tabs SHALL use the full signal-type HSL band palette (L=80, 60, 40, 20 per hue)
