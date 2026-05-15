## 1. Renderer Update

- [x] 1.1 In `src/renderer.ts`, after building the `<text>` label element for a tab, add a `transform="rotate(180, <cx>, <cy>)"` attribute to that element when `side === 'bottom'` (where `cx = tabLength / 2` and `cy = TAB_D * 0.6`)

## 2. Spec Sync

- [x] 2.1 Apply the delta spec to `openspec/specs/node-port-tab-style/spec.md`: extend the "Tab label text is bold…" requirement with the upright-rendering clause and the two new scenarios (bottom counter-rotation; top/left/right no counter-rotation)

## 3. Verification

- [x] 3.1 Visually confirm in the demo that a bottom-edge port tab label reads upright after the change
- [x] 3.2 Confirm top, left, and right tab labels are visually unchanged
- [x] 3.3 Run the test suite (`npm test`) and verify no regressions
