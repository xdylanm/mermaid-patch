## MODIFIED Requirements

### Requirement: Port tab colours are derived from signal type HSL formula, not from themeVariables

Port tab band fills SHALL be determined exclusively by the signal type's HSL formula (hue H per signal type, S=100%, L∈{80, 60, 40, 20} for background through outermost band). No `themeVariables` key — including `secondaryColor` — SHALL affect port tab colouring. The `simplifiedTabs` flag (set to `true` by the neutral theme palette) is the only mechanism that alters tab colour derivation.

#### Scenario: Port tab colours are unaffected by themeVariables.secondaryColor

- **WHEN** `mermaid.initialize({ themeVariables: { secondaryColor: '#ff0000' } })` is called
- **THEN** port tab fills SHALL use the signal-type HSL formula as specified in the base spec, with no influence from `secondaryColor`

#### Scenario: Audio port tab background uses HSL(25, 100%, 80%) on default theme

- **WHEN** `mermaid.initialize({ theme: 'default' })` is called and a port with signal type `audio` is rendered
- **THEN** the tab background fill SHALL be `hsl(25, 100%, 80%)` regardless of any `themeVariables` set
