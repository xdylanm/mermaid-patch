# Configuration

Pass a `monotrail` key inside `mermaid.initialize()` to override any option.  
All keys are optional — unset keys fall back to the defaults listed below.

```js
mermaid.initialize({
  theme: 'default',
  monotrail: {
    audioColor: '#ff6688',
    background: '#ffffff',
  },
});
```

## Signal type colours

Colours for port badges and wires, per signal type.

| Option | Default (light) | Description |
|--------|----------------|-------------|
| `audioColor` | `#F07BAB` | Audio signals |
| `cvColor` | `#51A4DB` | Control voltage |
| `voctColor` | `#8BC640` | V/oct pitch |
| `gateColor` | `#F9AF3C` | Gate / trigger |
| `anyColor` | `#888888` | Untyped ports |
| `defaultColor` | `#888888` | Fallback for unknown types |

## Node colours

| Option | Default (light) | Description |
|--------|----------------|-------------|
| `nodeHeaderFill` | `#ffffff` | Module name bar background |
| `nodeHeaderText` | `#111111` | Module name bar text |
| `nodeBodyFill` | `#404040` | Port area background |
| `nodeBodyText` | `#bbbbbb` | Port label text |
| `nodeBorderColor` | `#1a1a1a` | Node outline |

## Diagram background

| Option | Default (light) | Description |
|--------|----------------|-------------|
| `background` | `#f0ede8` | SVG background fill |

## Layout options

These are advanced options; the defaults work well in most cases.

| Option | Default | Values | Description |
|--------|---------|--------|-------------|
| `portPlacement` | `elk-optimized` | `elk-optimized` \| `declaration` | How port sides are assigned. `elk-optimized` runs a geometry pass after the first layout to distribute ports across all four sides (left, right, top, bottom) based on the Y-positions of connected nodes. `declaration` assigns output ports to the right side and input ports to the left side in module-declaration order, with no geometry adjustment. |
| `nodePlacementStrategy` | `brandes-koepf` | `brandes-koepf` \| `network-simplex` \| `simple` | ELK node placement algorithm. `brandes-koepf` produces the most compact layouts. |

## Dark mode

When `theme: 'dark'` is set in Mermaid, a built-in set of darker defaults is applied automatically — you don't need to do anything. You can also override the dark palette via the `dark` sub-object:

```js
mermaid.initialize({
  theme: 'dark',
  monotrail: {
    dark: {
      audioColor: '#ff88aa',
      background: '#0d1117',
    },
  },
});
```

The `dark` object accepts all colour options (`audioColor`, `cvColor`, etc. and all node colour keys) but not the layout options.

## Full example — custom light theme

```js
mermaid.initialize({
  startOnLoad: true,
  monotrail: {
    audioColor:      '#e05080',
    cvColor:         '#3090d0',
    voctColor:       '#60b030',
    gateColor:       '#e0a020',
    anyColor:        '#909090',
    defaultColor:    '#909090',
    nodeHeaderFill:  '#f8f8f8',
    nodeHeaderText:  '#222222',
    nodeBodyFill:    '#333333',
    nodeBodyText:    '#dddddd',
    nodeBorderColor: '#111111',
    background:      '#fafaf8',
  },
});
```
