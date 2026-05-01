import { createRequire } from 'node:module';

// nearley is a CommonJS package — use createRequire for compatibility with ESM Vite config
const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nearley = require('nearley') as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const compile = require('nearley/lib/compile') as (grammar: any, opts: object) => any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generate = require('nearley/lib/generate') as (grammar: any, moduleName: string) => string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bootstrappedNearley = require('nearley/lib/nearley-language-bootstrapped') as any;

/**
 * Compiles a nearley .ne grammar source string into an ES module string.
 *
 * The nearley generator produces an IIFE that exports via module.exports or
 * window.grammar. We strip the IIFE wrapper and the CJS/global export block,
 * then re-export as ESM. The compiled grammar object has no runtime dependencies
 * (it is just a data structure: { Lexer, ParserRules, ParserStart }).
 */
export function nearleyc(src: string): string {
  // Parse the .ne source using the bootstrapped nearley grammar parser
  const parser = new nearley.Parser(
    nearley.Grammar.fromCompiled(bootstrappedNearley)
  );
  parser.feed(src);
  const grammarDef = parser.results[0];

  if (!grammarDef) {
    throw new Error('nearley: failed to parse grammar — no result');
  }

  // Compile to an internal grammar representation
  const compiled = compile(grammarDef, {});

  // Generate CJS-wrapped JavaScript (nearley's only output format in v2)
  const generated = generate(compiled, 'grammar');

  // Strip the IIFE wrapper: "(function () {" ... "})()"
  // Strip the CJS/global export tail: "if (typeof module !== 'undefined'..."
  const inner = generated
    .replace(/^\(function \(\) \{\n?/, '')
    .replace(/\n?\}\)\(\);\s*$/, '');

  // Remove the CJS/global assignment block at the end of the inner code.
  // Pattern: `if (typeof module !== 'undefined'&& typeof module.exports ...`
  const withoutCjsExport = inner.replace(
    /\nif \(typeof module[^}]*\}\s*\}\s*\}\s*\)\s*;?/s,
    ''
  ).trimEnd();

  return `${withoutCjsExport}\n\nexport { grammar };\nexport default grammar;\n`;
}
