/**
 * Monotrail external diagram definition — main package entry point.
 *
 * Usage:
 *
 *   import mermaid from 'mermaid';
 *   import monotrail from 'mermaid-monotrail';
 *
 *   mermaid.registerExternalDiagrams([monotrail]);
 *   mermaid.initialize({ startOnLoad: true });
 *
 * Or with config:
 *
 *   mermaid.initialize({
 *     startOnLoad: true,
 *     monotrail: {
 *       audioColor: '#ff00aa',
 *       background: '#ffffff',
 *     },
 *   });
 */
import type { ExternalDiagramDefinition } from 'mermaid';
import diagram from './diagram-definition.js';

/** Matches diagram text that starts with optional whitespace then "monotrail". */
const detector = (text: string): boolean => /^\s*monotrail\b/i.test(text);

const monotrail: ExternalDiagramDefinition = {
  id: 'monotrail',
  detector,
  loader: async () => ({ id: 'monotrail', diagram }),
};

export default monotrail;
export { monotrail };
