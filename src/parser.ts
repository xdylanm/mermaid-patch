/**
 * Monotrail parser.
 *
 * At build time, Vite's nearley plugin compiles monotrail.ne into an ES module
 * that exports a compiled grammar object. At runtime, the nearley parser
 * runtime (`nearley` package) uses that grammar to parse diagram text.
 *
 * The parser populates db via setData() with the parsed AST.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import nearley from 'nearley';
import type { MonotrailAST } from './types.js';
import db from './db.js';
import { log } from './mermaidUtils.js';

// Grammar compiled from monotrail.ne by scripts/compileGrammar.cjs
// @ts-expect-error — generated JS file, no types
import grammar from './grammar/monotrail.grammar.js';

function parseMonotrail(text: string): MonotrailAST {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed(normalized);

  if (!parser.results || parser.results.length === 0) {
    throw new Error('Monotrail: no parse result — check diagram syntax');
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

  return { modules, nodes, connections } as MonotrailAST;
}

const parser = {
  parse(text: string): void {
    try {
      const ast = parseMonotrail(text);
      db.setData(ast);
    } catch (e) {
      log.error('Monotrail parse error:', String(e));
      throw e;
    }
  },
};

export default parser;
export { parseMonotrail };
