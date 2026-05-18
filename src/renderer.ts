/**
 * Patch diagram SVG renderer.
 *
 * Implements Mermaid's DrawDefinition interface. Calls buildLayout() then
 * renders nodes, port badges, wires, dangling stubs, and warnings into the
 * SVG element identified by `id`.
 */
import type { PatchConfig } from './config.js';
import { signalColor } from './config.js';
import type { Connection, NodeLayout, Side } from './types.js';
import {
  buildLayout,
  prepareConnections,
  validateConnections,
  portTipFn,
  badgeAnchorFn,
  mixedCornerRect,
  tabBandPath,
  BOX_W,
  BOX_H,
  BAND_STEP_H,
  BAND_STEP_V,
  CORNER_R_OUTER,
  CORNER_R_INNER,
  TAB_D,
  TAB_L,
  SVG_PAD,
  STUB,
  DANGLING_LEN,
  SIDE_DIR,
} from './layout.js';
import type { PatchDB } from './db.js';
import { log, sanitizeText as _sanitizeText } from './mermaidUtils.js';

// ── SVG helpers ───────────────────────────────────────────────────────────────

function svgEl(
  tag: string,
  attrs: Record<string, string | number>,
  children?: Element[]
): Element {
  const ns = 'http://www.w3.org/2000/svg';
  const el = document.createElementNS(ns, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (children) for (const c of children) { if (c) el.appendChild(c); }
  return el;
}

function safeStr(s: unknown): string {
  if (Array.isArray(s)) return (s as unknown[]).flat(Infinity).join('');
  return s == null ? '' : String(s);
}

function svgText(content: unknown, attrs: Record<string, string | number>): Element {
  const el = svgEl('text', attrs);
  el.textContent = safeStr(content);
  return el;
}

function sanitize(s: string): string {
  try {
    return _sanitizeText(s);
  } catch {
    return s;
  }
}

// ── Port geometry ─────────────────────────────────────────────────────────────

function badgeAnchor(nl: NodeLayout, portName?: string | null) {
  return badgeAnchorFn(nl, portName);
}

function portTip(nl: NodeLayout, portName?: string | null): { x: number; y: number } {
  return portTipFn(nl, portName);
}

// ── Port tab rendering ────────────────────────────────────────────────────────

/** Returns the four HSL fill colours for a port tab based on signal type. */
function tabColors(type: string): { bg: string; light: string; mid: string; dark: string } {
  const HUE: Record<string, number> = { audio: 25, cv: 200, voct: 100, gate: 300 };
  const h = HUE[type];
  if (h === undefined) {
    return { bg: 'hsl(0,0%,80%)', light: 'hsl(0,0%,60%)', mid: 'hsl(0,0%,40%)', dark: 'hsl(0,0%,20%)' };
  }
  return {
    bg:    `hsl(${h},100%,80%)`,
    light: `hsl(${h},100%,60%)`,
    mid:   `hsl(${h},100%,40%)`,
    dark:  `hsl(${h},100%,20%)`,
  };
}

/**
 * Renders a banded-frame port tab at port anchor (bx, by) on the given side.
 *
 * The tab is constructed in canonical space (open=bottom, thick=right) then
 * rotated into position via a single SVG transform on the enclosing <g>.
 * Transform: translate(bx, by) rotate(angle) translate(-tabLength/2, -TAB_D)
 * This maps the midpoint of the canonical open edge (tabLength/2, TAB_D) to (bx, by).
 *
 * @param tabLength - along-edge length of the tab (defaults to TAB_L; may be
 *   wider for a lone tab on a top or bottom edge)
 */
function renderPortTab(
  bx: number, by: number, side: Side,
  label: string, signalType: string, config: PatchConfig,
  tabLength = TAB_L,
): Element {
  const N = 3;
  const rStep = (CORNER_R_OUTER - CORNER_R_INNER) / N;
  const colors = config.simplifiedTabs
    ? { bg: config.nodeBgColor, light: config.nodeBgColor, mid: config.nodeBgColor, dark: config.nodeBandDark }
    : tabColors(signalType);
  const bandFills = [colors.dark, colors.mid, colors.light];

  const g = svgEl('g', {});

  // Background: solid shape filling the region inside all three bands.
  // Bounded by the inner boundary of band N (outerV=N·BSV, outerH=N·BSH).
  const bgOV = N * BAND_STEP_V;
  const bgOH = N * BAND_STEP_H;
  const bgRTL = CORNER_R_OUTER - bgOV;
  const bgRTR = CORNER_R_INNER;
  const bgPath = [
    `M ${bgOV},${TAB_D}`,
    `V ${bgOV + bgRTL}`,
    `Q ${bgOV},${bgOV} ${bgOV + bgRTL},${bgOV}`,
    `H ${tabLength - bgOH - bgRTR}`,
    `Q ${tabLength - bgOH},${bgOV} ${tabLength - bgOH},${bgOV + bgRTR}`,
    `V ${TAB_D}`,
    `Z`,
  ].join(' ');
  g.appendChild(svgEl('path', { d: bgPath, fill: colors.bg }));

  // Three band layers, outermost (dark) first
  for (let i = 0; i < N; i++) {
    const outerH  = i * BAND_STEP_H;
    const innerH  = (i + 1) * BAND_STEP_H;
    const outerV  = i * BAND_STEP_V;
    const innerV  = (i + 1) * BAND_STEP_V;
    const rTR_out = CORNER_R_OUTER - i * rStep;
    const rTR_in  = CORNER_R_OUTER - (i + 1) * rStep;
    const rTL_out = CORNER_R_OUTER - outerV;
    const rTL_in  = CORNER_R_OUTER - innerV;
    g.appendChild(svgEl('path', {
      d: tabBandPath(tabLength, TAB_D, outerH, innerH, outerV, innerV,
                     rTR_out, rTR_in, rTL_out, rTL_in),
      fill: bandFills[i],
    }));
  }

  // Label centred in canonical tab space
  const fontSize = String(Math.max(8, config.fontSize - 2));
  const cx = tabLength / 2;
  const cy = TAB_D * 0.6;
  const labelEl = svgText(sanitize(label), {
    x: cx, y: cy,
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    fill: colors.dark, 'font-size': fontSize, 'font-family': config.fontFamily,
    'font-weight': 'bold',
  });
  // Counter-rotate text for bottom tabs so glyphs render upright despite the 180° group rotation.
  if (side === 'bottom') {
    labelEl.setAttribute('transform', `rotate(180,${cx},${cy})`);
  }
  g.appendChild(labelEl);

  // Rotation per side.  Maps canonical open-edge midpoint (tabLength/2, TAB_D) → (bx, by).
  const rotationAngles: Record<Side, number> = { top: 0, bottom: 180, left: -90, right: 90 };
  const angle = rotationAngles[side];
  const tx = -tabLength / 2;
  const ty = -TAB_D;
  const transform = angle === 0
    ? `translate(${bx + tx},${by + ty})`
    : `translate(${bx},${by}) rotate(${angle}) translate(${tx},${ty})`;
  g.setAttribute('transform', transform);
  return g;
}

// ── Arrow markers ─────────────────────────────────────────────────────────────

/** Sanitize a colour string to a valid SVG id fragment (works for hex and HSL). */
function colorId(color: string): string {
  return color.replace(/[^a-zA-Z0-9]/g, '_');
}

function addArrowMarkers(svgElement: Element, colors: string[]): void {
  const defs = svgEl('defs', {});
  const seen = new Set<string>();
  for (const color of colors) {
    if (seen.has(color)) continue;
    seen.add(color);
    const id = 'arr-' + colorId(color);
    const marker = svgEl('marker', {
      id, markerWidth: '7', markerHeight: '5',
      refX: '6', refY: '2.5', orient: 'auto',
    });
    marker.appendChild(svgEl('polygon', { points: '0 0, 7 2.5, 0 5', fill: color }));
    defs.appendChild(marker);
  }
  svgElement.appendChild(defs);
}

// ── Node rendering ────────────────────────────────────────────────────────────

function renderNodeBadges(nl: NodeLayout, config: PatchConfig): Element {
  const g = svgEl('g', {});

  // Count ports per side to determine if a top/bottom tab should be widened.
  const sideCounts: Record<Side, number> = { top: 0, bottom: 0, left: 0, right: 0 };
  for (const port of nl.allPorts) sideCounts[nl.portAnchors[port.label].side]++;

  for (const port of nl.allPorts) {
    const { bx, by, side } = nl.portAnchors[port.label];
    const tabLength = (side === 'top' || side === 'bottom') && sideCounts[side] === 1
      ? Math.round(TAB_L * 1.4)
      : TAB_L;
    g.appendChild(renderPortTab(bx, by, side, port.label, port.type, config, tabLength));
  }
  return g;
}

function renderNodeBox(nl: NodeLayout, config: PatchConfig): Element {
  const { x, y, label, moduleType } = nl;
  const g = svgEl('g', {});

  // Draw four layers from outermost (darkest) to innermost (background).
  // Corner radius interpolates linearly from CORNER_R_OUTER to CORNER_R_INNER
  // so nested arcs produce a smooth graduated corner at top-right and bottom-left.
  const N = 3; // number of band steps
  const rStep = (CORNER_R_OUTER - CORNER_R_INNER) / N; // per-inset radius decrement
  const layers = [
    { fill: config.nodeBandDark,  inset: 0 },
    { fill: config.nodeBandMid,   inset: 1 },
    { fill: config.nodeBandLight, inset: 2 },
    { fill: config.nodeBgColor,   inset: 3 },
  ];
  for (const { fill, inset } of layers) {
    const bx = x + inset * BAND_STEP_H;
    const by = y + inset * BAND_STEP_V;
    const bw = BOX_W - 2 * inset * BAND_STEP_H;
    const bh = BOX_H - 2 * inset * BAND_STEP_V;
    const r  = CORNER_R_OUTER - inset * rStep; // 20, 15, 10, 5
    g.appendChild(svgEl('path', { d: mixedCornerRect(bx, by, bw, bh, r), fill }));
  }

  // Text: node name (bold, all-caps) centred horizontally;
  // shifts above centre when a label is present.
  const hasLabel = label !== null;
  const nameFontSize = String(config.fontSize);
  const nameY = y + (hasLabel ? BOX_H * 0.42 : BOX_H / 2);
  g.appendChild(svgText(sanitize(safeStr(moduleType).toUpperCase()), {
    x: x + BOX_W / 2, y: nameY,
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    fill: config.nodeNameColor,
    'font-size': nameFontSize, 'font-family': config.fontFamily,
    'font-weight': 'bold', 'letter-spacing': '0.06em',
  }));

  if (hasLabel) {
    const labelFontSize = String(Math.max(10, config.fontSize - 2));
    g.appendChild(svgText(sanitize(label), {
      x: x + BOX_W / 2, y: y + BOX_H * 0.62,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: config.nodeLabelColor,
      'font-size': labelFontSize, 'font-family': config.fontFamily,
    }));
  }

  return g;
}

// ── Wire midpoint ─────────────────────────────────────────────────────────────

function longestSegmentMidpoint(pts: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1) return pts[0];
  let bestLen = -1, bestI = 0;
  for (let i = 1; i < pts.length; i++) {
    const ddx = pts[i].x - pts[i - 1].x;
    const ddy = pts[i].y - pts[i - 1].y;
    const len = Math.sqrt(ddx * ddx + ddy * ddy);
    if (len > bestLen) { bestLen = len; bestI = i - 1; }
  }
  const ddx = pts[bestI + 1].x - pts[bestI].x;
  const ddy = pts[bestI + 1].y - pts[bestI].y;
  const isHorizontal = Math.abs(ddx) >= Math.abs(ddy);
  return {
    x: (pts[bestI].x + pts[bestI + 1].x) / 2 + (isHorizontal ? 0 : 8),
    y: (pts[bestI].y + pts[bestI + 1].y) / 2 + (isHorizontal ? -8 : 0),
  };
}

