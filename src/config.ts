/**
 * Fully-resolved patch diagram configuration (internal type used by renderer and layout).
 *
 * Users configure this diagram via `mermaid.initialize()` with a `patch` key and/or
 * standard Mermaid `themeVariables`.  Only the following keys are accepted from the user:
 *
 *   background, fontFamily, fontSize, portPlacement, nodePlacementStrategy,
 *   legend, legendPosition
 *
 * Signal colours and node chrome colours are derived from the built-in theme palette
 * (DEFAULT_CONFIG / DARK_CONFIG / NEUTRAL_CONFIG) and can be further adjusted via standard
 * Mermaid themeVariables (primaryColor → nodeBgColor, primaryBorderColor → nodeBandDark,
 * primaryTextColor → nodeNameColor, secondaryTextColor → nodeLabelColor).  They are not
 * settable through the `patch.*` user config.
 */
export interface PatchConfig {
  // ── Internal: signal type colors (palette-driven, not user-settable via patch.*) ─────
  audioColor: string;
  cvColor: string;
  voctColor: string;
  gateColor: string;
  anyColor: string;
  defaultColor: string;

  // ── Internal: node chrome (palette + themeVariables, not user-settable via patch.*) ──
  nodeBgColor: string;      // background fill (L=80 equivalent)
  nodeBandLight: string;    // innermost band (L=60 equivalent)
  nodeBandMid: string;      // middle band    (L=40 equivalent)
  nodeBandDark: string;     // outermost band (L=20 equivalent)
  nodeNameColor: string;    // module name text
  nodeLabelColor: string;   // optional label text

  // ── User-settable via patch.* or themeVariables ──────────────────────────────────────
  background: string;
  fontFamily: string;
  fontSize: number;

  // ── Internal: rendering mode flags (palette-driven, not user-settable via patch.*) ─────
  simplifiedTabs: boolean;  // when true, port tabs use node chrome colours instead of signal-type HSL

  // ── User-settable: layout options ─────────────────────────────────────────────────────────
  portPlacement: 'elk-optimized' | 'declaration';
  nodePlacementStrategy: 'brandes-koepf' | 'network-simplex' | 'simple';

  // ── User-settable: legend ──────────────────────────────────────────────────────────────────
  legend: boolean;          // when true, renders a signal-type colour legend overlay
  legendPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const DEFAULT_CONFIG: PatchConfig = {
  audioColor: 'hsl(25, 100%, 40%)',
  cvColor: 'hsl(200, 100%, 40%)',
  voctColor: 'hsl(100, 100%, 40%)',
  gateColor: 'hsl(300, 100%, 40%)',
  anyColor: 'hsl(0, 0%, 40%)',
  defaultColor: 'hsl(0, 0%, 40%)',

  nodeBgColor: '#cccccc',
  nodeBandLight: '#999999',
  nodeBandMid: '#666666',
  nodeBandDark: '#333333',
  nodeNameColor: '#111111',
  nodeLabelColor: '#333333',

  background: 'hsl(50, 100%, 95%)',

  fontFamily: 'Arial, sans-serif',
  fontSize: 18,

  simplifiedTabs: false,

  portPlacement: 'elk-optimized',
  nodePlacementStrategy: 'brandes-koepf',

  legend: false,
  legendPosition: 'top-right',
};

/** Built-in dark palette. Signal colours are identical to DEFAULT_CONFIG. */
export const DARK_CONFIG: PatchConfig = {
  ...DEFAULT_CONFIG,
  nodeBgColor: '#2a2a2a',
  nodeBandLight: '#3c3c3c',
  nodeBandMid: '#555555',
  nodeBandDark: '#6e6e6e',
  nodeNameColor: '#eeeeee',
  nodeLabelColor: '#cccccc',
  background: '#1e1e2e',
};

/** Built-in neutral palette — print-ready: dark outer band only, light grey backgrounds, white canvas. */
export const NEUTRAL_CONFIG: PatchConfig = {
  ...DEFAULT_CONFIG,
  audioColor: 'hsl(0,0%,20%)',
  cvColor: 'hsl(0,0%,20%)',
  voctColor: 'hsl(0,0%,20%)',
  gateColor: 'hsl(0,0%,20%)',
  anyColor: 'hsl(0,0%,20%)',
  defaultColor: 'hsl(0,0%,20%)',

  nodeBgColor: 'hsl(0,0%,95%)',
  nodeBandLight: 'hsl(0,0%,95%)',
  nodeBandMid: 'hsl(0,0%,95%)',
  nodeBandDark: 'hsl(0,0%,20%)',
  nodeNameColor: '#222222',
  nodeLabelColor: '#444444',

  background: '#ffffff',

  simplifiedTabs: true,
};

/** Signal type → color key in PatchConfig */
export const SIGNAL_COLOR_KEY: Record<string, keyof PatchConfig> = {
  audio: 'audioColor',
  cv: 'cvColor',
  voct: 'voctColor',
  gate: 'gateColor',
  any: 'anyColor',
};

/** Resolve a signal type to its configured color */
export function signalColor(type: string, config: PatchConfig): string {
  const key = SIGNAL_COLOR_KEY[(type || '').toLowerCase()];
  if (key) return config[key] as string;
  return config.defaultColor;
}
