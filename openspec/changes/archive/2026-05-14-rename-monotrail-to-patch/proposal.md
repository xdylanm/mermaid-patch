## Why

The module was originally developed under the internal codename "Monotrail", which is now leaking into all public-facing APIs, documentation, and identifiers. The name should be replaced with the generic term "patch" (as in "patch diagram") so the library has a neutral, descriptive identity that is not tied to any internal project name.

## What Changes

- **BREAKING** Rename npm package from `mermaid-monotrail` to `mermaid-patch`
- **BREAKING** Rename Mermaid diagram type keyword from `monotrail` to `patch` (the first line of a diagram block changes from `monotrail` to `patch`)
- **BREAKING** Rename `mermaid.initialize()` config group key from `monotrail` to `patch`
- Rename internal TypeScript types: `MonotrailAST` → `PatchAST`, `MonotrailConfig` → `PatchConfig`, `MonotrailDB` → `PatchDB`
- Rename internal function `parseMonotrail` → `parsePatch`
- Rename grammar source file `monotrail.ne` → `patch.ne` and compiled output `monotrail.grammar.js` → `patch.grammar.js`
- Rename SVG CSS class names: `monotrail-edges`, `monotrail-badges`, `monotrail-nodes`, `monotrail-warnings` → `patch-edges`, `patch-badges`, `patch-nodes`, `patch-warnings`
- Rename exported constant and default export in `detector.ts` from `monotrail` to `patch`
- Update all doc strings, comments, log messages, and documentation to remove "Monotrail" references
- Update `README.md`, `docs/usage.md`, `docs/config.md` to use "patch diagram" terminology
- Update `package.json` metadata (name, description, module paths, keywords)
- Update `vite.config.ts` output filename reference
- Update `scripts/compileGrammar.cjs` paths and log messages
- Update `.gitignore` comments

## Capabilities

### New Capabilities
<!-- none — this is a pure rename -->

### Modified Capabilities

- `diagram-schema`: The diagram keyword changes from `monotrail` to `patch` — this is a breaking change to the diagram grammar's start token
- `mermaid-extension`: The config key exposed via `mermaid.initialize()` changes from `monotrail` to `patch`, and the npm package name changes

## Impact

- **Breaking for users**: existing diagrams using `monotrail` as the first line must be updated to `patch`; existing `mermaid.initialize({ monotrail: { … } })` calls must change to `patch`
- **Breaking for importers**: the npm package name changes from `mermaid-monotrail` to `mermaid-patch`; import paths and CDN URLs change accordingly
- **Internal only** (no user impact): TypeScript type names, internal function names, grammar file names, SVG class names
- No runtime logic, layout, rendering, or feature behavior changes
