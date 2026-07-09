import { readJson } from './files.js';
import { assertFixture } from './fixture.js';
import type { TraceFixture } from './types.js';

export type FixtureInspection = {
  command: string;
  exitCode: number | null;
  cwdLabel: string;
  recordedAt: string;
  files: {
    total: number;
    present: number;
    missing: number;
    bytes: number;
  };
  output: {
    stdoutBytes: number;
    stderrBytes: number;
  };
  redactions: {
    total: number;
    byKind: Record<string, number>;
  };
  normalizers: string[];
};

export async function inspectTrace(fixturePath: string): Promise<FixtureInspection> {
  const loaded = await readJson<unknown>(fixturePath);
  assertFixture(loaded);
  return summarizeFixture(loaded);
}

export function summarizeFixture(fixture: TraceFixture): FixtureInspection {
  const byKind: Record<string, number> = {};
  for (const redaction of fixture.redactions) {
    byKind[redaction.kind] = (byKind[redaction.kind] ?? 0) + redaction.count;
  }

  return {
    command: fixture.command.display,
    exitCode: fixture.exitCode,
    cwdLabel: fixture.cwdLabel,
    recordedAt: fixture.recordedAt,
    files: {
      total: fixture.files.length,
      present: fixture.files.filter((file) => file.exists).length,
      missing: fixture.files.filter((file) => !file.exists).length,
      bytes: fixture.files.reduce((sum, file) => sum + file.size, 0)
    },
    output: {
      stdoutBytes: Buffer.byteLength(fixture.stdout),
      stderrBytes: Buffer.byteLength(fixture.stderr)
    },
    redactions: {
      total: fixture.redactions.reduce((sum, redaction) => sum + redaction.count, 0),
      byKind
    },
    normalizers: fixture.normalizers
  };
}

export function formatInspection(inspection: FixtureInspection): string {
  const redactionKinds = Object.entries(inspection.redactions.byKind)
    .map(([kind, count]) => `${kind}=${count}`)
    .join(', ') || 'none';

  return [
    `command: ${inspection.command}`,
    `exitCode: ${inspection.exitCode ?? 'signal'}`,
    `cwdLabel: ${inspection.cwdLabel}`,
    `recordedAt: ${inspection.recordedAt}`,
    `files: ${inspection.files.present}/${inspection.files.total} present, ${inspection.files.missing} missing, ${inspection.files.bytes} bytes`,
    `output: stdout=${inspection.output.stdoutBytes} bytes stderr=${inspection.output.stderrBytes} bytes`,
    `redactions: ${inspection.redactions.total} (${redactionKinds})`,
    `normalizers: ${inspection.normalizers.join(', ') || 'none'}`
  ].join('\n');
}
