/**
 * Monotrail SVG renderer.
 *
 * Implements Mermaid's DrawDefinition interface. Calls buildLayout() then
 * renders nodes, port badges, wires, dangling stubs, and warnings into the
 * SVG element identified by `id`.
 */
import type { MonotrailConfig } from './config.js';
import { signalColor } from './config.js';
import type { Connection, NodeLayout, Side } from './types.js';
import {
  buildLayout,
  prepareConnections,
  validateConnections,
  portTipFn,
  badgeAnchorFn,
  BOX_W,
  BOX_H,
  BOX_TOP_H,
  BOX_BOT_H,
  BADGE_D,
  BADGE_SLOPE,
  SVG_PAD,
  STUB,
  DANGLING_LEN,
  SIDE_DIR,
} from './layout.js';
import type { MonotrailDB } from './db.js';
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

function trapPoints(bx: number, by: number, side: Side): string {
  const d = BADGE_D;
  const taper = d * Math.tan((90 - BADGE_SLOPE) * Math.PI / 180);
  const wv = BOX_H * 0.4;
  const wh = wv * 1.2;
  const tv = wv - taper;
  const th = wh - taper;
  switch (side) {
    case 'left':
      return `${bx},${by - wv} ${bx},${by + wv} ${bx - d},${by + tv} ${bx - d},${by - tv}`;
    case 'right':
      return `${bx},${by - wv} ${bx},${by + wv} ${bx + d},${by + tv} ${bx + d},${by - tv}`;
    case 'top':
      return `${bx - wh},${by} ${bx + wh},${by} ${bx + th},${by - d} ${bx - th},${by - d}`;
    case 'bottom':
      return `${bx - wh},${by} ${bx + wh},${by} ${bx + th},${by + d} ${bx - th},${by + d}`;
  }
}

function badgeLabel(text: unknown, bx: number, by: number, side: Side, config: MonotrailConfig): Element {
  const d = BADGE_D;
  let tx: number, ty: number, rotate = '';
  switch (side) {
    case 'left':
      tx = bx - d / 2; ty = by;
      rotate = `rotate(-90 ${tx} ${ty})`;
      break;
    case 'right':
      tx = bx + d / 2; ty = by;
      rotate = `rotate(90 ${tx} ${ty})`;
      break;
    case 'top':
      tx = bx; ty = by - d / 2;
      break;
    default: // bottom
      tx = bx; ty = by + d / 2;
      break;
  }
  const badgeFontSize = String(Math.max(10, config.fontSize - 3));
  return svgText(safeStr(text), {
    x: tx, y: ty,
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    fill: '#fff', 'font-size': badgeFontSize, 'font-family': config.fontFamily,
    'font-weight': 'bold', transform: rotate,
  });
}

// ── Arrow markers ─────────────────────────────────────────────────────────────

