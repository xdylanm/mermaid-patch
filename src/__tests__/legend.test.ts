/**
 * Unit tests for the diagram legend feature.
 *
 * Tests the pure helper functions exported from renderer.ts:
 *   - legendEntries(): verifies the four signal-type entries have correct
 *     colours and stroke width without requiring a DOM.
 *   - computeLegendXY(): verifies that each corner position resolves to the
 *     expected translate coordinates.
 *
 * Config resolution tests verify that the `legend` and `legendPosition` keys
 * flow through the resolver correctly (config.ts / db.ts logic is mirrored
 * via DEFAULT_CONFIG here since db.ts requires mermaid at runtime).
 */
import { describe, test, expect } from 'vitest';
import { legendEntries, computeLegendXY } from '../renderer.js';
import { DEFAULT_CONFIG, type PatchConfig } from '../config.js';

// ── 4.1  Legend entries have correct colours and stroke width ─────────────────

describe('legendEntries()', () => {
  const entries = legendEntries(DEFAULT_CONFIG);

  test('returns exactly four entries', () => {
    expect(entries).toHaveLength(4);
  });

  test('entry labels are Audio, CV, V/oct, Gate in order', () => {
    expect(entries.map((e) => e.label)).toEqual(['Audio', 'CV', 'V/oct', 'Gate']);
  });

  test('audio entry has hsl(25, 100%, 40%) stroke', () => {
    expect(entries[0].color).toBe('hsl(25, 100%, 40%)');
  });

  test('cv entry has hsl(200, 100%, 40%) stroke', () => {
    expect(entries[1].color).toBe('hsl(200, 100%, 40%)');
  });

  test('voct entry has hsl(100, 100%, 40%) stroke', () => {
    expect(entries[2].color).toBe('hsl(100, 100%, 40%)');
  });

  test('gate entry has hsl(300, 100%, 40%) stroke', () => {
    expect(entries[3].color).toBe('hsl(300, 100%, 40%)');
  });

  test('all entries have strokeWidth 4', () => {
    for (const e of entries) {
      expect(e.strokeWidth).toBe(4);
    }
  });
});

// ── 4.2  `legend: false` default is reflected in DEFAULT_CONFIG ───────────────

describe('legend config default', () => {
  test('DEFAULT_CONFIG.legend is false', () => {
    expect(DEFAULT_CONFIG.legend).toBe(false);
  });

  test('DEFAULT_CONFIG.legendPosition is top-right', () => {
    expect(DEFAULT_CONFIG.legendPosition).toBe('top-right');
  });
});

// ── 4.3  computeLegendXY() places legend in the correct corner ────────────────

describe('computeLegendXY()', () => {
  const viewMinX = 0;
  const viewMinY = 0;
  const viewMaxX = 800;
  const svgHeight = 600;
  const legendW = 100;
  const legendH = 80;
  const pad = 20;

  test('top-right (default): anchors to right and top', () => {
    const { x, y } = computeLegendXY('top-right', viewMinX, viewMinY, viewMaxX, svgHeight, legendW, legendH, pad);
    expect(x).toBe(viewMaxX - pad - legendW); // 680
    expect(y).toBe(viewMinY + pad);           // 20
  });

  test('top-left: anchors to left and top', () => {
    const { x, y } = computeLegendXY('top-left', viewMinX, viewMinY, viewMaxX, svgHeight, legendW, legendH, pad);
    expect(x).toBe(viewMinX + pad); // 20
    expect(y).toBe(viewMinY + pad); // 20
  });

  test('bottom-left: anchors to left and bottom', () => {
    const { x, y } = computeLegendXY('bottom-left', viewMinX, viewMinY, viewMaxX, svgHeight, legendW, legendH, pad);
    expect(x).toBe(viewMinX + pad);              // 20
    expect(y).toBe(svgHeight - pad - legendH);   // 500
  });

  test('bottom-right: anchors to right and bottom', () => {
    const { x, y } = computeLegendXY('bottom-right', viewMinX, viewMinY, viewMaxX, svgHeight, legendW, legendH, pad);
    expect(x).toBe(viewMaxX - pad - legendW);    // 680
    expect(y).toBe(svgHeight - pad - legendH);   // 500
  });

  test('unrecognised position falls back to top-right', () => {
    // Cast to force an invalid value through
    const { x, y } = computeLegendXY(
      'center' as PatchConfig['legendPosition'],
      viewMinX, viewMinY, viewMaxX, svgHeight, legendW, legendH, pad
    );
    expect(x).toBe(viewMaxX - pad - legendW);
    expect(y).toBe(viewMinY + pad);
  });
});
