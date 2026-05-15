/**
 * Unit tests for mixedCornerRect() – the SVG path helper that produces
 * a rectangle with arcs at top-right and bottom-left, sharp corners at
 * top-left and bottom-right.
 *
 * Tests verify:
 *   – degenerate case (r ≤ 0): plain rectangle path
 *   – arc presence: path includes quadratic bezier commands for the two
 *     rounded corners and no other bezier commands
 *   – corner positions: the four corner coordinates appear correctly in
 *     the path string
 *   – band layer insets: using BAND_STEP_H / BAND_STEP_V + BOX_W / BOX_H,
 *     the outermost and innermost layer paths are structurally correct
 */
import { describe, test, expect } from 'vitest';
import { mixedCornerRect, BOX_W, BOX_H, BAND_STEP_H, BAND_STEP_V, CORNER_R_OUTER, CORNER_R_INNER } from '../layout.js';

describe('mixedCornerRect', () => {
  describe('degenerate: r = 0', () => {
    const path = mixedCornerRect(0, 0, 100, 50, 0);

    test('starts at top-left', () => {
      expect(path).toMatch(/^M 0,0/);
    });

    test('contains no Q (bezier arc) commands', () => {
      expect(path).not.toContain('Q');
    });

    test('produces a closed simple rectangle', () => {
      expect(path).toMatch(/H 100/);
      expect(path).toMatch(/V 50/);
      expect(path).toMatch(/H 0/);
      expect(path.trim().endsWith('Z')).toBe(true);
    });
  });

  describe('typical rect: 100×50, r=10', () => {
    const x = 0, y = 0, w = 100, h = 50, r = 10;
    const path = mixedCornerRect(x, y, w, h, r);

    test('starts at sharp top-left corner', () => {
      expect(path).toMatch(/^M 0,0/);
    });

    test('has exactly two Q commands', () => {
      const matches = path.match(/Q/g);
      expect(matches).toHaveLength(2);
    });

    test('top-right arc: control point at (w, y), end at (w, r)', () => {
      // Q cx,cy ex,ey
      expect(path).toContain(`Q ${x + w},${y} ${x + w},${y + r}`);
    });

    test('bottom-left arc: control point at (x, h), end at (x, h-r)', () => {
      expect(path).toContain(`Q ${x},${y + h} ${x},${y + h - r}`);
    });

    test('right edge reaches full height (sharp bottom-right)', () => {
      // After top-right arc, path goes straight to y+h (no further rounding)
      expect(path).toContain(`V ${y + h}`);
    });

    test('path is closed', () => {
      expect(path.trim().endsWith('Z')).toBe(true);
    });
  });

  describe('offset origin: x=10, y=20, w=80, h=40, r=8', () => {
    const x = 10, y = 20, w = 80, h = 40, r = 8;
    const path = mixedCornerRect(x, y, w, h, r);

    test('starts at offset top-left (x, y)', () => {
      expect(path).toMatch(new RegExp(`^M ${x},${y}`));
    });

    test('top-right arc control point at (x+w, y)', () => {
      expect(path).toContain(`Q ${x + w},${y} ${x + w},${y + r}`);
    });

    test('bottom-left arc control point at (x, y+h)', () => {
      expect(path).toContain(`Q ${x},${y + h} ${x},${y + h - r}`);
    });
  });

  describe('r larger than half dimension: clamped to min(r, w/2, h/2)', () => {
    // When r > h/2, rc should be clamped → degenerate path (no Q commands)
    const path = mixedCornerRect(0, 0, 100, 10, 50); // h/2 = 5, so rc clamped to 5

    test('does NOT produce degenerate path (rc=5, not ≤0)', () => {
      expect(path).toContain('Q');
    });

    test('clamped arc radius matches min(50, 50, 5) = 5', () => {
      // top-right arc: Q 100,0 100,5
      expect(path).toContain('Q 100,0 100,5');
    });
  });

  describe('band layer insets at default BOX dimensions', () => {
    const N = 3;
    const rStep = (CORNER_R_OUTER - CORNER_R_INNER) / N;

    // Layer 0 (outermost, nodeBandDark): inset=0, r=CORNER_R_OUTER
    const outerPath = mixedCornerRect(0, 0, BOX_W, BOX_H, CORNER_R_OUTER);

    test('outermost layer: starts at (0,0)', () => {
      expect(outerPath).toMatch(/^M 0,0/);
    });

    test('outermost layer: top-right arc uses CORNER_R_OUTER', () => {
      expect(outerPath).toContain(`Q ${BOX_W},0 ${BOX_W},${CORNER_R_OUTER}`);
    });

    // Layer 3 (innermost, nodeBgColor): inset=3, r=CORNER_R_INNER
    const inset = 3;
    const bx = inset * BAND_STEP_H;
    const by = inset * BAND_STEP_V;
    const bw = BOX_W - 2 * inset * BAND_STEP_H;
    const bh = BOX_H - 2 * inset * BAND_STEP_V;
    const rInner = CORNER_R_OUTER - inset * rStep; // = CORNER_R_INNER
    const innerPath = mixedCornerRect(bx, by, bw, bh, rInner);

    test('innermost layer radius equals CORNER_R_INNER', () => {
      expect(rInner).toBe(CORNER_R_INNER);
    });

    test('innermost layer: arc commands present (r > 0)', () => {
      expect(innerPath).toContain('Q');
    });

    test('innermost layer: top-right arc uses CORNER_R_INNER', () => {
      expect(innerPath).toContain(`Q ${bx + bw},${by} ${bx + bw},${by + rInner}`);
    });

    test('innermost layer: starts at inset origin', () => {
      expect(innerPath).toMatch(new RegExp(`^M ${bx},${by}`));
    });

    test('innermost layer: width shrinks by 2×BAND_STEP_H per inset', () => {
      expect(innerPath).toContain(`H ${bx + bw - rInner}`);
    });
  });
});
