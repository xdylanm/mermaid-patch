## 1. Palette constants in config.ts

- [x] 1.1 Add `fontFamily: string` and `fontSize: number` to `MonotrailConfig` interface with defaults `'Arial, sans-serif'` and `18`
- [x] 1.2 Add `DARK_CONFIG: MonotrailConfig` constant with: signal colours identical to `DEFAULT_CONFIG`, `nodeBodyFill: '#e8e8e8'`, `nodeBodyText: '#111111'`, `nodeHeaderFill: '#2a2a2a'`, `nodeHeaderText: '#eeeeee'`, `nodeBorderColor: '#555555'`, `background: '#1e1e2e'`, `fontFamily: 'Arial, sans-serif'`, `fontSize: 18`
- [x] 1.3 Add `NEUTRAL_CONFIG: MonotrailConfig` constant with: `audioColor: '#a0a0a0'`, `cvColor: '#888888'`, `voctColor: '#b0b0b0'`, `gateColor: '#c8c8c8'`, `anyColor: '#888888'`, `defaultColor: '#888888'`, `nodeHeaderFill: '#f0f0f0'`, `nodeHeaderText: '#222222'`, `nodeBodyFill: '#d0d0d0'`, `nodeBodyText: '#333333'`, `nodeBorderColor: '#999999'`, `background: '#f5f5f5'`, `fontFamily: 'Arial, sans-serif'`, `fontSize: 18`, layout options same as `DEFAULT_CONFIG`
- [x] 1.4 Export both `DARK_CONFIG` and `NEUTRAL_CONFIG` from `config.ts`
- [x] 1.5 Add `fontFamily` and `fontSize` to `DEFAULT_CONFIG` (`'Arial, sans-serif'` and `18`)

## 2. Config resolution in db.ts

- [x] 2.1 Import `DARK_CONFIG` and `NEUTRAL_CONFIG` from `config.ts`; use `mermaid.mermaidAPI.getConfig()` directly (the injected `getConfig` from `mermaidUtils` is never called for external diagrams)
- [x] 2.2 In `resolvedConfig()`, replace the current `isDark` / `darkOverride` logic with a palette lookup: `'dark'` → `DARK_CONFIG`, `'neutral'` → `NEUTRAL_CONFIG`, otherwise `DEFAULT_CONFIG`
- [x] 2.3 After selecting the palette, build a `themeVarOverride` partial by reading from `mermaidConf.themeVariables`: `background`, `fontFamily`, `fontSize` apply for all themes; node chrome vars (`primaryColor` → `nodeHeaderFill`, `primaryTextColor` → `nodeHeaderText`, `primaryBorderColor` → `nodeBorderColor`, `secondaryColor` → `nodeBodyFill`, `secondaryTextColor` → `nodeBodyText`) apply only when theme is `'dark'` or `'neutral'` — Mermaid auto-populates themeVariables for the default theme, which would otherwise stomp the Monotrail default palette
- [x] 2.4 Merge order: `palette ← themeVarOverride ← userOverride`; `userOverride` is built by explicitly picking only the allowed non-colour keys (`background`, `fontFamily`, `fontSize`, `portPlacement`, `nodePlacementStrategy`) — colour keys in `monotrail.*` are silently ignored

## 3. Renderer — use config font values

- [x] 3.1 In `renderNodeBox()`, replace hardcoded `'Arial, sans-serif'` with `config.fontFamily` and `'18'` with `String(config.fontSize)` for both the header name text and the body label text
- [x] 3.2 In `badgeLabel()` (port badge text), replace `'Arial, sans-serif'` with `config.fontFamily` and `'15'` with `String(Math.max(10, config.fontSize - 3))` — add `config: MonotrailConfig` parameter and thread it through `renderNodeBadges()`
- [x] 3.3 In `renderDangling()` and `renderDanglingTo()`, replace `'Arial, sans-serif'` with `config.fontFamily` and `'15'` with `String(Math.max(10, config.fontSize - 3))`
- [x] 3.4 In `renderElkEdge()`, replace `'Arial, sans-serif'` with `config.fontFamily` and `'13'` with `String(Math.max(10, config.fontSize - 5))` — add `config: MonotrailConfig` parameter and thread it through the call site

## 4. Update demo

- [x] 4.1 Replace the dark/light binary checkbox toggle with a `<select>` offering `dark` (default selected), `default`, and `neutral` options; add an import map so the plugin bundle's `import 'mermaid'` resolves to the same CDN instance as the demo script

## 5. Update docs

- [x] 5.1 In `docs/config.md`, document that `theme: 'neutral'` activates the grayscale palette (table of theme → signal colours / node body / canvas background)
- [x] 5.2 Document that `themeVariables.background` is read and applied as the canvas background colour
- [x] 5.3 Update the dark mode section to note that signal colours are unchanged from default in the dark palette
- [x] 5.4 Add a section documenting all supported `themeVariables` keys: `background`, `fontFamily`, `fontSize`, `primaryColor`, `primaryTextColor`, `primaryBorderColor`, `secondaryColor`, `secondaryTextColor` (with note that chrome vars are only applied for non-default themes)

## 6. Validate

- [x] 6.1 Run `openspec validate --specs --no-interactive` and confirm all specs pass (6/6 passed)
- [x] 6.2 Build the package (`npm run build`) and confirm no TypeScript errors
- [x] 6.3 Test the demo in a browser: verify default, dark, and neutral themes render correctly with expected colours
