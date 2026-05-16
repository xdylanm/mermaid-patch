# Usage

## Web page (CDN)

The simplest approach: load Mermaid and the plugin from a CDN, serve your HTML file over HTTP (browsers block ES module imports over `file://`).

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <!-- Diagram source: Mermaid finds all .language-patch code blocks -->
  <pre class="mermaid">
patch
module VCO {
    +voct V/oct
    +audio out
}
module VCF {
    +audio In
    +cv freq
    +audio LP
}

VCO osc1
VCF lpf1

osc1:out --> lpf1:In
  </pre>

  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    import patch from 'https://cdn.jsdelivr.net/npm/@idyllm/mermaid-patch/dist/mermaid-patch.core.mjs';

    await mermaid.registerExternalDiagrams([patch]);
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      // patch: { audioColor: '#e05080' },  // optional overrides
    });
  </script>
</body>
</html>
```

To serve locally during development:

```bash
# Python (no install needed)
python -m http.server 8080
# then open http://localhost:8080/index.html
```

## npm / bundled app

Install the package:

```bash
npm install mermaid @idyllm/mermaid-patch
```

Register before calling `initialize`:

```js
import mermaid from 'mermaid';
import patch from '@idyllm/mermaid-patch';

await mermaid.registerExternalDiagrams([patch]);
mermaid.initialize({ startOnLoad: true });
```

Call `mermaid.render()` to render programmatically:

```js
const { svg } = await mermaid.render('my-diagram', `
patch
module VCO { +audio out }
module VCF { +audio In +audio LP }
VCO osc1
VCF lpf1
osc1:out --> lpf1:In
`);
document.getElementById('output').innerHTML = svg;
```

## mkdocs-material

### 1. Install dependencies

```bash
pip install mkdocs-material
npm install mermaid @idyllm/mermaid-patch
```

Or if you prefer a CDN build, skip the npm step and adjust the script below.

### 2. Configure `mkdocs.yml`

Enable Mermaid support and point to a custom JS file and stylesheet:

```yaml
# mkdocs.yml
theme:
  name: material
  features:
    - content.code.annotate

markdown_extensions:
  - pymdownx.superfences:
      custom_fences:
        - name: mermaid
          class: mermaid
          format: !!python/name:pymdownx.superfences.fence_code_format

extra_css:
  - stylesheets/patch-diagrams.css

extra_javascript:
  - path: javascripts/mermaid-init.js
    type: module
```

### 3. Create `docs/stylesheets/patch-diagrams.css`

This stylesheet scales diagrams to fit the page width and styles the expand button and lightbox:

```css
/* ── Responsive scaling ─────────────────────────────────────────────────── */
/* Material MkDocs renders Mermaid SVGs inside a closed shadow root, so CSS
   cannot target the SVG directly. The shadow host (div.mermaid) is wrapped in
   .patch-diagram-wrap by our JS before Material processes the diagram. The SVG
   is rendered with width="100%" so it fills the host; an inline max-width
   (set in JS) prevents small diagrams from stretching to the full column. */
.patch-diagram-wrap div.mermaid {
  display: block;
  width: 100%;
}

/* ── Diagram wrapper ────────────────────────────────────────────────────── */
.patch-diagram-wrap {
  position: relative;
  display: block;
  max-width: 100%;
}

/* ── Expand button ──────────────────────────────────────────────────────── */
.patch-diagram-expand {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.3);
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  opacity: 0.45;
  transition: opacity 0.15s;
}

.patch-diagram-expand:hover {
  opacity: 1;
}

/* ── Lightbox ───────────────────────────────────────────────────────────── */
.patch-lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.patch-lightbox-inner {
  max-width: 95vw;
  max-height: 90vh;
  overflow: auto;
  border-radius: 4px;
}
```

### 4. Create `docs/javascripts/mermaid-init.js`

```js
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
import { patch } from 'https://cdn.jsdelivr.net/npm/@idyllm/mermaid-patch/dist/mermaid-patch.core.mjs';

const patchConfig = {
  // put any patch diagram config here, e.g.:
  // legend: true,
  // legendPosition: 'top-right',
};

// ── Lightbox ─────────────────────────────────────────────────────────────
// Takes the original diagram source text and re-renders at natural pixel size.

async function openLightbox(diagramText) {
  const lb = document.createElement('div');
  lb.className = 'patch-lightbox';

  const inner = document.createElement('div');
  inner.className = 'patch-lightbox-inner';

  // Re-render using the original (un-intercepted) render function so the SVG
  // has its natural width/height, not the responsive width="100%" version.
  const { svg } = await _render('patch-lightbox-' + Date.now(), diagramText);
  inner.innerHTML = svg;
  lb.appendChild(inner);

  // Close on backdrop click (but not on the inner container)
  lb.addEventListener('click', (e) => {
    if (e.target === lb) lb.remove();
  });

  // Close on Escape key
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      lb.remove();
      document.removeEventListener('keydown', onKeyDown);
    }
  };
  document.addEventListener('keydown', onKeyDown);

  document.body.appendChild(lb);
}

