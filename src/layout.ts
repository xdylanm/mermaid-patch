/**
 * ELK-based layout engine for patch diagrams.
 *
 * This is a direct port of buildElkLayout() from patchlog/renderPatchDiagram.js,
 * converted to TypeScript with elkjs imported directly (bundled).
 *
 * The layout is pure computation — no DOM access required.
 */
import ELK from 'elkjs/lib/elk.bundled.js';
import type {
  PatchAST,
  Connection,
  LayoutResult,
  NodeLayout,
  PortMeta,
  Side,
  SignalType,
} from './types.js';
import type { PatchConfig } from './config.js';
import { DEFAULT_CONFIG } from './config.js';
import { parsePatch } from './parser.js';

// ── Layout constants ──────────────────────────────────────────────────────────
export const BOX_W = 144;
export const BOX_H = 81;
// Band thickness per step: 6 px horizontally (wide/thick edge), ~2% of height vertically (min 1 px).
// Adjust these two values to tune the visual weight of the banded frame.
export const BAND_STEP_H = 5; // px per band (horizontal / thick edge)
export const BAND_STEP_V = Math.max(1, Math.round(BOX_H * 0.02)); // ≈ 2 px per band (vertical)
// Corner radius at the outermost band (dark) and innermost layer (background).
// Intermediate layers interpolate linearly between these two values.
export const CORNER_R_OUTER = 12; // outermost band corner radius (px)
export const CORNER_R_INNER = 4;  // background layer corner radius (px)
export const TAB_D = 24; // depth of port tab (perpendicular to node edge), px
export const TAB_L = BOX_H - 2 * CORNER_R_OUTER; // length of port tab along node edge = 57 px
export const LAYER_GAP = 17;
export const NODE_GAP = 16;
export const SVG_PAD = 40;
export const STUB = 36;
export const DANGLING_LEN = 60;

// Direction vectors for each side
export const SIDE_DIR: Record<Side, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  top: [0, -1],
  bottom: [0, 1],
};

// ── Node box SVG geometry ─────────────────────────────────────────────────────

/**
 * Returns SVG path data for a rectangle with:
 *   top-right corner   — quadratic bezier arc (radius r)
 *   bottom-left corner — quadratic bezier arc (radius r)
 *   top-left, bottom-right — sharp right angles
 * Winding is clockwise so the interior fills with the default fill-rule.
 *
 * Used by the renderer to build each banded-frame layer for the node box.
 * The corner radius `r` should decrease with each inner layer so that nested
 * arcs create a smooth graduated transition at the rounded corners.
 */
export function mixedCornerRect(x: number, y: number, w: number, h: number, r: number): string {
  const rc = Math.min(r, w / 2, h / 2);
  if (rc <= 0) {
    return `M ${x},${y} H ${x + w} V ${y + h} H ${x} Z`;
  }
  return (
    `M ${x},${y}` +                                       // top-left (sharp)
    ` H ${x + w - rc}` +                                  // → top edge
    ` Q ${x + w},${y} ${x + w},${y + rc}` +              // top-right arc ↘
    ` V ${y + h}` +                                       // ↓ right edge (sharp bottom-right)
    ` H ${x + rc}` +                                      // ← bottom edge
    ` Q ${x},${y + h} ${x},${y + h - rc}` +              // bottom-left arc ↑
    ` Z`                                                   // ↑ left edge → top-left
  );
}

/**
 * Returns SVG path data for one band layer of a port tab in canonical orientation:
 *   Width = tl (horizontal), Height = td (vertical)
 *   Open/attachment side = bottom (y = td)
 *   Outer/thick edge     = right  (BAND_STEP_H per band)
 *   Thin edges           = left and top (BAND_STEP_V per band)
 *
 * The path traces the outer boundary clockwise, then the inner boundary
 * counter-clockwise (same approach as mixedCornerRect nested layers).
 *
 * Arc radii:
 *   Top-right corner (thin-top → thick-right): rTR_outer / rTR_inner
 *     Follow the same radius progression as the node-box band layers:
 *     rTR = CORNER_R_OUTER - i * rStep, rTR_inner = CORNER_R_OUTER - (i+1)*rStep
 *   Top-left corner (thin-left ↔ thin-top): rTL_outer / rTL_inner
 *     rTL = CORNER_R_OUTER - outerV  (so arc centre at (outerV, outerV) has
 *     effective radius CORNER_R_OUTER, keeping band width constant around corner)
 *
 * @param tl        - tab length (canonical width, = TAB_L)
 * @param td        - tab depth  (canonical height, = TAB_D)
 * @param outerH    - right inset of outer boundary (= i * BAND_STEP_H)
 * @param innerH    - right inset of inner boundary (= (i+1) * BAND_STEP_H)
 * @param outerV    - left/top inset of outer boundary (= i * BAND_STEP_V)
 * @param innerV    - left/top inset of inner boundary (= (i+1) * BAND_STEP_V)
 * @param rTR_outer - top-right arc radius for outer boundary
 * @param rTR_inner - top-right arc radius for inner boundary
 * @param rTL_outer - top-left  arc radius for outer boundary (= CORNER_R_OUTER - outerV)
 * @param rTL_inner - top-left  arc radius for inner boundary (= CORNER_R_OUTER - innerV)
 */
