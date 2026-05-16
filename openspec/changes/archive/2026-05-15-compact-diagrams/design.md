## Context

The patch diagram renderer positions nodes using ELK and then renders the result as SVG. Two constants in `src/layout.ts` control whitespace:

- `SVG_PAD = 80` — padding added around the entire diagram bounding box before the SVG `viewBox` is computed. Currently 80 px, which is visually generous on all diagram sizes.
- `LAYER_GAP = 25` — horizontal spacing between adjacent node columns, passed to ELK as `elk.layered.spacing.edgeNodeBetweenLayers`. At 25 px this leaves a noticeable gap between columns that could be tightened without crowding connectors.

There are no user-facing config options for these values today; they are internal constants. Changing them is a purely additive visual change with no schema or API impact.

## Goals / Non-Goals

**Goals:**
- Reduce `SVG_PAD` from 80 px to ~40 px, eliminating excess border whitespace.
- Reduce `LAYER_GAP` from 25 px to ~17–18 px (~30% reduction), bringing columns closer together.
- Keep changes minimal and confined to the two constants and their spec requirements.

**Non-Goals:**
- Making padding or column gap user-configurable (possible future work, out of scope here).
- Changing vertical node gap (`NODE_GAP`), box dimensions, or any other layout parameter.
- Changing connector routing, tab geometry, or rendering logic.

## Decisions

### Decision: Adjust constants directly, no new config surface

**Chosen:** Change `SVG_PAD` and `LAYER_GAP` in `src/layout.ts` directly.

**Alternatives considered:**
- Expose as user config keys on `PatchConfig` — adds complexity (validation, docs, defaults management) that isn't justified for a visual tweak. Deferred to a future change if demand arises.
- Derive from `fontSize` or `BOX_W` — adds indirection with no clear benefit; the constants are independent of font/box geometry.

**Rationale:** The simplest change that achieves the goal. Constants are already named and grouped; adjusting their values is low-risk and immediately reviewable.

### Decision: Target values — SVG_PAD ≈ 40 px, LAYER_GAP ≈ 17 px

**Chosen:** `SVG_PAD = 40`, `LAYER_GAP = 17`.

**Rationale:**
- 40 px for padding leaves a comfortable margin at all diagram sizes and is a round number easy to revisit.
- 17 px for layer gap is a ~32% reduction from 25 px. At this value, connectors between adjacent columns still have enough horizontal clearance that they don't visually merge with node outlines (`STUB = 36` px stub extends further than the gap, so connector stubs are never in danger of overlap).

**Open:** Exact values marked TBD in proposal; final values to be confirmed during implementation via visual review.

## Risks / Trade-offs

- **Connectors may feel crowded on tall, dense columns** → Mitigation: `NODE_GAP` is unchanged at 16 px, and `STUB` (36 px) is larger than `LAYER_GAP`, so connector lines always have room to extend horizontally without clipping the adjacent node.
- **Snapshot / regression tests will need updating** → Mitigation: No pixel-snapshot tests exist; layout unit tests check grid positions not absolute pixel coordinates, so they are unaffected.
- **Reduced padding may clip long dangling-connector stubs on edge nodes** → Mitigation: `DANGLING_LEN = 60` px; with `SVG_PAD = 40` the dangling stub still fits if the node is at column 0 with the stub pointing left. The SVG `viewBox` is computed from layout bounds plus padding, so the stub is captured regardless.
