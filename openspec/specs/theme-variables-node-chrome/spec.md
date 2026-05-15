# Spec: Theme Variables — Node Chrome

## Purpose

Defines how the standard Mermaid `themeVariables` keys (`primaryColor`, `primaryTextColor`, `primaryBorderColor`, `secondaryTextColor`) are consumed to style node chrome colours (background, bands, and text), following the same three-tier precedence model as other theme variables.

## Requirements

### Requirement: Mermaid primaryColor theme variable sets the node background colour

The renderer SHALL read `themeVariables.primaryColor` from the Mermaid config and use it as the node background fill (`nodeBgColor`, the L=80 background visible in the centre of the box). This SHALL take precedence over the built-in palette default but be overridden by an explicit `patch.nodeBgColor` user key.

#### Scenario: primaryColor sets node background fill

- **WHEN** `mermaid.initialize({ themeVariables: { primaryColor: '#d4d4d4' } })` is called
- **THEN** the node background rectangle fill SHALL be `#d4d4d4`

#### Scenario: patch.nodeBgColor overrides primaryColor

- **WHEN** `mermaid.initialize({ themeVariables: { primaryColor: '#d4d4d4' }, patch: { nodeBgColor: '#e8e8e8' } })` is called
- **THEN** the node background fill SHALL be `#e8e8e8`

---

### Requirement: Mermaid primaryTextColor theme variable sets the node name text colour

The renderer SHALL read `themeVariables.primaryTextColor` from the Mermaid config and use it as the colour of the node name text. This SHALL take precedence over the palette default but be overridden by `patch.nodeNameColor`.

#### Scenario: primaryTextColor sets node name text colour

- **WHEN** `mermaid.initialize({ themeVariables: { primaryTextColor: '#ffff00' } })` is called
- **THEN** the node name text fill SHALL be `#ffff00`

#### Scenario: patch.nodeNameColor overrides primaryTextColor

- **WHEN** `mermaid.initialize({ themeVariables: { primaryTextColor: '#ffff00' }, patch: { nodeNameColor: '#ffffff' } })` is called
- **THEN** the node name text fill SHALL be `#ffffff`

---

### Requirement: Mermaid primaryBorderColor theme variable sets the outermost band colour

The renderer SHALL read `themeVariables.primaryBorderColor` from the Mermaid config and use it as the `nodeBandDark` value (the outermost, darkest band pair). This SHALL take precedence over the palette default but be overridden by `patch.nodeBandDark`.

#### Scenario: primaryBorderColor sets outermost band fill

- **WHEN** `mermaid.initialize({ themeVariables: { primaryBorderColor: '#1a1a1a' } })` is called
- **THEN** the outermost band pair (r-path and l-path) fill SHALL be `#1a1a1a`

#### Scenario: patch.nodeBandDark overrides primaryBorderColor

- **WHEN** `mermaid.initialize({ themeVariables: { primaryBorderColor: '#1a1a1a' }, patch: { nodeBandDark: '#0a0a0a' } })` is called
- **THEN** the outermost band fill SHALL be `#0a0a0a`

---

### Requirement: Mermaid secondaryTextColor theme variable sets the node label text colour

The renderer SHALL read `themeVariables.secondaryTextColor` from the Mermaid config and use it as the colour of the optional node label text. This SHALL take precedence over the palette default but be overridden by `patch.nodeLabelColor`.

#### Scenario: secondaryTextColor sets node label text colour

- **WHEN** `mermaid.initialize({ themeVariables: { secondaryTextColor: '#444444' } })` is called
- **THEN** the node label text fill SHALL be `#444444`

#### Scenario: patch.nodeLabelColor overrides secondaryTextColor

- **WHEN** `mermaid.initialize({ themeVariables: { secondaryTextColor: '#444444' }, patch: { nodeLabelColor: '#222222' } })` is called
- **THEN** the node label text fill SHALL be `#222222`

---

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
