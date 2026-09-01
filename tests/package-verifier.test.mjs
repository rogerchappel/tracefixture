import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

function packWithout(entry) {
  const work = mkdtempSync(join(tmpdir(), 'tracefixture-broken-package-'));
  const packed = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts'], { encoding: 'utf8' }))[0].filename;
  execFileSync('tar', ['-xzf', packed, '-C', work]);
  rmSync(packed, { force: true });
  rmSync(join(work, entry), { force: true });
  const tarball = join(work, 'broken.tgz');
  execFileSync('tar', ['-czf', tarball, '-C', work, 'package']);
  return { work, tarball };
}

for (const entry of ['package/dist/cli.js', 'package/dist/index.js']) {
  test(`package verifier rejects a tarball missing ${entry}`, () => {
    const { work, tarball } = packWithout(entry);
    try {
      assert.throws(
        () => execFileSync(process.execPath, ['scripts/verify-package.mjs', tarball], { stdio: 'pipe' }),
        new RegExp(`tarball is missing ${entry.replaceAll('.', '\\.')}`),
      );
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  });
}
