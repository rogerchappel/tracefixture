import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const requiredFiles = [
  'package/dist/cli.js',
  'package/dist/index.js',
  'package/README.md',
  'package/LICENSE',
  'package/CHANGELOG.md',
  'package/CONTRIBUTING.md',
  'package/SECURITY.md',
  'package/SKILL.md',
];

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
}

export function verifyTarball(tarball) {
  const entries = new Set(run('tar', ['-tzf', tarball]).trim().split('\n'));
  for (const file of requiredFiles) {
    assert(entries.has(file), `package verification failed: tarball is missing ${file}`);
  }
}

function main() {
  const work = mkdtempSync(join(tmpdir(), 'tracefixture-artifact-'));
  try {
    const supplied = process.argv[2];
    const tarball = supplied
      ? resolve(supplied)
      : resolve(JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts']))[0].filename);
    verifyTarball(tarball);
    if (supplied) return;

    const consumer = join(work, 'consumer');
    mkdirSync(consumer);
    run('npm', ['init', '-y'], { cwd: work });
    run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd: work });
    const cli = join(work, 'node_modules', '.bin', 'tracefixture');
    assert.match(run(cli, ['--help'], { cwd: consumer }), /Record and replay CLI command traces/);
    assert.equal(run(cli, ['--version'], { cwd: consumer }).trim(), JSON.parse(readFileSync('package.json', 'utf8')).version);

    const fixture = join(consumer, 'trace.json');
    const command = [process.execPath, '-e', "process.stdout.write('artifact smoke ok\\n')"];
    run(cli, ['record', '--out', fixture, '--cwd', consumer, '--cwd-label', '<CONSUMER>', '--', ...command], { cwd: consumer });
    assert.match(run(cli, ['inspect', fixture], { cwd: consumer }), /artifact smoke ok/);
    assert.match(run(cli, ['replay', fixture, '--cwd', consumer], { cwd: consumer }), /tracefixture replay ok/);
    console.log(`verified ${basename(tarball)} in an isolated consumer`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
