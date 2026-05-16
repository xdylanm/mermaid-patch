## Why

Patch diagrams rendered on a Material MkDocs site overflow the content column for anything more than two nodes wide, with no way to see the full diagram. Readers need diagrams that scale to fit the available width and can be expanded to their natural size for detailed inspection.

## What Changes

- Add a CSS file (`docs/stylesheets/patch-diagrams.css`) that scales rendered patch SVGs to fit the content column, with a minimum width floor of 480px
- Add post-render JS logic to `docs/javascripts/mermaid-init.js` that wraps each patch SVG with a container and injects a small expand button
- Implement a lightbox that opens on expand-button click, showing the diagram at its natural pixel size in a scrollable overlay
- Switch `mermaid-init.js` from `startOnLoad: true` to an explicit `mermaid.run()` call so that post-render wrapping can be reliably triggered after diagrams are in the DOM

## Capabilities

### New Capabilities

- `mkdocs-responsive-diagrams`: Responsive scaling and interactive lightbox expansion for patch diagrams rendered in a Material MkDocs documentation site

### Modified Capabilities

- `mermaid-extension`: The mkdocs-material initialisation pattern changes from `startOnLoad: true` to an explicit `mermaid.run()` call to enable post-render processing

## Impact

- `docs/javascripts/mermaid-init.js` — modified (post-render wrapping, `mermaid.run()` switch)
- `docs/stylesheets/patch-diagrams.css` — new file
- `mkdocs.yml` — add new CSS file to `extra_css`
- No changes to the renderer (`renderer.ts`) or any TypeScript source
- No npm dependency changes
