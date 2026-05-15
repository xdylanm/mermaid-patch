## MODIFIED Requirements

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
