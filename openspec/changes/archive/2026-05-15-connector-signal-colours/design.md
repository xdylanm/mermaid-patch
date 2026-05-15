## Context

Connectors in the patch diagram are currently coloured using a set of hex colour constants in `DEFAULT_CONFIG` (`audioColor`, `cvColor`, etc.) which are unrelated to the HSL formula used by port tabs. Port tabs compute their fills via a local `tabColors()` function in `renderer.ts` using a fixed HSL formula (H per signal type, S=100%, L∈{80,60,40,20}). The two colour systems are independently maintained, causing visible discontinuity between tab colours and wire colours. Additionally, connector polylines currently draw all bend points as sharp right-angle corners (SVG `L` commands throughout), unlike the rounded aesthetic of node boxes and port tabs.

## Goals / Non-Goals

**Goals:**
- Align connector wire/stub stroke colour with the port tab palette: `hsl(H, 100%, 40%)` for each signal type
- Align label text colour on connectors and dangling stubs with the same rule
- Round connector polyline corners with a quadratic arc at radius 16 px
- Change the `DEFAULT_CONFIG` background from `#f0ede8` to `hsl(50, 100%, 90%)`

**Non-Goals:**
- Changing the arc radius of node box corners
- Changing DARK_CONFIG or NEUTRAL_CONFIG signal colour hues
- Rounding dangling stub lines (they are straight single-segment lines with no bend points)
- Adding signal-type colouring to the arrowhead fill (already driven by the wire colour)

## Decisions

### Decision 1: Update DEFAULT_CONFIG signal colour values to HSL strings

The `audioColor`, `cvColor`, `voctColor`, `gateColor` keys in `DEFAULT_CONFIG` will be changed from the current hex values to their HSL-at-L=40 equivalents:
- `audioColor`: `hsl(25, 100%, 40%)`
- `cvColor`: `hsl(200, 100%, 40%)`
- `voctColor`: `hsl(100, 100%, 40%)`
- `gateColor`: `hsl(300, 100%, 40%)`

For the unknown/default type (S=0 grey), `defaultColor` and `anyColor` remain `hsl(0, 0%, 40%)` (mid grey).

**Alternative considered**: Compute HSL dynamically inside `signalColor()` from a per-type H map, removing the config keys entirely. Rejected: overkill — the config keys allow palette overrides and are already used by DARK_CONFIG/NEUTRAL_CONFIG. Keeping them as settable strings is the right abstraction level.

**DARK_CONFIG and NEUTRAL_CONFIG**: These override the signal colour keys already and are not affected by this change.

### Decision 2: Change DEFAULT_CONFIG background to `hsl(50, 100%, 90%)`

The single `background` field in `DEFAULT_CONFIG` is changed from `'#f0ede8'` to `'hsl(50, 100%, 90%)'`. The three-tier precedence model (palette default → themeVariables → patch user key) is unchanged.

### Decision 3: Round connector polyline corners with a quadratic arc at R=16

The `renderElkEdge()` function in `renderer.ts` currently builds an SVG path with `L` (lineto) commands for all points. To add rounded corners, the path-building logic will be updated:

At each interior bend point (all points except the first and last), instead of a straight `L`:
1. Compute the vector from the previous point to the bend, and from the bend to the next point.
2. Move `min(R, halfSegLen)` back along the incoming vector and forward along the outgoing vector to get `pIn` and `pOut`.
3. Draw `L pIn` then `Q bend pOut` (quadratic bezier with the bend point as the control point).

`R = 16`. Named constant `CONNECTOR_CORNER_R = 16` will be defined in `renderer.ts` (local constant — not exported to `layout.ts` since it is purely a rendering concern).

**Alternative considered**: Cubic bezier (`C`) for a more symmetric curve. Rejected: quadratic is sufficient for 90° orthogonal corners and is already used by node box and port tab arcs.

## Risks / Trade-offs

- [Risk] Very short segments (< 2R) could produce degenerate arcs → Mitigation: clamp the arc offset to half the shorter of the two adjacent segment lengths (`min(R, halfA, halfB)`) so the arc never exceeds the segment.
- [Risk] HSL strings may behave differently across SVG renderers (e.g. some older Mermaid environments). → Low risk: Mermaid already emits HSL for the port tab fills in the same SVG; no issues observed.
- [Trade-off] Updating `DEFAULT_CONFIG` will change the visual output of any existing diagram using the default palette. This is the intended behaviour of this change.
