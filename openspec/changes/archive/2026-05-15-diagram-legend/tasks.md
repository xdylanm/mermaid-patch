## 1. Config & Types

- [x] 1.1 Add `legend: boolean` and `legendPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'` fields to `PatchConfig` interface in `src/config.ts`
- [x] 1.2 Set default values `legend: false` and `legendPosition: 'top-right'` in `DEFAULT_CONFIG`, `DARK_CONFIG`, and `NEUTRAL_CONFIG` in `src/config.ts`

## 2. Config Resolver

- [x] 2.1 In `src/db.ts` `resolvedConfig()`, read `raw['legend']` (boolean, default `false`) from the user's `patch` config key and assign to `userOverride.legend`
- [x] 2.2 In `src/db.ts` `resolvedConfig()`, read `raw['legendPosition']` and validate it against the four accepted values (`'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`); assign to `userOverride.legendPosition` only when valid

## 3. Legend Renderer

- [x] 3.1 In `src/renderer.ts`, add a `renderLegend()` function that builds and returns a `<g class="patch-legend">` SVG element containing four rows (audio, cv, voct, gate), each with a `<line stroke-width="4">` in the signal-type colour and a `<text>` label (`Audio`, `CV`, `V/oct`, `Gate`)
- [x] 3.2 In `renderLegend()`, compute row height as `config.fontSize * 1.6` and line width as `32` px, with a `10` px gap between line end and label
- [x] 3.3 In `renderLegend()`, accept `x` and `y` parameters and apply them via `transform="translate(x, y)"` on the group
- [x] 3.4 In `draw()`, after computing `svgWidth` and `svgHeight`, call `renderLegend()` when `config.legend` is `true`; compute the legend's total width (line width + gap + estimated text width using `7 × config.fontSize / 18` px per character) and total height (`rowH * 4`); then resolve the corner translation from `config.legendPosition` using `SVG_PAD` as the inset
- [x] 3.5 Append the legend group as the last child of the SVG (after the warnings panel)

## 4. Tests

- [x] 4.1 Add a unit test in `src/__tests__/` that calls `renderLegend()` (or inspects the rendered SVG) and asserts the four `<line>` elements with correct `stroke` colours and `stroke-width="4"`
- [x] 4.2 Add a test asserting no legend group is present when `legend` is `false` or absent
- [x] 4.3 Add a test asserting `legendPosition: 'bottom-left'` produces the correct `translate(x, y)` transform on the group

## 5. Documentation

- [x] 5.1 Update `docs/config.md` to document the `legend` and `legendPosition` config keys with types, defaults, and a short example
