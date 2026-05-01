## Why

Automatically generated patchDiagram layouts often have more empty space than necessary — source nodes with no inputs are placed in the leftmost column even when they could sit closer to their consumers, inflating the bounding box. The 107.4 test diagram uses a 9×5 grid for 16 blocks; the 107.1 test has a connector crossing caused by the same over-eager left-placement of a source node. Compacting layouts (while keeping crossing minimization as the top priority) makes diagrams easier to read and fit better in documentation contexts.

## What Changes

- A **connection pre-sort pass** is inserted at the start of `buildElkLayout` in `renderPatchDiagram.js`. It computes `ASAP[v]` for every node by topological BFS over the forward connection graph, then sorts `ast.connections` by `(ASAP[from] asc, ASAP[to] desc, fromName, toName)`. This seeds ELK's crossing minimiser in topological order, producing deterministic, input-order-independent layouts.
- `NETWORK_SIMPLEX` layering is used unconditionally for Pass 1. It minimises total edge span, naturally distributing source nodes across columns rather than piling them all at column 0.
- The `LINEAR_SEGMENTS` node placement option is removed; `BRANDES_KOEPF` remains the default.

## Capabilities

### New Capabilities
- `compact-diagram-layout`: Connection pre-sort by topological order that seeds ELK's crossing minimiser deterministically, eliminating the 107.1 crossing for all input orderings without additional ELK passes or custom coordinate logic.

### Modified Capabilities
*(none — no existing spec-level requirements change)*

## Impact

- `patchDiagram/renderPatchDiagram.js` — the `buildElkLayout` function gains the column reassignment pass and the Pass 2 layering strategy change.
- No changes to the parser, grammar, schema, or SVG rendering.
- No new dependencies — stays within ELK's existing API.
- Test diagrams 107.1 (crossing fix) and 107.4 (sparsity reduction) are the primary validation targets.