// ── Dangling stubs ────────────────────────────────────────────────────────────

function renderDangling(
  conn: Connection,
  layout: Record<string, NodeLayout>,
  config: PatchConfig
): Element | null {
  if (conn.direction === 'to') return renderDanglingTo(conn, layout, config);

  const fromNode = conn.from ? layout[conn.from] : null;
  if (!fromNode) return null;

  let src: { x: number; y: number }, srcSide: Side;
  if (conn.fromPort && fromNode.portAnchors[conn.fromPort]) {
    src = portTip(fromNode, conn.fromPort);
    srcSide = fromNode.portAnchors[conn.fromPort].side;
  } else {
    const rp = fromNode.allPorts.find((p) => p.side === 'right');
    if (rp) { src = portTip(fromNode, rp.label); srcSide = 'right'; }
    else { src = { x: fromNode.x + BOX_W + TAB_D, y: fromNode.y + BOX_H / 2 }; srcSide = 'right'; }
  }

  const fromPortInfo = conn.fromPort
    ? fromNode.allPorts.find((p) => p.label === conn.fromPort)
    : null;
  const color = signalColor(fromPortInfo ? fromPortInfo.type : 'default', config);
  const [dx, dy] = SIDE_DIR[srcSide];
  const end = { x: src.x + dx * DANGLING_LEN, y: src.y + dy * DANGLING_LEN };

  const markerId = 'arr-' + colorId(color);
  const g = svgEl('g', {});
  g.appendChild(svgEl('line', {
    x1: src.x, y1: src.y, x2: end.x, y2: end.y,
    stroke: color, 'stroke-width': 2,
    'marker-end': `url(#${markerId})`,
  }));

  const isH = srcSide === 'left' || srcSide === 'right';
  const anchor = srcSide === 'left' ? 'end' : srcSide === 'right' ? 'start' : 'middle';
  g.appendChild(svgText(sanitize(conn.label ?? ''), {
    x: end.x + dx * 4, y: end.y + dy * 4,
    'text-anchor': anchor,
    'dominant-baseline': isH ? 'middle' : (srcSide === 'top' ? 'auto' : 'hanging'),
    fill: color, 'font-size': String(Math.max(10, config.fontSize - 3)), 'font-family': config.fontFamily, 'font-weight': 'bold',
  }));
  return g;
}

