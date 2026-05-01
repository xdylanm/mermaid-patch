## Why

Mermaid ships with four built-in themes (`default`, `dark`, `neutral`, `forest`). Monotrail currently hard-codes two palettes (light and dark) that are applied solely based on the Mermaid `theme` option, leaving the `neutral` theme unhandled and ignoring the standard Mermaid `themeVariables` configuration keys. Supporting all three conventional themes and respecting `themeVariables` makes Monotrail a first-class Mermaid citizen and lets documentation sites (e.g. mkdocs-material) use the standard theme-switching mechanism without any Monotrail-specific workarounds.

## What Changes

- Add a **neutral** built-in palette: a grayscale version of the default signal colours, with a light-grey canvas background.
- Refine the **dark** built-in palette: signal colours remain identical to the default (light) palette; node body (lower half of each block) renders with dark text on a light-grey background; canvas background becomes dark grey.
- Honour standard Mermaid `themeVariables` for canvas background, typography, and node chrome — taking precedence over the built-in palette defaults.
- Remove the `monotrail.*` config surface for signal type colours and node chrome colours. These are now derived exclusively from the theme palette and `themeVariables`; the `monotrail.*` key accepts only `background`, `fontFamily`, `fontSize`, `portPlacement`, and `nodePlacementStrategy`.
- The **default** palette is unchanged.

## Capabilities

### New Capabilities

- `neutral-theme`: Built-in neutral palette — grayscale signal colours and node chrome, light-grey canvas background, activated when Mermaid `theme` is `'neutral'`.
- `dark-theme`: Refined dark palette — signal colours identical to default, node body with dark text on light-grey background, dark-grey canvas. Activated when Mermaid `theme` is `'dark'`.
- `theme-variable-background`: Renderer reads `themeVariables.background` from the resolved Mermaid config and uses it as the SVG canvas background colour, overriding the palette default.
- `theme-variables-typography`: Renderer reads `themeVariables.fontFamily` and `themeVariables.fontSize` and applies them to all text elements; derived sizes for badge and edge labels scale relative to the base size.
- `theme-variables-node-chrome`: Renderer reads `themeVariables.primaryColor`, `primaryTextColor`, `primaryBorderColor`, `secondaryColor`, and `secondaryTextColor` and maps them to node header fill, header text, border, body fill, and body text respectively.

### Modified Capabilities

- `mermaid-extension`: The `monotrail.*` user config key no longer accepts signal type or node chrome colour options. Config resolution now handles `'neutral'` alongside `'dark'`, and merges all supported `themeVariables` into the resolved config.

## Impact

- `src/config.ts` — add `NEUTRAL_CONFIG` palette; update `DARK_CONFIG` defaults; clarify `MonotrailConfig` as an internal resolved type; remove `dark?` sub-object.
- `src/db.ts` — extend `resolvedConfig()` to apply neutral palette; read all supported `themeVariables`; restrict `userOverride` to non-colour keys only.
- `src/renderer.ts` — use `config.fontFamily` and derived `config.fontSize` values for all text elements.
- `docs/config.md` — document themes, `themeVariables` mapping, typography, and layout options; remove signal type and node chrome colour option tables.
- No changes to the grammar, parser, or layout engine.
- **Breaking change**: `monotrail.audioColor`, `monotrail.cvColor`, `monotrail.voctColor`, `monotrail.gateColor`, `monotrail.anyColor`, `monotrail.defaultColor`, `monotrail.nodeHeaderFill`, `monotrail.nodeHeaderText`, `monotrail.nodeBodyFill`, `monotrail.nodeBodyText`, and `monotrail.nodeBorderColor` are silently ignored. Use `themeVariables` to customise node chrome.
