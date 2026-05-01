## Context

`renderPatchDiagram.js` uses ELK's `layered` algorithm with `NETWORK_SIMPLEX` layering. The original pipeline ran a single ELK pass and used declaration order for port faces; a custom slot-reordering step unwound fan-out crossings; a second ELK pass re-ran with corrected port slot positions.

The 107.1 test diagram exhibited a connector crossing: `env1:decay → vca1:CV` crossed `lfo1:sine → lpf1:freq2`. Root-cause analysis showed this was not a port-assignment problem — it was a crossing-minimiser seeding problem. ELK's barycenter heuristic is a local-improvement algorithm that converges to different local minima depending on the order in which edges appear in the graph input. Feeding edges in declaration order (which is arbitrary from the user's perspective) gives a non-deterministic layout that can land in a crossing local minimum.

A second investigation (see `planning/layout-investigation-2026-04-28.md`) exhaustively tested all 720 permutations of node declaration order for the 107.1 diagram. Key findings:

- `NETWORK_SIMPLEX` is entirely deterministic w.r.t. **node** declaration order — every permutation produced the same layout.
- The layout *is* sensitive to **edge** (connection) declaration order. Different edge orderings produce different local minima for the crossing minimiser.
- Sorting `ast.connections` by topological order before building the ELK graph (so long-reach edges precede short-reach edges within each source layer) eliminates all 107.1 crossings for all 720 node-ordering permutations.
- An earlier ALAP-compact approach added ~350 lines of custom layout code (ASAP/ALAP computation, iterative migration, gap compaction, intermediate ELK pass, y-snap). The edge pre-sort achieves a better result with ~30 lines and no extra ELK passes.

## Goals / Non-Goals

**Goals:**
- Eliminate the 107.1 connector crossing, deterministically, regardless of how the user orders their connections or nodes in the source text.
- Keep source nodes from all landing in column 0 — `NETWORK_SIMPLEX` inherently spreads them across columns by minimising total edge span (unlike `ASAP` which places every source at column 0).
- Produce layouts that are input-order independent and reproducible.
- Keep ELK as the final arbiter of edge routing and crossing minimization.
- Introduce no new dependencies and change only `buildElkLayout`.

**Non-Goals:**
- Exact row uniformity — column height balance is ELK's responsibility under `NETWORK_SIMPLEX`.
- Port side reassignment — handled separately by the `elk-optimized` port placement pass (unchanged).
- Custom edge routing — all routing remains ELK's responsibility.
- Eliminating the residual 107.4 crossing — that crossing is topological (irreducible); `NETWORK_SIMPLEX` reduces it from 2 → 1.

## Decisions

### Decision 1: Connection pre-sort by topological edge order

**Chosen**: Before calling `buildGraph()`, compute `ASAP[v]` for every node by topological BFS over the forward connection graph. Then sort `ast.connections` by `(ASAP[from] asc, ASAP[to] desc, fromName, toName)`. Dangling and broken connections sort last.

The descending `ASAP[to]` tiebreaker is the critical detail: within a source layer, long-span connections (targets further to the right) precede short-span connections. This seeds ELK's crossing minimiser with the topologically most-distant connections first, placing long-reach nodes (e.g. `lfo1`) above short-reach nodes (e.g. `osc1`) in the same layer — the arrangement that avoids the `env1:decay → vca1:CV` crossing.

**Rationale**: Exhaustive testing (I-2 in the investigation) confirmed this sort eliminates all 107.1 crossings for all 720 node-declaration orderings. The fix is purely a pre-processing step: no additional ELK passes, no custom coordinate logic, no post-processing.

**Alternative considered**: ALAP-compact (iterative rightward migration of slack nodes between Pass 1 and Pass 2). Rejected — more complex (~350 lines), required an intermediate ELK pass for accurate y-positions, and a y-snap pass because `LINEAR_SEGMENTS` node placement gave imprecise row coordinates. Investigation showed the crossing in 107.1 was a port-assignment/edge-ordering issue, not a layering issue; ALAP-compact was solving the wrong problem.