function renderDanglingTo(
  conn: Connection,
  layout: Record<string, NodeLayout>,
  config: PatchConfig
): Element | null {
  const toNode = conn.to ? layout[conn.to] : null;
  if (!toNode) return null;

  let dst: { x: number; y: number }, destSide: Side;
  if (conn.toPort && toNode.portAnchors[conn.toPort]) {
    dst = portTip(toNode, conn.toPort);
    destSide = toNode.portAnchors[conn.toPort].side;
  } else {
    const lp = toNode.allPorts.find((p) => p.side === 'left');
    if (lp) { dst = portTip(toNode, lp.label); destSide = 'left'; }
    else { dst = { x: toNode.x - TAB_D, y: toNode.y + BOX_H / 2 }; destSide = 'left'; }
  }

  const toPortInfo = conn.toPort ? toNode.allPorts.find((p) => p.label === conn.toPort) : null;
  const color = signalColor(toPortInfo ? toPortInfo.type : 'default', config);
  const [dx, dy] = SIDE_DIR[destSide];
  const start = { x: dst.x + dx * STUB, y: dst.y + dy * STUB };

  const markerId = 'arr-' + colorId(color);
  const g = svgEl('g', {});
  g.appendChild(svgEl('line', {
    x1: start.x, y1: start.y, x2: dst.x, y2: dst.y,
    stroke: color, 'stroke-width': 2,
    'marker-end': `url(#${markerId})`,
  }));

  const isH = destSide === 'left' || destSide === 'right';
  const anchor = destSide === 'left' ? 'end' : destSide === 'right' ? 'start' : 'middle';
  g.appendChild(svgText(sanitize(conn.label ?? ''), {
    x: start.x + dx * 4, y: start.y + dy * 4,
    'text-anchor': anchor,
    'dominant-baseline': isH ? 'middle' : (destSide === 'top' ? 'auto' : 'hanging'),
    fill: color, 'font-size': String(Math.max(10, config.fontSize - 3)), 'font-family': config.fontFamily, 'font-weight': 'bold',
  }));
  return g;
}

