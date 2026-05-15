# Spec: Node Port Tab Style

## Purpose

Defines the visual appearance, dimensions, colouring, orientation, and label rendering of port tabs on node boxes. Port tabs use a banded-frame style with signal-type-derived HSL colours, replacing the legacy trapezoid badge.

## Requirements

### Requirement: Port tab uses a banded-frame appearance with signal-type HSL colouring

Each port tab SHALL be rendered as a rectangular banded-frame element (replacing the legacy trapezoid badge). The tab SHALL have one open side (the side that attaches to the node edge) and three banded sides (outer edge + two perpendicular edges). The background fill and three band fills SHALL be derived from the port's signal type using a fixed HSL formula: hue H is signal-type-specific (audio H=25, cv H=200, voct H=100, gate H=300; unknown types use S=0 grey), saturation S=100%, and luminance L∈{80, 60, 40, 20} for the background, inner band, middle band, and outer band respectively.

#### Scenario: Audio port tab uses orange-hued bands

- **WHEN** a port with signal type `audio` is rendered
- **THEN** the tab background fill SHALL be `hsl(25, 100%, 80%)`
- **THEN** the inner band (L=60) fill SHALL be `hsl(25, 100%, 60%)`
- **THEN** the middle band (L=40) fill SHALL be `hsl(25, 100%, 40%)`
- **THEN** the outer band (L=20) fill SHALL be `hsl(25, 100%, 20%)`

#### Scenario: CV port tab uses blue-hued bands

- **WHEN** a port with signal type `cv` is rendered
- **THEN** the tab background fill SHALL be `hsl(200, 100%, 80%)`
- **THEN** the outer band (L=20) fill SHALL be `hsl(200, 100%, 20%)`

#### Scenario: V/oct port tab uses green-hued bands

- **WHEN** a port with signal type `voct` is rendered
- **THEN** the tab background fill SHALL be `hsl(100, 100%, 80%)`
- **THEN** the outer band (L=20) fill SHALL be `hsl(100, 100%, 20%)`

#### Scenario: Gate port tab uses purple-hued bands

- **WHEN** a port with signal type `gate` is rendered
- **THEN** the tab background fill SHALL be `hsl(300, 100%, 80%)`
- **THEN** the outer band (L=20) fill SHALL be `hsl(300, 100%, 20%)`

#### Scenario: Unknown signal type renders as neutral grey bands

- **WHEN** a port with an unrecognised signal type is rendered
- **THEN** all four tab fills (background + three bands) SHALL use S=0 (greyscale) with L∈{80, 60, 40, 20}

---

### Requirement: Tab dimensions are fixed at TAB_L along the edge and TAB_D perpendicular

The tab SHALL have a length along the node edge of `TAB_L = BOX_H − 2 × CORNER_R_OUTER` (currently 57 px, using `CORNER_R_OUTER = 12`) and a depth perpendicular to the node edge of `TAB_D` (currently 24 px). `TAB_L` SHALL be exported as a named constant from `layout.ts`. When the tab is placed centered on a node edge, both ends of the tab SHALL fall within the straight portion of the edge (i.e., not overlap the arc region defined by `CORNER_R_OUTER`).

#### Scenario: Default tab dimensions are 57 × 24 px

- **WHEN** any port tab is rendered at default layout constants
- **THEN** the tab length along the node edge SHALL be 57 px
- **THEN** the tab depth perpendicular to the node edge SHALL be 24 px

#### Scenario: Tab centered on edge stays within straight portion

- **WHEN** a tab is placed centered on the left or right edge of a node box of height 81 px
- **THEN** the tab extends from `y + CORNER_R_OUTER` to `y + BOX_H − CORNER_R_OUTER` (i.e., from y+12 to y+69), fully within the straight portion of the edge

---

### Requirement: Tab bands use BAND_STEP_H for the outer (thick) edge and BAND_STEP_V for the inner (thin) perpendicular edges

