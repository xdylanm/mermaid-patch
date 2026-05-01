/**
 * Monotrail diagram configuration.
 *
 * All color values should be valid CSS color strings.
 * Pass overrides via:
 *
 *   mermaid.initialize({ monotrail: { audioColor: '#ff0000' } });
 */
export interface MonotrailConfig {
  // Signal type colors (used for port badges and wires)
  audioColor: string;
  cvColor: string;
  voctColor: string;
  gateColor: string;
  anyColor: string;
  defaultColor: string;

  // Node chrome
  nodeHeaderFill: string;
  nodeHeaderText: string;
  nodeBodyFill: string;
  nodeBodyText: string;
  nodeBorderColor: string;

  // Diagram background
  background: string;

  // Layout options (advanced)
  portPlacement: 'elk-optimized' | 'declaration';
  nodePlacementStrategy: 'brandes-koepf' | 'network-simplex' | 'simple';

  // Dark mode overrides — applied automatically when theme === 'dark'
  dark?: Partial<Omit<MonotrailConfig, 'dark' | 'portPlacement' | 'nodePlacementStrategy'>>;
}

export const DEFAULT_CONFIG: MonotrailConfig = {
  // Light mode defaults (matching the original patchlog renderer)
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

  portPlacement: 'elk-optimized',
  nodePlacementStrategy: 'brandes-koepf',

  dark: {
    audioColor: '#f4a7c3',
    cvColor: '#7bc4f0',
    voctColor: '#aad878',
    gateColor: '#fcc76a',
    anyColor: '#aaaaaa',
    defaultColor: '#aaaaaa',

    nodeHeaderFill: '#2a2a2a',
    nodeHeaderText: '#eeeeee',
    nodeBodyFill: '#1a1a1a',
    nodeBodyText: '#cccccc',
    nodeBorderColor: '#555555',

    background: '#1e1e2e',
  },
};

/** Signal type → color key in MonotrailConfig */
export const SIGNAL_COLOR_KEY: Record<string, keyof MonotrailConfig> = {
  audio: 'audioColor',
  cv: 'cvColor',
  voct: 'voctColor',
  gate: 'gateColor',
  any: 'anyColor',
};

/** Resolve a signal type to its configured color */
export function signalColor(type: string, config: MonotrailConfig): string {
  const key = SIGNAL_COLOR_KEY[(type || '').toLowerCase()];
  if (key) return config[key] as string;
  return config.defaultColor;
}