**Alternative considered**: Sort edges by `topoIdx[from]` (Kahn's BFS index). Rejected — Kahn's BFS queue ordering depends on connection input order, so `topoIdx` was itself non-deterministic. Node names are stable identifiers and sufficient as a final tiebreaker.

---

### Decision 2: NETWORK_SIMPLEX layering as the universal default

**Chosen**: Use `NETWORK_SIMPLEX` layering unconditionally for Pass 1. Do not offer `ASAP`, `ALAP-compact`, or load-levelling as alternatives.

`NETWORK_SIMPLEX` minimises total weighted edge span, which naturally distributes source nodes across the available columns rather than piling them all at column 0. This is the compact layout behaviour the original design was seeking, without any custom migration code.

**Rationale**:
- Investigation I-3 shows `NETWORK_SIMPLEX` reduces 107.4 crossings from 2 → 1 (the remaining crossing is topological).
- Investigation I-4 shows ALAP-compact performs significantly worse on 107.4 (3–5 crossings vs. 1–2 for the current default). ALAP-compact should never be the universal default.
- `NETWORK_SIMPLEX` with edge pre-sort is deterministic for all tested diagrams.

**Alternative considered**: Expose `ALAP-compact` as a user-selectable layering strategy. Rejected — it produces worse results on larger diagrams (107.4) and the edge pre-sort makes it unnecessary for the problem it was solving.

---

### Decision 3: Brandes-Koepf as the default node placement strategy; remove Linear Segments

**Chosen**: Default to `BRANDES_KOEPF` node placement. Remove `LINEAR_SEGMENTS` from the available options.

**Rationale**: `LINEAR_SEGMENTS` was chosen in the ALAP-compact pipeline because it happened to place `lpf1` and `lfo1` in the same row. Investigation I-4 confirms this was an aesthetic preference, not a correctness requirement — `BRANDES_KOEPF` and `NETWORK_SIMPLEX` NPS both give 0 crossings for 107.1 under the edge pre-sort pipeline. `LINEAR_SEGMENTS` produces connections with small excursions (imprecise y-coordinates that required a y-snap post-processing step), which is undesirable.

**Alternative considered**: Keep `LINEAR_SEGMENTS` as an option. Rejected — it gives no correctness benefit over `BRANDES_KOEPF`, produces visual artefacts (wire excursions), and adds unnecessary code surface area.

---

### Decision 4: No y-snap post-processing

**Chosen**: Remove the y-snap pass (previously used to cluster nodes into approximate rows after `LINEAR_SEGMENTS` gave imprecise y-coordinates).

**Rationale**: `BRANDES_KOEPF` and `NETWORK_SIMPLEX` NPS both give row-aligned y-coordinates natively. The y-snap was a workaround for `LINEAR_SEGMENTS`'s imprecision, which is no longer needed once `LINEAR_SEGMENTS` is removed.

---

### Decision 5: INTERACTIVE layering in Pass 2 only when port faces change

**Chosen**: Pass 2 continues to use `INTERACTIVE` layering (with pass-1 x-positions as overrides) only when the `elk-optimized` port face redistribution changes at least one port's face (`facesChanged = true`). If faces do not change and no slot reorder occurred, Pass 2 is skipped entirely.

**Rationale**: This preserves the existing optimisation: Pass 2 is only invoked when the input to ELK has actually changed from Pass 1. The `INTERACTIVE` strategy reads x-positions to preserve the column layout established in Pass 1 while allowing ELK to re-route edges with the updated port faces.

## Risks / Trade-offs

**[Risk] 107.4 gains one row (7×9 → 7×10)** → Edge pre-sort is counterproductive for 107.4 without the sort: `brandes-koepf` achieves 7×9. With edge-sort, all NPS give 7×10. This is an acceptable trade-off: input-order independence is a correctness requirement; the extra row is a minor aesthetic regression. The crossing improvement (2 → 1) more than compensates.

**[Risk] The residual 107.4 crossing is topological** → Investigation I-4 confirms that every NPS gives exactly 1 crossing for 107.4 under `NETWORK_SIMPLEX` layering. No algorithm can eliminate it without re-routing edges around the outside of the diagram. This is documented as a known limitation.

**[Risk] ASAP BFS adds a small constant overhead** → The ASAP computation is O(N + E) over nodes and connections before any ELK call. For diagrams up to ~30 nodes this is negligible (<1 ms).

## Open Questions

- **Port side reassignment**: Could further reduce edge spans after the edge pre-sort. Deferred to a separate change.
- **D-3 (longer-term)**: Extract `buildElkLayout` into `layoutPatchDiagram.js` to separate layout from SVG rendering. Deferred — low risk but out of scope for this change.
