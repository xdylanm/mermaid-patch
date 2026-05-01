## Context

`renderPatchDiagram.js` builds `allPortLabels` for each node by first adding every port declared in the module definition, then appending any ports referenced in connections. As a result, all declared ports are included in ELK layout and badge rendering even when they have no wire or dangling stub attached.

`outPorts[nodeName]` and `inPorts[nodeName]` are already computed by `prepareConnections()` and cover all referenced ports across every connection type (full wires and dangling stubs), because that function iterates `ast.connections` without filtering by type.

## Goals / Non-Goals

**Goals:**
- Only render port badges for ports that appear in at least one connection or dangling stub on that node.
- Keep the ELK port list consistent with the rendered badge set (no phantom ELK ports).
- Preserve port type metadata (`signalColor`) for ports that do appear.

**Non-Goals:**
- Changing the parser or diagram schema syntax.
- Hiding ports the user explicitly listed in connections (never hidden).
- Supporting a diagram-level flag to opt in/out of the behavior.

## Decisions

### Decision: Filter at `allPortLabels` construction, not at render time

The natural single control point is the construction of `allPortLabels` inside `buildElkLayout`. Currently it seeds from `def.ports` (all module ports) then unions in `outPorts`/`inPorts`. The fix replaces the seed with the union of `outPorts[node.name]` and `inPorts[node.name]` only.

```
// Before:
for (const p of def.ports) add(p.label);  // adds every declared port
for (const l of outPorts[node.name]) add(l);
for (const l of inPorts[node.name])  add(l);

// After:
for (const l of outPorts[node.name]) add(l);  // only connected ports
for (const l of inPorts[node.name])  add(l);
```

Module-declared ports not referenced in any connection are never inserted and so are excluded from both ELK layout and badge drawing. No other change is required.

**Alternative considered:** Post-filter `allPortLabels` after construction (remove entries not in `outPorts ∪ inPorts`). This would work but requires a second pass and is harder to read than simply not inserting them in the first place.

### Decision: Preserve declaration order via `outPorts`/`inPorts` insertion order

`outPorts` and `inPorts` are built from `ast.connections` in document order, so ports will appear in the order first referenced in the diagram. This is acceptable — the original module-definition order was also an arbitrary convention.

## Risks / Trade-offs

- [Visual change for existing diagrams] Any diagram where a module has more declared ports than used ports will render fewer badges after this change. → Expected and desired; no mitigation needed.
- [Port order change] Previously port order followed module definition; now it follows connection-reference order. → Low impact; port side assignment logic is unchanged and still separates inputs from outputs correctly.

## Migration Plan

No migration needed. The change is pure rendering behavior with no persistent state or stored data affected.
