/**
 * Parser tests — adapted from patchlog's patchDiagramParser.test.js.
 *
 * Each test input must include the "monotrail" keyword prefix required by the
 * Monotrail grammar.
 */
import { describe, it, expect } from 'vitest';
import { parseMonotrail } from '../parser.js';

describe('parseMonotrail', () => {
  it('parses the PRD example correctly', () => {
    const input = `monotrail
module Oscillator {
    +voct V/oct
    +cv FM
    +audio Out
}

module VCA {
    +audio In
    +cv CV
    +audio Out
}

Envelope env1["Ramp"]
VCA vca1
Oscillator osc1

osc1:Out --> vca1:In`;

    const ast = parseMonotrail(input);
    expect(ast).toHaveProperty('modules');
    expect(ast).toHaveProperty('nodes');
    expect(ast).toHaveProperty('connections');
    expect(ast.modules.length).toBeGreaterThan(0);
    expect(ast.nodes.length).toBeGreaterThan(0);
    expect(ast.connections.length).toBeGreaterThan(0);
    expect(ast.modules[0].name).toBe('Oscillator');
    expect(ast.nodes[0].function).toBe('Envelope');
    expect(ast.connections[0].from).toBe('osc1');
    expect(ast.connections[0].fromPort).toBe('Out');
    expect(ast.connections[0].to).toBe('vca1');
    expect(ast.connections[0].toPort).toBe('In');
  });

  it('parses an unlabeled connection without a label field', () => {
    const input = `monotrail
module VCA {
    +audio In
    +audio Out
}
VCA vca1
VCA mix1
vca1:Out --> mix1:In`;
    const ast = parseMonotrail(input);
    const conn = ast.connections[0];
    expect(conn.type).toBe('connection');
    expect(conn.from).toBe('vca1');
    expect(conn.fromPort).toBe('Out');
    expect(conn.to).toBe('mix1');
    expect(conn.toPort).toBe('In');
    expect(conn.label == null).toBe(true);
  });

  it('parses a labeled full connection', () => {
    const input = `monotrail
module VCA {
    +audio In
    +audio Out
}
VCA vca1
VCA mix1
vca1:Out -->|my note| mix1:In`;
    const ast = parseMonotrail(input);
    const conn = ast.connections[0];
    expect(conn.type).toBe('connection');
    expect(conn.from).toBe('vca1');
    expect(conn.fromPort).toBe('Out');
    expect(conn.to).toBe('mix1');
    expect(conn.toPort).toBe('In');
    expect(conn.label).toBe('my note');
  });

  it('parses a dangling-from labeled connection', () => {
    const input = `monotrail
module VCA {
    +audio Out
}
VCA vca1
vca1:Out -->|audio out|`;
    const ast = parseMonotrail(input);
    const conn = ast.connections[0];
    expect(conn.type).toBe('dangling');
    expect(conn.direction).toBe('from');
    expect(conn.from).toBe('vca1');
    expect(conn.fromPort).toBe('Out');
    expect(conn.label).toBe('audio out');
  });

  it('parses a dangling-to labeled connection', () => {
    const input = `monotrail
module Mixer {
    +audio In1
}
Mixer mix1
-->|keyboard| mix1:In1`;
    const ast = parseMonotrail(input);
    const conn = ast.connections[0];
    expect(conn.type).toBe('dangling');
    expect(conn.direction).toBe('to');
    expect(conn.to).toBe('mix1');
    expect(conn.toPort).toBe('In1');
    expect(conn.label).toBe('keyboard');
  });
});

describe('invalid module definitions and declarations', () => {
  it('rejects uppercase signal type (e.g. +Audio)', () => {
    const input = `monotrail
module VCA {
    +Audio In
    +audio Out
}
VCA vca1`;
    expect(() => parseMonotrail(input)).toThrow();
  });

  it('rejects old V_oct convention — uppercase and underscore in signal type', () => {
    const input = `monotrail
module Osc {
    +V_oct pitch
    +audio Out
}
Osc osc1`;
    expect(() => parseMonotrail(input)).toThrow();
  });

  it('rejects signal type containing a slash (e.g. +v/oct)', () => {
    const input = `monotrail
module Osc {
    +v/oct pitch
    +audio Out
}
Osc osc1`;
    expect(() => parseMonotrail(input)).toThrow();
  });

  it('rejects signal type containing a digit (e.g. +audio1)', () => {
    const input = `monotrail
module VCA {
    +audio1 In
    +audio Out
}
VCA vca1`;
    expect(() => parseMonotrail(input)).toThrow();
  });

  it('rejects a module name starting with a digit', () => {
    const input = `monotrail
module 123VCA {
    +audio In
}
123VCA vca1`;
    expect(() => parseMonotrail(input)).toThrow();
  });

  it('rejects a node name starting with a digit', () => {
    const input = `monotrail
module VCA {
    +audio In
    +audio Out
}
VCA 1vca`;
    expect(() => parseMonotrail(input)).toThrow();
  });
});
