import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'dist', 'cli.js');

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
}

test('prints help without a stack trace and exits successfully', () => {
  const result = runCli(['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^Usage: tracefixture/m);
  assert.equal(result.stderr, '');
});

test('prints the version without a stack trace and exits successfully', () => {
  const result = runCli(['--version']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, '0.1.0\n');
  assert.equal(result.stderr, '');
});

test('reports invalid usage concisely and exits unsuccessfully', () => {
  const result = runCli(['unknown']);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^error: unknown command 'unknown'\n$/);
  assert.doesNotMatch(result.stderr, /CommanderError|node_modules|\\bat /);
});

test('runs a valid command successfully', () => {
  const result = runCli(['inspect', 'fixtures/examples/hello.json']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^command: node fixtures\/examples\/hello-command\.mjs$/m);
  assert.equal(result.stderr, '');
});

test('exits unsuccessfully with a stable signal mismatch report', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'tracefixture-cli-signal-'));
  const fixturePath = path.join(dir, 'fixture.json');
  const recorded = runCli(['record', '--out', fixturePath, '--', process.execPath, '--version']);
  assert.equal(recorded.status, 0);
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
  writeFileSync(fixturePath, JSON.stringify({ ...fixture, signal: 'SIGTERM' }, null, 2) + '\n');

  const result = runCli(['replay', fixturePath]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^tracefixture replay failed\n\nMismatch: signal/m);
});
