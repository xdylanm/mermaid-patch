## Context

Monotrail's config resolution (`src/db.ts → resolvedConfig()`) currently recognises only one theme variant: `'dark'`. It spreads a single `DEFAULT_CONFIG.dark` object over the base defaults, then applies user overrides. The `neutral` Mermaid theme is ignored (falls through to the light defaults). Standard Mermaid `themeVariables` — the conventional way to override canvas colour, typography, and node chrome — are also ignored.

The colour palettes live in `src/config.ts`. At present there is only one exported config object (`DEFAULT_CONFIG`) with an optional nested `dark` sub-object.

The `MonotrailConfig` interface previously exposed signal type colour keys (`audioColor`, etc.) and node chrome colour keys (`nodeHeaderFill`, etc.) in the `monotrail.*` user config surface, creating a duplicate customisation path alongside `themeVariables`. This duplication is removed.

## Goals / Non-Goals

**Goals:**
- Ship a `neutral` palette (grayscale signal colours, light chrome, light-grey canvas).
- Refine the `dark` palette so signal colours are identical to default, node body (lower half) shows dark text on a light-grey background, and the canvas is dark grey.
- Read all relevant `themeVariables` (`background`, `fontFamily`, `fontSize`, `primaryColor`, `primaryTextColor`, `primaryBorderColor`, `secondaryColor`, `secondaryTextColor`) and apply them after the palette, before user overrides.
- Apply configurable typography (`fontFamily`, `fontSize`) to all rendered text elements; derive badge and edge label font sizes from the base.
- Restrict the `monotrail.*` user config to non-colour keys: `background`, `fontFamily`, `fontSize`, `portPlacement`, `nodePlacementStrategy`. Silently ignore colour keys supplied by users.
- Leave the `default` palette entirely unchanged.

**Non-Goals:**
- Supporting `forest` or any other Mermaid theme (falls back to default palette).
- Changing any grammar, parser, or layout logic.
- Introducing a public API for registering custom theme palettes.
- Supporting user-defined signal type colours.

## Decisions

### 1 — Separate named palette constants instead of extending the `dark` sub-object

**Decision:** Export `DARK_CONFIG` and `NEUTRAL_CONFIG` as standalone `MonotrailConfig` objects in `config.ts`, parallel to `DEFAULT_CONFIG`. Remove the `dark?` sub-object from `MonotrailConfig`.

**Rationale:** The nested `dark` sub-object mixed palette defaults with a user-override bag. Adding `neutral` as another nested key would require the resolver to know the nesting structure for each theme. Standalone named objects are simpler to read and test.

**Alternatives considered:**
- A `Map<theme, palette>` registry — over-engineered for three themes.
- Keep the `dark` sub-object and add a `neutral` sub-object — inconsistent with the standalone `DEFAULT_CONFIG` shape and hard to document.

### 2 — `MonotrailConfig` as an internal resolved type; user input is a restricted subset

**Decision:** `MonotrailConfig` is the fully-resolved internal type used by the renderer and layout engine (includes all colour fields). The user-facing `monotrail.*` config only accepts five keys: `background`, `fontFamily`, `fontSize`, `portPlacement`, `nodePlacementStrategy`. `resolvedConfig()` explicitly picks these keys and ignores all others from user input.

**Rationale:** Exposing `audioColor`, `nodeHeaderFill`, and similar keys as user config created a duplicate customisation path alongside `themeVariables`. Removing them simplifies both the API surface and the resolver logic, and avoids the question of which path wins when both are set.

**Alternatives considered:**
- Keeping colour keys in both `themeVariables` and `monotrail.*`, with `monotrail.*` winning — adds complexity for little benefit.
- A separate exported `MonotrailUserConfig` type — adds a type to the public API without changing runtime behaviour; the explicit pick in `resolvedConfig()` is sufficient.

### 3 — Theme resolution order in `resolvedConfig()`

**Decision:** The merge order is:
```
palette (DEFAULT_CONFIG / DARK_CONFIG / NEUTRAL_CONFIG)
  ← themeVariables.background, fontFamily, fontSize (all themes)
  ← themeVariables node chrome (primaryColor, …) — non-default themes only
  ← userOverride (monotrail.background / fontFamily / fontSize / portPlacement / nodePlacementStrategy)
```

**Rationale:** `themeVariables` should win over palette defaults but still lose to an explicit `monotrail.*` key. Node chrome themeVariables are **not** applied when `theme: 'default'` because Mermaid auto-populates `themeVariables` (e.g. `primaryColor: '#ECECFF'`) even for the default theme — applying them would stomp the intentional Monotrail default palette (white header, dark body). For `dark` and `neutral` they are applied, letting users fine-tune node chrome via standard Mermaid themeVariables.

**Alternatives considered:**
- Applying themeVariables for all themes — causes the default theme to render with Mermaid's own purple/grey palette instead of the Monotrail style.
- Applying `themeVariables` last — would silently stomp explicit user `monotrail.*` values.

### 4 — Dark node body colours

**Decision:** In `DARK_CONFIG`, set `nodeBodyFill: '#e8e8e8'` and `nodeBodyText: '#111111'` (light grey background, dark text), while `nodeHeaderFill` and `nodeHeaderText` remain dark to preserve the two-tone block appearance.

**Rationale:** The user requirement is dark text on a light-grey background for the lower half (body), preserving the visual identity of the block as a two-tone element while keeping the body legible on a dark canvas.

### 5 — Neutral palette colour values

**Decision:** Derive neutral signal colours by desaturating the default colours:

| Signal | Default | Neutral (grayscale) |
|--------|---------|---------------------|
| audio  | `#F07BAB` | `#a0a0a0` |
| cv     | `#51A4DB` | `#888888` |
| voct   | `#8BC640` | `#b0b0b0` |
| gate   | `#F9AF3C` | `#c8c8c8` |
| any / default | `#888888` | `#888888` |

Node chrome uses neutral greys: light header, medium-dark body. Canvas: `#f5f5f5`.

**Rationale:** Perceptual-luminance-matched grayscale of the default hues. Avoids pure black/white extremes to keep the two-tone block structure readable.

### 6 — Typography sizing

**Decision:** Badge label font size = `max(10, fontSize − 3)`. Edge mid-label font size = `max(10, fontSize − 5)`. Both floor at 10px for legibility.

**Rationale:** Keeps relative sizing consistent as the user changes the base `fontSize`. The 3px / 5px deltas match the visual hierarchy that was previously baked in (18 / 15 / 13).

## Risks / Trade-offs

- **Breaking change for colour overrides** — `monotrail.audioColor`, `monotrail.nodeHeaderFill`, etc. are silently ignored. Users who relied on these must migrate to `themeVariables`. Documented in the proposal.

- **`themeVariables` type safety** — `MermaidConfig.themeVariables` is typed loosely. We cast safely and skip if values are not valid strings/numbers. No runtime risk.

- **Grayscale palette aesthetics** — the neutral palette is subjective. The chosen values can be tuned without any API or spec changes.
