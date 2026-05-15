## 1. Update Themes table

- [x] 1.1 Update the **default** theme row: change Node body description from "Dark fill, light text" to "Light-grey banded frame (`#cccccc` bg, greyscale bands)" and canvas background from `#f0ede8` to `hsl(50, 100%, 95%)`
- [x] 1.2 Update the **dark** theme row: change Node body description from "Light-grey fill (`#e8e8e8`), dark text" to "Dark banded frame (`#2a2a2a` bg, ascending-luminance bands), light text" and canvas background value (already `#1e1e2e`, verify it is correct)
- [x] 1.3 Update the **neutral** theme row: change Node body description from "Medium-grey fill, dark text" to "Near-white banded frame, single dark outer band" and canvas background from `#f5f5f5` to `#ffffff`

## 2. Update Mermaid theme variables table

- [x] 2.1 Change the `primaryColor` row "Affects" cell from "Node name bar background" to "Node background fill (`nodeBgColor`)"
- [x] 2.2 Change the `primaryBorderColor` row "Affects" cell from "Node outline stroke" to "Outermost band colour (`nodeBandDark`)"
- [x] 2.3 Change the `secondaryTextColor` row "Affects" cell from "Port label text" to "Node label text (`nodeLabelColor`)"
- [x] 2.4 Remove the `secondaryColor` row (port tab colours are derived from signal type HSL formula, not from a theme variable)

## 3. Update themeVariables code example

- [x] 3.1 Remove the `secondaryColor` line from the `themeVariables` code example
- [x] 3.2 Update inline comments in the code example to reflect the new variable descriptions (e.g. "Node background fill" instead of "Node name bar bg")

## 4. Verify

- [x] 4.1 Read through the updated `docs/config.md` Themes section and confirm all values match `DEFAULT_CONFIG`, `DARK_CONFIG`, and `NEUTRAL_CONFIG` in `src/config.ts`
- [x] 4.2 Read through the themeVariables table and confirm all remaining rows map to the correct `PatchConfig` fields per the `theme-variables-node-chrome` spec
