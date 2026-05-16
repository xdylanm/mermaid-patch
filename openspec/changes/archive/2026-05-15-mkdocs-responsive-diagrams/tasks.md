## 1. CSS — Responsive Scaling

- [x] 1.1 Create `docs/stylesheets/patch-diagrams.css` with rules that set `max-width: 100%`, `min-width: min(480px, 100%)`, and `height: auto` on patch SVGs within `.mermaid` containers
- [x] 1.2 Add `patch-diagrams.css` to the `extra_css` list in `mkdocs.yml`
- [x] 1.3 Verify that a wide diagram (more than 2 nodes) scales down to the content column width without distorting proportions

## 2. Init Script — Switch to mermaid.run()

- [x] 2.1 Update `docs/javascripts/mermaid-init.js` to replace `startOnLoad: true` in `mermaid.initialize()` with an explicit `await mermaid.run()` call
- [x] 2.2 Verify that all existing diagram scenarios still render correctly after the init pattern change

## 3. Post-Render — Diagram Wrapping

- [x] 3.1 After `mermaid.run()` resolves, query for all `svg:has(g.patch-nodes)` elements and wrap each in a `<div class="patch-diagram-wrap">` container
- [x] 3.2 Add CSS for `.patch-diagram-wrap` in `patch-diagrams.css`: `position: relative; display: inline-block; max-width: 100%`
- [x] 3.3 Verify that wrapping does not break the responsive scaling rules from task 1.1

## 4. Expand Button

- [x] 4.1 Inject a `<button class="patch-diagram-expand">` element into each `.patch-diagram-wrap` container, positioned absolutely at the top-right corner
- [x] 4.2 Add CSS for `.patch-diagram-expand` in `patch-diagrams.css`: small size (24×24px), low opacity (0.45), full opacity on hover, positioned in the SVG padding area so it does not overlap diagram content
- [x] 4.3 Verify the expand button is visible on both light and dark Material themes

## 5. Lightbox

- [x] 5.1 Implement `openLightbox(svg)` in `mermaid-init.js` that creates a full-screen `.patch-lightbox` overlay containing a scrollable inner container with a cloned SVG at its natural `width`/`height`
- [x] 5.2 Add CSS for `.patch-lightbox` in `patch-diagrams.css`: `position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center`
- [x] 5.3 Add CSS for the inner scrollable container: `max-width: 95vw; max-height: 90vh; overflow: auto`
- [x] 5.4 Wire the expand button click event to call `openLightbox(svg)`
- [x] 5.5 Implement close-on-backdrop-click: attach a click handler to the `.patch-lightbox` element that removes it from the DOM when the click target is the backdrop (not the inner container)
- [x] 5.6 Implement close-on-Escape: attach a `keydown` listener on `document` when the lightbox opens; remove it when the lightbox closes
- [x] 5.7 Verify that a large diagram (e.g. 4+ nodes) is scrollable inside the lightbox and displays at its full natural size
- [x] 5.8 Verify that clicking outside the diagram and pressing Escape both close the lightbox correctly