The tab's outer edge (the edge of the tab farthest from the node) SHALL carry band layers each `BAND_STEP_H` px wide (matching the node box horizontal band width). The two edges perpendicular to the node edge (top and bottom when the tab is placed on a left/right node edge) SHALL carry band layers each `BAND_STEP_V` px wide (matching the node box vertical band width). The attachment side (the side meeting the node edge) SHALL have no band coverage.

#### Scenario: Outer edge total band depth equals 3 × BAND_STEP_H

- **WHEN** a port tab is rendered at default layout constants
- **THEN** the total band depth on the outer edge SHALL be 3 × BAND_STEP_H = 15 px
- **THEN** the remaining unobstructed background strip on the outer face SHALL be TAB_D − 3 × BAND_STEP_H = 9 px

#### Scenario: Perpendicular edge total band depth equals 3 × BAND_STEP_V

- **WHEN** a port tab is rendered at default layout constants
- **THEN** the total band depth on each thin edge SHALL be 3 × BAND_STEP_V = 6 px

---

### Requirement: Tab band corners follow the arc/sharp pattern with matching radii

The tab band paths SHALL include:
- A **quadratic arc** at the corner where the thin perpendicular edge meets the outer (thick) edge, with a radius that transitions from the thin edge width to the thick edge width. The innermost (lightest) arc radius SHALL match the outermost (darkest) arc radius of the top-left corner so that nested arcs align visually.
- A **quadratic arc** at the corner where the two thin perpendicular edges meet (the corner of the tab that is farthest from the node and opposite the open side). This arc SHALL use the same radius as the outermost band's outer-edge corner radius.
- **Sharp (right-angle) corners** at the two corners adjacent to the open attachment edge.

#### Scenario: Outer-outer corner has arc; attachment corners are sharp

- **WHEN** a port tab is rendered
- **THEN** the path for each band SHALL contain a curved arc at the outer-outer corner (farthest from attachment, farthest from node)
- **THEN** the two corners at the attachment edge of the band paths SHALL be right angles (no bezier arc)

---

### Requirement: Tab label text is bold, offset toward the attachment side, and rendered in the outer band colour

