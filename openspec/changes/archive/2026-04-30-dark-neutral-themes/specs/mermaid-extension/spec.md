## MODIFIED Requirements

### Requirement: Mermaid theme integration for color palette

The renderer SHALL read color values from the resolved Monotrail configuration, which is derived by merging the package defaults with any overrides. The resolver SHALL apply a theme-specific built-in palette based on the Mermaid `theme` option:

- `'dark'` → apply the built-in dark palette (signal colours identical to default, node body light-grey with dark text, dark-grey canvas)
- `'neutral'` → apply the built-in neutral palette (grayscale signal colours, neutral chrome, light-grey canvas)
- Any other theme (including `'default'`) → use the default palette unchanged

After applying the theme palette, the resolver SHALL apply `themeVariables.background` (if set to a non-empty string) to override only the `background` key. Finally, any keys in the `monotrail` user config object SHALL be merged on top, taking highest precedence.

#### Scenario: Light theme uses default palette

- **WHEN** `mermaid.initialize({ theme: 'default' })` is called with no `monotrail` overrides
- **THEN** the renderer SHALL use the light-mode defaults (e.g. `audioColor: '#F07BAB'`, `background: '#f0ede8'`)

#### Scenario: Dark theme auto-applies dark palette

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called with no `monotrail` overrides
- **THEN** the renderer SHALL automatically apply the built-in dark palette: signal colours identical to default, `nodeBodyFill: '#e8e8e8'`, `nodeBodyText: '#111111'`, `background: '#1e1e2e'`

#### Scenario: Neutral theme auto-applies neutral palette

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called with no `monotrail` overrides
- **THEN** the renderer SHALL apply the built-in neutral palette with grayscale signal colours and `background: '#f5f5f5'`

#### Scenario: Per-color override in light mode

- **WHEN** `mermaid.initialize({ monotrail: { audioColor: '#e05080' } })` is called
- **THEN** only `audioColor` SHALL be overridden; all other colors SHALL remain at their defaults

#### Scenario: User override takes precedence over theme palette

- **WHEN** `mermaid.initialize({ theme: 'dark', monotrail: { background: '#0d1117' } })` is called
- **THEN** `background` SHALL be `#0d1117`, overriding the dark palette default

#### Scenario: themeVariables.background applied after palette but before user override

- **WHEN** `mermaid.initialize({ theme: 'dark', themeVariables: { background: '#002b36' } })` is called with no `monotrail.background`
- **THEN** the canvas background SHALL be `#002b36`
