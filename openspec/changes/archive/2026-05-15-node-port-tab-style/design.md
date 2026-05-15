## Context

Port tabs (currently trapezoid-shaped "badges") are the visual labels attached to a node's ports, rendered by `trapPoints()` and `badgeLabel()` in `renderer.ts`. They use a solid signal-type colour fill with white bold text — a style developed before the banded-frame node box existed. The new node box (see `node-box-style`) introduced a coherent HSL band palette (achromatic for the box chrome). The port tabs should adopt a complementary scheme: signal-type-specific hue at S=100 with the same decreasing-luminance band structure (L=80/60/40/20). The reference geometry is captured in `tab_example.svg`.

## Goals / Non-Goals

**Goals:**
- Replace trapezoid badge rendering with a three-sided banded-frame tab whose outer edge carries thick bands and whose inner/perpendicular edges carry thin bands, reusing `BAND_STEP_H` / `BAND_STEP_V` constants from `layout.ts`.
- Derive tab background and band colours from a pure function of signal type, using fixed HSL hues (audio H=25, cv H=200, voct H=100, gate H=300) at S=100 and L∈{80,60,40,20}. No new `PatchConfig` keys.
- Add a `TAB_L` layout constant for the along-edge tab length (= `BOX_H − 2 × CORNER_R_OUTER = 49 px`) to ensure the centered tab sits entirely within the straight portion of the node edge.
- Render the tab label in dark, centered, sans-serif text (no rotation of text for the tab box; the tab itself is rotated per edge).
- Handle all four port sides (left, right, top, bottom) with consistent orientation rules.

**Non-Goals:**
- User-configurable tab colours via `patch.*` or `themeVariables`; colours are fully determined by signal type.
- Changing the hue or style of existing signal wire colours (`audioColor`, `cvColor`, etc.).
- Animating or gradating band fills.
- Backward compatibility with the trapezoid badge geometry.

## Decisions

### Decision 1 — Tab colour model: pure function, no config keys

**Chosen:** A standalone function `tabColors(type: string): { bg: string; light: string; mid: string; dark: string }` returns the four HSL colour strings for a given signal type using fixed hue values (audio=25, cv=200, voct=100, gate=300) at S=100 and L∈{80,60,40,20}. For unrecognised types, H=0 S=0 (neutral grey) is used. The function lives in `renderer.ts` (or `config.ts`).

**Rationale:** Signal-type colours for tabs follow a well-defined mathematical rule (HSL with per-type H, fixed S and L levels). Introducing config keys would add six new fields per signal type (4×4=16 keys) with no user-visible benefit — users cannot distinguish which keys drive which element. Keeping it a pure function also makes the tab colours fully reproducible and removes the need for theme-palette entries.

**Alternatives considered:**
- Config keys per signal type (e.g., `audioTabBg`, `audioTabBandDark`): Too many keys, no real customisation value.
- Re-use `audioColor` etc. and derive bands from them: Existing signal colours use arbitrary hex values incompatible with the HSL luminance model; the relationship to H/S/L would be fragile.

---

### Decision 2 — Tab dimensions: TAB_L derived from box constants, TAB_D = BADGE_D

**Chosen:** `TAB_L = BOX_H − 2 × CORNER_R_OUTER` (currently 49 px) is exported as a named constant from `layout.ts`. The depth of the tab (dimension perpendicular to the node edge) reuses `BADGE_D = 24 px`. `BADGE_D` is renamed to `TAB_D` for clarity; the old trapezoid-specific `BADGE_SLOPE` constant is removed.

| Constant | Value | Meaning |
|---|---|---|
| `TAB_L` | 57 px | Length of tab along the node edge (= `BOX_H − 2 × CORNER_R_OUTER` = 81 − 24) |
| `TAB_D` | 24 px | Depth of tab perpendicular to the node edge |

With `TAB_L = 57` and `BAND_STEP_H = 5`, total band depth on the outer edge = 3 × 5 = 15 px, leaving 9 px of clear background on the outer face. Band depth on the thin sides = 3 × 2 = 6 px of the 24 px depth.

**Alternatives considered:**
- Larger `TAB_D` (e.g., 30 px): Would extend tabs farther from nodes, increasing diagram width. Rejected: 24 matches the existing badge protrusion.
- Compute `TAB_L` inline: `BOX_H − 2 × CORNER_R_OUTER` is a frequently-needed geometric quantity; a named constant prevents drift if either parameter changes.

---

### Decision 3 — Canonical tab orientation and rotation per edge

