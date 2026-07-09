import { readJson } from './files.js';
import type { TraceFixture } from './types.js';

export interface FixtureSummary {
  command: string;
  cwdLabel: string;
  exitCode: number | null;
  durationMs: number;
  stdoutBytes: number;
  stderrBytes: number;
  capturedFiles: number;
  missingFiles: number;
  redactionCount: number;
  normalizers: string[];
  notes?: string;
}

export async function inspectFixture(fixturePath: string): Promise<FixtureSummary> {
  const fixture = await readJson<TraceFixture>(fixturePath);
  return summarizeFixture(fixture);
}

export function summarizeFixture(fixture: TraceFixture): FixtureSummary {
  const summary: FixtureSummary = {
    command: fixture.command.display,
    cwdLabel: fixture.cwdLabel,
    exitCode: fixture.exitCode,
    durationMs: fixture.durationMs,
    stdoutBytes: Buffer.byteLength(fixture.stdout),
    stderrBytes: Buffer.byteLength(fixture.stderr),
    capturedFiles: fixture.files.filter((file) => file.exists).length,
    missingFiles: fixture.files.filter((file) => !file.exists).length,
    redactionCount: fixture.redactions.reduce((total, entry) => total + entry.count, 0),
    normalizers: fixture.normalizers
  };
  if (fixture.notes) summary.notes = fixture.notes;
  return summary;
}

export function formatFixtureSummary(summary: FixtureSummary): string {
  const lines = [
    'Trace fixture summary',
    `Command: ${summary.command}`,
    `CWD: ${summary.cwdLabel}`,
    `Exit code: ${summary.exitCode ?? 'signal/unknown'}`,
    `Duration: ${summary.durationMs}ms`,
    `Stdout bytes: ${summary.stdoutBytes}`,
    `Stderr bytes: ${summary.stderrBytes}`,
    `Captured files: ${summary.capturedFiles}`,
    `Missing files: ${summary.missingFiles}`,
    `Redactions: ${summary.redactionCount}`,
    `Normalizers: ${summary.normalizers.join(', ')}`
  ];
  if (summary.notes) lines.push(`Notes: ${summary.notes}`);
  return `${lines.join('\n')}\n`;
}
