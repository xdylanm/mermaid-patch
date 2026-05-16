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

Enable Mermaid support and point to a custom JS file:

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

extra_javascript:
  - path: javascripts/mermaid-init.js
    type: module
```

### 3. Create `docs/javascripts/mermaid-init.js`

```js
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
import { patch } from 'https://cdn.jsdelivr.net/npm/@idyllm/mermaid-patch/dist/mermaid-patch.core.mjs';

mermaid.initialize({
  startOnLoad: false,  // Material for MkDocs controls when rendering runs
  securityLevel: 'loose',
  theme: document.documentElement.getAttribute('data-md-color-scheme') === 'slate'
    ? 'dark'
    : 'default',
});

// Must be awaited — Material triggers mermaid.run() as soon as window.mermaid is set
await mermaid.registerExternalDiagrams([patch]);

window.mermaid = mermaid;
```

> The `data-md-color-scheme` check automatically switches to the dark colour palette when the reader selects the dark theme in mkdocs-material.

### 4. Write a diagram in any markdown page

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
