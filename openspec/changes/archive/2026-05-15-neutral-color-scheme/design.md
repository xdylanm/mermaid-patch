## Context

The neutral theme (`NEUTRAL_CONFIG`) is one of three built-in palettes in `src/config.ts`. It currently sets grayscale signal colours, mid-grey node chrome, and a light-grey canvas. Visual rendering for node boxes and port tabs is split between:

- **Node box bands** — `renderNodeBox` in `renderer.ts` draws 4 layers (3 bands + background) using `config.nodeBandDark/Mid/Light` and `config.nodeBgColor`
- **Port tab bands** — `renderPortTab` calls `tabColors(signalType)`, which hardcodes the HSL hue-per-signal-type formula and **ignores `config`** entirely
- **Connector strokes** — use `signalColor(type, config)`, which reads from `config.audioColor` / `cvColor` / etc.

The core problem is that `tabColors()` is config-unaware, so the neutral theme's signal colour overrides have no effect on port tab appearance.

## Goals / Non-Goals

**Goals:**

- Neutral theme renders only the outer band (dark grey) on both node boxes and port tabs
- Node box and port tab backgrounds are very light grey (`hsl(0,0%,95%)`)
- Connector wires (and dangling stubs) are dark grey regardless of signal type
- Canvas background is white in the neutral theme
- Changes are contained to `src/config.ts` and `src/renderer.ts`; no new files

**Non-Goals:**

- Changing the default or dark theme appearance
- Adding user-configurable band-count controls
- Altering layout constants (box dimensions, tab dimensions)

## Decisions

### Decision 1: Node box — set inner bands equal to background colour

Rather than adding conditional rendering logic, `NEUTRAL_CONFIG` will set `nodeBandLight` and `nodeBandMid` to the same value as `nodeBgColor` (`hsl(0,0%,95%)`). Since all three layers share the same fill, the inner two bands are visually invisible, and only `nodeBandDark` (`hsl(0,0%,20%)`) is visible as the outer frame.

**Why this over a conditional renderer branch:** Zero renderer changes required; the existing 4-layer loop is correct by construction. The user explicitly suggested this approach as acceptable.

### Decision 2: Port tab — add `simplifiedTabs` flag to PatchConfig

`tabColors()` currently ignores `config` entirely. Rather than refactoring `tabColors()` to parse config HSL values or adding per-signal tab colour overrides, a boolean `simplifiedTabs` flag is added to `PatchConfig` (default `false`).

When `simplifiedTabs` is `true`, `renderPortTab` bypasses `tabColors()` and constructs tab colours directly from node chrome config:
- Background fill: `config.nodeBgColor` (`hsl(0,0%,95%)`)
- Inner and middle band fills: `config.nodeBgColor` (visually hidden, consistent with node box approach)
- Outer band fill: `config.nodeBandDark` (`hsl(0,0%,20%)`)
- Label text colour: `config.nodeBandDark`

`NEUTRAL_CONFIG` sets `simplifiedTabs: true`; `DEFAULT_CONFIG` and `DARK_CONFIG` set it to `false`.

**Why a flag over refactoring `tabColors()`:** `tabColors()` computes full L=80/60/40/20 spectra from a hue; making it config-aware would require parsing HSL strings back to hue values (fragile). The flag is explicit, minimal, and extends naturally if other themes need simplified rendering later.

### Decision 3: Connectors — set all signal colours to dark grey in NEUTRAL_CONFIG

`signalColor(type, config)` already reads colour from config. `NEUTRAL_CONFIG` will set `audioColor`, `cvColor`, `voctColor`, `gateColor`, `anyColor`, and `defaultColor` all to `hsl(0,0%,20%)`. No renderer changes needed; connectors and dangling stubs automatically use dark grey.

**Why not add a connector-specific flag:** Connector colour already flows through config; unifying signal colours to a single value is simpler and consistent with how the renderer uses `signalColor()`.

### Decision 4: Background — set to white in NEUTRAL_CONFIG

`NEUTRAL_CONFIG.background` changes from `#f5f5f5` to `#ffffff`. No renderer changes.

## Risks / Trade-offs

- **Inner bands still rendered (just invisible)** — Three band path elements are drawn even when `nodeBandLight = nodeBandMid = nodeBgColor`. This is a minor inefficiency (3 extra no-op paths per node box). It is acceptable; the user explicitly approved this approach.
- **`simplifiedTabs` is a boolean, not a per-theme enum** — If a future theme needs a different simplified style, another flag or a more expressive mode would be needed. Acceptable given current scope.
- **Arrow marker deduplication** — When all signal colours collapse to the same dark grey, `addArrowMarkers` will generate only one marker for all connectors rather than one per signal type. This is correct and slightly reduces SVG size.
