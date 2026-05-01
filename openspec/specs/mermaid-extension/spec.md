# Spec: Mermaid Extension

## Purpose

Defines how the Monotrail diagram type integrates with the Mermaid diagramming library as a registered external diagram, including support for the ELK layout engine, the `mkdocs-material` documentation site generator, and Mermaid's built-in theme and color-palette configuration system.

## Requirements

### Requirement: Registered as a Mermaid external diagram

The package SHALL export a default value that conforms to Mermaid's `ExternalDiagramDefinition` interface, allowing it to be registered via `mermaid.registerExternalDiagrams([monotrail])` before calling `mermaid.initialize()`.

#### Scenario: Register and render via CDN

- **WHEN** a page imports the package from a CDN and calls `await mermaid.registerExternalDiagrams([monotrail])` followed by `mermaid.initialize({ startOnLoad: true })`
- **THEN** Mermaid SHALL detect all `<pre class="mermaid">` blocks whose text starts with `monotrail` and render them as Monotrail patch diagrams

#### Scenario: Register and render via npm bundle

- **WHEN** the package is installed from npm and registered with `mermaid.registerExternalDiagrams([monotrail])`
- **THEN** `mermaid.render(id, diagramText)` SHALL resolve to an SVG string for any valid Monotrail diagram text

---

### Requirement: ELK layout engine

The layout engine SHALL use ELK (Eclipse Layout Kernel) via `elkjs` for node placement and layering. ELK SHALL be bundled with the package so that consumers do not need to install it separately.

#### Scenario: ELK bundled in package output

- **WHEN** the package is built
- **THEN** the output bundle SHALL include `elkjs` so that no separate `elkjs` peer dependency is required from the consumer

#### Scenario: Layout uses NETWORK_SIMPLEX layering

- **WHEN** a Monotrail diagram is rendered
- **THEN** the ELK graph SHALL be configured with `layering.strategy: NETWORK_SIMPLEX`

---

### Requirement: Usable in mkdocs-material via the Mermaid diagram component

Monotrail diagrams SHALL be renderable in documentation sites built with `mkdocs-material` using the built-in `pymdownx.superfences` Mermaid integration. A `docs/javascripts/mermaid-init.js` script loaded via `extra_javascript` in `mkdocs.yml` registers the extension before Mermaid initialises.

#### Scenario: Mermaid fence block renders in mkdocs-material

- **WHEN** a markdown page contains a fenced code block tagged `mermaid` whose content begins with `monotrail`
- **AND** the `mkdocs-material` site includes a JavaScript file that registers the Monotrail extension
- **THEN** the rendered HTML page SHALL display the Monotrail SVG diagram

#### Scenario: Dark theme auto-switches for mkdocs-material slate scheme

- **WHEN** the `mkdocs-material` site uses the `slate` color scheme (dark mode)
- **AND** the initialisation script passes `theme: 'dark'` to `mermaid.initialize()` when `document.documentElement.getAttribute('data-md-color-scheme') === 'slate'`
- **THEN** the diagram SHALL render using the dark color palette automatically

---

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

---

### Requirement: Configuration via mermaid.initialize()

The package SHALL accept configuration under the `monotrail` key inside `mermaid.initialize()`. All configuration keys SHALL be optional and SHALL fall back to built-in defaults when omitted.

#### Scenario: No monotrail key uses all defaults

- **WHEN** `mermaid.initialize({ startOnLoad: true })` is called with no `monotrail` key
- **THEN** the diagram SHALL render with all built-in default colors and layout options

#### Scenario: Partial override merges with defaults

- **WHEN** `mermaid.initialize({ monotrail: { background: '#ffffff' } })` is called
- **THEN** `background` SHALL be `#ffffff` and all other options SHALL retain their defaults

#### Scenario: elk-optimized port placement (default)

- **WHEN** `portPlacement` is `'elk-optimized'` (the default)
- **THEN** after the first ELK layout pass, the renderer SHALL run a geometry pass that reassigns ports to top or bottom sides based on the Y-positions of their connected nodes, distributing ports across all four sides

#### Scenario: declaration port placement

- **WHEN** `mermaid.initialize({ monotrail: { portPlacement: 'declaration' } })` is called
- **THEN** output ports SHALL be assigned to the right side and input ports to the left side in module-declaration order, and no geometry reassignment pass SHALL be performed

#### Scenario: nodePlacementStrategy is configurable

- **WHEN** `mermaid.initialize({ monotrail: { nodePlacementStrategy: 'network-simplex' } })` is called
- **THEN** the ELK graph SHALL be configured with `elk.layered.nodePlacement.strategy: NETWORK_SIMPLEX`
