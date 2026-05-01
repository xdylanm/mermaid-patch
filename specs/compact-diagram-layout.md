# Spec: Compact Diagram Layout

## Purpose

Defines the layout algorithm used to produce compact, crossing-minimal Monotrail diagrams. The layout uses a multi-pass ELK strategy seeded by a deterministic topological connection sort.

## Requirements

### Requirement: ASAP column computation from the connection graph

Before invoking ELK, the layout engine SHALL compute ASAP[v] (as-soon-as-possible column) for every node by topological BFS over the forward connection graph:

- Nodes with no incoming forward edges SHALL have `ASAP[v] = 0`.
- All other nodes SHALL have `ASAP[v] = max(ASAP[predecessor] + 1)` over all predecessor nodes reachable via forward edges.
- Dangling connections, broken connections, and back-edges SHALL be excluded from the traversal.
- The computation SHALL be performed before any ELK call, reading only the parsed `ast.connections`.

#### Scenario: Source node ASAP is 0
- **WHEN** a node has no incoming forward connections
- **THEN** `ASAP[v] = 0`

#### Scenario: Downstream node ASAP reflects longest path
- **WHEN** node v has predecessors in columns 0 and 1
- **THEN** `ASAP[v] = 2` (longest-path distance from a source)

#### Scenario: Back-edges are excluded from ASAP propagation
- **WHEN** a diagram contains a feedback loop (e.g. node A → node B → node A)
- **THEN** the back-edge SHALL be ignored during ASAP computation; loop nodes receive ASAP values based only on their forward-edge predecessors

---

### Requirement: Connection pre-sort by topological order

Before building the ELK graph, the layout engine SHALL sort `ast.connections` by the following criteria in order:

1. `ASAP[from]` ascending — connections from earlier layers sort first.
2. `ASAP[to]` **descending** — within the same source layer, long-span connections (targets in later columns) sort before short-span connections.
3. `from` node name lexicographic — tiebreaker for equal source and target layers.
4. `to` node name lexicographic — final tiebreaker.

Dangling connections (missing `from` or `to`) and broken connections SHALL sort last, treating their absent ASAP as ∞.

This ordering seeds ELK's crossing minimiser with connections in topological order, placing topologically distant nodes toward the top of their layer. For a given diagram topology, the canonical edge order is derived solely from graph structure, not from how the user happens to order their connections in the source text.

#### Scenario: 107.1 — 0 crossings for all 720 input orderings
- **WHEN** the 107.1 test diagram is rendered with any permutation of its 6 node declarations
- **THEN** the connection pre-sort SHALL produce the same canonical edge order for all 720 permutations, and the layout SHALL have 0 connector crossings

#### Scenario: Long-span edges precede short-span edges within a source layer
- **WHEN** two connections share the same source-layer column (`ASAP[from]` equal) but differ in their target column
- **THEN** the connection with the higher `ASAP[to]` SHALL appear earlier in the sorted list

#### Scenario: Determinism independent of connection declaration order
- **WHEN** the same diagram's connections are declared in any order
- **THEN** the layout SHALL produce the same grid positions and crossing count for all orderings

#### Scenario: Dangling and broken connections sort last
- **WHEN** a connection is a dangling stub or broken
- **THEN** it SHALL appear after all fully-connected edges in the sorted list

---

### Requirement: Network-simplex layering

The layout engine SHALL use ELK's `NETWORK_SIMPLEX` layering strategy for Pass 1. This strategy minimises the total weighted edge length (sum of layer spans across all connections), distributing nodes across columns to reduce both horizontal span and peak column height simultaneously.

Combined with the connection pre-sort, `NETWORK_SIMPLEX` consistently produces compact, crossing-minimal layouts without requiring a separate load-levelling pass.

#### Scenario: Source nodes are spread across multiple columns
- **WHEN** the 107.4 test diagram (16 nodes, multiple source nodes) is laid out
- **THEN** the source nodes (`sq1`, `n1`, `n2`, `lfo1`, `rand1`, `rand2`) SHALL be distributed across at least 2 distinct columns

#### Scenario: 107.4 peak column height is bounded
- **WHEN** the 107.4 test diagram is laid out
- **THEN** the peak column height (number of rows) SHALL be ≤ 10