function addArrowMarkers(svgElement: Element, colors: string[]): void {
  const defs = svgEl('defs', {});
  const seen = new Set<string>();
  for (const color of colors) {
    if (seen.has(color)) continue;
    seen.add(color);
    const id = 'arr-' + color.replace('#', '');
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

function renderNodeBadges(nl: NodeLayout, config: MonotrailConfig): Element {
  const g = svgEl('g', {});
  for (const port of nl.allPorts) {
    const color = signalColor(port.type, config);
    const { bx, by, side } = nl.portAnchors[port.label];
    g.appendChild(svgEl('polygon', { points: trapPoints(bx, by, side), fill: color }));
    g.appendChild(badgeLabel(port.label, bx, by, side, config));
  }
  return g;
}

function renderNodeBox(nl: NodeLayout, config: MonotrailConfig): Element {
  const { x, y, label, moduleType } = nl;
  const g = svgEl('g', {});

  g.appendChild(svgEl('rect', {
    x, y, width: BOX_W, height: BOX_TOP_H,
    fill: config.nodeHeaderFill,
    stroke: config.nodeBorderColor,
    'stroke-width': 1.5,
  }));

  const nodeFontSize = String(config.fontSize);
  g.appendChild(svgText(sanitize(safeStr(moduleType).toUpperCase()), {
    x: x + BOX_W / 2, y: y + BOX_TOP_H / 2,
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    fill: config.nodeHeaderText,
    'font-size': nodeFontSize, 'font-family': config.fontFamily,
    'font-weight': 'bold', 'letter-spacing': '0.06em',
  }));

  g.appendChild(svgEl('rect', {
    x, y: y + BOX_TOP_H, width: BOX_W, height: BOX_BOT_H,
    fill: config.nodeBodyFill,
    stroke: config.nodeBorderColor,
    'stroke-width': 1.5,
  }));

  if (label !== null) {
    g.appendChild(svgText(sanitize(label), {
      x: x + BOX_W / 2, y: y + BOX_TOP_H + BOX_BOT_H / 2,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: config.nodeBodyText,
      'font-size': nodeFontSize, 'font-family': config.fontFamily,
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
  config: MonotrailConfig
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
    else { src = { x: fromNode.x + BOX_W + BADGE_D, y: fromNode.y + BOX_H / 2 }; srcSide = 'right'; }
  }

  const fromPortInfo = conn.fromPort
    ? fromNode.allPorts.find((p) => p.label === conn.fromPort)
    : null;
  const color = signalColor(fromPortInfo ? fromPortInfo.type : 'default', config);
  const [dx, dy] = SIDE_DIR[srcSide];
  const end = { x: src.x + dx * DANGLING_LEN, y: src.y + dy * DANGLING_LEN };

  const markerId = 'arr-' + color.replace('#', '');
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
  config: MonotrailConfig
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
    else { dst = { x: toNode.x - BADGE_D, y: toNode.y + BOX_H / 2 }; destSide = 'left'; }
  }

  const toPortInfo = conn.toPort ? toNode.allPorts.find((p) => p.label === conn.toPort) : null;
  const color = signalColor(toPortInfo ? toPortInfo.type : 'default', config);
  const [dx, dy] = SIDE_DIR[destSide];
  const start = { x: dst.x + dx * STUB, y: dst.y + dy * STUB };

  const markerId = 'arr-' + color.replace('#', '');
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

function renderElkEdge(
  section: { startPoint: { x: number; y: number }; endPoint: { x: number; y: number }; bendPoints?: Array<{ x: number; y: number }> },
  srcSide: Side,
  destSide: Side,
  color: string,
  label: string | null | undefined,
  config: MonotrailConfig
): Element[] {
  const [sdx, sdy] = SIDE_DIR[srcSide] ?? [1, 0];
  const [ddx, ddy] = SIDE_DIR[destSide] ?? [-1, 0];

  const sp = section.startPoint;
  const ep = section.endPoint;
  const srcTip = { x: sp.x - sdx * STUB, y: sp.y - sdy * STUB };
  const destTip = { x: ep.x - ddx * STUB, y: ep.y - ddy * STUB };

  const bends = section.bendPoints || [];
  const raw = [srcTip, sp, ...bends, ep, destTip];
  const pts = raw.filter(
    (p, i) =>
      i === 0 ||
      Math.abs(p.x - raw[i - 1].x) > 0.5 ||
      Math.abs(p.y - raw[i - 1].y) > 0.5
  );

  const d = 'M ' + pts.map((p) => `${Math.round(p.x)} ${Math.round(p.y)}`).join(' L ');
  const markerId = 'arr-' + color.replace('#', '');
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

// ── Draw ──────────────────────────────────────────────────────────────────────

export const draw = async (
  text: string,
  id: string,
  _version: string,
  diagram: { db: MonotrailDB }
): Promise<void> => {
  log.info('Monotrail draw', id);

  const svgElement = document.querySelector<SVGSVGElement>(`#${CSS.escape(id)}`);
  if (!svgElement) {
    log.error('Monotrail: cannot find SVG element', id);
    return;
  }

  // Clear
  while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

  const db = diagram.db;
  const config = db.getConfig();
  const ast = db.getData();

  if (!ast) {
    log.error('Monotrail: no AST in db for', id);
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
    log.error('Monotrail layout error:', String(e));
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
    ? Math.max(...allNl.map((nl) => nl.x)) + BOX_W + SVG_PAD + BADGE_D
    : 400;
  const svgHeight = allNl.length
    ? Math.max(...allNl.map((nl) => nl.y)) + BOX_H + SVG_PAD + BADGE_D
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
        src = rp ? portTip(fn, rp.label) : { x: fn.x + BOX_W + BADGE_D, y: fn.y + BOX_H / 2 };
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
        dst = lp ? portTip(tn, lp.label) : { x: tn.x - BADGE_D, y: tn.y + BOX_H / 2 };
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
  const edgesG = svgEl('g', { class: 'monotrail-edges' });
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
  const badgesG = svgEl('g', { class: 'monotrail-badges' });
  for (const nl of allNl) badgesG.appendChild(renderNodeBadges(nl, config));
  svgElement.appendChild(badgesG);

  // 3. Node boxes (on top)
  const boxesG = svgEl('g', { class: 'monotrail-nodes' });
  for (const nl of allNl) boxesG.appendChild(renderNodeBox(nl, config));
  svgElement.appendChild(boxesG);

  // 4. Warnings panel
  if (warnings.length) {
    const panelY = svgHeight;
    const panelG = svgEl('g', { class: 'monotrail-warnings' });
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
};

export default { draw };
