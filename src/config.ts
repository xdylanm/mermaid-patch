/**
 * Fully-resolved patch diagram configuration (internal type used by renderer and layout).
 *
 * Users configure this diagram via `mermaid.initialize()` with a `patch` key and/or
 * standard Mermaid `themeVariables`.  Only the following keys are accepted from the user:
 *
 *   background, fontFamily, fontSize, portPlacement, nodePlacementStrategy
 *
 * Signal colours and node chrome colours are derived from the built-in theme palette
 * (DEFAULT_CONFIG / DARK_CONFIG / NEUTRAL_CONFIG) and can be further adjusted via standard
 * Mermaid themeVariables (primaryColor → nodeHeaderFill, etc.).  They are not settable
 * through the `patch.*` user config.
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
  nodeHeaderFill: string;
  nodeHeaderText: string;
  nodeBodyFill: string;
  nodeBodyText: string;
  nodeBorderColor: string;

  // ── User-settable via patch.* or themeVariables ──────────────────────────────────────
  background: string;
  fontFamily: string;
  fontSize: number;

  // ── User-settable: layout options ─────────────────────────────────────────────────────────
  portPlacement: 'elk-optimized' | 'declaration';
  nodePlacementStrategy: 'brandes-koepf' | 'network-simplex' | 'simple';
}

export const DEFAULT_CONFIG: PatchConfig = {
  audioColor: '#F07BAB',
  cvColor: '#51A4DB',
  voctColor: '#8BC640',
  gateColor: '#F9AF3C',
  anyColor: '#888888',
  defaultColor: '#888888',

  nodeHeaderFill: '#ffffff',
  nodeHeaderText: '#111111',
  nodeBodyFill: '#404040',
  nodeBodyText: '#bbbbbb',
  nodeBorderColor: '#1a1a1a',

  background: '#f0ede8',

  fontFamily: 'Arial, sans-serif',
  fontSize: 18,

  portPlacement: 'elk-optimized',
  nodePlacementStrategy: 'brandes-koepf',
};

/** Built-in dark palette. Signal colours are identical to DEFAULT_CONFIG. */
export const DARK_CONFIG: PatchConfig = {
  ...DEFAULT_CONFIG,
  nodeHeaderFill: '#2a2a2a',
  nodeHeaderText: '#eeeeee',
  nodeBodyFill: '#e8e8e8',
  nodeBodyText: '#111111',
  nodeBorderColor: '#555555',
  background: '#1e1e2e',
};

/** Built-in neutral palette — grayscale signal colours, light chrome. */
export const NEUTRAL_CONFIG: PatchConfig = {
  ...DEFAULT_CONFIG,
  audioColor: '#a0a0a0',
  cvColor: '#888888',
  voctColor: '#b0b0b0',
  gateColor: '#c8c8c8',
  anyColor: '#888888',
  defaultColor: '#888888',

  nodeHeaderFill: '#f0f0f0',
  nodeHeaderText: '#222222',
  nodeBodyFill: '#d0d0d0',
  nodeBodyText: '#333333',
  nodeBorderColor: '#999999',

  background: '#f5f5f5',
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
