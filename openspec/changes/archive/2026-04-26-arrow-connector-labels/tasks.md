## 1. Grammar

- [x] 1.1 Add `labeledConnection` rule to `patchDiagram.grammar.ne`: `identifier portSpec _ "-->" _ "|" pipeLabel "|" _ identifier portSpec` returning `type: 'connection'` with `label` field
- [x] 1.2 Add `danglingToConnection` rule to `patchDiagram.grammar.ne`: `"-->" _ "|" pipeLabel "|" _ identifier portSpec` returning `type: 'dangling'`, `direction: 'to'`
- [x] 1.3 Add `direction: 'from'` field to existing `danglingConnection` rule output for consistency
- [x] 1.4 Register all new rules under the `statement` alternative list in the grammar
- [x] 1.5 Recompile grammar: `npx nearleyc patchDiagram/patchDiagram.grammar.ne -o patchDiagram/patchDiagram.grammar.js`

## 2. Parser

- [x] 2.1 Update `parsePatchDiagram` in `patchDiagramParser.js` to ensure connections with a `label` field are included in the `connections` output array (no filtering change needed, but verify `type === 'connection'` and `type === 'dangling'` filters still apply correctly)
- [x] 2.2 Verify `prepareConnections` in `renderPatchDiagram.js` handles connections where `from` or `to` may be absent (dangling-to has no `from`)

## 3. Renderer

- [x] 3.1 In the wire-drawing code of `renderPatchDiagram.js`, after routing a full connection polyline, check for a `label` field and append an SVG `<text>` element at the polyline midpoint using `font-family: 'Arial, sans-serif'`, `font-size: '15'`, `font-weight: 'bold'` (matching port badge labels)
- [x] 3.2 In the dangling-from stub drawing code, check for a `label` field and append an SVG `<text>` element at the stub's free end (already has label support; verify or add)
- [x] 3.3 Add a new rendering branch for `type: 'dangling'` with `direction: 'to'`: draw a `STUB`-length arrow pointing at the destination port badge, colored by destination port signal type, with label at the open end using port badge font (`Arial, sans-serif`, size 15, bold)

## 4. Tests

- [x] 4.1 Add parser test for `vca1:Out -->|my note| mix1:In1` — asserts `type: 'connection'`, correct ports, and `label: 'my note'`
- [x] 4.2 Add parser test for `-->|keyboard| mix1:In1` — asserts `type: 'dangling'`, `direction: 'to'`, correct port, `label: 'keyboard'`
- [x] 4.3 Add parser test for `vca1:Out -->|audio out|` — asserts `type: 'dangling'`, `direction: 'from'`, correct port, `label: 'audio out'`
- [x] 4.4 Add parser test confirming unlabeled `vca1:Out --> mix1:In1` still parses correctly with no `label` field
- [x] 4.5 Run full test suite and confirm all tests pass: `npm test`
