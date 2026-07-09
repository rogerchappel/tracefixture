import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { formatInspection, inspectTrace, recordTrace, replayTrace, renderTrace } from '../dist/index.js';

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
  assert.match(fixture.stdout, /hello <CWD>/);
  assert.equal(fixture.files[0].content, 'created at <TIMESTAMP>\n');

  const replay = await replayTrace({ fixturePath, cwd: dir, customPatterns: [] });
  assert.equal(replay.ok, true);

  const markdownPath = path.join(dir, 'fixture.md');
  const markdown = await renderTrace({ fixturePath, markdown: markdownPath });
  assert.match(markdown, /Trace fixture:/);
  assert.equal((await readFile(markdownPath, 'utf8')), markdown);

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
