export type RedactionEntry = {
  kind: 'home' | 'cwd' | 'temp' | 'env' | 'timestamp' | 'custom';
  replacement: string;
  count: number;
  label?: string;
};

export type CapturedFile = {
  path: string;
  exists: boolean;
  size: number;
  sha256?: string;
  content?: string;
};

export type TraceCommand = {
  argv: string[];
  display: string;
};

export type TraceFixture = {
  schemaVersion: 1;
  tool: {
    name: 'tracefixture';
    version: string;
  };
  command: TraceCommand;
  cwdLabel: string;
  recordedAt: string;
  durationMs: number;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  files: CapturedFile[];
  redactions: RedactionEntry[];
  normalizers: string[];
  notes?: string;
};

export type CustomPattern = {
  label: string;
  pattern: RegExp;
  replacement: string;
};

export type RecordOptions = {
  out: string;
  argv: string[];
  cwd?: string;
  cwdLabel: string;
  capturePaths: string[];
  customPatterns: CustomPattern[];
  notes?: string;
};

export type ReplayOptions = {
  fixturePath: string;
  cwd?: string;
  customPatterns: CustomPattern[];
};

export type RenderOptions = {
  fixturePath: string;
  markdown?: string;
};

export type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
};

export type ReplayMismatch = {
  field: 'exitCode' | 'stdout' | 'stderr' | 'files';
  expected: string;
  actual: string;
};

export class TracefixtureError extends Error {
  constructor(message: string, readonly exitCode = 1) {
    super(message);
    this.name = 'TracefixtureError';
  }
}
