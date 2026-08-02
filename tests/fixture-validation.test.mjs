import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { assertFixture, inspectTrace } from '../dist/index.js';

const validFixture = {
  schemaVersion: 1,
  tool: { name: 'tracefixture', version: '0.1.0' },
  command: { argv: ['node', '--version'], display: 'node --version' },
  cwdLabel: '<TEST>', recordedAt: '2026-08-02T00:00:00.000Z', durationMs: 1,
  exitCode: 0, signal: null, stdout: '', stderr: '', files: [], redactions: [], normalizers: []
};

test('accepts a complete schema-v1 fixture', () => {
  assert.doesNotThrow(() => assertFixture(structuredClone(validFixture)));
});

test('reports missing required arrays by field', () => {
  for (const field of ['files', 'redactions', 'normalizers']) {
    const fixture = structuredClone(validFixture);
    delete fixture[field];
    assert.throws(() => assertFixture(fixture), new RegExp(`Fixture ${field} must be an array`));
  }
});

test('rejects invalid argv entries and nested file/redaction data', () => {
  const cases = [
    [{ ...structuredClone(validFixture), command: { argv: [42], display: '42' } }, /command\.argv\[0\] must be a string/],
    [{ ...structuredClone(validFixture), command: { argv: [''], display: '' } }, /command\.argv\[0\] must be a non-empty string/],
    [{ ...structuredClone(validFixture), files: [{ path: 'out.txt', exists: 'yes', size: 1 }] }, /files\[0\]\.exists must be a boolean/],
    [{ ...structuredClone(validFixture), redactions: [{ kind: 'custom', replacement: '<X>', count: '1' }] }, /redactions\[0\]\.count must be a non-negative integer/]
  ];
  for (const [fixture, diagnostic] of cases) assert.throws(() => assertFixture(fixture), diagnostic);
});

test('CLI returns stable diagnostics for malformed fixtures without a stack', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tracefixture-invalid-'));
  const cases = [['invalid.json', '{nope', 'Fixture JSON is invalid.'], ['missing.json', JSON.stringify({ ...validFixture, files: undefined }), 'Fixture files must be an array.']];
  for (const [name, contents, diagnostic] of cases) {
    const fixturePath = path.join(dir, name);
    await writeFile(fixturePath, contents);
    for (const command of ['inspect', 'replay', 'render']) {
      const result = spawnSync(process.execPath, ['dist/cli.js', command, fixturePath], { encoding: 'utf8' });
      assert.notEqual(result.status, 0);
      assert.equal(result.stderr.trim(), diagnostic);
      assert.doesNotMatch(result.stderr, /\n\s+at /);
    }
  }
});

test('loads the checked-in schema-v1 example', async () => {
  const inspection = await inspectTrace('fixtures/examples/hello.json');
  assert.equal(inspection.command, 'node fixtures/examples/hello-command.mjs');
});
