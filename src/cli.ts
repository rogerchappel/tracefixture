#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import { recordTrace } from './record.js';
import { parseCustomPattern } from './redaction.js';
import { formatReplayReport, replayTrace } from './replay.js';
import { renderTrace } from './render.js';
import { TracefixtureError } from './types.js';
import { VERSION } from './version.js';

const program = new Command();

program
  .name('tracefixture')
  .description('Record and replay CLI command traces as clean, redacted fixtures.')
  .version(VERSION);

program
  .command('record')
  .description('Run a command and write a redacted JSON fixture.')
  .requiredOption('--out <path>', 'Fixture output path')
  .option('--cwd <path>', 'Working directory for the command', process.cwd())
  .option('--cwd-label <label>', 'Stable label stored in the fixture instead of an absolute cwd', '<PROJECT>')
  .option('--capture <path>', 'File to capture after the command; can be repeated', collect, [])
  .option('--redact-pattern <label=pattern=replacement>', 'Custom regex redaction; can be repeated', collect, [])
  .option('--notes <text>', 'Optional fixture notes')
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .argument('[command...]', 'Command to record, usually after --')
  .action(async (command: string[], options: Record<string, unknown>) => {
    const argv = stripCommandSeparator(command);
    if (argv.length === 0) {
      throw new TracefixtureError('record requires a command after --, for example: tracefixture record --out fixtures/demo.json -- node --version');
    }

    const fixture = await recordTrace({
      out: String(options.out),
      argv,
      cwd: path.resolve(String(options.cwd)),
      cwdLabel: String(options.cwdLabel),
      capturePaths: options.capture as string[],
      customPatterns: (options.redactPattern as string[]).map(parseCustomPattern),
      notes: typeof options.notes === 'string' ? options.notes : undefined
    });

    console.log(JSON.stringify({
      ok: true,
      fixture: options.out,
      command: fixture.command.display,
      exitCode: fixture.exitCode,
      redactions: fixture.redactions.length,
      files: fixture.files.length
    }, null, 2));
    process.exitCode = fixture.exitCode ?? 1;
  });

program
  .command('replay')
  .description('Run the recorded command and compare output/files with a fixture.')
  .argument('<fixture>', 'Fixture JSON path')
  .option('--cwd <path>', 'Working directory for the command', process.cwd())
  .option('--redact-pattern <label=pattern=replacement>', 'Custom regex redaction; can be repeated', collect, [])
  .action(async (fixturePath: string, options: Record<string, unknown>) => {
    const result = await replayTrace({
      fixturePath,
      cwd: path.resolve(String(options.cwd)),
      customPatterns: (options.redactPattern as string[]).map(parseCustomPattern)
    });

    const report = formatReplayReport(result);
    if (result.ok) {
      console.log(report);
    } else {
      console.error(report);
      process.exitCode = 1;
    }
  });

program
  .command('render')
  .description('Render a fixture as a Markdown docs snippet.')
  .argument('<fixture>', 'Fixture JSON path')
  .option('--markdown <path>', 'Write Markdown to a file instead of only stdout')
  .action(async (fixturePath: string, options: Record<string, unknown>) => {
    const markdown = await renderTrace({
      fixturePath,
      markdown: typeof options.markdown === 'string' ? options.markdown : undefined
    });

    if (!options.markdown) {
      process.stdout.write(markdown);
    } else {
      console.log(JSON.stringify({ ok: true, markdown: options.markdown }, null, 2));
    }
  });

program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof TracefixtureError) {
    console.error(error.message);
    process.exit(error.exitCode);
  }

  if (error instanceof Error && 'exitCode' in error) {
    throw error;
  }

  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function stripCommandSeparator(command: string[]): string[] {
  return command[0] === '--' ? command.slice(1) : command;
}
