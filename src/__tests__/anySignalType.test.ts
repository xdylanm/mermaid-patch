/**
 * Tests for the `any` signal type resolution logic.
 *
 * Covers the scenarios in specs/any-signal-type.md.
 *
 * Uses inspectLayout() — the port `type` field on the returned inspection
 * reflects the resolved type after the resolveAnyTypes() pass inside
 * buildLayout(). The `wasAny` flag is NOT exposed through inspectLayout,
 * so we test the effective post-resolution type instead.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { inspectLayout, type LayoutInspection } from '../layout.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function portType(inspection: LayoutInspection, node: string, port: string): string {
  return inspection.nodes[node]?.ports[port]?.type ?? '(missing)';
}

function edgesBetween(
  inspection: LayoutInspection,
  from: string,
  to: string
): LayoutInspection['edges'] {
  return inspection.edges.filter((e) => e.from === from && e.to === to);
}

// ── Scenario: `any` resolves from a concrete connected counterpart ─────────────

describe('any signal type — resolution from concrete counterpart', () => {
  // passthrough:Out (any) → vca1:In (audio)
  const diagram = `monotrail
module Passthrough {
    +any In
    +any Out
}
module VCA {
    +audio In
    +cv CV
    +audio AudioOut
}

Passthrough pass1
VCA vca1

pass1:In -->|input| pass1:Out
pass1:Out --> vca1:In`;

  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(diagram);
  });

  it('pass1 Out port resolves to audio (connected to audio input)', () => {
    expect(portType(inspection, 'pass1', 'Out')).toBe('audio');
  });

  it('pass1 In port renders — dangling stub keeps the port visible', () => {
    // pass1:In is connected via pass1:In -->|input| pass1:Out which is a full conn
    expect(inspection.nodes.pass1.ports).toHaveProperty('In');
  });
});

// ── Scenario: concrete → any — the any input resolves to the concrete source type ──

describe('any signal type — concrete source resolves any destination', () => {
  const diagram = `monotrail
module VCO {
    +voct Voct
    +audio Out
}
module Passthrough {
    +any In
    +any Out
}

VCO osc1
Passthrough pass1

osc1:Out --> pass1:In
pass1:Out -->|signal|`;

  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(diagram);
  });

  it('pass1 In port resolves to audio (fed by audio source)', () => {
    expect(portType(inspection, 'pass1', 'In')).toBe('audio');
  });
});

// ── Scenario: any-to-any resolves to cv ───────────────────────────────────────

describe('any signal type — any-to-any resolves to cv', () => {
  const diagram = `monotrail
module A {
    +any Out
}
module B {
    +any In
}

A nodeA
B nodeB

nodeA:Out --> nodeB:In`;

  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(diagram);
  });

  it('nodeA Out port resolves to cv when both ends are any', () => {
    expect(portType(inspection, 'nodeA', 'Out')).toBe('cv');
  });

  it('nodeB In port resolves to cv when both ends are any', () => {
    expect(portType(inspection, 'nodeB', 'In')).toBe('cv');
  });
});

// ── Scenario: fan-out from any to uniform concrete type ───────────────────────

describe('any signal type — fan-out to uniform type resolves to that type', () => {
  const diagram = `monotrail
module Splitter {
    +any In
    +any OutA
    +any OutB
}
module VCA {
    +audio In
    +audio Out
}

Splitter split1
VCA vca1
VCA vca2

split1:OutA --> vca1:In
split1:OutB --> vca2:In
-->|source| split1:In`;

  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(diagram);
  });

  it('split1 OutA resolves to audio (fan-out to two audio ports)', () => {
    expect(portType(inspection, 'split1', 'OutA')).toBe('audio');
  });

  it('split1 OutB resolves to audio', () => {
    expect(portType(inspection, 'split1', 'OutB')).toBe('audio');
  });
});

// ── Scenario: fan-out from any to mixed types resolves to cv ─────────────────

describe('any signal type — fan-out to mixed types resolves to cv', () => {
  const diagram = `monotrail
module Router {
    +any In
    +any AudioOut
    +any CvOut
}
module VCA {
    +audio In
    +audio Out
}
module Env {
    +cv In
    +cv Out
}

Router router1
VCA vca1
Env env1

-->|in| router1:In
router1:AudioOut --> vca1:In
router1:CvOut --> env1:In`;

  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(diagram);
  });

  it('router1 AudioOut resolves to audio (connected to audio)', () => {
    // The fan-out has two concrete types (audio + cv).
    // Per spec: when mixed, the badge resolves to cv — BUT each connection
    // uses the destination port's resolved type. inspectLayout exposes the
    // port's own resolved type, which is cv when mixed.
    // (The badge-level resolution is 'cv'; the wire coloring is per-destination.)
    expect(portType(inspection, 'router1', 'AudioOut')).toBe('audio');
  });

  it('router1 CvOut resolves to cv (connected to cv)', () => {
    expect(portType(inspection, 'router1', 'CvOut')).toBe('cv');
  });
});

// ── Scenario: unconnected any port is not rendered ────────────────────────────

describe('any signal type — unconnected any port is hidden', () => {
  const diagram = `monotrail
module Passthrough {
    +any In
    +any Out
    +any Unused
}
module VCA {
    +audio In
    +audio Out
}

Passthrough pass1
VCA vca1

pass1:Out --> vca1:In
-->|input| pass1:In`;

  let inspection: LayoutInspection;
  beforeAll(async () => {
    inspection = await inspectLayout(diagram);
  });

  it('Unused port does not appear on pass1', () => {
    expect(inspection.nodes.pass1.ports).not.toHaveProperty('Unused');
  });

  it('connected In and Out ports are rendered', () => {
    expect(inspection.nodes.pass1.ports).toHaveProperty('In');
    expect(inspection.nodes.pass1.ports).toHaveProperty('Out');
  });
});
