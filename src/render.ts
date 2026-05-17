import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readJson } from './files.js';
import { assertFixture } from './fixture.js';
import type { RenderOptions, TraceFixture } from './types.js';

export async function renderTrace(options: RenderOptions): Promise<string> {
  const loaded = await readJson<unknown>(options.fixturePath);
  assertFixture(loaded);
  const markdown = fixtureToMarkdown(loaded);

  if (options.markdown) {
    await mkdir(path.dirname(options.markdown), { recursive: true });
    await writeFile(options.markdown, markdown, 'utf8');
  }

  return markdown;
}

export function fixtureToMarkdown(fixture: TraceFixture): string {
  const lines = [
    'Trace fixture: ' + fixture.command.display,
    '=====================================',
    '',
    '- Exit code: ' + String(fixture.exitCode),
    '- CWD: ' + fixture.cwdLabel,
    '- Duration: ' + String(fixture.durationMs) + 'ms',
    '- Files captured: ' + String(fixture.files.length),
    '',
    '## Command',
    '',
    '~~~bash',
    fixture.command.display,
    '~~~',
    '',
    '## stdout',
    '',
    '~~~text',
    fixture.stdout || '(empty)',
    '~~~',
    '',
    '## stderr',
    '',
    '~~~text',
    fixture.stderr || '(empty)',
    '~~~'
  ];

  if (fixture.files.length > 0) {
    lines.push('', '## Files', '');
    for (const file of fixture.files) {
      lines.push('### ' + file.path, '', '~~~text', file.content ?? (file.exists ? '(binary or uncaptured)' : '(missing)'), '~~~', '');
    }
  }

  if (fixture.redactions.length > 0) {
    lines.push('', '## Redactions', '');
    for (const entry of fixture.redactions) {
      lines.push('- ' + entry.kind + (entry.label ? ':' + entry.label : '') + ' -> ' + entry.replacement + ' (' + String(entry.count) + ')');
    }
  }

  return lines.join('\n') + '\n';
}
