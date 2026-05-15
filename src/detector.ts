/**
 * Patch diagram external diagram definition — main package entry point.
 *
 * Usage:
 *
 *   import mermaid from 'mermaid';
 *   import patch from 'mermaid-patch';
 *
 *   mermaid.registerExternalDiagrams([patch]);
 *   mermaid.initialize({ startOnLoad: true });
 *
 * Or with config:
 *
 *   mermaid.initialize({
 *     startOnLoad: true,
 *     patch: {
 *       audioColor: '#ff00aa',
 *       background: '#ffffff',
 *     },
 *   });
 */
import type { ExternalDiagramDefinition } from 'mermaid';
import diagram from './diagram-definition.js';

/** Matches diagram text that starts with optional whitespace then "patch". */
const detector = (text: string): boolean => /^\s*patch\b/i.test(text);

const patch: ExternalDiagramDefinition = {
  id: 'patch',
  detector,
  loader: async () => ({ id: 'patch', diagram }),
};

export default patch;
export { patch };
