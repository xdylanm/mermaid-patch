## Context

Port tabs are drawn in a canonical orientation (open side at bottom, outer edge at top-right) and placed via an SVG `<g transform>` that rotates the entire group. The rotation angles are: `top` → 0°, `bottom` → 180°, `left` → −90°, `right` → 90°. Because the `<text>` label is a child of that group, it inherits the rotation, which flips it 180° for bottom-edge tabs.

The canonical label position is `(tabLength/2, TAB_D * 0.6)`.

## Goals / Non-Goals

**Goals:**
- Label text on bottom-edge tabs renders upright (same visual orientation as top/left/right tabs).
- No visual change to tabs on top, left, or right edges.

**Non-Goals:**
- Changing font size, color, weight, or positioning logic.
- Addressing text orientation for left/right tabs (their rotated text is conventional for side-mounted port labels and reads naturally when the diagram is viewed normally).

## Decisions

### Counter-rotate the `<text>` element for `bottom` tabs

The label `<text>` element is given an additional `transform="rotate(180, cx, cy)"` where `cx = tabLength/2` and `cy = TAB_D * 0.6` — the text's own center point in canonical tab space. This undoes the parent group's 180° rotation exactly at the text's center, so the letters render upright with no change to position or other attributes.

**Alternative considered — lift text out of the group:** Move the label into a sibling element drawn after the group, computing its final coordinates explicitly. Rejected: more complex, requires duplicating position math, and breaks the clean encapsulation of the tab-drawing function.

**Alternative considered — SVG `writing-mode` or CSS:** CSS transforms are less predictable across SVG renderers. The inline `rotate` transform is well-supported everywhere mermaid targets.

## Risks / Trade-offs

- [Minimal scope] Only `bottom` tabs are affected; risk of regression is low and scoped to a single branch in renderer logic.
- [Renderer coupling] The `tabLength` value must be available at the point the text element is built; it already is (used for centering), so no new coupling is introduced.
