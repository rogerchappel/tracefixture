import type { TraceFixture } from './types.js';

export function assertFixture(value: unknown): asserts value is TraceFixture {
  if (!value || typeof value !== 'object') {
    throw new Error('Fixture must be a JSON object.');
  }

  const fixture = value as Partial<TraceFixture>;
  if (fixture.schemaVersion !== 1) {
    throw new Error('Unsupported fixture schemaVersion. Expected 1.');
  }

  if (!fixture.command || !Array.isArray(fixture.command.argv)) {
    throw new Error('Fixture command.argv is missing or invalid.');
  }

  if (typeof fixture.stdout !== 'string' || typeof fixture.stderr !== 'string') {
    throw new Error('Fixture stdout/stderr must be strings.');
  }
}
