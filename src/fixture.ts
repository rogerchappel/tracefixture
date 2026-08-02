import { readFile } from 'node:fs/promises';
import type { TraceFixture } from './types.js';
import { TracefixtureError } from './types.js';

const REDACTION_KINDS = new Set(['home', 'cwd', 'temp', 'env', 'timestamp', 'custom']);

export async function readFixture(filePath: string): Promise<TraceFixture> {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(filePath, 'utf8')) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) throw new TracefixtureError('Fixture JSON is invalid.');
    throw error;
  }
  assertFixture(value);
  return value;
}

export function assertFixture(value: unknown): asserts value is TraceFixture {
  requireObject(value, 'Fixture');
  if (value.schemaVersion !== 1) fail('schemaVersion', 'must be 1');
  requireObject(value.tool, 'Fixture tool');
  if (value.tool.name !== 'tracefixture') fail('tool.name', 'must be "tracefixture"');
  requireString(value.tool.version, 'tool.version');
  requireObject(value.command, 'Fixture command');
  requireArray(value.command.argv, 'command.argv');
  if (value.command.argv.length === 0) fail('command.argv', 'must contain at least one entry');
  value.command.argv.forEach((entry, index) => requireString(entry, `command.argv[${index}]`, true));
  requireString(value.command.display, 'command.display');
  requireString(value.cwdLabel, 'cwdLabel');
  requireString(value.recordedAt, 'recordedAt');
  requireNumber(value.durationMs, 'durationMs', false);
  if (value.exitCode !== null) requireNumber(value.exitCode, 'exitCode', true);
  if (value.signal !== null) requireString(value.signal, 'signal', true);
  requireString(value.stdout, 'stdout');
  requireString(value.stderr, 'stderr');

  requireArray(value.files, 'files');
  value.files.forEach((file, index) => {
    const field = `files[${index}]`;
    requireObject(file, `Fixture ${field}`);
    requireString(file.path, `${field}.path`, true);
    if (typeof file.exists !== 'boolean') fail(`${field}.exists`, 'must be a boolean');
    requireNumber(file.size, `${field}.size`, false);
    if (file.sha256 !== undefined) requireString(file.sha256, `${field}.sha256`, true);
    if (file.content !== undefined) requireString(file.content, `${field}.content`);
  });

  requireArray(value.redactions, 'redactions');
  value.redactions.forEach((redaction, index) => {
    const field = `redactions[${index}]`;
    requireObject(redaction, `Fixture ${field}`);
    if (typeof redaction.kind !== 'string' || !REDACTION_KINDS.has(redaction.kind)) fail(`${field}.kind`, 'must be a supported redaction kind');
    requireString(redaction.replacement, `${field}.replacement`);
    requireNumber(redaction.count, `${field}.count`, true);
    if (redaction.label !== undefined) requireString(redaction.label, `${field}.label`);
  });

  requireArray(value.normalizers, 'normalizers');
  value.normalizers.forEach((item, index) => requireString(item, `normalizers[${index}]`, true));
  if (value.notes !== undefined) requireString(value.notes, 'notes');
}

function requireObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TracefixtureError(`${label} must be a JSON object.`);
}
function requireArray(value: unknown, field: string): asserts value is unknown[] {
  if (!Array.isArray(value)) fail(field, 'must be an array');
}
function requireString(value: unknown, field: string, nonEmpty = false): asserts value is string {
  if (typeof value !== 'string') fail(field, 'must be a string');
  if (nonEmpty && value.length === 0) fail(field, 'must be a non-empty string');
}
function requireNumber(value: unknown, field: string, integer: boolean): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) fail(field, integer ? 'must be a non-negative integer' : 'must be a non-negative finite number');
}
function fail(field: string, requirement: string): never {
  throw new TracefixtureError(`Fixture ${field} ${requirement}.`);
}
