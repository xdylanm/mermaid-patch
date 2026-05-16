## MODIFIED Requirements

### Requirement: Network-simplex layering
The layout engine SHALL use ELK's `NETWORK_SIMPLEX` layering strategy for Pass 1. This strategy minimises the total weighted edge length (sum of layer spans across all connections), distributing nodes across columns to reduce both horizontal span and peak column height simultaneously.

Combined with the connection pre-sort, `NETWORK_SIMPLEX` consistently produces compact, crossing-minimal layouts without requiring a separate load-levelling pass.

The inter-column gap (`LAYER_GAP`) SHALL be set to a value ≤ 18 px to produce compact horizontal spacing. See the `compact-diagram-spacing` spec for the authoritative spacing constraints.

#### Scenario: Source nodes are spread across multiple columns
- **WHEN** the 107.4 test diagram (16 nodes, multiple source nodes) is laid out
- **THEN** the source nodes (`sq1`, `n1`, `n2`, `lfo1`, `rand1`, `rand2`) SHALL be distributed across at least 2 distinct columns

#### Scenario: 107.4 peak column height is bounded
- **WHEN** the 107.4 test diagram is laid out
- **THEN** the peak column height (number of rows) SHALL be ≤ 10
