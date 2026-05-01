## ADDED Requirements

### Requirement: Neutral theme palette is applied when Mermaid theme is neutral

When the Mermaid `theme` option is set to `'neutral'`, the renderer SHALL apply a built-in neutral palette consisting of grayscale signal colours, neutral node chrome, and a light-grey canvas background. The default palette SHALL remain unchanged.

#### Scenario: Neutral theme applies grayscale signal colours

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called
- **THEN** the renderer SHALL apply grayscale signal colour defaults: `audioColor: '#a0a0a0'`, `cvColor: '#888888'`, `voctColor: '#b0b0b0'`, `gateColor: '#c8c8c8'`

#### Scenario: Neutral theme applies light-grey canvas background

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called with no `monotrail.background` override
- **THEN** the diagram canvas SHALL render with background colour `#f5f5f5`

#### Scenario: Neutral theme node chrome uses neutral greys

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called
- **THEN** `nodeHeaderFill` SHALL be `#f0f0f0`, `nodeHeaderText` SHALL be `#222222`, `nodeBodyFill` SHALL be `#d0d0d0`, `nodeBodyText` SHALL be `#333333`, `nodeBorderColor` SHALL be `#999999`

#### Scenario: User overrides apply on top of neutral palette

- **WHEN** `mermaid.initialize({ theme: 'neutral', monotrail: { audioColor: '#ff0000' } })` is called
- **THEN** `audioColor` SHALL be `#ff0000` and all other keys SHALL use the neutral palette defaults

#### Scenario: Default theme is unaffected

- **WHEN** `mermaid.initialize({ theme: 'default' })` is called
- **THEN** the renderer SHALL use the original default palette with no changes
