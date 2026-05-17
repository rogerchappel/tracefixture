import path from 'node:path';
import { captureFiles, readJson } from './files.js';
import { assertFixture } from './fixture.js';
import { formatDiff } from './diff.js';
import { normalizeOutput } from './normalizers.js';
import { redactText } from './redaction.js';
import { runCommand } from './run.js';
import type { ReplayMismatch, ReplayOptions, TraceFixture } from './types.js';

export type ReplayResult = {
  ok: boolean;
  fixture: TraceFixture;
  mismatches: ReplayMismatch[];
};

export async function replayTrace(options: ReplayOptions): Promise<ReplayResult> {
  const loaded = await readJson<unknown>(options.fixturePath);
  assertFixture(loaded);
  const fixture = loaded;
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const result = await runCommand(fixture.command.argv, cwd);
  const stdout = redactText(normalizeOutput(result.stdout), {
    cwd,
    customPatterns: options.customPatterns
  }).value;
  const stderr = redactText(normalizeOutput(result.stderr), {
    cwd,
    customPatterns: options.customPatterns
  }).value;
  const captured = await captureFiles(fixture.files.map((file) => file.path), cwd, options.customPatterns);
  const mismatches: ReplayMismatch[] = [];

  if (fixture.exitCode !== result.exitCode) {
    mismatches.push({
      field: 'exitCode',
      expected: String(fixture.exitCode),
      actual: String(result.exitCode)
    });
  }

  if (fixture.stdout !== stdout) {
    mismatches.push({
      field: 'stdout',
      expected: fixture.stdout,
      actual: stdout
    });
  }

  if (fixture.stderr !== stderr) {
    mismatches.push({
      field: 'stderr',
      expected: fixture.stderr,
      actual: stderr
    });
  }

  const expectedFiles = JSON.stringify(fixture.files, null, 2);
  const actualFiles = JSON.stringify(captured.files, null, 2);
  if (expectedFiles !== actualFiles) {
    mismatches.push({
      field: 'files',
      expected: expectedFiles,
      actual: actualFiles
    });
  }

  return {
    ok: mismatches.length === 0,
    fixture,
    mismatches
  };
}

export function formatReplayReport(result: ReplayResult): string {
  if (result.ok) {
    return `tracefixture replay ok: ${result.fixture.command.display}`;
  }

  const sections = result.mismatches.map((mismatch) => {
    const diff = formatDiff(mismatch.expected, mismatch.actual);
    return [`Mismatch: ${mismatch.field}`, diff || `expected ${mismatch.expected}, got ${mismatch.actual}`].join('\n');
  });

  return ['tracefixture replay failed', ...sections].join('\n\n');
}
