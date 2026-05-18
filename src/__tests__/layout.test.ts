/**
 * Layout inspection tests.
 *
 * Uses inspectLayout() to assert on the structural output of the ELK layout
 * pipeline without a DOM.
 *
 * Runs under Vitest with pool:'forks' (configured in vite.config.ts) so that
 * ELK's fake-Worker has a real isolated V8 heap and MessageChannel.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test, expect, beforeAll } from 'vitest';
import { inspectLayout, type LayoutInspection } from '../layout.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

function loadDiagram(filename: string): string {
  return readFileSync(join(fixturesDir, filename), 'utf8');
}

function describeEdge(
  edges: LayoutInspection['edges'],
  c: LayoutInspection['crossings'][number]
): string {
  const ea = edges[c.edge_a];
  const eb = edges[c.edge_b];
  const fmt = (e: LayoutInspection['edges'][number]) =>
    `${e.from ?? '(stub)'} → ${e.to ?? '(stub)'}${e.label ? ` [${e.label}]` : ''}`;
  return `edge ${c.edge_a} (${fmt(ea)}) ✕ edge ${c.edge_b} (${fmt(eb)}) at (${c.at[0].toFixed(1)}, ${c.at[1].toFixed(1)})`;
}

// ── Basic diagram ─────────────────────────────────────────────────────────────

describe('basic diagram (osc1 → vca1)', () => {
  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(loadDiagram('basic.txt'));
  });

  test('grid is 1×2 (1 row, 2 cols)', () => {
    expect(inspection.grid).toEqual({ cols: 2, rows: 1 });
  });

  test('osc1 is in col 0', () => {
    expect(inspection.nodes.osc1.col).toBe(0);
  });

  test('vca1 is in col 1', () => {
    expect(inspection.nodes.vca1.col).toBe(1);
  });

  test('no connector crossings', () => {
    if (inspection.crossings.length > 0) {
      const desc = inspection.crossings.map((c) => describeEdge(inspection.edges, c)).join('\n  ');
      throw new Error(`Expected 0 crossings, got ${inspection.crossings.length}:\n  ${desc}`);
    }
    expect(inspection.crossings).toHaveLength(0);
  });
});

// ── 107.1 diagram ─────────────────────────────────────────────────────────────

describe('107.1 diagram', () => {
  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(loadDiagram('107.1.txt'));
  });

  test('has 6 nodes', () => {
    expect(Object.keys(inspection.nodes)).toHaveLength(6);
  });
});

// ── 107.1 diagram — network-simplex + edge-sort (default) ────────────────────

describe('107.1 diagram (network-simplex default)', () => {
  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(loadDiagram('107.1.txt'));
  });

  test('has 6 nodes', () => {
    expect(Object.keys(inspection.nodes)).toHaveLength(6);
  });

  test('sq1 is in column 0',  () => { expect(inspection.nodes.sq1.col).toBe(0); });
  test('osc1 is in column 1', () => { expect(inspection.nodes.osc1.col).toBe(1); });
  test('lfo1 is in column 1', () => { expect(inspection.nodes.lfo1.col).toBe(1); });
  test('env1 is in column 1', () => { expect(inspection.nodes.env1.col).toBe(1); });
  test('lpf1 is in column 2', () => { expect(inspection.nodes.lpf1.col).toBe(2); });
  test('vca1 is in column 3', () => { expect(inspection.nodes.vca1.col).toBe(3); });

  test('env1 is not sandwiched between osc1 and lfo1 in row order', () => {
    const { env1, osc1, lfo1 } = inspection.nodes;
    const lo = Math.min(osc1.row, lfo1.row);
    const hi = Math.max(osc1.row, lfo1.row);
    expect(env1.row < lo || env1.row > hi).toBe(true);
  });

  test('no connector crossings', () => {
    if (inspection.crossings.length > 0) {
      const desc = inspection.crossings.map((c) => describeEdge(inspection.edges, c)).join('\n  ');
      throw new Error(`Expected 0 crossings, got ${inspection.crossings.length}:\n  ${desc}`);
    }
    expect(inspection.crossings).toHaveLength(0);
  });
});

// ── 107.4 diagram ─────────────────────────────────────────────────────────────

describe('107.4 diagram', () => {
  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(loadDiagram('107.4.txt'));
  });

  test('has 16 nodes', () => {
    expect(Object.keys(inspection.nodes)).toHaveLength(16);
  });

  test('no connector crossings', () => {
    if (inspection.crossings.length > 0) {
      const desc = inspection.crossings.map((c) => describeEdge(inspection.edges, c)).join('\n  ');
      throw new Error(`Expected 0 crossings, got ${inspection.crossings.length}:\n  ${desc}`);
    }
    expect(inspection.crossings).toHaveLength(0);
  });

  test('peak column height ≤ 10 rows', () => {
    expect(inspection.grid.rows).toBeLessThanOrEqual(10);
  });

  test('source nodes are spread across at least 2 columns', () => {
    const sourceNodes = ['sq1', 'n1', 'n2', 'lfo1', 'rand1', 'rand2'];
    const cols = new Set(
      sourceNodes
        .map((n) => inspection.nodes[n]?.col)
        .filter((c): c is number => c !== undefined)
    );
    expect(cols.size).toBeGreaterThanOrEqual(2);
  });
});

// ── inspectLayout output shape ────────────────────────────────────────────────

describe('inspectLayout output shape', () => {
  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(loadDiagram('107.1.txt'));
  });

  test('grid has cols and rows', () => {
    expect(typeof inspection.grid.cols).toBe('number');
    expect(typeof inspection.grid.rows).toBe('number');
  });

  test('each node has row, col, x, y and ports object', () => {
    for (const node of Object.values(inspection.nodes)) {
      expect(typeof node.row).toBe('number');
      expect(typeof node.col).toBe('number');
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
      expect(typeof node.ports).toBe('object');
    }
  });

  test('each port has type, side (N/E/S/W) and loc array', () => {
    for (const node of Object.values(inspection.nodes)) {
      for (const port of Object.values(node.ports)) {
        expect(typeof port.type).toBe('string');
        expect(['N', 'E', 'S', 'W']).toContain(port.side);
        expect(Array.isArray(port.loc)).toBe(true);
        expect(port.loc.length).toBeGreaterThan(0);
        for (const coord of port.loc) {
          expect(coord).toHaveLength(2);
          expect(typeof coord[0]).toBe('number');
          expect(typeof coord[1]).toBe('number');
        }
      }
    }
  });

  test('each edge has from, to, label and points array', () => {
    for (const edge of inspection.edges) {
      expect(edge.from === null || typeof edge.from === 'string').toBe(true);
      expect(edge.to   === null || typeof edge.to   === 'string').toBe(true);
      expect(edge.label === null || typeof edge.label === 'string').toBe(true);
      expect(Array.isArray(edge.points)).toBe(true);
      expect(edge.points.length).toBeGreaterThanOrEqual(2);
      for (const pt of edge.points) {
        expect(pt).toHaveLength(2);
        expect(typeof pt[0]).toBe('number');
        expect(typeof pt[1]).toBe('number');
      }
    }
  });

  test('crossings array exists', () => {
    expect(Array.isArray(inspection.crossings)).toBe(true);
  });

  test('includes dangling stubs with null from/to', () => {
    // 107.1 has both dangling-to (-->|MIDI| sq1:sync) and dangling-from (vca1:Out -->|Out|)
    const danglingTo   = inspection.edges.filter((e) => e.from === null);
    const danglingFrom = inspection.edges.filter((e) => e.to   === null);
    expect(danglingTo.length).toBeGreaterThanOrEqual(1);
    expect(danglingFrom.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Connector labels ──────────────────────────────────────────────────────────

describe('connector labels', () => {
  const diagram = `patch
module VCO {
    +audio Out
}
module VCF {
    +audio In
    +audio LP
}
module VCA {
    +audio In
    +audio Out
}

VCO osc1
VCF lpf1
VCA vca1

osc1:Out -->|filter feed| lpf1:In
lpf1:LP --> vca1:In
vca1:Out -->|Main out|
-->|Ext in| osc1:Out`;

  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(diagram);
  });

  test('labeled full connection carries the label string', () => {
    const edge = inspection.edges.find(
      (e) => e.from === 'osc1:Out' && e.to === 'lpf1:In'
    );
    expect(edge).toBeDefined();
    expect(edge!.label).toBe('filter feed');
  });

  test('unlabeled full connection has null label', () => {
    const edge = inspection.edges.find(
      (e) => e.from === 'lpf1:LP' && e.to === 'vca1:In'
    );
    expect(edge).toBeDefined();
    expect(edge!.label).toBeNull();
  });

  test('dangling-from edge has null to and correct label', () => {
    const edge = inspection.edges.find(
      (e) => e.from === 'vca1:Out' && e.to === null
    );
    expect(edge).toBeDefined();
    expect(edge!.label).toBe('Main out');
  });

  test('dangling-to edge has null from and correct label', () => {
    // -->|Ext in| osc1:Out — note this is an invalid port (Out is an output),
    // so it will be treated as a broken/dangling-to. We just check that a
    // dangling-to edge with label 'Ext in' is present.
    const edge = inspection.edges.find(
      (e) => e.from === null && e.label === 'Ext in'
    );
    expect(edge).toBeDefined();
  });

  test('labeled edge has at least 2 points', () => {
    const edge = inspection.edges.find(
      (e) => e.from === 'osc1:Out' && e.to === 'lpf1:In'
    );
    expect(edge!.points.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Unconnected port hiding ───────────────────────────────────────────────────

describe('unconnected port hiding', () => {
  const diagram = `patch
module VCA {
    +audio In
    +cv CV
    +audio Out
}
module Mix {
    +audio In1
    +audio In2
    +audio Out
}

VCA vca1
Mix mix1

vca1:Out --> mix1:In1
mix1:Out -->|signal|`;

  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(diagram);
  });

  test('unused declared port (vca1:In) is not rendered', () => {
    expect(inspection.nodes.vca1.ports).not.toHaveProperty('In');
  });

  test('unused declared port (vca1:CV) is not rendered', () => {
    expect(inspection.nodes.vca1.ports).not.toHaveProperty('CV');
  });

  test('connected output port (vca1:Out) is rendered', () => {
    expect(inspection.nodes.vca1.ports).toHaveProperty('Out');
  });

  test('unused port (mix1:In2) is not rendered', () => {
    expect(inspection.nodes.mix1.ports).not.toHaveProperty('In2');
  });

  test('dangling stub port (mix1:Out) is rendered', () => {
    expect(inspection.nodes.mix1.ports).toHaveProperty('Out');
  });

  test('connected port (mix1:In1) is rendered', () => {
    expect(inspection.nodes.mix1.ports).toHaveProperty('In1');
  });
});

// ── bass.pad diagram ──────────────────────────────────────────────────────────

describe('bass.pad diagram', () => {
  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(loadDiagram('bass.pad.txt'));
  });

  test('has 11 nodes', () => {
    expect(Object.keys(inspection.nodes)).toHaveLength(11);
  });

  test('mix1 inputs are distributed across N, W, and S faces', () => {
    const { mix1 } = inspection.nodes;
    const sides = [mix1.ports.inA.side, mix1.ports.inB.side, mix1.ports.inC.side];
    expect(sides).toContain('N');
    expect(sides).toContain('W');
    expect(sides).toContain('S');
  });

  test('sq1:pitch is on E face', () => {
    expect(inspection.nodes.sq1.ports.pitch.side).toBe('E');
  });

  test('sq1:gate is on S face (capacity enforcement: W/E face holds at most 1 port)', () => {
    expect(inspection.nodes.sq1.ports.gate.side).toBe('S');
  });

  test('sq1:pitch connections do not cross each other', () => {
    const selfCross = inspection.crossings.filter((c) => {
      const ea = inspection.edges[c.edge_a];
      const eb = inspection.edges[c.edge_b];
      const fromPitch = (e: LayoutInspection['edges'][number]) => e.from === 'sq1:pitch';
      return fromPitch(ea) && fromPitch(eb);
    });
    if (selfCross.length > 0) {
      const desc = selfCross.map((c) => describeEdge(inspection.edges, c)).join('\n  ');
      throw new Error(`sq1:pitch connections cross each other:\n  ${desc}`);
    }
    expect(selfCross).toHaveLength(0);
  });
});
