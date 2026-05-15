## MODIFIED Requirements

### Requirement: Neutral theme canvas uses a white background

When the Mermaid `theme` is `'neutral'`, the SVG canvas background colour SHALL be `#ffffff` (pure white). The documentation SHALL reflect `#ffffff`, not `#f5f5f5` or any other light grey value.

#### Scenario: Neutral theme default canvas background is white

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called with no `patch.background` or `themeVariables.background` override
- **THEN** `background` SHALL be `#ffffff`
