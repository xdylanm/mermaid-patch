## Why

Module definitions require authors to specify exact signal types for every port, but some modules (e.g., utility mixers, switches, buffers) work equally well with audio, CV, gate, or v/oct signals. Without an "any" signal type, diagram authors must either pick an arbitrary type or create multiple module variants, leading to visual noise and inaccurate diagrams.

## What Changes

- Introduce a new built-in signal type identifier `any` for use in module port declarations.
- Define resolution rules for how `any` ports derive their rendered color/type at diagram render time, based on what they're connected to.
- Handle fan-out (one output port connected to multiple inputs of differing types) with a specific fallback rule.

## Capabilities

### New Capabilities

- `any-signal-type`: Defines the `any` signal type, its resolution semantics (connected-port inference, CV fallback for `any`-to-`any` and mixed fan-out), and rendering behavior for wires and port badges.

### Modified Capabilities

- `diagram-schema`: The `<signalType>` identifier grammar must accept `any` as a valid value alongside existing types (`audio`, `cv`, `gate`, `voct`). No behavioral change for existing types.

## Impact

- `patchDiagram.grammar.ne` / `patchDiagramParser.js` — parser must accept `any` as a signal type token.
- `renderPatchDiagram.js` — rendering logic must implement signal type resolution before assigning colors to port badges and connector lines.
- Existing diagrams are unaffected (no existing ports use `any`).
