# Spec: Diagram Legend

## Purpose

Defines the optional signal-type colour legend overlay for patch diagrams. When enabled, the legend renders four signal-type rows (Audio, CV, V/oct, Gate) as thick coloured horizontal lines with labels, positioned in a configurable corner of the SVG. The legend is controlled by `patch.legend` and `patch.legendPosition` keys passed to `mermaid.initialize()`.

## Requirements

### Requirement: Legend is rendered when `legend` config is true

When the `patch` Mermaid config includes `legend: true`, the renderer SHALL append a legend SVG group (`class="patch-legend"`) to the rendered SVG. The legend SHALL contain one row for each of the four concrete signal types: `audio`, `cv`, `voct`, and `gate`. Each row SHALL consist of a horizontal line coloured with the signal-type HSL colour at 2× the connector stroke width (4 px), followed by the human-readable label to the right: `Audio`, `CV`, `V/oct`, `Gate`.

The legend group SHALL have no background rect, border, or title element.

When `legend` is absent or `false`, no legend group SHALL be appended.

#### Scenario: Legend renders four signal-type rows

- **WHEN** `mermaid.initialize({ patch: { legend: true } })` is called and a patch diagram is rendered
- **THEN** the SVG SHALL contain a `<g class="patch-legend">` element with exactly four `<line>` elements coloured `hsl(25,100%,40%)`, `hsl(200,100%,40%)`, `hsl(100,100%,40%)`, and `hsl(300,100%,40%)`
- **AND** each line SHALL have `stroke-width="4"`
- **AND** four `<text>` elements SHALL be present with text content `Audio`, `CV`, `V/oct`, `Gate` respectively

#### Scenario: No legend when `legend` is false

- **WHEN** `mermaid.initialize({ patch: { legend: false } })` is called and a patch diagram is rendered
- **THEN** the SVG SHALL NOT contain any element with `class="patch-legend"`

#### Scenario: No legend when `patch` config has no `legend` key

- **WHEN** the `patch` config key is omitted entirely from `mermaid.initialize()`
- **THEN** the SVG SHALL NOT contain any element with `class="patch-legend"`

---

### Requirement: Legend is positioned in the specified corner

The `legendPosition` config key SHALL accept one of four string values: `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`. When `legend` is `true` and `legendPosition` is set, the legend group SHALL be translated so that the legend bounding box is inset by `SVG_PAD` from the corresponding corner of the SVG viewport.

When `legendPosition` is absent or unrecognised, it SHALL default to `'top-right'`.

#### Scenario: Legend defaults to top-right corner

- **WHEN** `legend: true` is set and `legendPosition` is not specified
- **THEN** the legend group `transform` attribute SHALL position it at the top-right of the SVG, inset by `SVG_PAD` pixels from the right and top edges

#### Scenario: Legend placed in top-left corner

- **WHEN** `legend: true` and `legendPosition: 'top-left'` are set
- **THEN** the legend group `transform` attribute SHALL position it at the top-left of the SVG, inset by `SVG_PAD` pixels from the left and top edges

#### Scenario: Legend placed in bottom-right corner

- **WHEN** `legend: true` and `legendPosition: 'bottom-right'` are set
- **THEN** the legend group `transform` attribute SHALL position it at the bottom-right of the SVG, inset by `SVG_PAD` pixels from the right and bottom edges

#### Scenario: Legend placed in bottom-left corner

- **WHEN** `legend: true` and `legendPosition: 'bottom-left'` are set
- **THEN** the legend group `transform` attribute SHALL position it at the bottom-left of the SVG, inset by `SVG_PAD` pixels from the left and bottom edges

#### Scenario: Invalid `legendPosition` value falls back to top-right

- **WHEN** `legendPosition` is set to an unrecognised string (e.g. `'center'`)
- **THEN** the legend SHALL be rendered in the `top-right` position

---

### Requirement: Legend config keys are accepted from the `patch` user config

The `db.ts` config resolver SHALL read `legend` (boolean) and `legendPosition` (string, validated to the four accepted values) from the user-supplied `patch` key of `mermaid.initialize()`. Both keys SHALL be ignored if absent; `legend` defaults to `false` and `legendPosition` defaults to `'top-right'`.

#### Scenario: `legend: true` propagates through config resolver

- **WHEN** `mermaid.initialize({ patch: { legend: true } })` is called
- **THEN** `db.getConfig().legend` SHALL be `true`

#### Scenario: `legendPosition` propagates through config resolver

- **WHEN** `mermaid.initialize({ patch: { legend: true, legendPosition: 'bottom-left' } })` is called
- **THEN** `db.getConfig().legendPosition` SHALL be `'bottom-left'`

#### Scenario: Non-string or invalid `legendPosition` is ignored

- **WHEN** `mermaid.initialize({ patch: { legend: true, legendPosition: 42 } })` is called
- **THEN** `db.getConfig().legendPosition` SHALL be `'top-right'`