// ── ELK edge rendering ────────────────────────────────────────────────────────

const CONNECTOR_CORNER_R = 16;

/**
 * Builds an SVG path string for a polyline with rounded corners.
 * Interior bend points are smoothed with a quadratic Bézier arc whose radius is
 * clamped to half the length of the shorter adjacent segment, so arcs never
 * overshoot a segment.
 */
function buildRoundedPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) {
    return `M ${Math.round(pts[0].x)} ${Math.round(pts[0].y)} L ${Math.round(pts[1].x)} ${Math.round(pts[1].y)}`;
  }
  const parts: string[] = [`M ${Math.round(pts[0].x)} ${Math.round(pts[0].y)}`];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1], curr = pts[i], next = pts[i + 1];
    const abx = curr.x - prev.x, aby = curr.y - prev.y;
    const bcx = next.x - curr.x, bcy = next.y - curr.y;
    const lenAB = Math.sqrt(abx * abx + aby * aby);
    const lenBC = Math.sqrt(bcx * bcx + bcy * bcy);
    if (lenAB < 0.5 || lenBC < 0.5) {
      parts.push(`L ${Math.round(curr.x)} ${Math.round(curr.y)}`);
      continue;
    }
    const r = Math.min(CONNECTOR_CORNER_R, lenAB / 2, lenBC / 2);
    const p1x = curr.x - (abx / lenAB) * r;
    const p1y = curr.y - (aby / lenAB) * r;
    const p2x = curr.x + (bcx / lenBC) * r;
    const p2y = curr.y + (bcy / lenBC) * r;
    parts.push(`L ${Math.round(p1x)} ${Math.round(p1y)}`);
    parts.push(`Q ${Math.round(curr.x)} ${Math.round(curr.y)} ${Math.round(p2x)} ${Math.round(p2y)}`);
  }
  const last = pts[pts.length - 1];
  parts.push(`L ${Math.round(last.x)} ${Math.round(last.y)}`);
  return parts.join(' ');
}

