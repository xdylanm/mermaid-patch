/**
 * scripts/compileGrammar.cjs
 *
 * Pre-compiles monotrail.ne → src/grammar/monotrail.grammar.js (ESM).
 * Run via: node scripts/compileGrammar.cjs
 * Or automatically via the `prebuild` / `pretest` npm scripts.
 */
'use strict';
const nearley  = require('nearley');
const compile  = require('nearley/lib/compile');
const generate = require('nearley/lib/generate');
const boot     = require('nearley/lib/nearley-language-bootstrapped');
const fs   = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '../src/grammar/monotrail.ne'),
  'utf-8'
);

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(boot));
parser.feed(src);

if (!parser.results || parser.results.length === 0) {
  console.error('Grammar compilation failed — no parse result.');
  process.exit(1);
}

const compiled  = compile(parser.results[0], {});
const generated = generate(compiled, 'grammar');

// Extract the IIFE body robustly (nearley prepends comment lines before the IIFE)
const iifStart = generated.indexOf('(function () {');
const iifEnd   = generated.lastIndexOf('})();');
if (iifStart === -1 || iifEnd === -1) {
  console.error('Grammar compilation failed — could not locate IIFE wrapper.');
  process.exit(1);
}
const iifBody = generated.slice(iifStart + '(function () {\n'.length, iifEnd);

// Strip the CJS/global export block (last if-block before closing IIFE brace)
const withoutCjs = iifBody
  .replace(/\nif \(typeof module[^}]*\}\s*\}\s*\n?$/s, '')
  .trimEnd();

// nearley emits `function id(x) { return x[0]; }` then later another identical
// `function id(d) { return d[0]; }` from the grammar builtins. Remove the first
// occurrence so the ESM module has no duplicate declaration.
const deduped = withoutCjs.replace(/^function id\(x\) \{ return x\[0\]; \}\n[ \t]*\n?/, '');

const esm = `// AUTO-GENERATED — do not edit. Run: node scripts/compileGrammar.cjs\n// Source: src/grammar/monotrail.ne\n\n${deduped}\n\nexport { grammar };\nexport default grammar;\n`;

const outPath = path.join(__dirname, '../src/grammar/monotrail.grammar.js');
fs.writeFileSync(outPath, esm, 'utf-8');
console.log('[monotrail] Grammar compiled →', path.relative(process.cwd(), outPath));