export function tabBandPath(
  tl: number, td: number,
  outerH: number, innerH: number,
  outerV: number, innerV: number,
  rTR_outer: number, rTR_inner: number,
  rTL_outer: number, rTL_inner: number,
): string {
  return [
    // ── Outer boundary (clockwise) ────────────────────────────────────────
    `M ${outerV},${td}`,                                                        // 1. bottom-left sharp corner
    `V ${outerV + rTL_outer}`,                                                  // 2. up left thin edge
    `Q ${outerV},${outerV} ${outerV + rTL_outer},${outerV}`,                   // 3. top-left arc (thin-left → thin-top)
    `H ${tl - outerH - rTR_outer}`,                                             // 4. right along top thin edge
    `Q ${tl - outerH},${outerV} ${tl - outerH},${outerV + rTR_outer}`,         // 5. top-right arc (thin-top → thick-right)
    `V ${td}`,                                                                   // 6. down right thick edge (sharp bottom-right)
    // ── Inner boundary (counter-clockwise) ───────────────────────────────
    `H ${tl - innerH}`,                                                          // 7. left along open bottom edge (inner)
    `V ${innerV + rTR_inner}`,                                                   // 8. up right thick edge (inner)
    `Q ${tl - innerH},${innerV} ${tl - innerH - rTR_inner},${innerV}`,          // 9. top-right arc inner
    `H ${innerV + rTL_inner}`,                                                   // 10. left along top thin edge (inner)
    `Q ${innerV},${innerV} ${innerV},${innerV + rTL_inner}`,                    // 11. top-left arc inner
    `V ${td}`,                                                                   // 12. down left thin edge (inner, sharp bottom-left)
    `Z`,                                                                         // 13. close
  ].join(' ');
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

/** Parametric segment intersection. Returns intersection point or null. */
function segIntersect(
  p0: { x: number; y: number },
  q0: { x: number; y: number },
  p1: { x: number; y: number },
  q1: { x: number; y: number }
): { t: number; x: number; y: number } | null {
  const dx0 = q0.x - p0.x, dy0 = q0.y - p0.y;
  const dx1 = q1.x - p1.x, dy1 = q1.y - p1.y;
  const denom = dx0 * dy1 - dy0 * dx1;
  if (Math.abs(denom) < 1e-9) return null;
  const fx = p1.x - p0.x, fy = p1.y - p0.y;
  const t = (fx * dy1 - fy * dx1) / denom;
  const u = (fx * dy0 - fy * dx0) / denom;
  if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return null;
  return { t, x: p0.x + t * dx0, y: p0.y + t * dy0 };
}

// ── Port inference ────────────────────────────────────────────────────────────

export interface PortInfo {
  moduleDefs: Record<string, { ports: Array<{ type: string; label: string }> }>;
  outPorts: Record<string, Set<string>>;
  inPorts: Record<string, Set<string>>;
}

export function prepareConnections(ast: PatchAST): PortInfo {
  const moduleDefs: PortInfo['moduleDefs'] = {};
  for (const m of ast.modules) moduleDefs[m.name] = m;

  const canonicalPort: Record<string, Map<string, string>> = {};
  for (const node of ast.nodes) {
    const def = moduleDefs[node.function];
    if (!def) continue;
    canonicalPort[node.name] = new Map(def.ports.map((p) => [p.label.toLowerCase(), p.label]));
  }

  function resolvePort(nodeName: string, label: string): string {
    const map = canonicalPort[nodeName];
    if (!map || !label) return label;
    return map.get(label.toLowerCase()) ?? label;
  }

  const outPorts: Record<string, Set<string>> = {};
  const inPorts: Record<string, Set<string>> = {};
  for (const c of ast.connections) {
    if (c.fromPort && c.from) {
      c.fromPort = resolvePort(c.from, c.fromPort);
      if (!outPorts[c.from]) outPorts[c.from] = new Set();
      outPorts[c.from].add(c.fromPort);
    }
    if (c.toPort && c.to) {
      c.toPort = resolvePort(c.to, c.toPort);
      if (!inPorts[c.to]) inPorts[c.to] = new Set();
      inPorts[c.to].add(c.toPort);
    }
  }
  return { moduleDefs, outPorts, inPorts };
}

// ── Any signal type resolution ────────────────────────────────────────────────

function resolveAnyTypes(
  ast: PatchAST,
  portMeta: Record<string, Record<string, PortMeta>>
): void {
  const originalType: Record<string, Record<string, string>> = {};
  for (const [nodeName, ports] of Object.entries(portMeta)) {
    originalType[nodeName] = {};
    for (const [portLabel, meta] of Object.entries(ports)) {
      originalType[nodeName][portLabel] = meta.type;
    }
  }

  function getOrigType(nodeName: string, portLabel: string): string | null {
    return (originalType[nodeName] && originalType[nodeName][portLabel]) || null;
  }

  const normalConns = ast.connections.filter(
    (c) => c.type !== 'dangling' && c.from && c.to && c.fromPort && c.toPort
  );

  for (const [nodeName, ports] of Object.entries(portMeta)) {
    for (const [portLabel, meta] of Object.entries(ports)) {
      if (getOrigType(nodeName, portLabel) !== 'any') continue;
      const concreteTypes = new Set<string>();
      for (const conn of normalConns) {
        if (conn.from === nodeName && conn.fromPort === portLabel) {
          const t = getOrigType(conn.to!, conn.toPort!);
          if (t && t !== 'any') concreteTypes.add(t);
        }
        if (conn.to === nodeName && conn.toPort === portLabel) {
          const t = getOrigType(conn.from!, conn.fromPort!);
          if (t && t !== 'any') concreteTypes.add(t);
        }
      }
      if (concreteTypes.size === 1) {
        meta.type = [...concreteTypes][0] as SignalType;
      } else if (concreteTypes.size > 1) {
        meta.type = 'cv';
      }
    }
  }

  for (const conn of normalConns) {
    const fromMeta = portMeta[conn.from!] && portMeta[conn.from!][conn.fromPort!];
    const toMeta = portMeta[conn.to!] && portMeta[conn.to!][conn.toPort!];
    if (fromMeta && fromMeta.type === 'any') fromMeta.type = 'cv';
    if (toMeta && toMeta.type === 'any') toMeta.type = 'cv';
  }

  for (const [nodeName, ports] of Object.entries(portMeta)) {
    for (const [portLabel, meta] of Object.entries(ports)) {
      if (getOrigType(nodeName, portLabel) === 'any') {
        meta.wasAny = true;
      }
    }
  }
}

// ── Connection validation ─────────────────────────────────────────────────────

export function validateConnections(ast: PatchAST): {
  warnings: string[];
  broken: Set<Connection>;
} {
  const moduleDefs: Record<string, { ports: Array<{ label: string }> }> = {};
  for (const m of ast.modules) moduleDefs[m.name] = m;
  const nodeMap: Record<string, { function: string }> = {};
  for (const n of ast.nodes) nodeMap[n.name] = n;

  const warnings: string[] = [];
  const broken = new Set<Connection>();

  for (const conn of ast.connections) {
    let isBroken = false;
    const fromNode = conn.from ? nodeMap[conn.from] : null;
    const toNode = conn.to ? nodeMap[conn.to] : null;

    if (conn.from) {
      if (!fromNode) {
        warnings.push(`Unknown node "${conn.from}" (from-side of connection)`);
        isBroken = true;
      } else if (conn.fromPort) {
        const def = moduleDefs[fromNode.function];
        if (def && !def.ports.some((p) => p.label === conn.fromPort)) {
          warnings.push(`${conn.from}:${conn.fromPort} — port not in ${fromNode.function} definition`);
          isBroken = true;
        }
      }
    }

    if (conn.type !== 'dangling') {
      if (!toNode) {
        warnings.push(`Unknown node "${conn.to}" (to-side of connection)`);
        isBroken = true;
      } else if (conn.toPort) {
        const def = moduleDefs[toNode.function];
        if (def && !def.ports.some((p) => p.label === conn.toPort)) {
          warnings.push(`${conn.to}:${conn.toPort} — port not in ${toNode.function} definition`);
          isBroken = true;
        }
      }
    }

    if (isBroken) broken.add(conn);
  }

  return { warnings, broken };
}

// ── Port geometry helpers (needed by renderer & inspectLayout) ────────────────

export function badgeAnchorFn(nl: NodeLayout, portName?: string | null): { bx: number; by: number; side: Side } {
  if (!portName) return { bx: nl.x + BOX_W, by: nl.y + BOX_H / 2, side: 'right' };
  return nl.portAnchors[portName] ?? { bx: nl.x + BOX_W, by: nl.y + BOX_H / 2, side: 'right' };
}

export function portTipFn(nl: NodeLayout, portName?: string | null): { x: number; y: number } {
  const { bx, by, side } = badgeAnchorFn(nl, portName);
  switch (side) {
    case 'left':   return { x: bx - TAB_D, y: by };
    case 'right':  return { x: bx + TAB_D, y: by };
    case 'top':    return { x: bx, y: by - TAB_D };
    case 'bottom': return { x: bx, y: by + TAB_D };
  }
}

// ── ELK layout ────────────────────────────────────────────────────────────────

export async function buildLayout(
  ast: PatchAST,
  portInfo: PortInfo,
  brokenConns: Set<Connection>,
  config: PatchConfig
): Promise<LayoutResult> {
  const { moduleDefs, outPorts, inPorts } = portInfo;
  const { portPlacement = 'elk-optimized', nodePlacementStrategy = 'brandes-koepf' } = config;

  const PORT_SPLIT = 12;
  const SIDE_PERP: Record<Side, [number, number]> = {
    right: [0, 1], left: [0, 1], top: [1, 0], bottom: [1, 0],
  };
  const SIDE_TO_ELK: Record<Side, string> = {
    right: 'EAST', left: 'WEST', top: 'NORTH', bottom: 'SOUTH',
  };

  // ── Compute portMeta ────────────────────────────────────────────────────────
  const portMeta: Record<string, Record<string, PortMeta>> = {};
  const nodePortLabels: Record<string, string[]> = {};

  for (const node of ast.nodes) {
    const def = moduleDefs[node.function] || { ports: [] };
    const defPortMap: Record<string, { type: string; label: string }> = {};
    for (const p of def.ports) defPortMap[p.label] = p;

    const seen = new Set<string>();
    const allPortLabels: string[] = [];
    const add = (l: string) => { if (!seen.has(l)) { seen.add(l); allPortLabels.push(l); } };

    const nodeOutPorts = outPorts[node.name] || new Set<string>();
    const nodeInPorts = inPorts[node.name] || new Set<string>();
    for (const p of def.ports) {
      if (nodeOutPorts.has(p.label) || nodeInPorts.has(p.label)) add(p.label);
    }
    for (const l of nodeOutPorts) add(l);
    for (const l of nodeInPorts) add(l);

    const outputLabels = allPortLabels.filter((l) => nodeOutPorts.has(l) || !nodeInPorts.has(l));
    const inputLabels = allPortLabels.filter((l) => nodeInPorts.has(l) && !nodeOutPorts.has(l));

    const OUTPUT_SIDE_PREF: Side[] = ['right', 'bottom', 'top', 'left'];
    const INPUT_SIDE_PREF: Side[] = ['left', 'top', 'bottom', 'right'];
    const taken = new Set<Side>();
    const portSides: Record<string, Side> = {};
    for (const label of outputLabels) {
      const side = OUTPUT_SIDE_PREF.find((s) => !taken.has(s)) ?? 'right';
      taken.add(side);
      portSides[label] = side;
    }
    for (const label of inputLabels) {
      const side = INPUT_SIDE_PREF.find((s) => !taken.has(s)) ?? 'left';
      taken.add(side);
      portSides[label] = side;
    }

    portMeta[node.name] = {};
    for (const label of allPortLabels) {
      portMeta[node.name][label] = {
        side: portSides[label] || 'right',
        type: ((defPortMap[label] || {}).type as SignalType) || 'default',
      };
    }
    nodePortLabels[node.name] = allPortLabels;
  }

  resolveAnyTypes(ast, portMeta);

  // ── Pre-sort connections (ASAP topological order) ─────────────────────────
  {
    const preFwd: Record<string, string[]> = {};
    const preIn: Record<string, number> = {};
    for (const node of ast.nodes) { preFwd[node.name] = []; preIn[node.name] = 0; }
    for (const conn of ast.connections) {
      if (conn.type === 'dangling' || brokenConns.has(conn) || !conn.from || !conn.to) continue;
      preFwd[conn.from].push(conn.to);
    }
    for (const tos of Object.values(preFwd)) for (const to of tos) preIn[to]++;
    const asap: Record<string, number> = {};
    for (const node of ast.nodes) asap[node.name] = 0;
    const sortQ = ast.nodes.filter((n) => preIn[n.name] === 0).map((n) => n.name);
    while (sortQ.length > 0) {
      const v = sortQ.shift()!;
      for (const u of preFwd[v]) {
        if (asap[v] + 1 > (asap[u] || 0)) asap[u] = asap[v] + 1;
        if (--preIn[u] === 0) sortQ.push(u);
      }
    }
    const MAX = 9999;
    ast.connections.sort((a, b) => {
      const aF = a.from ?? null, bF = b.from ?? null;
      const aT = a.to ?? null, bT = b.to ?? null;
      const aAsapF = aF ? (asap[aF] ?? MAX) : MAX;
      const bAsapF = bF ? (asap[bF] ?? MAX) : MAX;
      if (aAsapF !== bAsapF) return aAsapF - bAsapF;
      const aAsapT = aT ? (asap[aT] ?? MAX) : MAX;
      const bAsapT = bT ? (asap[bT] ?? MAX) : MAX;
      if (aAsapT !== bAsapT) return bAsapT - aAsapT;
      return (aF ?? '\uFFFF').localeCompare(bF ?? '\uFFFF') ||
             (aT ?? '\uFFFF').localeCompare(bT ?? '\uFFFF');
    });
  }

  // ── Slot tracking ─────────────────────────────────────────────────────────
  const srcSlots: Record<string, Record<string, number[]>> = {};
  const dstSlots: Record<string, Record<string, number[]>> = {};
  ast.connections.forEach((conn, i) => {
    if (conn.type === 'dangling' || brokenConns.has(conn) || !conn.from || !conn.to) return;
    if (conn.fromPort) {
      if (!srcSlots[conn.from]) srcSlots[conn.from] = {};
      if (!srcSlots[conn.from][conn.fromPort]) srcSlots[conn.from][conn.fromPort] = [];
      srcSlots[conn.from][conn.fromPort].push(i);
    }
    if (conn.toPort) {
      if (!dstSlots[conn.to]) dstSlots[conn.to] = {};
      if (!dstSlots[conn.to][conn.toPort]) dstSlots[conn.to][conn.toPort] = [];
      dstSlots[conn.to][conn.toPort].push(i);
    }
  });

  // ── Build ELK graph ───────────────────────────────────────────────────────
  function buildGraph({ interactive = false, xOverrides = {} as Record<string, number> } = {}) {
    const BS = TAB_D + STUB;
    const elkW = BOX_W + 2 * BS;
    const elkH = BOX_H + 2 * BS;
    const SIDE_TO_POS: Record<Side, { x: number; y: number }> = {
      right:  { x: elkW,           y: BS + BOX_H / 2 },
      left:   { x: 0,              y: BS + BOX_H / 2 },
      top:    { x: BS + BOX_W / 2, y: 0 },
      bottom: { x: BS + BOX_W / 2, y: elkH },
    };

    const connPortId: Record<number, { src?: string; dst?: string }> = {};
    for (const [nn, ports] of Object.entries(srcSlots)) {
      for (const [label, list] of Object.entries(ports)) {
        const n = list.length;
        list.forEach((ci, s) => {
          if (!connPortId[ci]) connPortId[ci] = {};
          connPortId[ci].src = n === 1 ? `${nn}__${label}` : `${nn}__${label}__s${s}`;
        });
      }
    }
    for (const [nn, ports] of Object.entries(dstSlots)) {
      for (const [label, list] of Object.entries(ports)) {
        const n = list.length;
        list.forEach((ci, s) => {
          if (!connPortId[ci]) connPortId[ci] = {};
          connPortId[ci].dst = n === 1 ? `${nn}__${label}` : `${nn}__${label}__s${s}`;
        });
      }
    }

    const elkChildren = ast.nodes.map((node) => {
      const allPortLabels = nodePortLabels[node.name];
      const nodeOutSet = outPorts[node.name] || new Set<string>();
      const nodeInSet = inPorts[node.name] || new Set<string>();
      const elkPorts: unknown[] = [];

      for (const label of allPortLabels) {
        const meta = portMeta[node.name][label];
        const side = meta.side;
        const basePos = SIDE_TO_POS[side];
        const [px, py] = SIDE_PERP[side];
        const isOutput = nodeOutSet.has(label) || !nodeInSet.has(label);
        const slotList = isOutput
          ? (srcSlots[node.name] || {})[label] || []
          : (dstSlots[node.name] || {})[label] || [];
        const n = Math.max(slotList.length, 1);

        for (let s = 0; s < n; s++) {
          const offset = (s - (n - 1) / 2) * PORT_SPLIT;
          const vid = n === 1 ? `${node.name}__${label}` : `${node.name}__${label}__s${s}`;
          elkPorts.push({
            id: vid,
            x: basePos.x + px * offset,
            y: basePos.y + py * offset,
            properties: { 'port.side': SIDE_TO_ELK[side] },
          });
        }
      }

      const child: Record<string, unknown> = {
        id: node.name,
        width: elkW, height: elkH,
        ports: elkPorts,
        layoutOptions: { portConstraints: 'FIXED_POS' },
      };
      if (xOverrides[node.name] !== undefined) child.x = xOverrides[node.name];
      return child;
    });

    const elkEdges: unknown[] = [];
    ast.connections.forEach((conn, i) => {
      if (conn.type === 'dangling' || brokenConns.has(conn) || !conn.from || !conn.to) return;
      const srcMeta = portMeta[conn.from] || {};
      const destMeta = portMeta[conn.to] || {};

      let srcPortId = connPortId[i]?.src;
      if (!srcPortId) {
        if (conn.fromPort && srcMeta[conn.fromPort]) srcPortId = `${conn.from}__${conn.fromPort}`;
        else {
          const k = Object.keys(srcMeta).find((k) => srcMeta[k].side === 'right');
          if (!k) return;
          srcPortId = `${conn.from}__${k}`;
        }
      }
      let destPortId = connPortId[i]?.dst;
      if (!destPortId) {
        if (conn.toPort && destMeta[conn.toPort]) destPortId = `${conn.to}__${conn.toPort}`;
        else {
          const k = Object.keys(destMeta).find((k) => destMeta[k].side === 'left');
          if (!k) return;
          destPortId = `${conn.to}__${k}`;
        }
      }
      elkEdges.push({ id: `e${i}`, sources: [srcPortId], targets: [destPortId] });
    });

    const rootLayoutOptions: Record<string, string> = {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.spacing.nodeNodeBetweenLayers': String(LAYER_GAP),
      'elk.spacing.nodeNode': String(NODE_GAP),
      'elk.padding': `[top=${SVG_PAD},left=${SVG_PAD},bottom=${SVG_PAD},right=${SVG_PAD}]`,
    };
    if (interactive) rootLayoutOptions['elk.layered.layering.strategy'] = 'INTERACTIVE';
    else rootLayoutOptions['elk.layered.layering.strategy'] = 'NETWORK_SIMPLEX';

    const NPS_MAP: Record<string, string> = {
      'brandes-koepf': 'BRANDES_KOEPF',
      'network-simplex': 'NETWORK_SIMPLEX',
      'simple': 'SIMPLE',
    };
    if (NPS_MAP[nodePlacementStrategy]) {
      rootLayoutOptions['elk.layered.nodePlacement.strategy'] = NPS_MAP[nodePlacementStrategy];
    }

    return {
      id: 'root',
      layoutOptions: rootLayoutOptions,
      children: elkChildren,
      edges: elkEdges,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elk = new (ELK as any)();

  // ── Pass 1 ────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result1: any = await elk.layout(buildGraph());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const secs1: Record<number, any[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const e of (result1.edges || [])) secs1[parseInt(e.id.slice(1), 10)] = e.sections || [];

  // ── Geometry-based port face assignment (elk-optimized) ───────────────────
  const changedFaceKeys = new Set<string>();
  let facesChanged = false;

  if (portPlacement === 'elk-optimized') {
    const BS2 = TAB_D + STUB;
    const nodeY: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const elkNode of (result1.children || []) as any[]) {
      nodeY[elkNode.id] = elkNode.y + BS2 + BOX_H / 2;
    }

    function connAvgY(nodeName: string, label: string, isOutput: boolean): number {
      const cy = nodeY[nodeName] ?? 0;
      const ys: number[] = [];
      for (const conn of ast.connections) {
        if (brokenConns.has(conn)) continue;
        if (isOutput) {
          if (conn.from !== nodeName || conn.fromPort !== label) continue;
          ys.push(conn.type === 'dangling' || !conn.to ? cy : (nodeY[conn.to] ?? cy));
        } else {
          if (conn.to !== nodeName || conn.toPort !== label) continue;
          ys.push(conn.type === 'dangling' || !conn.from ? cy : (nodeY[conn.from] ?? cy));
        }
      }
      return ys.length > 0 ? ys.reduce((a, b) => a + b, 0) / ys.length : cy;
    }

    function findCenter(withY: Array<{ avgY: number }>, cy: number): number {
      let idx = 0, minDist = Infinity;
      for (let i = 0; i < withY.length; i++) {
        const d = Math.abs(withY[i].avgY - cy);
        if (d < minDist) { minDist = d; idx = i; }
      }
      return idx;
    }

    function setFace(nodeName: string, label: string, face: Side): void {
      if (portMeta[nodeName][label].side !== face) {
        portMeta[nodeName][label].side = face;
        changedFaceKeys.add(`${nodeName}|${label}`);
        facesChanged = true;
      }
    }

    for (const node of ast.nodes) {
      const cy = nodeY[node.name];
      if (cy === undefined) continue;

      const labels = nodePortLabels[node.name] || [];
      const nodeOutSet = outPorts[node.name] || new Set<string>();
      const nodeInSet = inPorts[node.name] || new Set<string>();
      const inputLabels = labels.filter((l) => nodeInSet.has(l) && !nodeOutSet.has(l));
      const outputLabels = labels.filter((l) => nodeOutSet.has(l) || !nodeInSet.has(l));

      for (const label of inputLabels)  setFace(node.name, label, 'left');
      for (const label of outputLabels) setFace(node.name, label, 'right');

      let nUsed = false, sUsed = false;

      if (inputLabels.length > 1) {
        const withY = inputLabels
          .map((l) => ({ label: l, avgY: connAvgY(node.name, l, false) }))
          .sort((a, b) => a.avgY - b.avgY);
        const ci = findCenter(withY, cy);
        let nMoved = 0, sMoved = 0;
        for (let i = 0; i < withY.length; i++) {
          const { label } = withY[i];
          if (i < ci && nMoved < 2)       { setFace(node.name, label, 'top');    nMoved++; nUsed = true; }
          else if (i > ci && sMoved < 2)  { setFace(node.name, label, 'bottom'); sMoved++; sUsed = true; }
        }
      }

      if (outputLabels.length > 1) {
        const withY = outputLabels
          .map((l) => ({ label: l, avgY: connAvgY(node.name, l, true) }))
          .sort((a, b) => a.avgY - b.avgY);
        const ci = findCenter(withY, cy);
        let nMoved = 0, sMoved = 0;
        for (let i = 0; i < withY.length; i++) {
          const { label } = withY[i];
          if (i < ci && !nUsed && nMoved < 2)       { setFace(node.name, label, 'top');    nMoved++; nUsed = true; }
          else if (i > ci && !sUsed && sMoved < 2)  { setFace(node.name, label, 'bottom'); sMoved++; sUsed = true; }
        }
      }
    }
  }

  // ── Slot reordering ───────────────────────────────────────────────────────
  let reordered = false;

  for (const [nodeName, ports] of Object.entries(srcSlots)) {
    for (const [label, list] of Object.entries(ports)) {
      if (list.length < 2) continue;
      if (changedFaceKeys.has(`${nodeName}|${label}`)) continue;
      const side = portMeta[nodeName][label].side;
      const useX = side === 'right' || side === 'left';

      const slotPts = list.map((ci) => secs1[ci]?.[0]?.startPoint ?? null);
      const endPts: Record<number, { x: number; y: number } | null> = Object.fromEntries(
        list.map((ci) => [ci, secs1[ci]?.[0]?.endPoint ?? null])
      );

      let MAX_ITERS = list.length * list.length + 2;
      let changed = true;
      while (changed && MAX_ITERS-- > 0) {
        changed = false;
        let bestI = -1, bestJ = -1, bestDist = Infinity;
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const p0 = slotPts[i], q0 = endPts[list[i]];
            const p1 = slotPts[j], q1 = endPts[list[j]];
            if (!p0 || !q0 || !p1 || !q1) continue;
            const hit = segIntersect(p0, q0, p1, q1);
            if (!hit) continue;
            const srcCoord = useX ? p0.x : p0.y;
            const hitCoord = useX ? hit.x : hit.y;
            const dist = Math.abs(hitCoord - srcCoord);
            if (dist < bestDist) { bestDist = dist; bestI = i; bestJ = j; }
          }
        }
        if (bestI >= 0) {
          [list[bestI], list[bestJ]] = [list[bestJ], list[bestI]];
          reordered = true;
          changed = true;
        }
      }
    }
  }

  for (const [nodeName, ports] of Object.entries(dstSlots)) {
    for (const [label, list] of Object.entries(ports)) {
      if (list.length < 2) continue;
      if (changedFaceKeys.has(`${nodeName}|${label}`)) continue;
      const side = portMeta[nodeName][label].side;
      const useX = side === 'right' || side === 'left';

      const slotPts = list.map((ci) => secs1[ci]?.[0]?.endPoint ?? null);
      const startPts: Record<number, { x: number; y: number } | null> = Object.fromEntries(
        list.map((ci) => [ci, secs1[ci]?.[0]?.startPoint ?? null])
      );

      let MAX_ITERS = list.length * list.length + 2;
      let changed = true;
      while (changed && MAX_ITERS-- > 0) {
        changed = false;
        let bestI = -1, bestJ = -1, bestDist = Infinity;
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const p0 = startPts[list[i]], q0 = slotPts[i];
            const p1 = startPts[list[j]], q1 = slotPts[j];
            if (!p0 || !q0 || !p1 || !q1) continue;
            const hit = segIntersect(p0, q0, p1, q1);
            if (!hit) continue;
            const dstCoord = useX ? q0.x : q0.y;
            const hitCoord = useX ? hit.x : hit.y;
            const dist = Math.abs(hitCoord - dstCoord);
            if (dist < bestDist) { bestDist = dist; bestI = i; bestJ = j; }
          }
        }
        if (bestI >= 0) {
          [list[bestI], list[bestJ]] = [list[bestJ], list[bestI]];
          reordered = true;
          changed = true;
        }
      }
    }
  }

  // ── Pass 2 ────────────────────────────────────────────────────────────────
  const pass1Xs: Record<string, number> = {};
  if (facesChanged) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const elkNode of (result1.children || []) as any[]) pass1Xs[elkNode.id] = elkNode.x;
  }
  const needPass2 = reordered || facesChanged;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = needPass2
    ? await elk.layout(buildGraph({ interactive: facesChanged, xOverrides: facesChanged ? pass1Xs : {} }))
    : result1;

  // ── Build layout map ──────────────────────────────────────────────────────
  const layout: Record<string, NodeLayout> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const elkNode of (result.children || []) as any[]) {
    const name = elkNode.id;
    const BS = TAB_D + STUB;
    const x = elkNode.x + BS;
    const y = elkNode.y + BS;
    const astNode = ast.nodes.find((n) => n.name === name);
    const portAnchors: NodeLayout['portAnchors'] = {};
    const allPorts: NodeLayout['allPorts'] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const elkPort of (elkNode.ports || []) as any[]) {
      const rawLabel = elkPort.id.slice(name.length + 2);
      const label = rawLabel.replace(/__s\d+$/, '');
      if (portAnchors[label]) continue;
      const meta = (portMeta[name] || {})[label] || { side: 'right' as Side, type: 'default' };
      const sideBx =
        meta.side === 'right' ? x + BOX_W :
        meta.side === 'left'  ? x :
        x + BOX_W / 2;
      const sideBy =
        meta.side === 'top'    ? y :
        meta.side === 'bottom' ? y + BOX_H :
        y + BOX_H / 2;
      portAnchors[label] = { bx: sideBx, by: sideBy, side: meta.side };
      allPorts.push({ label, type: meta.type, side: meta.side, wasAny: meta.wasAny || false });
    }

    layout[name] = {
      x, y,
      label: astNode ? astNode.label || null : null,
      moduleType: astNode ? astNode.function : name,
      allPorts, portAnchors,
    };
  }

  const edgeSections: LayoutResult['edgeSections'] = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const elkEdge of (result.edges || []) as any[]) {
    const i = parseInt(elkEdge.id.slice(1), 10);
    edgeSections[i] = elkEdge.sections || [];
  }

  return { layout, edgeSections };
}

