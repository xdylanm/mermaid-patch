## MODIFIED Requirements

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
