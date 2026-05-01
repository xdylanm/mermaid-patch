# Configuration

Pass a `monotrail` key inside `mermaid.initialize()` to override layout and typography options.

```js
mermaid.initialize({
  theme: 'dark',
  monotrail: {
    portPlacement: 'declaration',
    fontSize: 16,
  },
});
```

Signal colours and node chrome colours are **not** settable via `monotrail.*`. Use the standard Mermaid `theme` and `themeVariables` options instead (see below).

## Themes

Setting Mermaid's `theme` option automatically applies a built-in Monotrail palette:

| Theme | Signal colours | Node body | Canvas background |
|-------|---------------|-----------|-------------------|
| `default` | Original hues | Dark fill, light text | `#f0ede8` |
| `dark` | Same as default | Light-grey fill (`#e8e8e8`), dark text | `#1e1e2e` |
| `neutral` | Grayscale | Medium-grey fill, dark text | `#f5f5f5` |

## Mermaid theme variables

The following standard Mermaid `themeVariables` are mapped to Monotrail colours. `background`, `fontFamily`, and `fontSize` apply for all themes. The node chrome variables (`primaryColor` etc.) are only applied when `theme` is `dark` or `neutral` — Mermaid auto-populates these even for the `default` theme, so applying them would override the intentional Monotrail default palette.

| Theme variable | Affects | Notes |
|---------------|---------|-------|
| `background` | SVG canvas fill | Also settable via `monotrail.background` |
| `fontFamily` | Font for all text | Also settable via `monotrail.fontFamily` |
| `fontSize` | Base font size for node names | `px` suffix stripped; also via `monotrail.fontSize` |
| `primaryColor` | Node name bar background | — |
| `primaryTextColor` | Node name bar text | — |
| `primaryBorderColor` | Node outline stroke | — |
| `secondaryColor` | Port area background | — |
| `secondaryTextColor` | Port label text | — |

```js
mermaid.initialize({
  theme: 'dark',
  themeVariables: {
    primaryColor: '#0d1117',
    primaryTextColor: '#f0f0f0',
    primaryBorderColor: '#30363d',
    secondaryColor: '#161b22',
    secondaryTextColor: '#c9d1d9',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '14px',
  },
});
```

## Diagram background

| Option | Default | Description |
|--------|---------|-------------|
| `monotrail.background` | palette default | SVG background fill. Overrides `themeVariables.background`. |

## Typography

| Option | Default | Description |
|--------|---------|-------------|
| `monotrail.fontFamily` | `'Arial, sans-serif'` | Font family for all SVG text. Overrides `themeVariables.fontFamily`. |
| `monotrail.fontSize` | `18` | Base font size for node names (px). Port badge labels use `fontSize − 3`, edge labels use `fontSize − 5` (minimum 10 for both). Overrides `themeVariables.fontSize`. |

## Layout options

These are advanced options; the defaults work well in most cases.

| Option | Default | Values | Description |
|--------|---------|--------|-------------|
| `portPlacement` | `elk-optimized` | `elk-optimized` \| `declaration` | How port sides are assigned. `elk-optimized` runs a geometry pass after the first layout to distribute ports across all four sides (left, right, top, bottom) based on the Y-positions of connected nodes. `declaration` assigns output ports to the right side and input ports to the left side in module-declaration order, with no geometry adjustment. |
| `nodePlacementStrategy` | `brandes-koepf` | `brandes-koepf` \| `network-simplex` \| `simple` | ELK node placement algorithm. `brandes-koepf` produces the most compact layouts. |
