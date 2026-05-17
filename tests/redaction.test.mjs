import assert from 'node:assert/strict';
import os from 'node:os';
import test from 'node:test';
import { parseCustomPattern, redactText } from '../dist/index.js';

test('redacts home paths, timestamps, and custom patterns', () => {
  const pattern = parseCustomPattern('secret=abc[0-9]+=<SECRET>');
  const result = redactText(`${os.homedir()}/project at 2026-05-17T12:30:00.000Z token abc123`, {
    cwd: process.cwd(),
    customPatterns: [pattern]
  });

  assert.equal(result.value.includes(os.homedir()), false);
  assert.match(result.value, /<HOME>\/project/);
  assert.match(result.value, /<TIMESTAMP>/);
  assert.match(result.value, /<SECRET>/);
  assert.equal(result.entries.some((entry) => entry.kind === 'custom' && entry.label === 'secret'), true);
});
