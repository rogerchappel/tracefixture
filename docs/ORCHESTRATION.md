# Orchestration

`tracefixture` is built as a local-first CLI package. The default agent workflow is:

1. Run `npm install`.
2. Make a focused change.
3. Run the smallest targeted check.
4. Run `bash scripts/validate.sh` before publishing.
5. Keep generated temporary fixtures under `fixtures/tmp/`, which is ignored.

## Commands

- `npm run check` - TypeScript typecheck without emitting files.
- `npm test` - Build and run node:test coverage.
- `npm run build` - Emit `dist/`.
- `npm run smoke` - Record, replay, and render a real local fixture.
- `node dist/cli.js inspect <fixture>` - Summarize fixture contents before replaying a command.
- `bash scripts/validate.sh` - Repository-level validation gate.

## Agent Notes

- Do not commit local secrets in fixtures.
- Prefer `--cwd-label '<REPO>'` in checked-in examples.
- Use `--redact-pattern label=pattern=replacement` for project-specific volatile output.
- Use `inspect` when a PR note or agent audit only needs command, output, file, and redaction counts.
- Replay executes the recorded command, so inspect third-party fixtures before running them.
