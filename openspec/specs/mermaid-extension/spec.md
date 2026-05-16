# Spec: Mermaid Extension

## Purpose

Defines how the patch diagram type integrates with the Mermaid diagramming library as a registered external diagram, including support for the ELK layout engine, the `mkdocs-material` documentation site generator, and Mermaid's built-in theme and color-palette configuration system.

## Requirements

### Requirement: Registered as a Mermaid external diagram

The package SHALL export a default value that conforms to Mermaid's `ExternalDiagramDefinition` interface, allowing it to be registered via `mermaid.registerExternalDiagrams([patch])` before calling `mermaid.initialize()`.

#### Scenario: Register and render via CDN

- **WHEN** a page imports the package from a CDN and calls `await mermaid.registerExternalDiagrams([patch])` followed by `mermaid.initialize({ startOnLoad: true })`
- **THEN** Mermaid SHALL detect all `<pre class="mermaid">` blocks whose text starts with `patch` and render them as patch diagrams

#### Scenario: Register and render via npm bundle

- **WHEN** the package is installed from npm and registered with `mermaid.registerExternalDiagrams([patch])`
- **THEN** `mermaid.render(id, diagramText)` SHALL resolve to an SVG string for any valid patch diagram text

---

### Requirement: ELK layout engine

The layout engine SHALL use ELK (Eclipse Layout Kernel) via `elkjs` for node placement and layering. ELK SHALL be bundled with the package so that consumers do not need to install it separately.

#### Scenario: ELK bundled in package output

- **WHEN** the package is built
- **THEN** the output bundle SHALL include `elkjs` so that no separate `elkjs` peer dependency is required from the consumer

#### Scenario: Layout uses NETWORK_SIMPLEX layering

- **WHEN** a patch diagram is rendered
- **THEN** the ELK graph SHALL be configured with `layering.strategy: NETWORK_SIMPLEX`

---

### Requirement: Usable in mkdocs-material via the Mermaid diagram component

Patch diagrams SHALL be renderable in documentation sites built with `mkdocs-material` using the built-in `pymdownx.superfences` Mermaid integration. A `docs/javascripts/mermaid-init.js` script loaded via `extra_javascript` in `mkdocs.yml` registers the extension before Mermaid initialises.

The init script SHALL call `mermaid.run()` explicitly (returning a Promise) rather than relying on `startOnLoad: true`, so that post-render processing can be triggered reliably after all diagrams are in the DOM.

#### Scenario: Mermaid fence block renders in mkdocs-material

- **WHEN** a markdown page contains a fenced code block tagged `mermaid` whose content begins with `patch`
- **AND** the `mkdocs-material` site includes a JavaScript file that registers the patch diagram extension
- **THEN** the rendered HTML page SHALL display the patch diagram SVG

#### Scenario: Dark theme auto-switches for mkdocs-material slate scheme

- **WHEN** the `mkdocs-material` site uses the `slate` color scheme (dark mode)
- **AND** the initialisation script passes `theme: 'dark'` to `mermaid.initialize()` when `document.documentElement.getAttribute('data-md-color-scheme') === 'slate'`
- **THEN** the diagram SHALL render using the dark color palette automatically
#### Scenario: Post-render processing runs after mermaid.run() resolves

- **WHEN** `mermaid.run()` resolves after rendering all diagrams on the page
- **THEN** any post-render DOM processing (such as wrapping diagrams and adding interactive controls) SHALL be able to execute against the fully rendered SVG elements
---

### Requirement: Mermaid theme integration for color palette

The renderer SHALL read color values from the resolved patch diagram configuration, which is derived by merging the package defaults with any overrides. The resolver SHALL apply a theme-specific built-in palette based on the Mermaid `theme` option:

- `'dark'` → apply the built-in dark palette (signal colours identical to default, node body light-grey with dark text, dark-grey canvas)
- `'neutral'` → apply the built-in neutral palette (grayscale signal colours, neutral chrome, light-grey canvas)
- Any other theme (including `'default'`) → use the default palette unchanged

After applying the theme palette, the resolver SHALL apply `themeVariables.background` (if set to a non-empty string) to override only the `background` key. Finally, any keys in the `patch` user config object SHALL be merged on top, taking highest precedence.

#### Scenario: Light theme uses default palette

- **WHEN** `mermaid.initialize({ theme: 'default' })` is called with no `patch` overrides
- **THEN** the renderer SHALL use the light-mode defaults (e.g. `audioColor: '#F07BAB'`, `background: '#f0ede8'`)

#### Scenario: Dark theme auto-applies dark palette

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called with no `patch` overrides
- **THEN** the renderer SHALL automatically apply the built-in dark palette: signal colours identical to default, `nodeBodyFill: '#e8e8e8'`, `nodeBodyText: '#111111'`, `background: '#1e1e2e'`

#### Scenario: Neutral theme auto-applies neutral palette

- **WHEN** `mermaid.initialize({ theme: 'neutral' })` is called with no `patch` overrides
- **THEN** the renderer SHALL apply the built-in neutral palette with grayscale signal colours and `background: '#f5f5f5'`

#### Scenario: Per-color override in light mode

- **WHEN** `mermaid.initialize({ patch: { audioColor: '#e05080' } })` is called
- **THEN** only `audioColor` SHALL be overridden; all other colors SHALL remain at their defaults

#### Scenario: User override takes precedence over theme palette

- **WHEN** `mermaid.initialize({ theme: 'dark', patch: { background: '#0d1117' } })` is called
- **THEN** `background` SHALL be `#0d1117`, overriding the dark palette default

#### Scenario: themeVariables.background applied after palette but before user override

- **WHEN** `mermaid.initialize({ theme: 'dark', themeVariables: { background: '#002b36' } })` is called with no `patch.background`
- **THEN** the canvas background SHALL be `#002b36`

---

### Requirement: Configuration via mermaid.initialize()

The package SHALL accept configuration under the `patch` key inside `mermaid.initialize()`. All configuration keys SHALL be optional and SHALL fall back to built-in defaults when omitted.

#### Scenario: No patch key uses all defaults

- **WHEN** `mermaid.initialize({ startOnLoad: true })` is called with no `patch` key
- **THEN** the diagram SHALL render with all built-in default colors and layout options

#### Scenario: Partial override merges with defaults

- **WHEN** `mermaid.initialize({ patch: { background: '#ffffff' } })` is called
- **THEN** `background` SHALL be `#ffffff` and all other options SHALL retain their defaults

#### Scenario: elk-optimized port placement (default)

- **WHEN** `portPlacement` is `'elk-optimized'` (the default)
- **THEN** after the first ELK layout pass, the renderer SHALL run a geometry pass that reassigns ports to top or bottom sides based on the Y-positions of their connected nodes, distributing ports across all four sides

#### Scenario: declaration port placement

- **WHEN** `mermaid.initialize({ patch: { portPlacement: 'declaration' } })` is called
- **THEN** output ports SHALL be assigned to the right side and input ports to the left side in module-declaration order, and no geometry reassignment pass SHALL be performed

#### Scenario: nodePlacementStrategy is configurable

- **WHEN** `mermaid.initialize({ patch: { nodePlacementStrategy: 'network-simplex' } })` is called
- **THEN** the ELK graph SHALL be configured with `elk.layered.nodePlacement.strategy: NETWORK_SIMPLEX`
