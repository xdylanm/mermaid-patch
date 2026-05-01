/**
 * Mermaid DiagramDefinition for Monotrail.
 *
 * Assembles parser, renderer, styles, and db into the shape Mermaid
 * expects when a diagram type is registered.
 */
import parser from './parser.js';
import { draw } from './renderer.js';
import styles from './styles.js';
import db from './db.js';

import type { DiagramDefinition } from 'mermaid/dist/diagram-api/types.js';

const diagram: DiagramDefinition = {
  db: db as unknown as DiagramDefinition['db'],
  parser,
  renderer: { draw } as unknown as DiagramDefinition['renderer'],
  styles,
};

export default diagram;
