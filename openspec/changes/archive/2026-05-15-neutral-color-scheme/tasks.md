## 1. Config Changes

- [x] 1.1 Add `simplifiedTabs: boolean` field to the `PatchConfig` interface in `src/config.ts`
- [x] 1.2 Set `simplifiedTabs: false` in `DEFAULT_CONFIG`
- [x] 1.3 Set `simplifiedTabs: false` in `DARK_CONFIG`
- [x] 1.4 Update `NEUTRAL_CONFIG`: set all signal colours (`audioColor`, `cvColor`, `voctColor`, `gateColor`, `anyColor`, `defaultColor`) to `hsl(0,0%,20%)`
- [x] 1.5 Update `NEUTRAL_CONFIG`: set `nodeBgColor` to `hsl(0,0%,95%)`, `nodeBandLight` and `nodeBandMid` to `hsl(0,0%,95%)`, `nodeBandDark` to `hsl(0,0%,20%)`
- [x] 1.6 Update `NEUTRAL_CONFIG`: set `background` to `#ffffff`
- [x] 1.7 Update `NEUTRAL_CONFIG`: set `simplifiedTabs: true`

## 2. Renderer Changes

- [x] 2.1 In `renderPortTab` (`src/renderer.ts`), add a branch: when `config.simplifiedTabs` is `true`, bypass `tabColors()` and use `{ bg: config.nodeBgColor, light: config.nodeBgColor, mid: config.nodeBgColor, dark: config.nodeBandDark }` as the colour set
- [x] 2.2 In the simplified-tab path, ensure the port label text colour uses `config.nodeBandDark` instead of `colors.dark` from `tabColors()`

## 3. Spec Update

- [x] 3.1 Sync the delta spec (`openspec/changes/neutral-color-scheme/specs/neutral-theme/spec.md`) into the main spec at `openspec/specs/neutral-theme/spec.md` (will be done via `opsx:archive` or manual merge)

## 4. Verification

- [x] 4.1 Build the project (`npm run build`) and confirm no TypeScript errors
- [x] 4.2 Render a diagram with `theme: 'neutral'` and verify: only outer band visible on node boxes, port tabs show dark outer band with light background, connectors are dark grey, canvas is white
- [x] 4.3 Render a diagram with `theme: 'default'` and confirm appearance is unchanged (signal-type colours on port tabs and connectors)
- [x] 4.4 Run the test suite (`npm test`) and confirm all existing tests pass
