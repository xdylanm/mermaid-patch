## 1. ASAP Column Computation (pre-ELK)

- [x] 1.1 Before calling `buildGraph()`, iterate `ast.connections` (excluding dangling, broken) to build a forward-edge adjacency list
- [x] 1.2 Run topological BFS (Kahn's algorithm) over the forward-edge graph to compute `asap[v]` for every node — sources get 0, others get max(asap[predecessor]) + 1

## 2. Connection Pre-Sort by Topological Order

- [x] 2.1 Sort `ast.connections` by `(asap[from] asc, asap[to] desc, fromName asc, toName asc)` before building the ELK graph
- [x] 2.2 Dangling connections (missing `from` or `to`) and broken connections shall sort last (treat absent ASAP as ∞)
- [x] 2.3 Verify the sort is fully deterministic: same input topology always produces the same edge order regardless of connection declaration order in the source text

## 3. ELK Pass 1 with NETWORK_SIMPLEX Layering

- [x] 3.1 Pass 1 uses `NETWORK_SIMPLEX` layering (unchanged from existing code); confirm no `ALAP` or `INTERACTIVE` strategy is applied to Pass 1
- [x] 3.2 Remove any y-snap post-processing pass (was a workaround for `LINEAR_SEGMENTS` imprecision — no longer needed)

## 4. Remove Linear Segments Node Placement Option

- [x] 4.1 Remove `'linear-segments': 'LINEAR_SEGMENTS'` from `NPS_MAP` in `buildGraph()`
- [x] 4.2 Remove the `linear-segments` comment from `buildElkLayout`'s parameter docs
- [x] 4.3 Remove the "Linear Segments" radio button from `scratch/index.html`

## 5. Testing

- [x] 5.1 Run the existing test suite (`npm test`) and confirm no regressions in `patchDiagramParser.test.js`, `anySignalType.test.js`, `portFiltering.test.js`, and `layoutInspection.test.js`
- [x] 5.2 `layoutInspection.test.js` — 107.1 default pipeline: 0 crossings, `env1` not sandwiched between `osc1` and `lfo1`, all column assignments correct
- [x] 5.3 `layoutInspection.test.js` — 107.4 default pipeline: peak rows ≤ 10, source nodes in ≥ 2 columns, ≤ 1 crossing (documented as topological)