function renderElkEdge(
  section: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number }; bendPoints?: Array<{ x: number; y: number }> },
  srcSide: Side,
  destSide: Side,
  color: string,
  label: string | null | undefined,
  config: PatchConfig
): Element[] {
  const [sdx, sdy] = SIDE_DIR[srcSide] ?? [1, 0];
  const [ddx, ddy] = SIDE_DIR[destSide] ?? [-1, 0];

  const sp = section.startPoint;
  const ep = section.endPoint;
  const srcTip = { x: sp.x - sdx * STUB, y: sp.y - sdy * STUB };
  const destTip = { x: ep.x - ddx * STUB, y: ep.y - ddy * STUB };

  const bends = section.bendPoints || [];
  const raw = [srcTip, sp, ...bends, ep, destTip];
  const deduped = raw.filter(
    (p, i) =>
      i === 0 ||
      Math.abs(p.x - raw[i - 1].x) > 0.5 ||
      Math.abs(p.y - raw[i - 1].y) > 0.5
  );
  // Remove collinear intermediate points so corners adjacent to port stubs get full corner radius
  const pts: typeof deduped = [deduped[0]];
  for (let i = 1; i < deduped.length - 1; i++) {
    const prev = pts[pts.length - 1];
    const curr = deduped[i];
    const next = deduped[i + 1];
    const abx = curr.x - prev.x, aby = curr.y - prev.y;
    const bcx = next.x - curr.x, bcy = next.y - curr.y;
    if (Math.abs(abx * bcy - aby * bcx) > 0.5) pts.push(curr);
  }
  if (deduped.length > 0) pts.push(deduped[deduped.length - 1]);

  const d = buildRoundedPath(pts);
  const markerId = 'arr-' + color.replace(/[^a-zA-Z0-9]/g, '_');
  const els: Element[] = [];
  els.push(svgEl('path', {
    d, fill: 'none', stroke: color, 'stroke-width': 2,
    'marker-end': `url(#${markerId})`,
  }));

  if (label) {
    const mid = longestSegmentMidpoint(pts);
    els.push(svgText(sanitize(label), {
      x: mid.x, y: mid.y,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: color, 'font-size': String(Math.max(10, config.fontSize - 5)), 'font-family': config.fontFamily,
      'font-weight': 'bold',
    }));
  }

  return els;
}

// ── Legend ────────────────────────────────────────────────────────────────────

