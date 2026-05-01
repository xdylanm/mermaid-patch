## Context

patchDiagram is a DSL for describing modular synthesizer patches. Each port in a module definition declares a `<signalType>` (e.g., `audio`, `cv`, `gate`, `voct`). Signal types drive port badge and wire colors in the SVG renderer.

Currently the grammar accepts any identifier as a signal type, and `signalColor()` in `renderPatchDiagram.js` falls back to a gray `default` color for unknown types. There is no mechanism for a port to defer its type to whatever is connected to it.

The change adds `any` as a first-class signal type with inference-based rendering. The parser already accepts any identifier, so the grammar needs no token-level changes — only documentation and rendering behavior are new.

## Goals / Non-Goals

**Goals:**
- Allow `any` as a declared signal type in module port definitions.
- Implement a resolution pass in the renderer that maps `any` ports to a concrete rendering type before colors are assigned to port badges and wires.
- Define clear, deterministic resolution rules for all connection topologies (1:1, fan-out, `any`-to-`any`).

**Non-Goals:**
- Runtime validation that connected port types are compatible (type-checking is out of scope).
- Modifying the parser grammar — the grammar already accepts any identifier as a signal type; `any` is a semantic convention, not a new token.
- Changing color palettes or adding a distinct visual for `any` ports while unconnected (unconnected ports are already hidden per the `unconnected-port-hiding` spec).

## Decisions

### Decision: Resolution happens in the renderer, not in the parser

The parser produces a plain AST with `type: 'any'` on ports, unchanged. A dedicated `resolveAnyTypes(ast, portMeta)` pass in `renderPatchDiagram.js` computes a `resolvedType` for every port before `signalColor()` is called. This keeps the parser free of rendering concerns and makes the resolution logic easy to test and iterate.

**Alternatives considered:**
- Resolve at parse time: rejected — the AST would then depend on connection topology, conflating parsing and layout concerns.
- Resolve inside `signalColor()` lazily: rejected — it would require passing the full connection graph into a utility that should remain a pure color lookup.

### Decision: Resolution algorithm

A `resolveAnyTypes` function builds a map `resolvedPortType[nodeName][portLabel]` and replaces `type` in `portMeta` before rendering proceeds:

1. **1:1 connection (`any` ↔ concrete):** Resolve `any` to the concrete type of the counterpart.
2. **`any`-to-`any` connection:** Both ports resolve to `cv`.
3. **Fan-out (one output `any` connected to N inputs):**
   - Collect the resolved types of all destination inputs (recursing rule 1/2 first).
   - If all destinations resolve to the same concrete type, the output port also resolves to that type.
   - If destinations resolve to mixed types, the output port resolves to `cv`.
   - Each wire segment is colored by the *destination* port's resolved type, not the source port.

**Wire coloring for fan-out with mixed types:** The current renderer assigns a single color to the whole wire based on the source port type. For `any` fan-out with mixed destinations, the wire color must come from the resolved destination type. This means `signalColor` for a wire connection must use the destination port's `resolvedType` when the source is `any`.

### Decision: Iteration order for resolution

Resolve concrete↔concrete first (no-ops), then `any`↔concrete, then `any`↔`any`. A two-pass approach is sufficient because `any` chains longer than one hop are an edge case not required by the spec, and the fallback to `cv` covers them gracefully.

## Risks / Trade-offs

- **Circular `any` graphs:** Two `any` ports wired to each other resolve to `cv` via rule 2. Longer chains (any→any→concrete) are not required to propagate; they fall back to `cv` safely.  
  Mitigation: Document in the spec that multi-hop inference is not guaranteed.
- **Wire color diverges from source badge color:** For mixed fan-out, the output port badge shows `cv` but individual wires show their destination type. This is intentional but could confuse users who expect uniform color.  
  Mitigation: Specify this explicitly in the spec so the behavior is documented.

## Migration Plan

No migration needed. Existing diagrams do not use `any` as a signal type. The renderer change is additive: if no port has `type: 'any'`, the resolution pass is a no-op.
