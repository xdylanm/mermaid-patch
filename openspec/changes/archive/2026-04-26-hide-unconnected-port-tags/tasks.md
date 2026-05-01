## 1. Renderer — Filter Unconnected Ports

- [x] 1.1 In `renderPatchDiagram.js` `buildElkLayout`, remove the loop that seeds `allPortLabels` from `def.ports` and rely solely on `outPorts[node.name]` and `inPorts[node.name]` to populate the list
- [x] 1.2 Verify `portMeta` lookup still works for ports not in `defPortMap` (type defaults to `'default'`, which is already handled)

## 2. Tests

- [x] 2.1 Add a parser test fixture where a module declares 3 ports but only 1 is used in a connection; assert that only 1 port appears in the rendered SVG (check for port badge count or absence of unused port label text)
- [x] 2.2 Add a test confirming a dangling stub port is still rendered (counts as connected)
- [x] 2.3 Add a test confirming that when all declared ports are used, all badges still render (no regression)
- [x] 2.4 Run `npm test` and confirm all tests pass

## 3. Manual Verification

- [x] 3.1 Load a diagram with a module that has extra declared ports in the scratch HTML and verify unused port badges are absent
- [x] 3.2 Confirm connected port badges still render with correct signal-type colors and positions
