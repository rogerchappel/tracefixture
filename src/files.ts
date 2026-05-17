import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CapturedFile, CustomPattern, RedactionEntry } from './types.js';
import { redactText } from './redaction.js';

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

export async function captureFiles(
  capturePaths: string[],
  cwd: string,
  customPatterns: CustomPattern[]
): Promise<{ files: CapturedFile[]; redactions: RedactionEntry[][] }> {
  const files: CapturedFile[] = [];
  const redactions: RedactionEntry[][] = [];

  for (const capturePath of capturePaths) {
    const absolutePath = path.resolve(cwd, capturePath);
    const relativePath = normalizePath(path.relative(cwd, absolutePath));

    try {
      const fileStat = await stat(absolutePath);
      if (!fileStat.isFile()) {
        files.push({ path: relativePath, exists: false, size: 0 });
        continue;
      }

      const raw = await readFile(absolutePath, 'utf8');
      const redacted = redactText(raw, { cwd, customPatterns });
      redactions.push(redacted.entries);
      files.push({
        path: relativePath,
        exists: true,
        size: Buffer.byteLength(raw),
        sha256: createHash('sha256').update(raw).digest('hex'),
        content: redacted.value
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        files.push({ path: relativePath, exists: false, size: 0 });
        continue;
      }
      throw error;
    }
  }

  return { files, redactions };
}

export function normalizePath(value: string): string {
  return value.split(path.sep).join('/');
}
