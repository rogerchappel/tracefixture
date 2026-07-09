import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { inspectFixture, recordTrace, replayTrace, renderTrace } from '../dist/index.js';

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

  const summary = await inspectFixture(fixturePath);
  assert.equal(summary.command, `${process.execPath} writer.mjs`);
  assert.equal(summary.capturedFiles, 1);
  assert.equal(summary.redactionCount > 0, true);
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
