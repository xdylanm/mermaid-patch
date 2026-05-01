/**
 * Minimal CSS injected by Mermaid's styleRenderer.
 * Must be a function (options, svgId) => string — Mermaid calls it as
 * themes[type]({ ...options, svgId }) in getStyles().
 * Most Monotrail styling is done inline in SVG attributes.
 */
const styles = (_options?: unknown, _svgId?: string): string => `
  .monotrail-edges path { vector-effect: non-scaling-stroke; }
  .monotrail-edges line { vector-effect: non-scaling-stroke; }
`;

export default styles;
