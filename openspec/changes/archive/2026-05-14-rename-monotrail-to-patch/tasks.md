## 1. Grammar Source

- [x] 1.1 Rename `src/grammar/monotrail.ne` → `src/grammar/patch.ne`
- [x] 1.2 Update the first-line comment in `patch.ne` to reference "patch" instead of "Monotrail"
- [x] 1.3 Change the grammar start rule keyword from `"monotrail"` to `"patch"` in `patch.ne`
- [x] 1.4 Update `scripts/compileGrammar.cjs`: change input path to `src/grammar/patch.ne`, output path to `src/grammar/patch.grammar.js`, and log message
- [x] 1.5 Run `node scripts/compileGrammar.cjs` to regenerate the compiled grammar as `src/grammar/patch.grammar.js`
- [x] 1.6 Delete the old compiled file `src/grammar/monotrail.grammar.js`
- [x] 1.7 Update `.gitignore` comment to reference `patch.grammar.js` instead of `monotrail.grammar.js`

## 2. Core Source Files

- [x] 2.1 `src/types.ts`: rename `MonotrailAST` → `PatchAST`
- [x] 2.2 `src/config.ts`: rename `MonotrailConfig` → `PatchConfig`; update all comment references from "Monotrail" to "patch diagram" and `monotrail.*` to `patch.*`
- [x] 2.3 `src/parser.ts`: update grammar import to `./grammar/patch.grammar.js`; rename `parseMonotrail` → `parsePatch`; update comment references; update error message strings
- [x] 2.4 `src/db.ts`: update all `MonotrailAST` → `PatchAST`, `MonotrailConfig` → `PatchConfig`, `MonotrailDB` → `PatchDB` references; change config key read from `.monotrail` to `.patch`; update comment references
- [x] 2.5 `src/detector.ts`: rename exported constant `monotrail` → `patch`; update `id: 'monotrail'` → `id: 'patch'`; update detector regex to match `patch`; update comment and JSDoc references; update `export default` and named export
- [x] 2.6 `src/layout.ts`: update `MonotrailAST` → `PatchAST`, `MonotrailConfig` → `PatchConfig` references; rename `parseMonotrail` import → `parsePatch`; update comment references
- [x] 2.7 `src/renderer.ts`: update `MonotrailConfig` → `PatchConfig`, `MonotrailDB` → `PatchDB` references; rename SVG classes `monotrail-edges` → `patch-edges`, `monotrail-badges` → `patch-badges`, `monotrail-nodes` → `patch-nodes`, `monotrail-warnings` → `patch-warnings`; update log message strings
- [x] 2.8 `src/styles.ts`: rename CSS selectors `.monotrail-edges` → `.patch-edges`, `.monotrail-edges line` → `.patch-edges line`; update comment
- [x] 2.9 `src/mermaidUtils.ts`: update log message strings from "Monotrail:" to "Patch:"
- [x] 2.10 `src/diagram-definition.ts`: update comment reference from "Monotrail" to "patch diagram"

## 3. Package & Build Config

- [x] 3.1 `package.json`: rename `name` from `mermaid-monotrail` to `mermaid-patch`; update `description` to remove "Monotrail"; update `module` and `exports` entry paths from `mermaid-monotrail.core.mjs` to `mermaid-patch.core.mjs`; remove `monotrail` from `keywords` and add `patch`
- [x] 3.2 `vite.config.ts`: update the output filename from `mermaid-monotrail.core.mjs` to `mermaid-patch.core.mjs`

## 4. Documentation

- [x] 4.1 `README.md`: replace "Monotrail Patch Diagrams" heading with "Patch Diagrams"; update package name, import variable name, diagram keyword example, and all prose references
- [x] 4.2 `docs/usage.md`: update all `monotrail` keyword references in code fences; update npm package name; update CDN URLs; update import variable name and `registerExternalDiagrams` call
- [x] 4.3 `docs/config.md`: replace all `monotrail.*` config key references with `patch.*`; update prose descriptions; remove "Monotrail palette" → "patch diagram palette"

## 5. Tests & Fixtures

- [x] 5.1 `src/__tests__/parser.test.ts`: update any `monotrail` diagram keyword in fixture strings or inline diagram text to `patch`
- [x] 5.2 `src/__tests__/fixtures/*.txt`: update the first line of each fixture file from `monotrail` to `patch`
- [x] 5.3 `src/__tests__/anySignalType.test.ts`: update any `monotrail` diagram keyword references to `patch`
- [x] 5.4 `src/__tests__/layout.test.ts`: update any `monotrail` diagram keyword references to `patch`

## 6. Verification

- [x] 6.1 Run a workspace-wide case-insensitive search for "monotrail" and confirm zero matches outside git history
- [x] 6.2 Run `node scripts/compileGrammar.cjs` and confirm it exits successfully with the new paths
- [x] 6.3 Run the test suite and confirm all tests pass
