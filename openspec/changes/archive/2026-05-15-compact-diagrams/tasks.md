## 1. Update layout constants

- [x] 1.1 In `src/layout.ts`, change `SVG_PAD` from `80` to `40`
- [x] 1.2 In `src/layout.ts`, change `LAYER_GAP` from `25` to `17`

## 2. Visual review

- [x] 2.1 Build the project and open the demo in the browser; verify the diagram looks tighter with no clipping
- [x] 2.2 Check that dangling connector stubs are still fully visible within the SVG viewport
- [x] 2.3 Confirm connector lines do not visually merge with adjacent node boxes at the new column gap

## 3. Spec sync

- [x] 3.1 Run `openspec status --change compact-diagrams` and confirm all artifacts are complete
- [x] 3.2 Archive the change with `openspec archive compact-diagrams` once implementation is verified
