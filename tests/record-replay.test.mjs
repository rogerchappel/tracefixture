import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { formatInspection, formatReplayReport, inspectTrace, recordTrace, replayTrace, renderTrace } from '../dist/index.js';

test('records and replays a command with captured files', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tracefixture-test-'));
  await writeFile(path.join(dir, 'writer.mjs'), [
    "import { writeFileSync } from 'node:fs';",
    "writeFileSync('out.txt', 'created at 2026-05-17T12:30:00.000Z\\n');",
    "console.log('hello ' + process.cwd());"
  ].join('\n'));

  const fixturePath = path.join(dir, 'fixture.json');
  const fixture = await recordTrace({
    out: fixturePath,
    argv: [process.execPath, 'writer.mjs'],
    cwd: dir,
    cwdLabel: '<TEST>',
    capturePaths: ['out.txt'],
    customPatterns: []
  });

  assert.equal(fixture.exitCode, 0);
  assert.equal(fixture.signal, null);
  assert.match(fixture.stdout, /hello <CWD>/);
  assert.equal(fixture.files[0].content, 'created at <TIMESTAMP>\n');

  const replay = await replayTrace({ fixturePath, cwd: dir, customPatterns: [] });
  assert.equal(replay.ok, true);

  const markdownPath = path.join(dir, 'fixture.md');
  const markdown = await renderTrace({ fixturePath, markdown: markdownPath });
  assert.match(markdown, /Trace fixture:/);
  assert.equal((await readFile(markdownPath, 'utf8')), markdown);

});

test('accepts a matching non-null termination signal', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tracefixture-signal-match-'));
  await writeFile(path.join(dir, 'terminate.mjs'), "process.kill(process.pid, 'SIGTERM');\n");
  const fixturePath = path.join(dir, 'fixture.json');
  const fixture = await recordTrace({
    out: fixturePath,
    argv: [process.execPath, 'terminate.mjs'],
    cwd: dir,
    cwdLabel: '<TEST>',
    capturePaths: [],
    customPatterns: []
  });

  const replay = await replayTrace({ fixturePath, cwd: dir, customPatterns: [] });

  assert.equal(fixture.exitCode, null);
  assert.equal(fixture.signal, 'SIGTERM');
  assert.equal(replay.ok, true);
});

test('reports a termination signal mismatch', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tracefixture-signal-mismatch-'));
  await writeFile(path.join(dir, 'terminate.mjs'), "process.kill(process.pid, 'SIGTERM');\n");
  const fixturePath = path.join(dir, 'fixture.json');
  const fixture = await recordTrace({
    out: fixturePath,
    argv: [process.execPath, 'terminate.mjs'],
    cwd: dir,
    cwdLabel: '<TEST>',
    capturePaths: [],
    customPatterns: []
  });
  await writeFile(fixturePath, JSON.stringify({ ...fixture, signal: 'SIGINT' }, null, 2) + '\n');

  const replay = await replayTrace({ fixturePath, cwd: dir, customPatterns: [] });

  assert.equal(replay.ok, false);
  assert.deepEqual(replay.mismatches, [{ field: 'signal', expected: 'SIGINT', actual: 'SIGTERM' }]);
  assert.match(formatReplayReport(replay), /^tracefixture replay failed\n\nMismatch: signal/m);
});

test('replays captured files using their redacted identity', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tracefixture-redacted-file-'));
  await writeFile(path.join(dir, 'writer.mjs'), [
    "import { existsSync, writeFileSync } from 'node:fs';",
    "const timestamp = existsSync('recorded')",
    "  ? '2026-05-18T12:30:00.000Z'",
    "  : '2026-05-17T12:30:00.000Z';",
    "writeFileSync('recorded', 'yes');",
    "writeFileSync('out.txt', `created at ${timestamp}\\n`);"
  ].join('\n'));

  const fixturePath = path.join(dir, 'fixture.json');
  const fixture = await recordTrace({
    out: fixturePath,
    argv: [process.execPath, 'writer.mjs'],
    cwd: dir,
    cwdLabel: '<TEST>',
    capturePaths: ['out.txt'],
    customPatterns: []
  });

  const replay = await replayTrace({ fixturePath, cwd: dir, customPatterns: [] });

  assert.equal(fixture.files[0].content, 'created at <TIMESTAMP>\n');
  assert.equal(replay.ok, true);
});

