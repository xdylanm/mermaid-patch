# Spec: Theme Variables — Node Chrome

## Purpose

Defines how the standard Mermaid `themeVariables` keys (`primaryColor`, `primaryTextColor`, `primaryBorderColor`, `secondaryColor`, `secondaryTextColor`) are consumed to style node header and body colours, following the same three-tier precedence model as other theme variables.

## Requirements

### Requirement: Mermaid primaryColor theme variable sets the node header background

The renderer SHALL read `themeVariables.primaryColor` from the Mermaid config and use it as the node header (upper half) background colour. This SHALL take precedence over the built-in palette default but be overridden by an explicit `patch.nodeHeaderFill` user key. Each theme palette SHALL define an appropriate default.

#### Scenario: primaryColor sets node header background

- **WHEN** `mermaid.initialize({ themeVariables: { primaryColor: '#ff0000' } })` is called
- **THEN** the node header rectangle fill SHALL be `#ff0000`

#### Scenario: patch.nodeHeaderFill overrides primaryColor

- **WHEN** `mermaid.initialize({ themeVariables: { primaryColor: '#ff0000' }, patch: { nodeHeaderFill: '#00ff00' } })` is called
- **THEN** the node header fill SHALL be `#00ff00`

---

### Requirement: Mermaid primaryTextColor theme variable sets the node header text colour

The renderer SHALL read `themeVariables.primaryTextColor` from the Mermaid config and use it as the colour of the node name text in the header. This SHALL take precedence over the palette default but be overridden by `patch.nodeHeaderText`.

#### Scenario: primaryTextColor sets node name text colour

- **WHEN** `mermaid.initialize({ themeVariables: { primaryTextColor: '#ffff00' } })` is called
- **THEN** the node name text fill SHALL be `#ffff00`

---

### Requirement: Mermaid primaryBorderColor theme variable sets the node border colour

The renderer SHALL read `themeVariables.primaryBorderColor` from the Mermaid config and use it as the stroke colour for node block borders. This SHALL take precedence over the palette default but be overridden by `patch.nodeBorderColor`.

#### Scenario: primaryBorderColor sets node border stroke

- **WHEN** `mermaid.initialize({ themeVariables: { primaryBorderColor: '#aabbcc' } })` is called
- **THEN** all node rectangle strokes SHALL be `#aabbcc`

---

### Requirement: Mermaid secondaryColor theme variable sets the node body background

The renderer SHALL read `themeVariables.secondaryColor` from the Mermaid config and use it as the node body (lower half) background colour. This SHALL take precedence over the palette default but be overridden by `patch.nodeBodyFill`.

#### Scenario: secondaryColor sets node body fill

- **WHEN** `mermaid.initialize({ themeVariables: { secondaryColor: '#eeeeee' } })` is called
- **THEN** the node body rectangle fill SHALL be `#eeeeee`

---

### Requirement: Mermaid secondaryTextColor theme variable sets the node label text colour

The renderer SHALL read `themeVariables.secondaryTextColor` from the Mermaid config and use it as the text colour for the optional node label in the body. This SHALL take precedence over the palette default but be overridden by `patch.nodeBodyText`.

#### Scenario: secondaryTextColor sets node label text colour

- **WHEN** `mermaid.initialize({ themeVariables: { secondaryTextColor: '#444444' } })` is called
- **THEN** the node label text fill SHALL be `#444444`

---

### Requirement: Theme variable precedence for node chrome colours

All node chrome theme variables (`primaryColor`, `primaryTextColor`, `primaryBorderColor`, `secondaryColor`, `secondaryTextColor`) SHALL follow the same precedence order as `background`: palette default → themeVariable → explicit `patch.*` user key. Port badge fill colours and signal wire colours are NOT affected by these theme variables.

#### Scenario: themeVariables chrome wins over palette, loses to patch diagram key

- **WHEN** `mermaid.initialize({ theme: 'dark', themeVariables: { primaryColor: '#334455' }, patch: { nodeHeaderFill: '#aabbcc' } })` is called
- **THEN** node header fill SHALL be `#aabbcc` (patch diagram key wins)

#### Scenario: Port badge and signal colours are unaffected

- **WHEN** any combination of primaryColor, secondaryColor, or primaryBorderColor is set
- **THEN** port badge polygon fills and wire stroke colours SHALL be determined solely by signal type and the `patch.*Color` keys, unchanged
