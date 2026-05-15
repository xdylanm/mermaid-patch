# Spec: Node Box Style

## Purpose

Defines the visual appearance of the node box — the rectangular SVG element that represents a module. The design uses a single unified region with a light background and three concentric band pairs (banded-frame style) replacing the legacy header/body two-rectangle layout.

## Requirements

### Requirement: Node box uses a 16:9 aspect ratio

The node box SHALL have a width-to-height ratio of 16:9. The default dimensions SHALL be `BOX_W = 144` and `BOX_H = 81`. The previous header/body height split (`BOX_TOP_H`, `BOX_BOT_H`) is eliminated; the box is a single unified region.

#### Scenario: Node box dimensions are 144×81

- **WHEN** any node is rendered
- **THEN** the bounding rectangle of the node box SHALL be exactly 144 units wide and 81 units tall

---

### Requirement: Node box renders a light-grey background fill

The renderer SHALL draw a background rectangle filling the entire node box (width × height) with the `nodeBgColor` colour (default: `hsl(0,0%,80%)` = `#cccccc`). This rectangle forms the visible background in the centre of the box where no band overlaps it.

#### Scenario: Default background fill is light grey

- **WHEN** no `patch.nodeBgColor` is set
- **THEN** the background rectangle fill SHALL be `#cccccc`

#### Scenario: Custom nodeBgColor overrides the background

- **WHEN** `patch: { nodeBgColor: '#e0e0e0' }` is configured
- **THEN** the background rectangle fill SHALL be `#e0e0e0`

---

### Requirement: Node box renders three concentric band pairs with decreasing luminance

The renderer SHALL draw three band pairs (six `<path>` elements total) layered over the background. From innermost to outermost:

- Band 1 (inner): colour `nodeBandLight` (default `#999999`, L=60)
- Band 2 (middle): colour `nodeBandMid` (default `#666666`, L=40)
- Band 3 (outer): colour `nodeBandDark` (default `#333333`, L=20)

Each band pair consists of two paths sharing the same fill colour:
- An **r-path** covering the top edge and right edge
- An **l-path** covering the left edge and bottom edge

The bands SHALL be drawn in order from innermost (lightest) to outermost (darkest) so that darker bands visually frame lighter ones.

#### Scenario: Default band colours form a greyscale gradient

- **WHEN** no band colour overrides are set
- **THEN** the three band pairs SHALL be filled with `#999999`, `#666666`, and `#333333` from innermost to outermost respectively

#### Scenario: Band pair fills match configured colours

- **WHEN** `patch: { nodeBandDark: '#1a1a1a' }` is configured
- **THEN** the outermost band pair SHALL be filled with `#1a1a1a`

---

### Requirement: Band thickness scales with box dimensions

`BAND_STEP_H` and `BAND_STEP_V` SHALL be exported named constants in `layout.ts`. Each band SHALL occupy approximately 5% of the box width per side horizontally (`BAND_STEP_H ≈ BOX_W × 0.05`) and approximately 2% of the box height per side vertically (`BAND_STEP_V ≈ BOX_H × 0.02`), with a minimum value of 1 px for `BAND_STEP_V`.

#### Scenario: Default band step values meet per-band targets

- **WHEN** any node is rendered at default box dimensions (144×81)
- **THEN** `BAND_STEP_H` SHALL be approximately 7 px (≈ 5% of 144)
- **THEN** `BAND_STEP_V` SHALL be approximately 1.6 px (≈ 2% of 81) and no less than 1 px

#### Scenario: Total band depth across three steps

- **WHEN** any node is rendered at default box dimensions
- **THEN** the total band depth on the right edge SHALL be approximately 21 px (3 × BAND_STEP_H)
- **THEN** the total band depth on the top edge SHALL be approximately 4.9 px (3 × BAND_STEP_V)

---

### Requirement: Band corners follow the arc/sharp pattern

Each band's r-path SHALL have a **curved arc** at the **top-right** corner (transitioning smoothly from the horizontal top edge to the vertical right edge using a cubic bezier) and a **sharp corner** at the **bottom-right** (a direct right-angle join). Each band's l-path SHALL have a **curved arc** at the **bottom-left** corner and a **sharp corner** at the **top-left**.

#### Scenario: Top-right and bottom-left corners are rounded

- **WHEN** the node box SVG is inspected
- **THEN** the r-path at the top-right corner SHALL use a bezier curve command (C or c) to transition between edges
- **THEN** the l-path at the bottom-left corner SHALL use a bezier curve command (C or c) to transition between edges

