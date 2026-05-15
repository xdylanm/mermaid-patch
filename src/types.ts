// ── AST types (output of the nearley parser) ─────────────────────────────────

export type SignalType = 'audio' | 'cv' | 'voct' | 'gate' | 'any' | string;

export interface PortDef {
  type: SignalType;
  label: string;
}

export interface ModuleDef {
  type: 'module';
  name: string;
  ports: PortDef[];
}

export interface NodeDef {
  type: 'node';
  function: string;
  name: string;
  label: string | null;
}

export interface Connection {
  type: 'connection' | 'dangling';
  from?: string;
  fromPort?: string;
  to?: string;
  toPort?: string;
  label?: string;
  direction?: 'from' | 'to';
}

export interface PatchAST {
  modules: ModuleDef[];
  nodes: NodeDef[];
  connections: Connection[];
}

// ── Layout types (output of buildLayout) ─────────────────────────────────────

export type Side = 'left' | 'right' | 'top' | 'bottom';

export interface PortAnchor {
  bx: number;
  by: number;
  side: Side;
}

export interface PortInfo {
  label: string;
  type: SignalType;
  side: Side;
  wasAny: boolean;
}

export interface NodeLayout {
  x: number;
  y: number;
  label: string | null;
  moduleType: string;
  allPorts: PortInfo[];
  portAnchors: Record<string, PortAnchor>;
}

export interface ElkPoint {
  x: number;
  y: number;
}

export interface ElkSection {
  startPoint: ElkPoint;
  endPoint: ElkPoint;
  bendPoints?: ElkPoint[];
}

export interface LayoutResult {
  layout: Record<string, NodeLayout>;
  edgeSections: Record<number, ElkSection[]>;
}

// ── Port metadata (internal to layout) ───────────────────────────────────────

export interface PortMeta {
  side: Side;
  type: SignalType;
  wasAny?: boolean;
}
