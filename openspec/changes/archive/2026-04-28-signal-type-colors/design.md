## Context

The patchDiagram renderer uses a color lookup table keyed by signal type to color port badges and connector wires. The current colors were chosen during initial implementation and do not match Monotrail's color palette. This change updates only those four color values.

## Goals / Non-Goals

**Goals:**
- Replace the four signal type hex color values with Monotrail equivalents
- Keep the spec and renderer in sync

**Non-Goals:**
- Adding new signal types
- Changing color assignment logic or port-side rules
- Any visual layout or rendering behavior changes

## Decisions

**Single source of change — the color table in `renderPatchDiagram.js`**

The renderer holds a map from signal type string to hex color. All four values are updated in place. No abstraction or theming layer is introduced; the change is purely a data update.

Alternatives considered: externalizing colors into a config file — rejected as over-engineering for a four-value update.

## Risks / Trade-offs

- [Visual regression] Snapshot or screenshot tests that assert on specific hex colors will fail → Update expected values in tests after changing the color table.
