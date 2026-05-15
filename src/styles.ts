/**
 * Minimal CSS injected by Mermaid's styleRenderer.
 * Must be a function (options, svgId) => string — Mermaid calls it as
 * themes[type]({ ...options, svgId }) in getStyles().
 * Most patch diagram styling is done inline in SVG attributes.
 */
const styles = (_options?: unknown, _svgId?: string): string => `
  .patch-edges path { vector-effect: non-scaling-stroke; }
  .patch-edges line { vector-effect: non-scaling-stroke; }
`;

export default styles;
