## MODIFIED Requirements

### Requirement: Theme variable precedence for node chrome colours

All node chrome theme variables (`primaryColor`, `primaryTextColor`, `primaryBorderColor`, `secondaryTextColor`) SHALL follow the same precedence order: palette default → themeVariable → explicit `patch.*` user key.

- `primaryColor` → `nodeBgColor`
- `primaryTextColor` → `nodeNameColor`
- `primaryBorderColor` → `nodeBandDark`
- `secondaryTextColor` → `nodeLabelColor`

Port tab band colours and signal wire colours are NOT affected by these theme variables. Port tab colours are derived exclusively from the signal type's HSL formula (see `node-port-tab-style` spec).

#### Scenario: themeVariables chrome wins over palette, loses to patch diagram key

- **WHEN** `mermaid.initialize({ theme: 'dark', themeVariables: { primaryColor: '#334455' }, patch: { nodeBgColor: '#aabbcc' } })` is called
- **THEN** node background fill SHALL be `#aabbcc` (patch diagram key wins)

#### Scenario: Port tab and signal colours are unaffected by node chrome theme variables

- **WHEN** any combination of `primaryColor`, `primaryBorderColor`, or `secondaryTextColor` is set
- **THEN** port tab fills and wire stroke colours SHALL be determined solely by signal type and the HSL tab colour formula, unchanged