// ── inspectLayout — pure function for tests ───────────────────────────────────

export interface LayoutInspection {
  grid: { cols: number; rows: number };
  nodes: Record<string, {
    row: number; col: number; x: number; y: number;
    ports: Record<string, { type: string; side: string; loc: [number, number][] }>;
  }>;
  edges: Array<{
    from: string | null; to: string | null; label: string | null;
    points: [number, number][];
  }>;
  crossings: Array<{ edge_a: number; edge_b: number; at: [number, number] }>;
}

const SIDE_NAME: Record<Side, string> = { left: 'W', right: 'E', top: 'N', bottom: 'S' };

export async function inspectLayout(
  text: string,
  opts: { portPlacement?: PatchConfig['portPlacement']; nodePlacementStrategy?: PatchConfig['nodePlacementStrategy'] } = {}
): Promise<LayoutInspection> {
  const ast = parsePatch(text);
  const portInfo = prepareConnections(ast);
  const { broken } = validateConnections(ast);
  const config = { ...DEFAULT_CONFIG, ...opts };
  const { layout, edgeSections } = await buildLayout(ast, portInfo, broken, config);

  // ── Grid ─────────────────────────────────────────────────────────────────
  const COL_TOL = 2;
  const ROW_TOL = Math.round((BOX_H + NODE_GAP) / 2);
  const allNl = Object.values(layout);
  const colXs: number[] = [];
  const rowYs: number[] = [];
  for (const nl of allNl) {
    const cx = nl.x + BOX_W / 2;
    const cy = nl.y + BOX_H / 2;
    if (!colXs.some((x) => Math.abs(x - cx) <= COL_TOL)) colXs.push(cx);
    if (!rowYs.some((y) => Math.abs(y - cy) <= ROW_TOL)) rowYs.push(cy);
  }
  colXs.sort((a, b) => a - b);
  rowYs.sort((a, b) => a - b);

  // ── Nodes ─────────────────────────────────────────────────────────────────
  const nodes: LayoutInspection['nodes'] = {};
  for (const [name, nl] of Object.entries(layout)) {
    const cx = nl.x + BOX_W / 2;
    const cy = nl.y + BOX_H / 2;
    const col = colXs.findIndex((x) => Math.abs(x - cx) <= COL_TOL);
    const row = rowYs.findIndex((y) => Math.abs(y - cy) <= ROW_TOL);
    const ports: LayoutInspection['nodes'][string]['ports'] = {};
    for (const p of nl.allPorts) {
      const tip = portTipFn(nl, p.label);
      ports[p.label] = {
        type: p.type,
        side: SIDE_NAME[p.side] || p.side,
        loc: [[tip.x, tip.y]],
      };
    }
    nodes[name] = { row, col, x: nl.x, y: nl.y, ports };
  }

  // ── Edges ─────────────────────────────────────────────────────────────────
  const edges: LayoutInspection['edges'] = [];
  ast.connections.forEach((conn, i) => {
    if (broken.has(conn)) return;

    if (conn.type === 'dangling') {
      if (conn.direction === 'from' && conn.from) {
        const fn = layout[conn.from];
        if (!fn) return;
        let src: { x: number; y: number }, srcSide: Side;
        if (conn.fromPort && fn.portAnchors[conn.fromPort]) {
          src = portTipFn(fn, conn.fromPort);
          srcSide = fn.portAnchors[conn.fromPort].side;
        } else {
          const rp = fn.allPorts.find((p) => p.side === 'right');
          src = rp ? portTipFn(fn, rp.label) : { x: fn.x + BOX_W + TAB_D, y: fn.y + BOX_H / 2 };
          srcSide = 'right';
        }
        const [dx, dy] = SIDE_DIR[srcSide];
        const end = { x: src.x + dx * DANGLING_LEN, y: src.y + dy * DANGLING_LEN };
        edges.push({
          from: conn.fromPort ? `${conn.from}:${conn.fromPort}` : conn.from,
          to: null, label: conn.label || null,
          points: [[src.x, src.y], [end.x, end.y]],
        });
      } else if (conn.direction === 'to' && conn.to) {
        const tn = layout[conn.to];
        if (!tn) return;
        let dst: { x: number; y: number }, destSide: Side;
        if (conn.toPort && tn.portAnchors[conn.toPort]) {
          dst = portTipFn(tn, conn.toPort);
          destSide = tn.portAnchors[conn.toPort].side;
        } else {
          const lp = tn.allPorts.find((p) => p.side === 'left');
          dst = lp ? portTipFn(tn, lp.label) : { x: tn.x - TAB_D, y: tn.y + BOX_H / 2 };
          destSide = 'left';
        }
        const [dx, dy] = SIDE_DIR[destSide];
        const start = { x: dst.x + dx * STUB, y: dst.y + dy * STUB };
        edges.push({
          from: null,
          to: conn.toPort ? `${conn.to}:${conn.toPort}` : conn.to,
          label: conn.label || null,
          points: [[start.x, start.y], [dst.x, dst.y]],
        });
      }
      return;
    }

    const sections = edgeSections[i] || [];
    const fromStr = conn.from
      ? conn.fromPort ? `${conn.from}:${conn.fromPort}` : conn.from
      : null;
    const toStr = conn.to
      ? conn.toPort ? `${conn.to}:${conn.toPort}` : conn.to
      : null;
    const pts: [number, number][] = [];
    for (const section of sections) {
      const sp = section.startPoint;
      const ep = section.endPoint;
      const bends = section.bendPoints || [];
      if (pts.length === 0) pts.push([sp.x, sp.y]);
      for (const b of bends) pts.push([b.x, b.y]);
      pts.push([ep.x, ep.y]);
    }
    edges.push({ from: fromStr, to: toStr, label: conn.label || null, points: pts });
  });

  // ── Crossings ─────────────────────────────────────────────────────────────
  const crossings: LayoutInspection['crossings'] = [];
  for (let ai = 0; ai < edges.length; ai++) {
    for (let bi = ai + 1; bi < edges.length; bi++) {
      const aPts = edges[ai].points;
      const bPts = edges[bi].points;
      for (let as = 0; as < aPts.length - 1; as++) {
        for (let bs = 0; bs < bPts.length - 1; bs++) {
          const p0 = { x: aPts[as][0],     y: aPts[as][1]     };
          const q0 = { x: aPts[as + 1][0], y: aPts[as + 1][1] };
          const p1 = { x: bPts[bs][0],     y: bPts[bs][1]     };
          const q1 = { x: bPts[bs + 1][0], y: bPts[bs + 1][1] };
          const hit = segIntersect(p0, q0, p1, q1);
          if (hit) crossings.push({ edge_a: ai, edge_b: bi, at: [hit.x, hit.y] });
        }
      }
    }
  }

  return {
    grid: { cols: colXs.length, rows: rowYs.length },
    nodes,
    edges,
    crossings,
  };
}
