import type { MermaidConfig } from 'mermaid';
import mermaid from 'mermaid';
import type { PatchAST } from './types.js';
import { DEFAULT_CONFIG, DARK_CONFIG, NEUTRAL_CONFIG, type PatchConfig } from './config.js';

let _ast: PatchAST | null = null;

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

function resolvedConfig(): PatchConfig {
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
  // background and node chrome variables are only applied for non-default themes,
  // because Mermaid auto-populates themeVariables (including background) even when
  // theme: 'default', which would stomp the intentional patch diagram default palette.
  const tv = (mermaidConf.themeVariables ?? {}) as Record<string, unknown>;
  const themeVarOverride: Partial<PatchConfig> = {};
  const col = (k: keyof PatchConfig, v: string | undefined) => { if (v) (themeVarOverride as Record<string, unknown>)[k] = v; };
  col('fontFamily', parseThemeColor(tv['fontFamily']));
  const fs = parseThemeSize(tv['fontSize']);
  if (fs !== undefined) themeVarOverride.fontSize = fs;
  // background and node chrome overrides only when an explicit non-default theme is active.
  const isNonDefaultTheme = mermaidConf.theme === 'dark' || mermaidConf.theme === 'neutral';
  if (isNonDefaultTheme) {
    col('background',    parseThemeColor(tv['background']));
    col('nodeNameColor', parseThemeColor(tv['primaryTextColor']));
    col('nodeLabelColor', parseThemeColor(tv['secondaryTextColor']));
    const bgOverride = parseThemeColor(tv['primaryColor']);
    col('nodeBgColor', bgOverride);
    if (palette.simplifiedTabs) {
      // In simplified-tab mode (neutral theme) keep inner bands in sync with the background
      // override so all three layers stay the same colour. Also suppress primaryBorderColor
      // → nodeBandDark because Mermaid's built-in neutral themeVariables set that to a light
      // grey, which would clobber the intentional dark outer band.
      if (bgOverride) {
        col('nodeBandLight', bgOverride);
        col('nodeBandMid',   bgOverride);
      }
    } else {
      col('nodeBandDark', parseThemeColor(tv['primaryBorderColor']));
    }
  }

  // 3. User's patch key — only accept the non-color keys.
  const raw = (mermaidConf as Record<string, unknown>).patch as Record<string, unknown> | undefined;
  const userOverride: Partial<PatchConfig> = {};
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
  setData(ast: PatchAST): void {
    _ast = ast;
  },

  getData(): PatchAST | null {
    return _ast;
  },

  getConfig(): PatchConfig {
    return resolvedConfig();
  },

  clear(): void {
    _ast = null;
  },
};

export default db;
export type PatchDB = typeof db;