// ── Pre-processing ────────────────────────────────────────────────────
// Wraps patch diagram pre.mermaid elements with .patch-diagram-wrap and
// injects an expand button BEFORE Material replaces the pre with a div.mermaid
// shadow host. When Material does the replacement, the wrapper and button are
// already in place — no element reference from render() needed.

function preprocessPatchDiagrams() {
  document.querySelectorAll('pre.mermaid:not([data-patch-pre])').forEach((pre) => {
    const code = pre.querySelector('code') || pre;
    const text = (code.textContent || '').trim();
    if (!text.startsWith('patch')) return;

    pre.setAttribute('data-patch-pre', '');

    const wrap = document.createElement('div');
    wrap.className = 'patch-diagram-wrap';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement('button');
    btn.className = 'patch-diagram-expand';
    btn.setAttribute('aria-label', 'Expand diagram');
    btn.textContent = '⤢';
    // text is captured in the closure here, before Material replaces the pre.
    btn.addEventListener('click', () => openLightbox(text));
    wrap.appendChild(btn);
  });
}

// ── Mermaid setup ─────────────────────────────────────────────────────────

// Saved reference to the original mermaid.render() — used in the lightbox to
// re-render at natural (unscaled) size without going through our interception.
let _render;

// Material calls mermaid.initialize() with its own stripped-down config
// (no patch key), overwriting anything set earlier. Wrap it so our
// settings always win regardless of what Material passes.
const _initialize = mermaid.initialize.bind(mermaid);
mermaid.initialize = (config) => {
  _initialize({ securityLevel: 'loose', ...config, patch: patchConfig });
};

// Intercept mermaid.render() — called by Material before it inserts the SVG
// into the closed shadow root on div.mermaid. For patch diagrams:
//   1. Rewrite the SVG to use width="100%"; viewBox preserves the aspect ratio.
//   2. Apply max-width (= natural rendered width) on the shadow host so small
//      diagrams don't stretch to fill the full content column.
//
// Material does not reliably pass the shadow host as argument 3, so we locate
// the host via .patch-diagram-wrap. Material renders diagrams in document order
// and setTimeout callbacks fire FIFO, so the Nth callback finds the Nth host.
_render = mermaid.render.bind(mermaid);
mermaid.render = async (id, text, element) => {
  const result = await _render(id, text, element);
  if (typeof text === 'string' && text.trimStart().startsWith('patch')) {
    const widthMatch = result.svg.match(/\bwidth="(\d+)"/);
    const naturalWidth = widthMatch ? parseInt(widthMatch[1]) : null;

    const modifiedSvg = result.svg.replace(
      /^<svg ([^>]*)>/,
      (_, attrs) => `<svg ${attrs
        .replace(/\bwidth="[^"]*"/, 'width="100%"')
        .replace(/\s*\bheight="[^"]*"/, '')
      }>`
    );

    // Find the shadow host: the first .patch-diagram-wrap div.mermaid without
    // a max-width yet. The FIFO guarantee of setTimeout(,0) means each callback
    // picks up the next host in document order.
    const capturedNW = naturalWidth;
    setTimeout(() => {
      const host = document.querySelector(
        '.patch-diagram-wrap div.mermaid:not([data-nw-set])'
      );
      if (host) {
        host.setAttribute('data-nw-set', '');
        if (capturedNW) host.style.maxWidth = capturedNW + 'px';
      }
    }, 0);

    return { ...result, svg: modifiedSvg };
  }
  return result;
};

// Intercept mermaid.run() to pre-process diagrams before each render cycle.
// Material calls this for SPA (instant) navigation re-renders.
const _run = mermaid.run.bind(mermaid);
mermaid.run = async (...args) => {
  preprocessPatchDiagrams();
  await _run(...args);
};

// Pre-process diagrams already in the DOM before exposing mermaid.
// Material starts rendering as soon as window.mermaid is set.
preprocessPatchDiagrams();

// Must be awaited — Material triggers rendering as soon as window.mermaid is set.
await mermaid.registerExternalDiagrams([patch]);

window.mermaid = mermaid;
```

> **Dark mode:** Material handles dark mode for its built-in diagram types via CSS custom properties that update automatically on palette change. Patch diagrams render SVG with explicit colours and are not re-rendered on toggle — the diagram stays in whichever theme was active when the page loaded.

> **Diagram scaling:** Diagrams wider than the content column scale down automatically to fit. Click ⤢ on any diagram to open it at full size in a lightbox; click the backdrop or press Escape to close.

### 5. Write a diagram in any markdown page

````markdown
```mermaid
patch
module VCO {
    +voct V/oct
    +audio out
}
module VCF {
    +audio In
    +cv freq
    +audio LP
}

VCO osc1["Oscillator"]
VCF lpf1["Filter"]

--> |pitch| osc1:V/oct
osc1:out --> lpf1:In
lpf1:LP --> |output|
```
````

### Note on self-hosted plugin builds

If you want to bundle the plugin instead of loading it from a CDN (e.g. for offline docs or version pinning), copy `node_modules/@idyllm/mermaid-patch/dist/mermaid-patch.core.mjs` into `docs/javascripts/` and update the import path accordingly.