const LEGEND_ENTRIES: Array<{ type: string; label: string }> = [
  { type: 'audio', label: 'Audio' },
  { type: 'cv',    label: 'CV' },
  { type: 'voct',  label: 'V/oct' },
  { type: 'gate',  label: 'Gate' },
];
const LEGEND_LINE_W = 32;
const LEGEND_GAP = 10;

/** Returns the computed legend entry data (colour + strokeWidth) for unit testing. */
export function legendEntries(config: PatchConfig): Array<{ label: string; color: string; strokeWidth: number }> {
  return LEGEND_ENTRIES.map(({ type, label }) => ({
    label,
    color: signalColor(type, config),
    strokeWidth: 4,
  }));
}

/** Pure function: compute the top-left translation for the legend group. Exported for unit testing. */
export function computeLegendXY(
  pos: PatchConfig['legendPosition'],
  viewMinX: number, viewMinY: number, viewMaxX: number,
  svgHeight: number, legendW: number, legendH: number, pad: number
): { x: number; y: number } {
  if (pos === 'top-left')     return { x: viewMinX + pad,          y: viewMinY + pad };
  if (pos === 'bottom-left')  return { x: viewMinX + pad,          y: svgHeight - pad - legendH };
  if (pos === 'bottom-right') return { x: viewMaxX - pad - legendW, y: svgHeight - pad - legendH };
  // 'top-right' (default)
  return { x: viewMaxX - pad - legendW, y: viewMinY + pad };
}

function renderLegend(x: number, y: number, config: PatchConfig): Element {
  const rowH = config.fontSize * 1.6;
  const midY = (i: number) => rowH * i + rowH / 2;

  const g = svgEl('g', { class: 'patch-legend', transform: `translate(${x}, ${y})` });
  for (let i = 0; i < LEGEND_ENTRIES.length; i++) {
    const { type, label } = LEGEND_ENTRIES[i];
    const color = signalColor(type, config);
    g.appendChild(svgEl('line', {
      x1: 0, y1: midY(i), x2: LEGEND_LINE_W, y2: midY(i),
      stroke: color, 'stroke-width': 4, 'stroke-linecap': 'round',
    }));
    g.appendChild(svgText(label, {
      x: LEGEND_LINE_W + LEGEND_GAP, y: midY(i),
      'dominant-baseline': 'middle',
      fill: config.nodeNameColor,
      'font-size': String(config.fontSize),
      'font-family': config.fontFamily,
    }));
  }
  return g;
}

// ── Draw ──────────────────────────────────────────────────────────────────────