**Chosen:** The tab is defined in a **canonical orientation** matching the SVG reference example:
- Width = `TAB_L` (horizontal dimension)
- Height = `TAB_D` (vertical dimension)
- Open/attachment side = **bottom** (the side that meets the node edge)
- **Outer** edge = **right** (thick bands; `BAND_STEP_H` per band)
- **Inner-perpendicular** edges = **left** and **top** (thin bands; `BAND_STEP_V` per band)

When placed at a port, the tab is translated and rotated via an SVG `transform`:

| Port side | SVG transform | Open-side direction (post-transform) | Thick-edge direction (post-transform) |
|---|---|---|---|
| `top` | no rotation | downward (toward node's top edge) | rightward |
| `bottom` | `rotate(180)` | upward (toward node's bottom edge) | leftward |
| `left` | `rotate(-90)` | rightward (toward node's left edge) | upward |
| `right` | `rotate(90)` | leftward (toward node's right edge) | downward |

The text label is rendered inside the canonical tab coordinate system and rotates with the tab. The label x-position is `TAB_L/2` (horizontal centre); the y-position is `TAB_D * 0.6` (60% of the depth from the closed/outer end, biasing the text toward the attachment side so it sits clear of the arc region at the closed corners). This matches the current left/right badge text orientation.

**Alternatives considered:**
- Separate path builders per edge side: avoids the rotation transform but duplicates complex bezier math four times. Rejected.
- Always render upright text and compute per-edge rotation separately: Splitting transform from content makes the render function stateful; keeping a single `<g transform>` wrapping both paths and text is simpler.

---

### Decision 4 — Band path construction: three-sided analog of mixedCornerRect

**Chosen:** A helper `tabBandPath(tl, td, outerH, innerH, outerV, innerV, rTR_outer, rTR_inner, rTL_outer, rTL_inner): string` returns the SVG `d` string for one band of the canonical tab (open at the bottom). This follows the exact same quadratic-bezier arc approach as `mixedCornerRect` in `layout.ts`.

Each band occupies the region between its outer and inner boundaries, rendered as a single closed path (outer boundary forward + inner boundary backward). The band has:
- Two **sharp** corners: bottom-left and bottom-right (adjacent to the open attachment edge)
- Two **arced** corners: top-left (thin-left ↔ thin-top) and top-right (thin-top ↔ thick-right)

**Boundary geometry for band index `i` (0 = outermost):**

| Boundary | Left/top inset | Right inset |
|---|---|---|
| Outer | `outerV = i × BAND_STEP_V` | `outerH = i × BAND_STEP_H` |
| Inner | `innerV = (i+1) × BAND_STEP_V` | `innerH = (i+1) × BAND_STEP_H` |

**Arc radii — top-right corner** (thin-top → thick-right; the blend arc):

This corner follows the **same radius progression as the node box layers**:

```
rStep  = (CORNER_R_OUTER − CORNER_R_INNER) / N    // same rStep as renderNodeBox
rTR_outer = CORNER_R_OUTER − i × rStep            // matches node-box layer i radius
rTR_inner = CORNER_R_OUTER − (i+1) × rStep
```

**Arc radii — top-left corner** (thin-left ↔ thin-top; the symmetric thin corner):

The outermost band's outer boundary uses `CORNER_R_OUTER` as the starting radius, then each inward step decreases the radius by `BAND_STEP_V` (one thin-band width), keeping the apparent band thickness constant around this corner:

```
rTL_outer = CORNER_R_OUTER − outerV    // = CORNER_R_OUTER − i × BAND_STEP_V
rTL_inner = CORNER_R_OUTER − innerV    // = CORNER_R_OUTER − (i+1) × BAND_STEP_V
```

The `outerV` and `innerV` inset values are subtracted because the arc centre sits at the band boundary's corner `(outerV, outerV)` rather than at `(0, 0)`, so the effective radius from that corner point is always `CORNER_R_OUTER`.

**Path trace (outer boundary forward, inner boundary backward):**
1. Move to `(outerV, td)` — bottom-left sharp corner
2. Line up to `(outerV, outerV + rTL_outer)` — left thin edge
3. `Q (outerV, outerV) (outerV + rTL_outer, outerV)` — top-left arc (thin-left → thin-top)
4. Line right to `(tl − outerH − rTR_outer, outerV)` — top thin edge
5. `Q (tl − outerH, outerV) (tl − outerH, outerV + rTR_outer)` — top-right arc (thin-top → thick-right)
6. Line down to `(tl − outerH, td)` — right thick edge (sharp bottom-right)
7. Line left to `(tl − innerH, td)` — open bottom edge, inner back
8. Line up to `(tl − innerH, innerV + rTR_inner)` — right thick edge (inner)
9. `Q (tl − innerH, innerV) (tl − innerH − rTR_inner, innerV)` — top-right arc inner
10. Line left to `(outerV + rTL_inner, innerV)` — top thin edge (inner)
11. `Q (innerV, innerV) (innerV, innerV + rTL_inner)` — top-left arc inner
12. Line down to `(innerV, td)` — left thin edge (inner, sharp bottom-left)
13. Close `Z`

**Background layer** (inset = N = 3): `rTR = CORNER_R_INNER`, `rTL = CORNER_R_OUTER − N × BAND_STEP_V`.

The reference SVG is a visual guide only; the implementation SHALL compute all coordinates and radii from the above formulae rather than tracing the example paths.

**Alternatives considered:**
- `clip-path` on a full rect: would require per-band `<clipPath>` elements in `<defs>` and make the path math less direct.
- CSS borders: not applicable to SVG `<g>` elements rendered through Mermaid's pipeline.

---

### Decision 5 — Text rendering in the tab

**Chosen:** The tab label is rendered as a single `<text>` element with:
- `x = tabLength / 2`, `y = TAB_D * 0.6`
- `text-anchor: middle`, `dominant-baseline: middle`
- `fill`: the `dark` band colour (`hsl(H, 100%, 20%)`) for sufficient contrast against the L=80 background
- `font-family: config.fontFamily` (sans-serif)
- `font-size`: `config.fontSize - 2` (slightly smaller than node name)
- `font-weight: bold`
- No additional `transform` beyond the enclosing `<g>` rotation

**Rationale:** The dark L=20 colour at S=100 gives ~4.5:1 contrast against the L=80 background, meeting WCAG AA at typical sizes. Using `config.fontFamily` (which defaults to `Arial, sans-serif`) satisfies the sans-serif requirement. Bold weight improves legibility at the small tab size. Positioning the text at 60% of TAB_D (rather than 50%) moves it toward the open/attachment edge, visually centering it within the visible interior region once the arc of the closed corners is accounted for.

## Risks / Trade-offs

- **Bezier arc math**: The top-right corner arc is a standard quadratic bezier (same as `mixedCornerRect`) but the two corners use independent radii. Getting the radius values wrong will produce a visible kink or gap. → Mitigation: derive radii from the formulas above; add unit tests that check the path start/end coordinates and arc control points for each band at default dimensions.
- **Rotation + text baseline on some browsers**: The combination of `<g>` rotation and `dominant-baseline: middle` can produce sub-pixel misalignment in some SVG renderers. → Mitigation: verify in demo at default and large font sizes; use explicit `dy` offset if needed.
- **Trapezoid removal**: All four edges currently use `trapPoints()`. Removing it entirely may break any consumer that calls `renderNodeBadges` with non-standard port positions. → Mitigation: `renderNodeBadges` is internal; search for all call sites and replace in a single pass.
- **`BADGE_SLOPE` removal**: This constant is referenced in `trapPoints`. After removal, check for any other usages before deleting. → Low risk: it's a local constant with no external consumers.

---

### Decision 6 — Wide tab for lone top/bottom ports

**Chosen:** When a `top` or `bottom` edge port is the **only** port on that edge, its tab length is `Math.round(TAB_L × 1.4)` (currently 80 px) rather than the standard `TAB_L`. The `renderPortTab` function accepts an optional `tabLength` parameter (defaulting to `TAB_L`) so the same path-builder is reused. `renderNodeBadges` computes the per-side port count and passes the wider length for eligible ports.

**Rationale:** Top/bottom port tabs sit perpendicular to the typical left/right flow of a patch diagram. A single isolated tab at full `TAB_L` width looks narrow relative to the node box width (`BOX_W = 144 px`). Widening it to ≈80 px (≈56% of `BOX_W`) gives it more visual presence without overrunning the arc corners, since the node's top and bottom edges are `BOX_W = 144 px` wide with only the `CORNER_R_OUTER = 12 px` arc at the two corners occupied. When multiple ports share a top/bottom edge, each tab keeps the standard `TAB_L` to avoid overlap.

**Alternatives considered:**
- Always use `BOX_W − 2 × CORNER_R_OUTER` for top/bottom tabs: this is 120 px, which would look very wide for edge-labels. Rejected in favour of a proportional factor.
- User-configurable multiplier: unnecessary complexity for a purely aesthetic choice.
