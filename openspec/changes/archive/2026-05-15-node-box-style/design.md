## Context

The node box is the primary visual element of a Patch diagram. Currently it is drawn as two stacked rectangles (header + body), styled by five config keys (`nodeHeaderFill`, `nodeHeaderText`, `nodeBodyFill`, `nodeBodyText`, `nodeBorderColor`). The new design replaces those two rectangles with a banded-frame appearance — a light background with three concentric band pairs of decreasing luminance — and changes the box to 16:9 proportions. The SVG reference design (`box_example.svg`) shows the target geometry precisely.

## Goals / Non-Goals

**Goals:**
- Replace `renderNodeBox()` with a banded-frame implementation that matches the reference SVG geometry.
- Update box constants in `layout.ts` to the 16:9 ratio, removing the header/body split.
- Replace the five node-chrome config keys with a four-key set (`nodeBgColor`, `nodeBandLight`, `nodeBandMid`, `nodeBandDark`, `nodeNameColor`, `nodeLabelColor`) and update all three theme palettes.
- Update text-placement logic: name centred vertically when no label, shifted above centre when a label is present; label below centre.
- Update the `theme-variables-node-chrome` spec to describe the new mapping.

**Non-Goals:**
- Theming with hue or saturation (bands remain achromatic in all built-in palettes).
- Backward compatibility shims for removed config keys.
- Animated or gradient band rendering.

## Decisions

### Decision 1 — Path construction strategy

**Chosen:** Compute each band as two SVG path commands per `<path>` element — one path covers the top edge + right edge (arc at top-right corner, sharp corner at bottom-right); the mirror path covers the left edge + bottom edge (arc at bottom-left, sharp corner at top-left). This exactly mirrors the reference SVG structure (`rband*` / `lband*` pairs).

**Alternatives considered:**
- Single closed rect with `clip-path`: avoids explicit path math but requires a `<defs>` clip element per band and is harder to reason about in a purely-programmatic renderer.
- CSS `outline` / `border-image`: not available inside SVG `<text>` or `<g>` elements rendered through Mermaid's SVG pipeline.

**Rationale:** Direct path construction is transparent, produces minimal SVG markup, and maps one-to-one to the reference design.

---

### Decision 2 — Band thickness parameterisation

Each of the three band pairs (L=60, L=40, L=20) is drawn as a nested frame. **Each** band occupies approximately 5% of the horizontal dimension and 2% of the vertical dimension — these are per-band figures, not totals.

| Parameter | Formula | Approximate value (144×81 box) |
|---|---|---|
| `BAND_STEP_H` | `BOX_W × 0.05` | ≈ 7 px (horizontal inset per band) |
| `BAND_STEP_V` | `BOX_H × 0.02` | ≈ 1.6 px per band (minimum 1 px enforced) |

Three steps give a total band depth of ≈ 15% of width per side and ≈ 6% of height per side. The arc at each rounded corner is naturally parameterised by the per-band step sizes — no separate radius constant is needed; the bezier control distances mirror `BAND_STEP_H` and `BAND_STEP_V` for that band index.

`BAND_STEP_H` and `BAND_STEP_V` SHALL be exported named constants from `layout.ts` so their values can be tuned independently without touching the renderer logic.

For each band index `i ∈ {0,1,2}` (0 = darkest / outermost):
- `outerH = i × BAND_STEP_H` from the box right/left edge
- `innerH = (i+1) × BAND_STEP_H`
- `outerV = i × BAND_STEP_V` from the box top/bottom edge
- `innerV = (i+1) × BAND_STEP_V`

A helper `bandPath(x, y, w, h, outerH, innerH, outerV, innerV, side)` constructs the path string for either the `r` (top+right) or `l` (left+bottom) half.

---

### Decision 3 — Box aspect ratio

**Chosen:** `BOX_W = 144`, `BOX_H = 81` (exact 16:9). At `BOX_H = 81`, `BAND_STEP_V = 81 × 0.02 ≈ 1.6 px`, which satisfies the 1 px minimum per band and keeps the box compact for screen layouts. The constants `BOX_TOP_H` and `BOX_BOT_H` are removed; the box is a single unified region.

**Alternatives considered:**
- `BOX_W = 160`, `BOX_H = 90` — rounder numbers but larger than needed; at this size `BAND_STEP_V = 1.8 px` which is within spec but the box is unnecessarily wide.
- Keep `BOX_W = 140`, set `BOX_H = 78.75` — awkward fractional height.

---

### Decision 4 — Config key replacement

Remove the five old keys and add six new ones:

| New key | Role | Default (default palette) |
|---|---|---|
| `nodeBgColor` | Background fill (L=80) | `hsl(0,0%,80%)` = `#cccccc` |
| `nodeBandLight` | Inner band (L=60) | `hsl(0,0%,60%)` = `#999999` |
| `nodeBandMid` | Middle band (L=40) | `hsl(0,0%,40%)` = `#666666` |
| `nodeBandDark` | Outer band (L=20) | `hsl(0,0%,20%)` = `#333333` |
| `nodeNameColor` | Node name text | `#111111` |
| `nodeLabelColor` | Label text | `#333333` |

The `theme-variables-node-chrome` spec update maps Mermaid `themeVariables`:
- `primaryColor` → `nodeBgColor` (background L=80 equivalent)
- `primaryTextColor` → `nodeNameColor`
- `secondaryTextColor` → `nodeLabelColor`
- `primaryBorderColor` → `nodeBandDark` (outer / darkest band)

The middle and inner band colours are derived from `nodeBandDark` by adjusting luminance when the user sets `primaryBorderColor`, or can be set explicitly via `patch.nodeBandLight` / `patch.nodeBandMid`.

---

### Decision 5 — Text placement

| Condition | Node name vertical position | Label vertical position |
|---|---|---|
| No label | `y + BOX_H / 2` (true centre) | — |
| Label present | `y + BOX_H × 0.42` (above centre) | `y + BOX_H × 0.62` (below centre) |

Font sizes remain theme-driven via `config.fontSize`. Label font size = `config.fontSize - 2`.

## Risks / Trade-offs

- **Layout impact**: Changing `BOX_W` from 140 to 144 and `BOX_H` from 84 to 81 affects spacing between nodes. All existing layout tests will fail and need updating. → Mitigation: update constants in a single commit alongside renderer changes; update all snapshots at once.
- **Path complexity**: Hand-computing cubic bezier control points for the arc corners is error-prone. → Mitigation: derive arc parameterisation directly from the reference SVG and encode as a pure function with unit tests.
- **Theme-variable breakage**: Removing `nodeHeaderFill` etc. is a breaking change for any user who sets those keys via `themeVariables`. → Mitigation: document in CHANGELOG; the keys are project-internal and not yet part of any public release.
- **No hue support**: The achromatic band palette ignores any hue in `primaryColor`. Users expecting colour-tinted nodes will need a future enhancement. → Accept for now; noted as non-goal.
