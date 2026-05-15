/**
 * Patch diagram parser.
 *
 * At build time, Vite's nearley plugin compiles patch.ne into an ES module
 * that exports a compiled grammar object. At runtime, the nearley parser
 * runtime (`nearley` package) uses that grammar to parse diagram text.
 *
 * The parser populates db via setData() with the parsed AST.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import nearley from 'nearley';
import type { PatchAST } from './types.js';
import db from './db.js';
import { log } from './mermaidUtils.js';

// Grammar compiled from patch.ne by scripts/compileGrammar.cjs
// @ts-expect-error — generated JS file, no types
import grammar from './grammar/patch.grammar.js';

function parsePatch(text: string): PatchAST {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed(normalized);

  if (!parser.results || parser.results.length === 0) {
    throw new Error('Patch: no parse result — check diagram syntax');
  }

  const statements: unknown[] = parser.results[0];
  const modules = statements.filter(
    (s): s is { type: 'module'; name: string; ports: unknown[] } =>
      (s as { type: string }).type === 'module'
  );
  const nodes = statements.filter(
    (s): s is { type: 'node'; function: string; name: string; label: string | null } =>
      (s as { type: string }).type === 'node'
  );
  const connections = statements.filter(
    (s): s is { type: 'connection' | 'dangling' } =>
      (s as { type: string }).type === 'connection' ||
      (s as { type: string }).type === 'dangling'
  );

  return { modules, nodes, connections } as PatchAST;
}

const parser = {
  parse(text: string): void {
    try {
      const ast = parsePatch(text);
      db.setData(ast);
    } catch (e) {
      log.error('Patch parse error:', String(e));
      throw e;
    }
  },
};

export default parser;
export { parsePatch };
