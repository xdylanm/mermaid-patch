import type { MermaidConfig } from 'mermaid';

const warning = (s: string) => {
  console.error('Patch: log function called before initialization', s);
};

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export const LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

export const log: Record<keyof typeof LEVELS, typeof console.log> = {
  trace: console.debug.bind(console),
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  fatal: console.error.bind(console),
};

export let setLogLevel: (level: keyof typeof LEVELS | number) => void;
export let getConfig: () => MermaidConfig;
export let sanitizeText: (str: string) => string;
export let setupGraphViewbox: (
  graph: unknown,
  svgElem: unknown,
  padding: unknown,
  useMaxWidth: boolean
) => void;

export const injectUtils = (
  _log: Record<keyof typeof LEVELS, typeof console.log>,
  _setLogLevel: typeof setLogLevel,
  _getConfig: typeof getConfig,
  _sanitizeText: typeof sanitizeText,
  _setupGraphViewbox: typeof setupGraphViewbox
) => {
  _log.info('Patch utils injected');
  log.trace = _log.trace;
  log.debug = _log.debug;
  log.info = _log.info;
  log.warn = _log.warn;
  log.error = _log.error;
  log.fatal = _log.fatal;
  setLogLevel = _setLogLevel;
  getConfig = _getConfig;
  sanitizeText = _sanitizeText;
  setupGraphViewbox = _setupGraphViewbox;
};
