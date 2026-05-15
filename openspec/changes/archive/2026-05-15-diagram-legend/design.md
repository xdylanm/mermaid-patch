## Context

Patch diagrams use signal-type colour coding on connector wires and port badges. Readers new to the convention have no in-diagram reference. The renderer builds an SVG by calling `draw()`, which appends SVG element groups for edges, badges, boxes, and warnings. All user-settable configuration flows through `mermaid.initialize({ patch: { ... } })` into `db.ts`'s `resolvedConfig()`, which merges it with the palette defaults and produces a `PatchConfig`. The connector stroke width is `2` px; the legend lines should be twice that (`4` px).

## Goals / Non-Goals

**Goals:**
- Add `legend: boolean` and `legendPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'` to `PatchConfig`, defaulting to `false` and `'top-right'`.
- Render a borderless, title-free SVG group in the diagram when `legend` is `true`, showing one row per concrete signal type (audio, CV, V/oct, gate): a horizontal coloured line at `stroke-width: 4` followed by the human-readable label.
- Position the legend group in the specified corner, inset by `SVG_PAD`.
- Accept the new keys from the `patch` user config in `db.ts`.

**Non-Goals:**
- Interactive toggling of the legend at runtime.
- Customising which signal types appear in the legend.
- Rendering a legend for the `neutral` theme (signal colours are all grey there — the legend would be uninformative, but it is still rendered if requested; filtering is a future concern).
- Dynamic legend sizing based on SVG text measurements (a fixed layout based on `fontSize` is sufficient).

## Decisions

### 1. Fixed-size row layout using `fontSize`

**Decision:** Each legend row is `fontSize * 1.6` px tall, with a horizontal sample line `32` px wide and a text label `10` px to the right of the line end.

**Rationale:** SVG text measurement requires querying `getBBox()`, which is unreliable in headless/server-side contexts and introduces async complexity. A `fontSize`-proportional layout works well across the typical range (`fontSize` 14–24). Row height `1.6 × fontSize` gives comfortable spacing matching the port label metrics used elsewhere in the renderer.

**Alternative considered:** `getBBox()`-based dynamic sizing — rejected due to reliability and complexity concerns.

---

### 2. Legend appended as last SVG group (`patch-legend`)

**Decision:** The legend group is appended after the warnings panel in `draw()`, so it always renders on top.

**Rationale:** Placing it last in DOM order ensures it is never occluded by node boxes, wires, or warning panels. Corner positioning keeps it out of the diagram content area in most cases.

**Alternative considered:** Prepending before edges — rejected because it could be covered by node boxes.

---

### 3. Position computed from final `svgWidth` / `svgHeight`

**Decision:** The legend `transform="translate(x, y)"` is computed after `svgWidth` and `svgHeight` are established, using a `legendWidth = 32 + 10 + <estimated text width>` approximation of `7 × fontSize / 18` px per character (matches the font metrics already used in the renderer for label sizing heuristics).

**Rationale:** `svgWidth`/`svgHeight` are set before the legend group is appended. A character-width estimate avoids the `getBBox()` complexity.

**Alternative considered:** Hardcoded legend width — rejected because it breaks at very large or very small `fontSize` values.

---

### 4. Human-readable signal type labels

**Decision:** The four signal types render with display labels: `audio → Audio`, `cv → CV`, `voct → V/oct`, `gate → Gate`. These are defined as a constant array in `renderer.ts`, not derived from `SIGNAL_COLOR_KEY` at runtime.

**Rationale:** `SIGNAL_COLOR_KEY` maps parser identifiers to config keys; the legend labels are presentation strings that happen to differ (`voct` → `V/oct`). Hardcoding the four entries is explicit and avoids coupling rendering to the parser's identifier set.

## Risks / Trade-offs

- **Overlap with diagram content** → For dense diagrams where the content area extends to a corner, the legend may overlap nodes. Mitigation: users can choose a different corner via `legendPosition`, or move the legend to `bottom-left` on tall diagrams.
- **Neutral theme legend is monochrome** → All four lines appear the same grey, making the legend unhelpful but not harmful. Mitigation: document that the legend is designed for colour-enabled themes.
- **Fixed character-width estimate** → Proportional fonts vary. Mitigation: the estimate is conservative; labels are short enough that misalignment is minor.
