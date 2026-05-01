## 1. Spec & Documentation

- [x] 1.1 Update `diagram-schema` spec to document `any` as a recognized signal type value (no parser change needed — grammar already accepts any identifier)

## 2. Renderer: Type Resolution Pass

- [x] 2.1 Add `resolveAnyTypes(ast, portMeta)` function in `renderPatchDiagram.js` that builds a `resolvedPortType[nodeName][portLabel]` map
- [x] 2.2 Implement rule: `any` ↔ concrete → resolve `any` to the concrete type
- [x] 2.3 Implement rule: `any` ↔ `any` → both resolve to `cv`
- [x] 2.4 Implement fan-out rule: if all destination resolved types are the same, source resolves to that type; if mixed, source resolves to `cv`
- [x] 2.5 Apply resolved types to `portMeta` entries before ELK layout and rendering calls proceed

## 3. Renderer: Wire Coloring for Fan-out

- [x] 3.1 For wire connections where the source port is `any` (mixed fan-out), pass the *destination* port's resolved type to `signalColor()` for that wire segment, rather than the source port type
- [x] 3.2 Verify port badge color uses source port's resolved type (already handled via `portMeta` update in 2.5)

## 4. Tests

- [x] 4.1 Add unit test: `any` port connected to `audio` port resolves to `audio`
- [x] 4.2 Add unit test: `any`-to-`any` resolves both to `cv`
- [x] 4.3 Add unit test: fan-out `any` → uniform type resolves source to that type
- [x] 4.4 Add unit test: fan-out `any` → mixed types resolves source to `cv`, wires colored by destination type
- [x] 4.5 Add integration test: render a diagram with `any` ports and verify correct SVG colors
