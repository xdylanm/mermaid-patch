import type { Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { nearleyc } from './nearleyTransformer.js';

const fileRegex = /\.(ne)$/;

export default function nearley(): Plugin {
  return {
    name: 'nearley',
    enforce: 'pre',
    // Use load() so the grammar is compiled before Vite's import-analysis runs
    load(id: string) {
      if (!fileRegex.test(id)) return null;
      const src = readFileSync(id, 'utf-8');
      return {
        code: nearleyc(src),
        map: null,
      };
    },
  };
}
