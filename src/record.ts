import path from 'node:path';
import { captureFiles, writeJson } from './files.js';
import { NORMALIZERS, normalizeCommandDisplay, normalizeOutput } from './normalizers.js';
import { mergeRedactions, redactText } from './redaction.js';
import { runCommand } from './run.js';
import type { RecordOptions, TraceFixture } from './types.js';
import { VERSION } from './version.js';

export async function recordTrace(options: RecordOptions): Promise<TraceFixture> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const result = await runCommand(options.argv, cwd);
  const stdout = redactText(normalizeOutput(result.stdout), {
    cwd,
    customPatterns: options.customPatterns
  });
  const stderr = redactText(normalizeOutput(result.stderr), {
    cwd,
    customPatterns: options.customPatterns
  });
  const captured = await captureFiles(options.capturePaths, cwd, options.customPatterns);

  const fixture: TraceFixture = {
    schemaVersion: 1,
    tool: {
      name: 'tracefixture',
      version: VERSION
    },
    command: {
      argv: options.argv,
      display: normalizeCommandDisplay(options.argv)
    },
    cwdLabel: options.cwdLabel,
    recordedAt: new Date().toISOString(),
    durationMs: result.durationMs,
    exitCode: result.exitCode,
    signal: result.signal,
    stdout: stdout.value,
    stderr: stderr.value,
    files: captured.files,
    redactions: mergeRedactions([stdout.entries, stderr.entries, ...captured.redactions]),
    normalizers: [...NORMALIZERS]
  };

  if (options.notes) {
    fixture.notes = options.notes;
  }

  await writeJson(options.out, fixture);
  return fixture;
}
