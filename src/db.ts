import type { MermaidConfig } from 'mermaid';
import mermaid from 'mermaid';
import type { MonotrailAST } from './types.js';
import { DEFAULT_CONFIG, DARK_CONFIG, NEUTRAL_CONFIG, type MonotrailConfig } from './config.js';

let _ast: MonotrailAST | null = null;

/** Parse a pixel/number value from a themeVariables entry (e.g. '16px' → 16). */
function parseThemeSize(raw: unknown): number | undefined {
  if (typeof raw === 'number' && raw > 0) return raw;
  if (typeof raw === 'string') {
    const n = parseFloat(raw);
    if (!isNaN(n) && n > 0) return n;
  }
  return undefined;
}

/** Extract a non-empty string or return undefined. */
function parseThemeColor(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : undefined;
}

function resolvedConfig(): MonotrailConfig {
  let mermaidConf: MermaidConfig;
  try {
    mermaidConf = mermaid.mermaidAPI.getConfig();
  } catch {
    mermaidConf = {};
  }

  // 1. Pick the theme palette.
  const palette =
    mermaidConf.theme === 'dark' ? DARK_CONFIG :
    mermaidConf.theme === 'neutral' ? NEUTRAL_CONFIG :
    DEFAULT_CONFIG;

  // 2. Build an override from supported themeVariables.
  // Node chrome variables (primaryColor etc.) are only applied for non-default themes,
  // because Mermaid auto-populates themeVariables even when theme: 'default', which
  // would stomp the intentional Monotrail default palette.
  const tv = (mermaidConf.themeVariables ?? {}) as Record<string, unknown>;
  const themeVarOverride: Partial<MonotrailConfig> = {};
  const col = (k: keyof MonotrailConfig, v: string | undefined) => { if (v) (themeVarOverride as Record<string, unknown>)[k] = v; };
  col('background', parseThemeColor(tv['background']));
  col('fontFamily', parseThemeColor(tv['fontFamily']));
  const fs = parseThemeSize(tv['fontSize']);
  if (fs !== undefined) themeVarOverride.fontSize = fs;
  // Node chrome overrides only when an explicit non-default theme is active.
  const isNonDefaultTheme = mermaidConf.theme === 'dark' || mermaidConf.theme === 'neutral';
  if (isNonDefaultTheme) {
    col('nodeHeaderFill',  parseThemeColor(tv['primaryColor']));
    col('nodeHeaderText',  parseThemeColor(tv['primaryTextColor']));
    col('nodeBorderColor', parseThemeColor(tv['primaryBorderColor']));
    col('nodeBodyFill',    parseThemeColor(tv['secondaryColor']));
    col('nodeBodyText',    parseThemeColor(tv['secondaryTextColor']));
  }

  // 3. User's monotrail key — only accept the non-color keys.
  const raw = (mermaidConf as Record<string, unknown>).monotrail as Record<string, unknown> | undefined;
  const userOverride: Partial<MonotrailConfig> = {};
  if (raw) {
    if (typeof raw['background'] === 'string' && raw['background'].trim())
      userOverride.background = (raw['background'] as string).trim();
    if (typeof raw['fontFamily'] === 'string' && raw['fontFamily'].trim())
      userOverride.fontFamily = (raw['fontFamily'] as string).trim();
    const ufs = parseThemeSize(raw['fontSize']);
    if (ufs !== undefined) userOverride.fontSize = ufs;
    if (raw['portPlacement'] === 'elk-optimized' || raw['portPlacement'] === 'declaration')
      userOverride.portPlacement = raw['portPlacement'];
    if (raw['nodePlacementStrategy'] === 'brandes-koepf' || raw['nodePlacementStrategy'] === 'network-simplex' || raw['nodePlacementStrategy'] === 'simple')
      userOverride.nodePlacementStrategy = raw['nodePlacementStrategy'];
  }

  return {
    ...palette,
    ...themeVarOverride,
    ...userOverride,
  };
}

const db = {
  setData(ast: MonotrailAST): void {
    _ast = ast;
  },

  getData(): MonotrailAST | null {
    return _ast;
  },

  getConfig(): MonotrailConfig {
    return resolvedConfig();
  },

  clear(): void {
    _ast = null;
  },
};

export default db;
export type MonotrailDB = typeof db;