export const draw = async (
  text: string,
  id: string,
  _version: string,
  diagram: { db: PatchDB }
): Promise<void> => {
  log.info('Patch draw', id);

  const svgElement = document.querySelector<SVGSVGElement>(`#${CSS.escape(id)}`);
  if (!svgElement) {
    log.error('Patch: cannot find SVG element', id);
    return;
  }

  // Clear
  while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

  const db = diagram.db;
  const config = db.getConfig();
  const ast = db.getData();

  if (!ast) {
    log.error('Patch: no AST in db for', id);
    return;
  }

  // Canonicalize port labels
  const portInfo = prepareConnections(ast);

  // Validate
  const { warnings, broken } = validateConnections(ast);

  // Layout
  let layout: Record<string, NodeLayout>;
  let edgeSections: Record<number, Array<{ startPoint: { x: number; y: number }; endPoint: { x: number; y: number }; bendPoints?: Array<{ x: number; y: number }> }>>;
  try {
    ({ layout, edgeSections } = await buildLayout(ast, portInfo, broken, config));
  } catch (e) {
    log.error('Patch layout error:', String(e));
    const err = svgText('Layout error: ' + String(e), {
      x: 20, y: 30, fill: '#cc0000', 'font-family': 'monospace', 'font-size': '13',
    });
    svgElement.appendChild(err);
    return;
  }

  // Collect used colors for arrow markers
  const usedColors = new Set<string>();
  ast.connections.forEach((conn, i) => {
    if (broken.has(conn)) return;
    if (conn.type === 'dangling') {
      if (conn.direction === 'to' && conn.to) {
        const tn = layout[conn.to];
        if (tn) {
          const tp = conn.toPort ? tn.allPorts.find((p) => p.label === conn.toPort) : null;
          usedColors.add(signalColor(tp ? tp.type : 'default', config));
        }
      } else if (conn.from) {
        const fn = layout[conn.from];
        if (fn) {
          const fp = conn.fromPort ? fn.allPorts.find((p) => p.label === conn.fromPort) : null;
          usedColors.add(signalColor(fp ? fp.type : 'default', config));
        }
      }
      return;
    }
    const fn = layout[conn.from!];
    const tn = layout[conn.to!];
    if (fn) {
      const fp = conn.fromPort ? fn.allPorts.find((p) => p.label === conn.fromPort) : null;
      if (fp?.wasAny && tn) {
        const tp = conn.toPort ? tn.allPorts.find((p) => p.label === conn.toPort) : null;
        usedColors.add(signalColor(tp ? tp.type : 'default', config));
      } else {
        usedColors.add(signalColor(fp ? fp.type : 'default', config));
      }
    }
  });
  addArrowMarkers(svgElement, [...usedColors]);

  // SVG sizing
  const allNl = Object.values(layout);
  const svgWidth = allNl.length
    ? Math.max(...allNl.map((nl) => nl.x)) + BOX_W + SVG_PAD + TAB_D
    : 400;
  const svgHeight = allNl.length
    ? Math.max(...allNl.map((nl) => nl.y)) + BOX_H + SVG_PAD + TAB_D
    : 200;

  const WARNING_LINE_H = 18;
  const WARNING_PAD = 10;
  const warningPanelH = warnings.length ? WARNING_PAD * 2 + warnings.length * WARNING_LINE_H : 0;

  // Compute viewBox including dangling stub label extents
  const LABEL_BUDGET = 100;
  const VBOX_MARGIN = 10;
  let dMinX = Infinity, dMinY = Infinity, dMaxX = -Infinity, dMaxY = -Infinity;
  for (const conn of ast.connections) {
    if (conn.type !== 'dangling') continue;
    if (conn.direction === 'from' && conn.from) {
      const fn = layout[conn.from];
      if (!fn) continue;
      let src: { x: number; y: number }, srcSide: Side;
      if (conn.fromPort && fn.portAnchors[conn.fromPort]) {
        src = portTip(fn, conn.fromPort);
        srcSide = fn.portAnchors[conn.fromPort].side;
      } else {
        const rp = fn.allPorts.find((p) => p.side === 'right');
        src = rp ? portTip(fn, rp.label) : { x: fn.x + BOX_W + TAB_D, y: fn.y + BOX_H / 2 };
        srcSide = rp ? rp.side : 'right';
      }
      const [dx, dy] = SIDE_DIR[srcSide];
      const ex = src.x + dx * (DANGLING_LEN + LABEL_BUDGET);
      const ey = src.y + dy * (DANGLING_LEN + LABEL_BUDGET);
      dMinX = Math.min(dMinX, src.x, ex); dMinY = Math.min(dMinY, src.y, ey);
      dMaxX = Math.max(dMaxX, src.x, ex); dMaxY = Math.max(dMaxY, src.y, ey);
    } else if (conn.direction === 'to' && conn.to) {
      const tn = layout[conn.to];
      if (!tn) continue;
      let dst: { x: number; y: number }, destSide: Side;
      if (conn.toPort && tn.portAnchors[conn.toPort]) {
        dst = portTip(tn, conn.toPort);
        destSide = tn.portAnchors[conn.toPort].side;
      } else {
        const lp = tn.allPorts.find((p) => p.side === 'left');
        dst = lp ? portTip(tn, lp.label) : { x: tn.x - TAB_D, y: tn.y + BOX_H / 2 };
        destSide = lp ? lp.side : 'left';
      }
      const [dx, dy] = SIDE_DIR[destSide];
      const sx = dst.x + dx * (STUB + LABEL_BUDGET);
      const sy = dst.y + dy * (STUB + LABEL_BUDGET);
      dMinX = Math.min(dMinX, dst.x, sx); dMinY = Math.min(dMinY, dst.y, sy);
      dMaxX = Math.max(dMaxX, dst.x, sx); dMaxY = Math.max(dMaxY, dst.y, sy);
    }
  }

  const viewMinX = Math.min(0, isFinite(dMinX) ? dMinX - VBOX_MARGIN : 0);
  const viewMinY = Math.min(0, isFinite(dMinY) ? dMinY - VBOX_MARGIN : 0);
  const viewMaxX = Math.max(svgWidth, isFinite(dMaxX) ? dMaxX + VBOX_MARGIN : svgWidth);
  const viewMaxY = Math.max(
    svgHeight + warningPanelH,
    isFinite(dMaxY) ? dMaxY + VBOX_MARGIN : svgHeight + warningPanelH
  );
  const vbW = viewMaxX - viewMinX;
  const vbH = viewMaxY - viewMinY;

  svgElement.setAttribute('width', String(vbW));
  svgElement.setAttribute('height', String(vbH));
  svgElement.setAttribute('viewBox', `${viewMinX} ${viewMinY} ${vbW} ${vbH}`);
  svgElement.setAttribute('style', `background:${config.background}; display:block;`);

  // ── Draw order: edges → badges → boxes ───────────────────────────────────

  // 1. Wires (behind nodes)
  const edgesG = svgEl('g', { class: 'patch-edges' });
  ast.connections.forEach((conn, i) => {
    if (broken.has(conn)) return;

    if (conn.type === 'dangling') {
      const el = renderDangling(conn, layout, config);
      if (el) edgesG.appendChild(el);
      return;
    }

    const sections = edgeSections[i] || [];
    const fn = layout[conn.from!];
    const tn = layout[conn.to!];
    if (!fn || !tn) return;

    const fp = conn.fromPort ? fn.allPorts.find((p) => p.label === conn.fromPort) : null;
    const tp = conn.toPort ? tn.allPorts.find((p) => p.label === conn.toPort) : null;
    const color = fp?.wasAny
      ? signalColor(tp ? tp.type : 'default', config)
      : signalColor(fp ? fp.type : 'default', config);

    const srcSide = fp ? fn.portAnchors[fp.label]?.side ?? 'right' : 'right';
    const destSide = tp ? tn.portAnchors[tp.label]?.side ?? 'left' : 'left';

    for (const section of sections) {
      const els = renderElkEdge(section, srcSide, destSide, color, conn.label ?? null, config);
      for (const el of els) edgesG.appendChild(el);
    }
  });
  svgElement.appendChild(edgesG);

  // 2. Port badges (in front of wires, behind box outlines)
  const badgesG = svgEl('g', { class: 'patch-badges' });
  for (const nl of allNl) badgesG.appendChild(renderNodeBadges(nl, config));
  svgElement.appendChild(badgesG);

  // 3. Node boxes (on top)
  const boxesG = svgEl('g', { class: 'patch-nodes' });
  for (const nl of allNl) boxesG.appendChild(renderNodeBox(nl, config));
  svgElement.appendChild(boxesG);

  // 4. Warnings panel
  if (warnings.length) {
    const panelY = svgHeight;
    const panelG = svgEl('g', { class: 'patch-warnings' });
    panelG.appendChild(svgEl('rect', {
      x: 0, y: panelY,
      width: svgWidth, height: warningPanelH,
      fill: '#fff3cd', stroke: '#ffc107', 'stroke-width': 1,
    }));
    warnings.forEach((w, i) => {
      panelG.appendChild(svgText(`⚠ ${w}`, {
        x: WARNING_PAD, y: panelY + WARNING_PAD + i * WARNING_LINE_H + WARNING_LINE_H / 2,
        fill: '#856404', 'font-size': '13', 'font-family': 'Arial, sans-serif',
        'dominant-baseline': 'middle',
      }));
    });
    svgElement.appendChild(panelG);
  }

  // 5. Legend overlay (topmost)
  if (config.legend) {
    const rowH = config.fontSize * 1.6;
    const legendH = rowH * LEGEND_ENTRIES.length;
    const longestLabel = Math.max(...LEGEND_ENTRIES.map((e) => e.label.length));
    const legendW = LEGEND_LINE_W + LEGEND_GAP + longestLabel * (7 * config.fontSize / 18);
    const { x: lx, y: ly } = computeLegendXY(
      config.legendPosition, viewMinX, viewMinY, viewMaxX, svgHeight, legendW, legendH, SVG_PAD
    );

    svgElement.appendChild(renderLegend(lx, ly, config));
  }
};

export default { draw };