test('reports genuine captured file content changes', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tracefixture-file-mismatch-'));
  await writeFile(path.join(dir, 'writer.mjs'), [
    "import { existsSync, writeFileSync } from 'node:fs';",
    "const status = existsSync('recorded') ? 'failed' : 'passed';",
    "writeFileSync('recorded', 'yes');",
    "writeFileSync('out.txt', `status: ${status}\\n`);"
  ].join('\n'));

  const fixturePath = path.join(dir, 'fixture.json');
  await recordTrace({
    out: fixturePath,
    argv: [process.execPath, 'writer.mjs'],
    cwd: dir,
    cwdLabel: '<TEST>',
    capturePaths: ['out.txt'],
    customPatterns: []
  });

  const replay = await replayTrace({ fixturePath, cwd: dir, customPatterns: [] });

  assert.equal(replay.ok, false);
  assert.equal(replay.mismatches[0].field, 'files');
  assert.match(replay.mismatches[0].expected, /status: passed/);
  assert.match(replay.mismatches[0].actual, /status: failed/);
});

test('reports replay mismatches', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tracefixture-mismatch-'));
  await writeFile(path.join(dir, 'say.mjs'), "console.log('first');\n");
  const fixturePath = path.join(dir, 'fixture.json');
  await recordTrace({
    out: fixturePath,
    argv: [process.execPath, 'say.mjs'],
    cwd: dir,
    cwdLabel: '<TEST>',
    capturePaths: [],
    customPatterns: []
  });

  await writeFile(path.join(dir, 'say.mjs'), "console.log('second');\n");
  const replay = await replayTrace({ fixturePath, cwd: dir, customPatterns: [] });
  assert.equal(replay.ok, false);
  assert.equal(replay.mismatches[0].field, 'stdout');
});

test('CLI requires recorded custom patterns before replaying stdout and captured files', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tracefixture-custom-replay-'));
  await writeFile(path.join(dir, 'writer.mjs'), [
    "import { appendFileSync, writeFileSync } from 'node:fs';",
    "appendFileSync('runs.txt', 'run\\n');",
    "writeFileSync('captured.txt', 'file secret-123\\n');",
    "console.log('stdout secret-123');"
  ].join('\n'));

  const cli = path.resolve('dist/cli.js');
  const fixturePath = path.join(dir, 'fixture.json');
  const pattern = 'demo-secret=secret-\\d+=<SECRET>';
  const recorded = spawnSync(process.execPath, [
    cli, 'record', '--out', fixturePath, '--cwd', dir,
    '--capture', 'captured.txt', '--redact-pattern', pattern,
    '--', process.execPath, 'writer.mjs'
  ], { encoding: 'utf8' });

  assert.equal(recorded.status, 0, recorded.stderr);
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  assert.equal(fixture.stdout, 'stdout <SECRET>\n');
  assert.equal(fixture.files[0].content, 'file <SECRET>\n');

  const missing = spawnSync(process.execPath, [cli, 'replay', fixturePath, '--cwd', dir], { encoding: 'utf8' });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Replay requires custom redaction pattern\(s\).*demo-secret/);
  assert.match(missing.stderr, /--redact-pattern label=pattern=replacement/);
  assert.equal(await readFile(path.join(dir, 'runs.txt'), 'utf8'), 'run\n');

  const replayed = spawnSync(process.execPath, [
    cli, 'replay', fixturePath, '--cwd', dir, '--redact-pattern', pattern
  ], { encoding: 'utf8' });
  assert.equal(replayed.status, 0, replayed.stderr);
  assert.match(replayed.stdout, /tracefixture replay ok/);
  assert.equal(await readFile(path.join(dir, 'runs.txt'), 'utf8'), 'run\nrun\n');
});

test('inspects fixture summary without replaying command', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tracefixture-inspect-'));
  await writeFile(path.join(dir, 'writer.mjs'), [
    "import { writeFileSync } from 'node:fs';",
    "writeFileSync('captured.txt', 'secret-123\\n');",
    "console.log('hello secret-123');"
  ].join('\n'));

  const fixturePath = path.join(dir, 'fixture.json');
  await recordTrace({
    out: fixturePath,
    argv: [process.execPath, 'writer.mjs'],
    cwd: dir,
    cwdLabel: '<TEST>',
    capturePaths: ['captured.txt', 'missing.txt'],
    customPatterns: [{ label: 'demo-secret', pattern: /secret-\d+/g, replacement: '<SECRET>' }]
  });

  const inspection = await inspectTrace(fixturePath);
  const text = formatInspection(inspection);

  assert.equal(inspection.files.total, 2);
  assert.equal(inspection.files.present, 1);
  assert.equal(inspection.files.missing, 1);
  assert.equal(inspection.redactions.byKind.custom, 2);
  assert.match(text, /redactions: 2/);
  assert.match(text, /files: 1\/2 present/);
});