#### Scenario: Top-left and bottom-right corners are sharp

- **WHEN** the node box SVG is inspected
- **THEN** the r-path SHALL terminate at the top-left corner with a straight horizontal segment
- **THEN** the l-path SHALL terminate at the bottom-right corner with a straight horizontal segment

---

### Requirement: Node name text is bold, all-caps, sans-serif, and horizontally centred

The node name (module type identifier) SHALL be rendered as:
- Font family: sans-serif (via `config.fontFamily`)
- Font weight: bold
- Letter case: all-caps (uppercase transform of the source string)
- Horizontal alignment: centred at `x + BOX_W / 2` with `text-anchor: middle`
- Colour: `nodeNameColor`

#### Scenario: Node name renders in bold all-caps

- **WHEN** a node with `moduleType = "Oscillator"` is rendered
- **THEN** the displayed text SHALL be `OSCILLATOR` in bold sans-serif

#### Scenario: Node name is horizontally centred

- **WHEN** any node is rendered
- **THEN** the node name text element SHALL have `text-anchor="middle"` and its x coordinate SHALL be `nodeX + BOX_W / 2`

---

### Requirement: Node name is vertically centred when no label is present

When the node has no label, the node name SHALL be positioned at the vertical centre of the box: `y + BOX_H / 2`.

#### Scenario: No-label node name at vertical centre

- **WHEN** a node with no label is rendered
- **THEN** the node name text element SHALL have a y coordinate of `nodeY + BOX_H / 2` and `dominant-baseline: middle`

---

### Requirement: Node name shifts above centre when a label is present

When the node has a label, the node name SHALL be positioned above centre at `y + BOX_H × 0.42` and the label SHALL be positioned below centre at `y + BOX_H × 0.62`.

#### Scenario: Node name and label are vertically offset from centre

- **WHEN** a node with label `"Wavetable"` is rendered
- **THEN** the node name text y coordinate SHALL be approximately `nodeY + 34` (0.42 × 81)
- **THEN** the label text y coordinate SHALL be approximately `nodeY + 50` (0.62 × 81)

---

### Requirement: Node label is sans-serif, smaller font, and horizontally centred

When present, the label SHALL be rendered as:
- Font family: sans-serif (via `config.fontFamily`)
- Font weight: normal
- Font size: `config.fontSize - 2`
- Horizontal alignment: centred at `x + BOX_W / 2` with `text-anchor: middle`
- Colour: `nodeLabelColor`

#### Scenario: Label uses smaller font than node name

- **WHEN** a node with a label is rendered
- **THEN** the label text element font-size SHALL be `config.fontSize - 2`
- **THEN** the label SHALL NOT use font-weight bold

#### Scenario: Label is horizontally centred

- **WHEN** a node with a label is rendered
- **THEN** the label text element SHALL have `text-anchor="middle"` and its x coordinate SHALL be `nodeX + BOX_W / 2`

---

### Requirement: themeVariables node chrome variables map to banded-frame palette colours

The standard Mermaid `themeVariables` keys for node chrome SHALL map to the banded-frame palette as follows (precedence: palette default → themeVariable → explicit `patch.*`):

- `primaryColor` → `nodeBgColor` (node background fill, the L=80-equivalent central region)
- `primaryTextColor` → `nodeNameColor` (module name text colour)
- `primaryBorderColor` → `nodeBandDark` (outermost / darkest band pair fill)
- `secondaryTextColor` → `nodeLabelColor` (optional module label text colour)

The legacy `secondaryColor` → port area background mapping is REMOVED. Port tab colours are derived exclusively from the signal type's HSL formula (see `node-port-tab-style` spec) and are NOT affected by any `themeVariables` key.

#### Scenario: primaryColor sets the node background fill

- **WHEN** `mermaid.initialize({ themeVariables: { primaryColor: '#d4d4d4' } })` is called
- **THEN** the node background rectangle fill SHALL be `#d4d4d4`

#### Scenario: primaryBorderColor sets the outermost band colour

- **WHEN** `mermaid.initialize({ themeVariables: { primaryBorderColor: '#1a1a1a' } })` is called
- **THEN** the outermost band pair (r-path and l-path) fill SHALL be `#1a1a1a`

#### Scenario: secondaryColor is ignored for port tab colouring

- **WHEN** `mermaid.initialize({ themeVariables: { secondaryColor: '#abcdef' } })` is called
- **THEN** port tab fills SHALL be determined solely by signal type and the HSL tab colour formula, unaffected by `secondaryColor`
