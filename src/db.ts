import type { MermaidConfig } from 'mermaid';
import type { MonotrailAST } from './types.js';
import { DEFAULT_CONFIG, type MonotrailConfig } from './config.js';
import { getConfig } from './mermaidUtils.js';

let _ast: MonotrailAST | null = null;

function resolvedConfig(): MonotrailConfig {
  let mermaidConf: MermaidConfig;
  try {
    mermaidConf = getConfig();
  } catch {
    mermaidConf = {};
  }

  const userOverride = (mermaidConf as Record<string, unknown>).monotrail as
    | Partial<MonotrailConfig>
    | undefined;

  const isDark = mermaidConf.theme === 'dark';
  const darkOverride = isDark ? DEFAULT_CONFIG.dark ?? {} : {};

  return {
    ...DEFAULT_CONFIG,
    ...darkOverride,
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
