# PRD: tracefixture

Status: in-progress
Decision: build now
Factory run: 2026-05-17 PM

## Pitch

`tracefixture` records CLI command sessions into clean, redacted fixtures that tests and docs can replay. It makes "here is how the tool behaves" executable. 🎬

## Why It Matters

CLI projects need examples that stay honest. Agents often update code without updating docs or smoke fixtures. A local recorder that captures command, exit code, stdout/stderr, files written, and redaction metadata gives maintainers durable examples and regression tests.

## Qualification

### Pub Test

"Record a CLI smoke run once, check in the trace, and replay it in tests without leaking local paths or secrets."

### Source / Inspiration

Inspired by snapshot testing, VCR-style HTTP fixtures, asciinema-style terminal recording, and Roger's fixture-backed CLI quality bar. This is a focused local CLI fixture tool, not a terminal video recorder.

### V1 Scope

- TypeScript CLI package.
- `tracefixture record -- <command>` captures command metadata, cwd label, exit code, duration, stdout/stderr, selected written files, and redaction log.
- `tracefixture replay` validates command output against a stored fixture with stable normalizers.
- Redact temp paths, home paths, env secrets, timestamps, and configurable patterns.
- Emit JSON fixtures and Markdown docs snippets.
- Fixture-backed tests for record, replay, normalization, redaction, and failure diffs.

## Out of Scope

- Interactive TTY recording.
- Network mocking.
- Shell history capture.
- Uploading traces.

## CLI Sketch

```bash
tracefixture record --out fixtures/smoke/scan.json -- npm run smoke
tracefixture replay fixtures/smoke/scan.json
tracefixture render fixtures/smoke/scan.json --markdown docs/examples.md
```

## Verification

Run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, `bash scripts/validate.sh`, and one real CLI smoke that records and replays a fixture command.

## Agent Prompt

Build `tracefixture` as a local CLI trace fixture recorder/replayer with conservative redaction and docs-friendly output.

