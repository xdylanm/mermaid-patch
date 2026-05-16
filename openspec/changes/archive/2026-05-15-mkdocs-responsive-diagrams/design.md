## Context

Patch diagrams are rendered client-side by Mermaid's external diagram API. On a Material MkDocs site, the Mermaid lifecycle begins with static HTML containing `<pre class="mermaid"><code>patch ...</code></pre>` blocks. The existing `mermaid-init.js` registers the patch extension and calls `mermaid.initialize({ startOnLoad: true })`, which triggers asynchronous rendering. After rendering, each `<pre>` is replaced in the DOM with the rendered `<svg>` element.

The renderer sets explicit `width` and `height` presentation attributes on the SVG (e.g. `width="1120" height="480"`) alongside a `viewBox`. These fixed sizes cause the SVG to overflow the Material content column (~740px effective width) for any diagram with more than two nodes.

The rendered SVG contains identifiable child groups (`g.patch-nodes`, `g.patch-edges`, `g.patch-badges`) that distinguish patch diagrams from other Mermaid diagram types on the same page.

## Goals / Non-Goals

**Goals:**
- Scale patch SVGs down to fit the content column without distorting the aspect ratio
- Show a small, unobtrusive expand button on every patch diagram
- Open a full-screen lightbox showing the diagram at its natural pixel size when the button is clicked
- Close the lightbox on backdrop click or Escape key
- Implement entirely in the MkDocs adapter layer — no changes to `renderer.ts` or any TypeScript source

**Non-Goals:**
- Pan/zoom interaction inside the lightbox
- Export or print from the lightbox
- Updating the lightbox when the Material theme toggle switches light/dark
- Responsive fallback rendering for very narrow viewports
- Changes to the CDN or npm consumer experience

## Decisions

### D1: Adapter layer only, renderer unchanged

The renderer's job is to faithfully produce a correct SVG. Where and how it is displayed is a host concern. Modifying the renderer would affect all consumers (CDN, npm) and introduce display logic into a module with no knowledge of the host environment.

*Alternatives considered:*
- Add a `responsive: true` config flag to the renderer that emits `width="100%"` — rejected because it conflates rendering with display policy and complicates the renderer's contract.

### D2: CSS-only responsive scaling via presentation attribute override

SVG `width` and `height` attributes are presentation attributes (lower specificity than CSS). Setting `max-width: 100%; height: auto` in a stylesheet overrides them without JavaScript or DOM mutation. The `viewBox` already present on every patch SVG ensures the aspect ratio is preserved automatically.

A `min-width: min(480px, 100%)` floor keeps diagrams legible on standard desktop content widths while gracefully collapsing to `100%` width on narrow (mobile) viewports.

*Alternatives considered:*
- Post-render JS to set inline style — more brittle, runs after paint.
- Remove `width`/`height` in the renderer — changes renderer behaviour for all consumers.

### D3: Switch mermaid-init.js from `startOnLoad` to `mermaid.run()`

`startOnLoad: true` fires rendering asynchronously with no callback. `mermaid.run()` returns a Promise that resolves once all diagrams on the page are rendered, giving a reliable hook to run post-render DOM processing.

*Alternatives considered:*
- `MutationObserver` watching for SVG insertion — works but is more complex and runs continuously rather than once.
- `setTimeout` polling — fragile, timing-dependent.

### D4: Detect patch diagrams by child class selector

`svg:has(g.patch-nodes)` precisely identifies patch SVGs without depending on Mermaid-generated IDs (which change across renders) or element position. The renderer stamps every patch SVG with `g.patch-nodes`, making this selector stable.

### D5: Lightbox shows natural-size SVG in a scrollable container

The purpose of expanding is to see detail that was lost due to scaling. Scaling the SVG again to fit the viewport defeats this. Instead, the lightbox shows the SVG at its authored `width`/`height` inside an `overflow: auto` container bounded to 95vw × 90vh. Users scroll to inspect detail.

*Alternatives considered:*
- Fit-to-viewport scaling in the lightbox — still loses detail on large diagrams; provides less benefit than natural size.

### D6: Expand button positioned absolutely within a wrapper div

The post-render JS wraps each patch SVG in a `<div class="patch-diagram-wrap">` and appends an absolutely-positioned `<button>` at the top-right corner. The SVG has `SVG_PAD` padding in its coordinate space, so the button overlays blank background rather than content. The button is kept small (24×24px) and low-opacity (0.45) with a full-opacity hover state.

## Risks / Trade-offs

- **Mermaid DOM structure assumption** → The post-render JS assumes that after `mermaid.run()` resolves, the patch SVGs are direct children of the original `<pre>` replacement site. If a future Mermaid version wraps SVGs differently, the selector may need adjustment. Mitigation: selector targets SVG content classes (`g.patch-nodes`), not position, so structural wrapping changes are tolerated.

- **`mermaid.run()` vs `startOnLoad`** → Some Material MkDocs setups rely on `startOnLoad` for compatibility with the instant-loading navigation plugin. Mitigation: `mermaid.run()` is equivalent when called after `mermaid.initialize()`; Material's documentation recommends this pattern for custom init scripts.

- **CSS specificity for SVG attribute override** → If Material or another stylesheet sets an inline `width` style on the SVG, the CSS `max-width` rule cannot override it (inline style wins). The patch renderer does not set `width` in the inline style attribute — only as a presentation attribute — so this is safe today. A future renderer change that moves `width` to the inline style would break scaling.

## Open Questions

None — all design questions resolved during exploration.
