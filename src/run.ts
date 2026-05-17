import { spawn } from 'node:child_process';
import type { RunResult } from './types.js';

export async function runCommand(argv: string[], cwd: string): Promise<RunResult> {
  if (argv.length === 0) {
    throw new Error('No command was provided. Put the command after --.');
  }

  const started = performance.now();
  const child = spawn(argv[0] ?? '', argv.slice(1), {
    cwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk: string) => {
    stderr += chunk;
  });

  return await new Promise<RunResult>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (exitCode, signal) => {
      resolve({
        stdout,
        stderr,
        exitCode,
        signal,
        durationMs: Math.round(performance.now() - started)
      });
    });
  });
}