The tab label (port name) SHALL be rendered in the dark outer band colour (`hsl(H, 100%, 20%)` for the port's signal type) to ensure contrast against the light background. The text SHALL be:
- Horizontally centered within the tab
- Vertically positioned at 60% of `TAB_D` from the closed/outer end (i.e., `y = TAB_D * 0.6`), biasing toward the attachment edge so the label sits clear of the arc region
- `font-family: config.fontFamily` (sans-serif)
- `font-size: config.fontSize − 2`
- `font-weight: bold`
- **Always rendered upright** regardless of the tab group's rotation. For a `bottom`-edge tab (group rotation 180°) the `<text>` element SHALL carry a `transform="rotate(180, tabLength/2, TAB_D * 0.6)"` counter-rotation so that the glyphs appear in the same reading direction as tabs on other edges.

#### Scenario: Audio tab label uses dark orange text

- **WHEN** a port with signal type `audio` and label `IN` is rendered
- **THEN** the label text fill SHALL be `hsl(25, 100%, 20%)`
- **THEN** the text SHALL be positioned at x = `tabLength / 2`, y = `TAB_D * 0.6` in canonical tab space

#### Scenario: Tab label text size is slightly smaller than node name

- **WHEN** the default `fontSize` is 18
- **THEN** the tab label font size SHALL be 16 (= 18 − 2)

#### Scenario: Bottom tab label renders upright

- **WHEN** a port on the `bottom` edge of a node is rendered
- **THEN** the tab group SHALL have rotation 180° applied via its `transform` attribute
- **THEN** the `<text>` element inside that group SHALL have `transform="rotate(180, <cx>, <cy>)"` where `<cx> = tabLength/2` and `<cy> = TAB_D * 0.6`
- **THEN** the rendered label glyphs SHALL appear upright (not upside-down) to the viewer

#### Scenario: Top/left/right tab labels have no counter-rotation

- **WHEN** a port on the `top`, `left`, or `right` edge of a node is rendered
- **THEN** the `<text>` element inside the tab group SHALL NOT have any additional rotation transform

---

### Requirement: Port tab is oriented by rotating a canonical form to match the port's side

The tab SHALL be constructed in a canonical orientation (width = `tabLength` horizontal, height = `TAB_D` vertical, open side at bottom, outer thick edge at right) and rendered via an SVG `<g transform>` element that rotates and translates the canonical tab to the correct position and orientation for the port's edge side. The midpoint of the canonical open edge (`tabLength/2`, `TAB_D`) SHALL coincide with the port anchor point `(bx, by)` after the transform.

The transform applied is: `translate(bx, by) rotate(angle) translate(-tabLength/2, -TAB_D)`
where `angle` is: `top` → 0°, `bottom` → 180°, `left` → −90°, `right` → 90°.

#### Scenario: Left-side port tab extends to the left of the node

- **WHEN** a port on the `left` side of a node is rendered
- **THEN** the rendered tab SHALL extend outward to the left from the node's left edge
- **THEN** the tab's open/attachment side SHALL face the node's left edge

#### Scenario: Right-side port tab extends to the right of the node

- **WHEN** a port on the `right` side of a node is rendered
- **THEN** the rendered tab SHALL extend outward to the right from the node's right edge
- **THEN** the tab's open/attachment side SHALL face the node's right edge

#### Scenario: Tab is centred on the port anchor

- **WHEN** a port tab is rendered for a port at anchor position (bx, by)
- **THEN** the midpoint of the tab's along-edge dimension SHALL coincide with (bx, by)

---

### Requirement: Lone top or bottom port tab is widened by 40%

When a port on the `top` or `bottom` edge of a node is the **only** port on that edge, its tab length SHALL be `Math.round(TAB_L × 1.4)` (currently 80 px) rather than the standard `TAB_L`. Ports on `left` or `right` edges, and top/bottom ports that share their edge with another port, SHALL always use the standard `TAB_L`.

#### Scenario: Lone top port tab is wider than standard

- **WHEN** a node has exactly one port on its top edge
- **THEN** that tab's along-edge length SHALL be `Math.round(TAB_L × 1.4)` = 80 px

#### Scenario: Multiple top-edge ports use standard width

- **WHEN** a node has two or more ports on its top edge
- **THEN** each tab's along-edge length SHALL be the standard `TAB_L` = 57 px

#### Scenario: Left/right ports are never widened

- **WHEN** a node has exactly one port on its left or right edge
- **THEN** that tab's along-edge length SHALL be the standard `TAB_L` = 57 px

---

### Requirement: Port tab colours are derived from signal type HSL formula, not from themeVariables

Port tab band fills SHALL be determined exclusively by the signal type's HSL formula (hue H per signal type, S=100%, L∈{80, 60, 40, 20} for background through outermost band). No `themeVariables` key — including `secondaryColor` — SHALL affect port tab colouring. The `simplifiedTabs` flag (set to `true` by the neutral theme palette) is the only mechanism that alters tab colour derivation.

#### Scenario: Port tab colours are unaffected by themeVariables.secondaryColor

- **WHEN** `mermaid.initialize({ themeVariables: { secondaryColor: '#ff0000' } })` is called
- **THEN** port tab fills SHALL use the signal-type HSL formula as specified in the base spec, with no influence from `secondaryColor`

#### Scenario: Audio port tab background uses HSL(25, 100%, 80%) on default theme

- **WHEN** `mermaid.initialize({ theme: 'default' })` is called and a port with signal type `audio` is rendered
- **THEN** the tab background fill SHALL be `hsl(25, 100%, 80%)` regardless of any `themeVariables` set
