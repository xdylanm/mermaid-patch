## 1. Update DEFAULT_CONFIG signal colours and background

- [x] 1.1 In `src/config.ts`, change `audioColor` in `DEFAULT_CONFIG` from `'#F07BAB'` to `'hsl(25, 100%, 40%)'`
- [x] 1.2 In `src/config.ts`, change `cvColor` in `DEFAULT_CONFIG` from `'#51A4DB'` to `'hsl(200, 100%, 40%)'`
- [x] 1.3 In `src/config.ts`, change `voctColor` in `DEFAULT_CONFIG` from `'#8BC640'` to `'hsl(100, 100%, 40%)'`
- [x] 1.4 In `src/config.ts`, change `gateColor` in `DEFAULT_CONFIG` from `'#F9AF3C'` to `'hsl(300, 100%, 40%)'`
- [x] 1.5 In `src/config.ts`, change `anyColor` and `defaultColor` in `DEFAULT_CONFIG` to `'hsl(0, 0%, 40%)'`
- [x] 1.6 In `src/config.ts`, change `background` in `DEFAULT_CONFIG` from `'#f0ede8'` to `'hsl(50, 100%, 95%)'`

## 2. Add rounded corners to connector polylines

- [x] 2.1 In `src/renderer.ts`, define a local constant `CONNECTOR_CORNER_R = 16`
- [x] 2.2 In `src/renderer.ts`, replace the `renderElkEdge` path-building logic: instead of joining all points with `L`, compute a rounded-corner path where each interior bend point is smoothed with a quadratic Bézier arc (`Q`) using `CONNECTOR_CORNER_R` clamped to half the length of the shorter adjacent segment
- [x] 2.3 Verify the arc clamping: for a bend where one adjacent segment length is less than `2 × CONNECTOR_CORNER_R`, confirm the offset uses `halfSegLen` rather than `CONNECTOR_CORNER_R`

## 3. Update spec files (main openspec/specs/)

- [x] 3.1 Apply the delta from `openspec/changes/connector-signal-colours/specs/connector-labels/spec.md` to `openspec/specs/connector-labels/spec.md` — update the three label-colour requirements with explicit HSL fill values
- [x] 3.2 Apply the delta from `openspec/changes/connector-signal-colours/specs/theme-variable-background/spec.md` to `openspec/specs/theme-variable-background/spec.md` — update the palette default background scenario value to `hsl(50, 100%, 90%)`
- [x] 3.3 Create `openspec/specs/connector-signal-colours/spec.md` from `openspec/changes/connector-signal-colours/specs/connector-signal-colours/spec.md`

## 4. Validation

- [x] 4.1 Run `npm run build` and confirm no TypeScript or build errors
- [x] 4.2 Open the demo and confirm audio connectors appear in orange-brown, cv in blue, voct in green, gate in purple, and unknown in grey
- [x] 4.3 Confirm connector polyline bends are visibly rounded at approximately 16 px radius
- [x] 4.4 Confirm connector wire labels and dangling stub labels use the same colour as the wire
- [x] 4.5 Confirm the default diagram background is a pale warm yellow (`hsl(50, 100%, 90%)`)
- [x] 4.6 Confirm DARK_CONFIG and NEUTRAL_CONFIG themes still render correctly (their signal colour overrides are unaffected)
