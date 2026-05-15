## Context

`docs/config.md` documents how users configure patch diagram colours via Mermaid `themeVariables` and `patch.*` keys. The page was written when the node box used a two-rectangle header/body layout and port tabs were coloured via `themeVariables.secondaryColor`. Both of those designs have since been replaced by a unified banded-frame renderer (`src/renderer.ts`) backed by the `node-box-style` and `node-port-tab-style` specs. The documentation has drifted from the implementation.

## Goals / Non-Goals

**Goals:**
- Correct the **Themes** table (node body description and canvas background colour for every built-in theme).
- Correct the **Mermaid theme variables** mapping table and remove the obsolete `secondaryColor` row.
- Update the `themeVariables` code example to match the current API.

**Non-Goals:**
- Document every field in `PatchConfig` — only user-facing, documented surface is in scope.
- Change any source code.
- Update specs — specs in `openspec/specs/` are updated by a separate workflow.

## Decisions

### Use exact colour values from `src/config.ts` for the Themes table

The table cells should show the concrete defaults that come from `DEFAULT_CONFIG`, `DARK_CONFIG`, and `NEUTRAL_CONFIG` rather than prose descriptions. This keeps the docs testable: a reader can cross-reference values directly with the source.

**Alternatives considered:** English-only descriptions ("dark background, light bands") — rejected because they are ambiguous for implementors and do not match the precision used elsewhere in the docs.

### Remove `secondaryColor` from the theme variables table without a deprecation note

`secondaryColor` was never in a published release — this is an in-development project. No deprecation ceremony is warranted.

### Keep the `secondaryTextColor` row but correct its description

`themeVariables.secondaryTextColor` still maps to something useful (`nodeLabelColor`, the optional module label below the name text), so the row stays; only the "Affects" cell is updated.

## Risks / Trade-offs

- [Risk] The dark theme spec (`dark-theme/spec.md`) still uses old "nodeBodyFill / nodeHeaderFill" terminology that does not match the banded-frame design. → **Not in scope for this change** — spec corrections belong to a separate change; the docs update references `src/config.ts` as the ground truth.
- [Risk] Users who pinned a config referencing `secondaryColor` will silently lose that colour. → Acceptable: no released artefact existed.
