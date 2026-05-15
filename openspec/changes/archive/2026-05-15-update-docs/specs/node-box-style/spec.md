## MODIFIED Requirements

### Requirement: themeVariables node chrome variables map to banded-frame palette colours

The standard Mermaid `themeVariables` keys for node chrome SHALL map to the banded-frame palette as follows (precedence: palette default → themeVariable → explicit `patch.*`):

- `primaryColor` → `nodeBgColor` (node background fill, the L=80-equivalent central region)
- `primaryTextColor` → `nodeNameColor` (module name text colour)
- `primaryBorderColor` → `nodeBandDark` (outermost / darkest band pair fill)
- `secondaryTextColor` → `nodeLabelColor` (optional module label text colour)

The legacy `secondaryColor` → port area background mapping is REMOVED. Port tab colours are derived exclusively from the signal type's HSL formula (see `node-port-tab-style` spec) and are NOT affected by any `themeVariables` key.

#### Scenario: primaryColor sets the node background fill

- **WHEN** `mermaid.initialize({ themeVariables: { primaryColor: '#d4d4d4' } })` is called
- **THEN** the node background rectangle fill SHALL be `#d4d4d4`

#### Scenario: primaryBorderColor sets the outermost band colour

- **WHEN** `mermaid.initialize({ themeVariables: { primaryBorderColor: '#1a1a1a' } })` is called
- **THEN** the outermost band pair (r-path and l-path) fill SHALL be `#1a1a1a`

#### Scenario: secondaryColor is ignored for port tab colouring

- **WHEN** `mermaid.initialize({ themeVariables: { secondaryColor: '#abcdef' } })` is called
- **THEN** port tab fills SHALL be determined solely by signal type and the HSL tab colour formula, unaffected by `secondaryColor`
